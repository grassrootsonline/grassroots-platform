export default function LoginLoading() {
  return (
    <div className="panel-page">
      <div className="skeleton" style={{ width: 140, height: 36 }} />
      <div className="panel">
        <div className="skeleton" style={{ width: '50%', height: 28, margin: '0 auto var(--space-xl)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              <div className="skeleton" style={{ width: 60, height: 12 }} />
              <div className="skeleton" style={{ height: 38, borderRadius: 'var(--radius-md)' }} />
            </div>
          ))}
          <div className="skeleton" style={{ height: 40, borderRadius: 'var(--radius-md)' }} />
        </div>
      </div>
    </div>
  );
}
