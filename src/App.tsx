import { useEffect, useState } from 'react';
// Define candidate shape
type Candidate = {
  id: string;
  candidate: string;
  party: string | null;
  votes: number;
};

export default function App() {
  const [romCandidates, setRomCandidates] = useState<Candidate[]>([]);
  const [diaCandidates, setDiaCandidates] = useState<Candidate[]>([]);
  const [combinedCandidates, setCombinedCandidates] = useState<Candidate[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/votes');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setRomCandidates(data.romania);
        setDiaCandidates(data.diaspora);
        setCombinedCandidates(data.combined);
        setError(null);

      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Unexpected error');
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 20 * 1000); // refresh every 20s
    return () => clearInterval(interval);
  }, []);

  if (error) return <div style={{ padding: '2rem', textAlign: 'center' }}>Error: {error}</div>;
  if (!romCandidates.length || !diaCandidates.length || !combinedCandidates.length) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>;

  // sort lists and compute diffs
  const sortDiff = (arr: Candidate[]) => {
    const sorted = [...arr].sort((a, b) => b.votes - a.votes);
    return sorted.map((c, i) => ({ ...c, diff: i < sorted.length - 1 ? c.votes - sorted[i + 1].votes : 0 }));
  };
  const romList = sortDiff(romCandidates);
  const diaList = sortDiff(diaCandidates);
  const combinedList = sortDiff(combinedCandidates);

  const totalVotesRom = romList.reduce((acc, c) => acc + c.votes, 0);
  const totalVotesDia = diaList.reduce((acc, c) => acc + c.votes, 0);
  const totalVotesCombined = combinedList.reduce((acc, c) => acc + c.votes, 0);

  const remainingVotes = 8416686 + 3127125 - totalVotesCombined;

  return (
    <div style={{ maxWidth: '100%', margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h1>Candidați Prezență la vot</h1>
      <div style={{ display: 'flex', gap: '2rem' }}>
        {/* Left lists */}
        <div style={{ flex: 1 }}>
          <section>
            <h2>România</h2>
            <ul>
              {romList.map(c => (
                <li key={c.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>{c.candidate}</span>
                  <span>{c.votes.toLocaleString()} ({((c.votes / totalVotesRom) * 100).toFixed(2)}%) {c.diff ? `(+${c.diff.toLocaleString()})` : ''}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2>Diaspora</h2>
            {diaList.length ? (
              <ul>
                {diaList.map(c => (
                  <li key={c.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>{c.candidate}</span>
                    <span>{c.votes.toLocaleString()} ({((c.votes / totalVotesDia) * 100).toFixed(2)}%){c.diff ? `(+${c.diff.toLocaleString()})` : ''}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nu există date pentru Diaspora.</p>
            )}
          </section>
        </div>

        {/* Combined on right */}
        <div style={{ width: '50%' }}>
            <h2 style={{ textAlign: 'right' }}>Combinate</h2>
            <p style={{ textAlign: 'right', fontWeight: 'bold' }}>
            Total voturi: {totalVotesCombined.toLocaleString()}
            </p>
            <p style={{ textAlign: 'right', fontWeight: 'bold' }}>
            Voturi ramase: {remainingVotes.toLocaleString()}
            </p>
          <ul>
            {combinedList.map(c => (
              <li key={c.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>{c.candidate}</span>
                <span>{c.votes.toLocaleString()} ({((c.votes / totalVotesCombined) * 100).toFixed(2)}%) {c.diff ? `(+${c.diff.toLocaleString()})` : ''}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
