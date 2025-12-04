export class PrismaClient {
  schedule = {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
    update: jest.fn(),
  };
  user = { findUnique: jest.fn() };
  course = { findUnique: jest.fn() };
  qRCode = {
    create: jest.fn().mockResolvedValue({
      sessionId: 'mock-session',
      courseId: 1,
      professorId: 1,
      title: 'Mock',
      description: 'Mock',
      expiresAt: new Date(Date.now() + 60_000),
      isActive: true
    }),
    findUnique: jest.fn().mockResolvedValue({
      sessionId: 'mock-session',
      courseId: 1,
      professorId: 1,
      title: 'Mock',
      expiresAt: new Date(Date.now() + 60_000),
      isActive: true,
      course: {},
      professor: {},
      attendanceRecords: []
    }),
    update: jest.fn().mockResolvedValue({}),
    findMany: jest.fn().mockResolvedValue([])
  };
}


