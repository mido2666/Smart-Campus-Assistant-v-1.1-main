import { generateSessionDates } from './src/utils/recurringSchedule.ts';

// Test monthly recurring sessions
console.log('Testing monthly recurring sessions...');

const monthlySchedule = {
  frequency: 'monthly',
  interval: 1,
  startDate: new Date('2025-11-15T09:00:00Z'),
  endDate: new Date('2026-02-15T09:00:00Z'),
  dayOfMonth: 15,
  maxSessions: 4
};

console.log('Generating monthly dates...');
const monthlyDates = generateSessionDates(monthlySchedule);
console.log('Monthly dates count:', monthlyDates.length);
console.log('Monthly dates:', monthlyDates);