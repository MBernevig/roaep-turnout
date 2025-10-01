import { useEffect, useState } from 'react';
import './App.css';

// Define candidate shape
type Candidate = {
  id: string;
  candidate: string;
  party: string | null;
  votes: number;
};

// Enhanced candidate with difference calculation
type EnhancedCandidate = Candidate & {
  diff: number;
};

export default function App() {
  const [romCandidates, setRomCandidates] = useState<Candidate[]>([]);
  const [diaCandidates, setDiaCandidates] = useState<Candidate[]>([]);
  const [combinedCandidates, setCombinedCandidates] = useState<Candidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    if (isDarkMode) {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }
    
    // Save theme preference
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't manually set a preference
      if (!localStorage.getItem('theme')) {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/votes');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setRomCandidates(data.romania);
        setDiaCandidates(data.diaspora);
        setCombinedCandidates(data.combined);
        setLastUpdate(new Date());
        setError(null);

      } catch (err: unknown) {
        console.error(err);
        setError((err as Error).message || 'Unexpected error');
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 20 * 1000); // refresh every 20s
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className={`app-container ${isDarkMode ? 'dark' : ''}`}>
        <div className="error">
          <div>
            <h2>❌ Error loading data</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!romCandidates.length || !diaCandidates.length || !combinedCandidates.length) {
    return (
      <div className={`app-container ${isDarkMode ? 'dark' : ''}`}>
        <div className="loading">
          <div>
            <div className="spinner"></div>
            <div>Loading election data...</div>
          </div>
        </div>
      </div>
    );
  }

  // Sort lists and compute differences
  const sortDiff = (arr: Candidate[]): EnhancedCandidate[] => {
    const sorted = [...arr].sort((a, b) => b.votes - a.votes);
    return sorted.map((c, i) => ({ 
      ...c, 
      diff: i < sorted.length - 1 ? c.votes - sorted[i + 1].votes : 0 
    }));
  };
  
  const romList = sortDiff(romCandidates);
  const diaList = sortDiff(diaCandidates);
  const combinedList = sortDiff(combinedCandidates);

  const totalVotesRom = romList.reduce((acc, c) => acc + c.votes, 0);
  const totalVotesDia = diaList.reduce((acc, c) => acc + c.votes, 0);
  const totalVotesCombined = combinedList.reduce((acc, c) => acc + c.votes, 0);

  const renderCandidatesList = (candidates: EnhancedCandidate[], totalVotes: number) => (
    <ul className="candidates-list">
      {candidates.map((candidate, index) => (
        <li key={candidate.id} className="candidate-item">
          <span className="candidate-name">
            {index === 0 && '🥇 '}
            {index === 1 && '🥈 '}
            {index === 2 && '🥉 '}
            {candidate.candidate}
          </span>
          <div className="candidate-stats">
            <span className="votes-count">
              {candidate.votes.toLocaleString()}
            </span>
            <span className="percentage">
              {((candidate.votes / totalVotes) * 100).toFixed(2)}%
            </span>
            {candidate.diff > 0 && (
              <span className="vote-diff">
                +{candidate.diff.toLocaleString()}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <div className={`app-container ${isDarkMode ? 'dark' : ''}`}>
      <header className="header">
        <button 
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {isDarkMode ? '☀️' : '🌙'} {isDarkMode ? 'Light' : 'Dark'}
        </button>
        <h1>🗳️ Romanian Presidential Elections</h1>
        <p className="subtitle">Real-time turnout results</p>
        {lastUpdate && (
          <div className="refresh-indicator">
            <div className="pulse"></div>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </header>

      <div className="results-grid">
        {/* Romania Results */}
        <section className="results-section">
          <div className="section-header">
            <h2 className="section-title">
              🇷🇴 România
            </h2>
          </div>
          <p className="total-votes">
            Total votes
            <span className="number">{totalVotesRom.toLocaleString()}</span>
          </p>
          {renderCandidatesList(romList, totalVotesRom)}
        </section>

        {/* Diaspora Results */}
        <section className="results-section">
          <div className="section-header">
            <h2 className="section-title">
              🌍 Diaspora
            </h2>
          </div>
          <p className="total-votes">
            Total votes
            <span className="number">{totalVotesDia.toLocaleString()}</span>
          </p>
          {diaList.length ? (
            renderCandidatesList(diaList, totalVotesDia)
          ) : (
            <p>No diaspora data available.</p>
          )}
        </section>

        {/* Combined Results */}
        <section className="results-section combined-section">
          <div className="section-header">
            <h2 className="section-title">
              🏆 Combined Results
            </h2>
          </div>
          <p className="total-votes">
            Total votes
            <span className="number">{totalVotesCombined.toLocaleString()}</span>
          </p>
          {renderCandidatesList(combinedList, totalVotesCombined)}
        </section>
      </div>
    </div>
  );
}
