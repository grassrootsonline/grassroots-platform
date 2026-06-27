import { Navbar } from '@/components/layout/navbar'
import { Toaster } from '@/components/ui/toast'
import { MOCK_USER } from '@/lib/mock-data'

const isDev =
  process.env.USE_SEED_DATA === 'true' ||
  process.env.NEXT_PUBLIC_APP_ENV !== 'production'

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar user={MOCK_USER} />
      {isDev && (
        <div
          className="flex items-center justify-center gap-2 py-1.5 text-[11px] font-[500] tracking-[0.04em] uppercase"
          style={{
            background: 'var(--color-accent-mist)',
            borderBottom: 'var(--border-accent)',
            color: 'var(--color-accent)',
          }}
        >
          <i className="ti ti-database text-[13px]" aria-hidden="true" />
          Development build · seeded data
        </div>
      )}
      <div className="container-page pt-5">
        {children}
      </div>
      <Toaster />
    </>
  )
}
