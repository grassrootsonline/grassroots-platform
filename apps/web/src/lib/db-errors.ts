// 23505 is Postgres's standard SQLSTATE for unique_violation — stable
// across Postgres versions, safe to match on.
export function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === '23505';
}
