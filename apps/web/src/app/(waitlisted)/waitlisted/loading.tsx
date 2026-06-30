import s from './page.module.css';

export default function WaitlistedLoading() {
  return (
    <div className={s.page}>
      <div className={s.content}>
        <div className="skeleton" style={{ width: 160, height: 36 }} />
        <div className="skeleton" style={{ width: 56, height: 56, borderRadius: 'var(--radius-pill)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', alignItems: 'center', width: '100%' }}>
          <div className="skeleton" style={{ width: 120, height: 16 }} />
          <div className="skeleton" style={{ width: '80%', height: 36 }} />
        </div>
        <div className="skeleton" style={{ width: '90%', height: 64 }} />
      </div>
    </div>
  );
}
