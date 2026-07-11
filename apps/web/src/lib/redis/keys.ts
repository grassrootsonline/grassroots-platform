// Matches ROADMAP.md's {entity}:{id}:{variant} key convention. Centralized
// here so middleware.ts, require-admin.ts, and admin-users.actions.ts can't
// drift out of sync with each other (the exact bug class that caused the
// admin_users RLS gap, handoff 058 — two places assuming the same thing
// without a shared source of truth).
export const sessionKey = (authUserId: string) => `session:${authUserId}`
export const adminKey = (userId: string) => `admin:${userId}`
