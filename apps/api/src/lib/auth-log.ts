export function logAuthEvent(
  event: 'staff_login_success' | 'staff_login_failure' | 'supabase_exchange',
  details: Record<string, unknown>
) {
  console.info(`[auth] ${event}`, {
    at: new Date().toISOString(),
    ...details
  });
}
