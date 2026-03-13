export function getDayKey(date = new Date()) {
  return new Intl.DateTimeFormat("sv-SE").format(date);
}
