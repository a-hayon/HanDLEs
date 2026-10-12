/** Date du jour à Paris au format YYYY-MM-DD : le joueur change à minuit, heure française. */
export function parisDateKey(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(now);
}
