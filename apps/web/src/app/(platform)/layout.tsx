import { Navbar } from '@/components/layout/navbar'
import { Toaster } from '@/components/ui/toast'
import { MOCK_USER } from '@/lib/mock-data'
import s from './layout.module.css'

const isDev =
  process.env.USE_SEED_DATA === 'true' ||
  process.env.NEXT_PUBLIC_APP_ENV !== 'production'

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar user={MOCK_USER} />
      {isDev && (
        <div className={s.devBanner}>
          <i className="ti ti-database icon-xs" aria-hidden="true" />
          Development build · seeded data
        </div>
      )}
      <div className={`container-platform ${s.main}`}>
        {children}
      </div>
      <Toaster />
    </>
  )
}
