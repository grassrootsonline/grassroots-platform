export default function BoardSkeleton() {
  return (
    <div style={{ padding: 'var(--space-2xl)', width: '100%' }}>
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="skeleton" style={{ width: 160, height: 28, borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-sm)' }} />
        <div className="skeleton" style={{ width: 320, height: 16, borderRadius: 'var(--radius-sm)' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 'var(--space-lg)' }}>
        {[1, 2, 3, 4].map((col) => (
          <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <div className="skeleton" style={{ height: 20, borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-sm)' }} />
            {[1, 2].map((card) => (
              <div key={card} className="skeleton" style={{ height: 96, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
