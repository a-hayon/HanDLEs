/** Today's date in Paris as YYYY-MM-DD: the daily player changes at midnight Paris time. */
export function parisDateKey(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(now);
}
