# Admin Users management: list, activate, suspend

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `feature` |
| **Branch** | `feat/admin-users-management` |
| **Depends on** | none (independent of 059/060 — reads/writes `users` only, no posts schema involved) |

---

## Problem

Alex's request was two-part: "I'd like to be able to see some posts and interact with users that I let into the project." Handoffs 059/060 cover the posts half. This handles the second half — right now the only way to move an account from `waitlisted` to `active` (or to suspend one) is a manual `UPDATE` against the database directly (per handoff 050's note: "today: a manual `UPDATE`"). The admin dashboard (`/admin`) already shows waitlisted/active/suspended counts (`admin/page.tsx`) but there's no way to act on an individual user from the UI at all.

This adds a straightforward list-and-act page, following the exact same server-component-table pattern already established by `/admin/careers` (`admin/careers/page.tsx` — read it before starting, this handoff mirrors its structure closely on purpose for consistency).

---

## Affected files

- `apps/web/src/app/admin/users/page.tsx` — new
- `apps/web/src/app/admin/users/users.module.css` — new (copy `admin/careers/careers.module.css`'s table/badge classes as a starting point — same visual pattern, same design tokens)
- `apps/web/src/app/admin/nav.tsx` — add a "Users" nav item
- `apps/web/src/actions/admin-users.actions.ts` — new

---

## Implementation steps

### 1. `apps/web/src/actions/admin-users.actions.ts`

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@grassroots/db';
import { users } from '@grassroots/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function setAccountStatusAction(userId: string, status: 'waitlisted' | 'active' | 'suspended') {
  await requireAdmin();
  await db.update(users).set({ accountStatus: status }).where(eq(users.id, userId));
  revalidatePath('/admin/users');
  revalidatePath('/admin');
}
```

This is the entire mutation surface for v1 — activate, suspend, or move back to waitlisted, all through the one status field that already drives every gate in `middleware.ts`. No separate "ban" or "delete" concept; `suspended` already exists as an `account_status` enum value and `users.isSuspended`/`deletedAt` columns exist for future use but aren't wired to anything yet — don't build UI for those in this handoff, `accountStatus` alone is what Alex asked for.

**Note on the pending waitlist-activation email** (handoff 050, `docs/ROADMAP.md`): that roadmap item describes this exact action later triggering a Resend email. Resend isn't wired up yet (Alex explicitly deferred it — "we'll set up resend later on down the line"). Don't add an email side-effect here; just leave a one-line comment in `setAccountStatusAction` noting that a transactional email on `waitlisted → active` transitions is the planned follow-up, so it's easy to find when Resend does land.

Commit: `feat(admin): add setAccountStatusAction`

### 2. `apps/web/src/app/admin/users/page.tsx`

Server Component, same shape as `admin/careers/page.tsx`. Support an optional `?status=` query param so Alex can filter (the dashboard's status breakdown cards are a natural place to later link here with a filter, though wiring that link is optional — not required for this handoff):

```tsx
import { db } from '@grassroots/db'
import { users } from '@grassroots/db/schema'
import { desc, eq } from 'drizzle-orm'
import { UserRow } from './user-row'
import s from './users.module.css'

