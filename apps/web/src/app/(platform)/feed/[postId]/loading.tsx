import { FeedCardSkeleton } from '@/components/feed/feed-card'

export default function ThreadLoading() {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-relaxed)' }}>
      <div className="skeleton" style={{ width: 240, height: 400, borderRadius: 'var(--radius-lg)' }} />

      <main style={{ flex: 1, maxWidth: 600, minWidth: 0 }}>
        <div className="skeleton" style={{ width: 100, height: 16, marginBottom: 'var(--space-lg)' }} />

        <FeedCardSkeleton />

        <div style={{ marginTop: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 'var(--radius-pill)', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                <div className="skeleton" style={{ width: 120, height: 14 }} />
                <div className="skeleton" style={{ width: '90%', height: 14 }} />
                <div className="skeleton" style={{ width: '60%', height: 14 }} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
