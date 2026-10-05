/**
 * Shared local-calendar-date helper for the food diary.
 *
 * Both the READ side ({@link DailyDashboard}, which queries `food_logs` by
 * `logged_on`) and the WRITE side ({@link ManualFoodForm}, which inserts a new
 * log) must agree on what "today" means. If they disagree, a freshly logged
 * item can be written under one `logged_on` while the dashboard is subscribed
 * to another, so the item neither appears nor matches the invalidation key.
 *
 * To keep them in lockstep, this module is the single source of truth for the
 * current day string.
 */

/**
 * Today's LOCAL calendar date as a `yyyy-mm-dd` string.
 *
 * We deliberately build the string from the LOCAL date parts rather than
 * `Date#toISOString()` (which is UTC) so a log made late at night is attributed
 * to the user's own calendar day, not the next/previous UTC day for users
 * west/east of UTC. The month and day are zero-padded to keep the DB
 * `logged_on` (a Postgres `date`) format stable.
 *
 * Pure: takes an optional `now` for deterministic testing and never reads or
 * mutates external state otherwise.
 */
export function localToday(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