const STATUS_BADGE: Record<string, string> = {
  waitlisted: 'badge-muted',
  active: 'badge-accent',
  suspended: 'badge-danger',
}
const STATUS_LABEL: Record<string, string> = {
  waitlisted: 'Waitlisted',
  active: 'Active',
  suspended: 'Suspended',
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const filter = status === 'waitlisted' || status === 'active' || status === 'suspended' ? status : undefined

  const rows = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      username: users.username,
      accountStatus: users.accountStatus,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(filter ? eq(users.accountStatus, filter) : undefined)
    .orderBy(desc(users.createdAt))

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Users</h1>
          <p className={s.subtitle}>Manage account access — activate waitlisted users, suspend if needed.</p>
        </div>
      </div>

      <div className={s.filterBar}>
        {(['all', 'waitlisted', 'active', 'suspended'] as const).map((f) => (
          <a
            key={f}
            href={f === 'all' ? '/admin/users' : `/admin/users?status=${f}`}
            className={[s.filterChip, (filter ?? 'all') === f ? s.filterChipActive : ''].filter(Boolean).join(' ')}
          >
            {f === 'all' ? 'All' : STATUS_LABEL[f]}
          </a>
        ))}
      </div>

      <div className={s.tableCard}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>User</th>
              <th>Status</th>
              <th>Joined</th>
              <th className={s.actionCol}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <UserRow key={u.id} user={u} statusBadge={STATUS_BADGE} statusLabel={STATUS_LABEL} />
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="empty-state" style={{ padding: 'var(--space-lg)' }}>
            <p className="empty-state-body">No users match this filter.</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

Note the `email` column deliberately isn't selected or shown — `CLAUDE.md`'s user data conventions ("Never render in public-facing UI") are written about public-facing surfaces, but there's no reason to pull `email` into an admin list view that doesn't need it either; keep the query minimal. If Alex later wants email visible for support/moderation purposes, that's a deliberate follow-up decision, not an oversight — flag it in your completion report rather than adding it preemptively.

### 3. `apps/web/src/app/admin/users/user-row.tsx` (client component — needs interactivity for the action buttons)

```tsx
'use client'

import { useState, useTransition } from 'react'
import { setAccountStatusAction } from '@/actions/admin-users.actions'
import s from './users.module.css'

interface UserRowProps {
  user: { id: string; displayName: string; username: string; accountStatus: 'waitlisted' | 'active' | 'suspended'; createdAt: Date }
  statusBadge: Record<string, string>
  statusLabel: Record<string, string>
}

export function UserRow({ user, statusBadge, statusLabel }: UserRowProps) {
  const [status, setStatus] = useState(user.accountStatus)
  const [isPending, startTransition] = useTransition()

  function handleSetStatus(next: 'waitlisted' | 'active' | 'suspended') {
    setStatus(next) // optimistic
    startTransition(async () => {
      await setAccountStatusAction(user.id, next)
    })
  }

  return (
    <tr>
      <td>
        <div className={s.userCell}>
          <span className={s.userName}>{user.displayName}</span>
          <span className={s.userHandle}>@{user.username}</span>
        </div>
      </td>
      <td><span className={`badge ${statusBadge[status]}`}>{statusLabel[status]}</span></td>
      <td className={s.joined}>{new Date(user.createdAt).toLocaleDateString()}</td>
      <td className={s.right}>
        <div className={s.actions}>
          {status !== 'active' && (
            <button className="btn btn-sm btn-secondary" disabled={isPending} onClick={() => handleSetStatus('active')}>
              Activate
            </button>
          )}
          {status !== 'suspended' && (
            <button className="btn btn-sm btn-ghost" disabled={isPending} onClick={() => handleSetStatus('suspended')}>
              Suspend
            </button>
          )}
          {status === 'suspended' && (
            <button className="btn btn-sm btn-secondary" disabled={isPending} onClick={() => handleSetStatus('waitlisted')}>
              Reinstate to waitlist
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
```

No confirmation dialog on "Suspend" for v1 — `setAccountStatusAction` is trivially reversible (immediately re-activatable from the same row), unlike account deletion which `CLAUDE.md`'s copy table already treats as a serious, 30-day-delayed action. If Alex wants a confirm step later, that's a quick follow-up, not a blocker here.

Commit: `feat(admin): build users list page with activate/suspend actions`

### 4. `apps/web/src/app/admin/nav.tsx` — add the nav item

```tsx
const isUsers = pathname.startsWith('/admin/users');
// ...
<Link href="/admin/users" className={`${s.navItem} ${isUsers ? s.navItemActive : ''}`}>
  <i className="ti ti-users" aria-hidden="true" />
  Users
</Link>
```

Place it between "Dashboard" and "Postings" — user management is the more frequently-used action day-to-day right now (activating early-access signups) than posting jobs.

Commit: `feat(admin): add Users nav item`

---

## Verification

- [ ] `/admin/users` lists all users, newest-first, with working status filter chips.
- [ ] Clicking "Activate" on a waitlisted user flips their status immediately (optimistic) and persists on refresh; the same account can now reach `/feed` (this is the direct fix for "interact with users that I let into the project" — test end-to-end with a real second account, not just the DB row).
- [ ] "Suspend" on an active user immediately blocks their next `/feed` request via the existing middleware gate (no changes needed there — confirm the existing gate already handles `suspended` correctly, since this is the first UI path that can actually produce a suspended user in production).
- [ ] A non-admin hitting the `setAccountStatusAction` Server Action directly (bypassing the UI) gets rejected by `requireAdmin()`.
- [ ] `pnpm check:routes` passes (new `/admin/users` route must be classified — it's already covered by the existing `/admin` prefix pattern in `GATED_PATHS`/middleware if one exists; confirm rather than assume).
- [ ] `pnpm type-check` passes.
