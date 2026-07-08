'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import s from './layout.module.css';

export function AdminNav() {
  const pathname = usePathname();
  const isDashboard = pathname === '/admin';
  const isCareers = pathname.startsWith('/admin/careers');

  return (
    <nav className={s.nav}>
      <Link href="/admin" className={`${s.navItem} ${isDashboard ? s.navItemActive : ''}`}>
        <i className="ti ti-layout-dashboard" aria-hidden="true" />
        Dashboard
      </Link>
      <Link href="/admin/careers" className={`${s.navItem} ${isCareers ? s.navItemActive : ''}`}>
        <i className="ti ti-briefcase" aria-hidden="true" />
        Postings
      </Link>
      <Link href="/admin/careers" className={s.navItem}>
        <i className="ti ti-file-text" aria-hidden="true" />
        Applications
      </Link>
    </nav>
  );
}
