import { FeedCardSkeleton } from '@/components/feed/feed-card'

export default function FeedLoading() {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-relaxed)' }}>
      <div className="skeleton" style={{ width: 240, height: 400, borderRadius: 'var(--radius-lg)' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        <div className="skeleton" style={{ height: 72, borderRadius: 'var(--radius-lg)' }} />
        {[1, 2, 3, 4].map((i) => (
          <FeedCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
