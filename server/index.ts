import express from 'express';
import cors from 'cors';
import puppeteer, { Browser } from 'puppeteer';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());

// Get current directory for config file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load configuration
let config: any = {};
try {
  const configPath = join(__dirname, 'config.json');
  config = JSON.parse(readFileSync(configPath, 'utf-8'));
} catch (error) {
  console.warn('Could not load config.json, using defaults');
}

// API URLs - priority: environment variables > config file > defaults
const AGG_URL = process.env.ROMANIA_API_URL || 
  config.apiUrls?.romania || 
  'https://prezenta.roaep.ro/prezidentiale04052025/data/json/sicpv/pv/pv_aggregated.json';

const AGG_URL_DIAS = process.env.DIASPORA_API_URL || 
  config.apiUrls?.diaspora || 
  'https://prezenta.roaep.ro/prezidentiale04052025/data/json/sicpv/pv/pv_aggregated_sr.json';

// Server configuration
const PORT = process.env.PORT || config.server?.port || 3001;
const TTL_MS = parseInt(process.env.CACHE_TTL || '') || config.server?.cacheTtl || 30000;

console.log('🔧 Configuration loaded:');
console.log('📍 Romania API:', AGG_URL);
console.log('📍 Diaspora API:', AGG_URL_DIAS);
console.log('🚀 Server Port:', PORT);
console.log('⏱️  Cache TTL:', TTL_MS + 'ms');

const cache = new Map(); // key -> { value, expiresAt }

function setCache(key: string, value: JSON) {
  cache.set(key, { value, expiresAt: Date.now() + TTL_MS });
}
function getCache(key: string) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}


let browser: Browser | null = null;

async function ensureBrowser() {
  if (browser) return browser;
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  browser.on('disconnected', () => {
    console.warn('Puppeteer browser disconnected; setting browser=null');
    browser = null;
  });
  return browser;
}

async function fetchJsonWithBrowser(url: string) {
  // Check cache first
  const cached = getCache(url);
  if (cached) return cached;

  const b = await ensureBrowser();
  const page = await b.newPage();

  try {
    const responsePromise = page.waitForResponse(
      (resp: { url: () => string; status: () => number; }) => {
        const u = resp.url();
        return u.endsWith('.json') && resp.status() >= 200 && resp.status() < 300;
      },
      { timeout: 15000 } // 15s
    );

    // start navigation
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => { /* ignore goto timeout */ });

    const resp = await responsePromise;
    const text = await resp.text();

    const data = JSON.parse(text);

    setCache(url, data);

    return data;
  } catch (err) {
    let body = '';
    try {
      body = await page.content();
    } catch (e) {
      body = `<unable to read page content: ${(e as Error).message}>`;
    }
    throw new Error(`Failed to fetch JSON. URL: ${url}. Error: ${(err as Error).message}. Page content: ${body}`);
  } finally {
    try {
      await page.close();
    } catch {
      // intentionally ignored
    }
  }
}


// Candidate structure for reference:
type Candidate = {
  id: string,
  candidate: string,
  party: string | null,
  votes: number
}

async function toJSON(candidate : Candidate) {
  return {
    id: candidate.id,
    candidate: candidate.candidate,
    party: candidate.party,
    votes: candidate.votes
  };
}


const votes_cache : Map<string, [Candidate[], number]> = new Map(); // list_name -> [data, expiresAt]
const CACHE_TIMEOUT = 20 * 1000; // 20 seconds

function isCacheValid(timestamp: number) {
  return Date.now() < timestamp;
}

function setVotesCache(list_name: string, data: Candidate[]) {
  const expiresAt = Date.now() + CACHE_TIMEOUT;
  votes_cache.set(list_name, [data, expiresAt]);
}

function getVotesCache(list_name: string) {
  const entry = votes_cache.get(list_name);
  if (!entry) return null;
  if (!isCacheValid(entry[1])) {
    votes_cache.delete(list_name);
    return null;
  }
  return entry[0];
}

async function getRomaniaVotesCount() {

  const cached = getVotesCache('romania');
  if (cached) return cached;

  const data = await fetchJsonWithBrowser(AGG_URL);

  const romList = data.scopes.CNTRY.PRSD.RO.candidates as Candidate[];


  setVotesCache('romania', romList);

  return romList;
}

async function getDiasporaVotesCount() {

  const cached = getVotesCache('diaspora');
  if (cached) return cached;

  const data = await fetchJsonWithBrowser(AGG_URL_DIAS);

  const uatPrsd = data.scopes?.UAT?.PRSD;
  const map: Record<string, Candidate> = {};
  if (uatPrsd) {
    Object.values(uatPrsd).forEach(region =>
      region.candidates.forEach(c => {
        if (map[c.id]) map[c.id].votes += c.votes;
        else map[c.id] = { ...c };
      })
    );
  }

  const votes = Object.values(map);
  setVotesCache('diaspora', votes);

  return votes;
}


async function aggregate(romList: Candidate[], diaList: Candidate[]) {

  const cached = getVotesCache('combined');
  if (cached) return cached;

  // Build combined list for series
  const combinedMap: Candidate[] = [];
  romList.forEach(c => {
    combinedMap.push({ ...c });
  });

  diaList.forEach(c => {
    const existing = combinedMap.find(cc => cc.id === c.id);
    if (existing) existing.votes += c.votes;
    else combinedMap.push({ ...c });
  });

  setVotesCache('combined', combinedMap);

  return combinedMap;
}

app.get('/api/votes', async (req, res) => {
  try {
    const romList = await getRomaniaVotesCount();
    const diaList = await getDiasporaVotesCount();
    const combinedList = await aggregate(romList, diaList);

    res.json({
      romania: await Promise.all(romList.map(toJSON)),
      diaspora: await Promise.all(diaList.map(toJSON)),
      combined: await Promise.all(combinedList.map(toJSON))
    });
  } catch (err) {
    console.error('Error /api/votes:', err);
    res.status(502).json({ error: (err as Error).message });
  }
});

// Legacy endpoints

app.get('/api/count', async (req, res) => {
  try {
    const data = await fetchJsonWithBrowser(AGG_URL);
    res.json(data);
  } catch (err) {
    console.error('Error /api/count:', err);
    res.status(502).json({ error: err.message });
  }
});

app.get('/api/count-dias', async (req, res) => {
  try {
    const data = await fetchJsonWithBrowser(AGG_URL_DIAS);
    res.json(data);
  } catch (err) {
    console.error('Error /api/count-dias:', err);
    res.status(502).json({ error: err.message });
  }
});

// Not so graceful shutdown
process.on('SIGINT', async () => {
  console.log('SIGINT: closing browser...');
  if (browser) await browser.close().catch(() => { });
  process.exit(0);
});

app.listen(PORT, () => console.log(`🚀 Proxy listening on port ${PORT}`));
