import { parseHHMM, formatTo12h, durationLabel, isValidRange } from '../src/utils/time';

describe('time utils', () => {
  it('parses HH:MM correctly', () => {
    expect(parseHHMM('00:00')).toEqual({ hours: 0, minutes: 0 });
    expect(parseHHMM('13:05')).toEqual({ hours: 13, minutes: 5 });
    expect(parseHHMM('24:00')).toBeNull();
    expect(parseHHMM('9:7')).toBeNull(); // Invalid format - minutes must be 2 digits
    expect(parseHHMM('09:07')).toEqual({ hours: 9, minutes: 7 });
  });

  it('formats to 12h', () => {
    expect(formatTo12h({ hours: 0, minutes: 0 })).toBe('12:00 AM');
    expect(formatTo12h({ hours: 12, minutes: 0 })).toBe('12:00 PM');
    expect(formatTo12h({ hours: 15, minutes: 30 })).toBe('3:30 PM');
    expect(formatTo12h({ hours: 1, minutes: 0 })).toBe('1:00 AM');
    expect(formatTo12h({ hours: 11, minutes: 59 })).toBe('11:59 AM');
    expect(formatTo12h({ hours: 23, minutes: 59 })).toBe('11:59 PM');
  });

  it('computes duration label', () => {
    expect(durationLabel({ hours: 9, minutes: 0 }, { hours: 10, minutes: 0 })).toBe('1h');
    expect(durationLabel({ hours: 9, minutes: 15 }, { hours: 10, minutes: 45 })).toBe('1h 30m');
    expect(durationLabel({ hours: 9, minutes: 0 }, { hours: 9, minutes: 5 })).toBe('5m');
    expect(durationLabel({ hours: 9, minutes: 0 }, { hours: 9, minutes: 0 })).toBe('0m');
  });

  it('validates ranges', () => {
    expect(isValidRange('09:00', '10:00')).toBe(true);
    expect(isValidRange('10:00', '09:00')).toBe(false);
    expect(isValidRange('09:00', '09:00')).toBe(false);
    expect(isValidRange('xx', '10:00')).toBe(false);
  });
});


