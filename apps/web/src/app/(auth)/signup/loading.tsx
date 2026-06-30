export default function SignupLoading() {
  return (
    <div className="panel-page">
      <div className="skeleton" style={{ width: 160, height: 36 }} />
      <div className="panel">
        <div className="skeleton" style={{ width: '60%', height: 28, margin: '0 auto var(--space-sm)' }} />
        <div className="skeleton" style={{ width: '80%', height: 16, margin: '0 auto var(--space-xl)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              <div className="skeleton" style={{ width: 80, height: 12 }} />
              <div className="skeleton" style={{ height: 38, borderRadius: 'var(--radius-md)' }} />
            </div>
          ))}
          <div className="skeleton" style={{ height: 40, borderRadius: 'var(--radius-md)' }} />
        </div>
      </div>
    </div>
  );
}
