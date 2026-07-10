import { Navbar } from '@/components/layout/navbar'
import { Toaster } from '@/components/ui/toast'
import { getDataClient } from '@/lib/data'
import s from './layout.module.css'

export const maxDuration = 30

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const client = getDataClient()
  const [user, notifications] = await Promise.all([
    client.getCurrentUser(),
    client.getNotifications(),
  ])

  return (
    <>
      <Navbar user={user} notifications={notifications} />
      {process.env.USE_SEED_DATA === 'true' && (
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
