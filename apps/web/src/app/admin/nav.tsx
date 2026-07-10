'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import s from './layout.module.css';

export function AdminNav() {
  const pathname = usePathname();
  const isDashboard = pathname === '/admin';
  const isUsers = pathname.startsWith('/admin/users');
  const isCareers = pathname.startsWith('/admin/careers');
  const isBoard = pathname.startsWith('/admin/board');

  return (
    <nav className={s.nav}>
      <Link href="/admin" className={`${s.navItem} ${isDashboard ? s.navItemActive : ''}`}>
        <i className="ti ti-layout-dashboard" aria-hidden="true" />
        Dashboard
      </Link>
      <Link href="/admin/users" className={`${s.navItem} ${isUsers ? s.navItemActive : ''}`}>
        <i className="ti ti-users" aria-hidden="true" />
        Users
      </Link>
      <Link href="/admin/careers" className={`${s.navItem} ${isCareers ? s.navItemActive : ''}`}>
        <i className="ti ti-briefcase" aria-hidden="true" />
        Postings
      </Link>
      <Link href="/admin/careers" className={s.navItem}>
        <i className="ti ti-file-text" aria-hidden="true" />
        Applications
      </Link>
      <Link href="/admin/board" className={`${s.navItem} ${isBoard ? s.navItemActive : ''}`}>
        <i className="ti ti-layout-kanban" aria-hidden="true" />
        Task board
      </Link>
    </nav>
  );
}
