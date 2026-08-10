export const defaultHouseholdTimeZone = "Europe/Paris";

export function getDayKey(
  date = new Date(),
  timeZone = defaultHouseholdTimeZone,
) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone }).format(date);
}
