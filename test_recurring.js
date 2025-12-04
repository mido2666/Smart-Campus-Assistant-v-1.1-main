import { generateSessionDates } from './src/utils/recurringSchedule.ts';

// Test daily recurring sessions
console.log('Testing daily recurring sessions...');

const dailySchedule = {
  frequency: 'daily',
  interval: 1,
  startDate: new Date('2025-11-21T09:00:00Z'),
  endDate: new Date('2025-11-25T09:00:00Z'),
  maxSessions: 5
};

const dailyDates = generateSessionDates(dailySchedule);
console.log('Daily dates:', dailyDates);

// Test weekly recurring sessions
console.log('\nTesting weekly recurring sessions...');

const weeklySchedule = {
  frequency: 'weekly',
  interval: 1,
  startDate: new Date('2025-11-21T09:00:00Z'), // Thursday
  endDate: new Date('2025-12-05T09:00:00Z'),
  daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
  maxSessions: 10
};

console.log('Generating weekly dates...');
const weeklyDates = generateSessionDates(weeklySchedule);
console.log('Weekly dates count:', weeklyDates.length);
console.log('Weekly dates:', weeklyDates);

// Test monthly recurring sessions
console.log('\nTesting monthly recurring sessions...');

const monthlySchedule = {
  frequency: 'monthly',
  interval: 1,
  startDate: new Date('2025-11-21T09:00:00Z'),
  endDate: new Date('2026-02-21T09:00:00Z'),
  dayOfMonth: 15,
  maxSessions: 4
};

const monthlyDates = generateSessionDates(monthlySchedule);
console.log('Monthly dates:', monthlyDates);