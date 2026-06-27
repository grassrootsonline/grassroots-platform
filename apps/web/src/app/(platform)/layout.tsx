import { Navbar } from '@/components/layout/navbar'
import { Toaster } from '@/components/ui/toast'
import { MOCK_USER } from '@/lib/mock-data'

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar user={MOCK_USER} />
      <div className="w-full max-w-[var(--content-max-width)] mx-auto px-5 pt-5">
        {children}
      </div>
      <Toaster />
    </>
  )
}
