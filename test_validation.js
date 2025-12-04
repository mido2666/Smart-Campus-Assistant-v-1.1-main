import { validateSchedule } from './src/utils/recurringSchedule.ts';

// Test validation
console.log('Testing validation...');

// Test past date
const pastDateSchedule = {
  frequency: 'daily',
  interval: 1,
  startDate: new Date('2020-01-01T09:00:00Z'), // Past date
  maxSessions: 5
};

const pastValidation = validateSchedule(pastDateSchedule);
console.log('Past date validation:', pastValidation);

// Test invalid end date
const invalidEndDateSchedule = {
  frequency: 'daily',
  interval: 1,
  startDate: new Date('2025-12-01T09:00:00Z'),
  endDate: new Date('2025-11-01T09:00:00Z'), // Before start
  maxSessions: 5
};

const endDateValidation = validateSchedule(invalidEndDateSchedule);
console.log('Invalid end date validation:', endDateValidation);

// Test too many sessions
const tooManySessionsSchedule = {
  frequency: 'daily',
  interval: 1,
  startDate: new Date('2025-12-01T09:00:00Z'),
  maxSessions: 60 // > 50
};

const sessionsValidation = validateSchedule(tooManySessionsSchedule);
console.log('Too many sessions validation:', sessionsValidation);

// Test missing daysOfWeek for weekly
const missingDaysSchedule = {
  frequency: 'weekly',
  interval: 1,
  startDate: new Date('2025-12-01T09:00:00Z'),
  maxSessions: 5
  // No daysOfWeek
};

const daysValidation = validateSchedule(missingDaysSchedule);
console.log('Missing days validation:', daysValidation);

// Test valid schedule
const validSchedule = {
  frequency: 'weekly',
  interval: 1,
  startDate: new Date('2025-12-01T09:00:00Z'),
  endDate: new Date('2025-12-15T09:00:00Z'),
  daysOfWeek: [1, 3, 5],
  maxSessions: 5
};

const validValidation = validateSchedule(validSchedule);
console.log('Valid schedule validation:', validValidation);