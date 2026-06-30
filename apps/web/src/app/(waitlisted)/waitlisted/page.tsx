import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@grassroots/db';
import { signoutAction } from '@/actions/auth.actions';
import s from './page.module.css';

export default async function WaitlistedPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const profile = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.authId, user.id),
    columns: { displayName: true },
  });

  const firstName = profile?.displayName?.split(' ')[0] ?? 'there';

  return (
    <div className={s.page}>
      {/* Sage accent stripe at top */}
      <div className={s.accentStripe} aria-hidden="true" />

      <div className={s.content}>
        <span className={s.wordmark}>Grassroots</span>

        <div className={s.iconWrap}>
          <i className="ti ti-leaf icon-lg" style={{ color: 'var(--color-accent-ink)' }} aria-hidden="true" />
        </div>

        <div className={s.copyBlock}>
          <p className={s.greeting}>Hey {firstName},</p>
          <h1 className={s.heading}>You&apos;re on the list.</h1>
        </div>

        <p className={s.body}>
          Your account is created and waiting. We&apos;ll send you an email the moment
          access opens — no action needed on your end.
        </p>

        <form action={signoutAction}>
          <button type="submit" className={`btn btn-ghost btn-sm ${s.signoutBtn}`}>
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
