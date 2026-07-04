export default function ProfileLoading() {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-relaxed)' }}>
      <div className="skeleton" style={{ width: 240, height: 400, borderRadius: 'var(--radius-lg)' }} />

      <main style={{ flex: 1, maxWidth: 600, minWidth: 0 }}>
        <div className="skeleton" style={{ width: 100, height: 16, marginBottom: 'var(--space-lg)' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-base)' }}>
          <div className="skeleton" style={{ width: 96, height: 96, borderRadius: 'var(--radius-pill)' }} />
          <div className="skeleton" style={{ width: 120, height: 36, borderRadius: 'var(--radius-md)' }} />
        </div>

        <div style={{ marginTop: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <div className="skeleton" style={{ width: 180, height: 28 }} />
          <div className="skeleton" style={{ width: 100, height: 16 }} />
          <div className="skeleton" style={{ width: '80%', height: 16 }} />
          <div style={{ display: 'flex', gap: 'var(--space-lg)', marginTop: 'var(--space-md)' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ width: 64, height: 20 }} />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-relaxed)', marginTop: 'var(--space-lg)', marginBottom: 'var(--space-lg)', borderBottom: 'var(--border-default)', paddingBottom: 'var(--space-md)' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ width: 56, height: 16 }} />
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {[1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      </main>
    </div>
  );
}
