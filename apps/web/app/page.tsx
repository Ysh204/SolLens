export default function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'var(--font-sans), sans-serif', backgroundColor: '#0a0a0a', color: '#ffffff' }}>
      <main style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.05em', marginBottom: '1rem' }}>SolLens</h1>
        <p style={{ color: '#a0a0a0', fontSize: '1.25rem' }}>Solana Expression Engine & Development Suite</p>
      </main>
    </div>
  );
}
