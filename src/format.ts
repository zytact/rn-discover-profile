const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const ordinal = (day: number) => {
  if (day >= 11 && day <= 13) return 'th';
  return ['th', 'st', 'nd', 'rd'][day % 10] ?? 'th';
};

// Formats like the reference feed, e.g. "7th July", in the device time zone.
export function formatDayMonth(iso: string) {
  const date = new Date(iso);
  const day = date.getDate();
  return `${day}${ordinal(day)} ${months[date.getMonth()]}`;
}

// "Just now", "5m", "3h", "2d", then falls back to the day and month.
export function formatRelativeTime(iso: string, now = Date.now()) {
  const minutes = Math.floor((now - Date.parse(iso)) / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return formatDayMonth(iso);
}

// Matches public.word_count in the database, which enforces the bio limit.
export function countWords(text: string) {
  const trimmed = text.trim();
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
}
