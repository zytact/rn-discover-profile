import { countWords, formatDayMonth, formatRelativeTime } from './format';

describe('formatDayMonth', () => {
  it.each([
    ['2026-07-01T12:00:00', '1st July'],
    ['2026-07-02T12:00:00', '2nd July'],
    ['2026-07-03T12:00:00', '3rd July'],
    ['2026-07-07T12:00:00', '7th July'],
    ['2026-07-11T12:00:00', '11th July'],
    ['2026-07-13T12:00:00', '13th July'],
    ['2026-07-22T12:00:00', '22nd July'],
  ])('formats %s as %s', (iso, expected) => {
    expect(formatDayMonth(iso)).toBe(expected);
  });
});

describe('formatRelativeTime', () => {
  const now = Date.parse('2026-07-20T12:00:00Z');

  it.each([
    ['2026-07-20T11:59:30Z', 'Just now'],
    ['2026-07-20T11:55:00Z', '5m'],
    ['2026-07-20T09:00:00Z', '3h'],
    ['2026-07-18T12:00:00Z', '2d'],
  ])('formats %s as %s', (iso, expected) => {
    expect(formatRelativeTime(iso, now)).toBe(expected);
  });

  it('falls back to the date after a week', () => {
    expect(formatRelativeTime('2026-07-07T12:00:00', now)).toBe('7th July');
  });
});

describe('countWords', () => {
  it('counts runs of non-whitespace', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   ')).toBe(0);
    expect(countWords(' one  two\nthree ')).toBe(3);
  });
});
