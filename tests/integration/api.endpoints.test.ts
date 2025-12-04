import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

// Mock Prisma client
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  attendanceSession: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn()
  },
  attendanceRecord: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn()
  },
  fraudAlert: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn()
  },
  deviceFingerprint: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn()
  },
  $transaction: vi.fn(),
  $disconnect: vi.fn()
};

// Mock JWT secret
const JWT_SECRET = 'test-secret';

// Test data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  role: 'PROFESSOR',
  permissions: ['attendance:create', 'attendance:read', 'attendance:update'],
  isActive: true
};

const mockStudent = {
  id: 'student-123',
  email: 'student@example.com',
  role: 'STUDENT',
  permissions: ['attendance:mark'],
  isActive: true
};

const mockSession = {
  id: 'session-123',
  courseId: 1,
  professorId: 'user-123',
  title: 'Test Session',
  description: 'Test Description',
  startTime: new Date('2024-01-15T09:00:00Z'),
  endTime: new Date('2024-01-15T11:00:00Z'),
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    radius: 100,
    name: 'Test Location'
  },
  securitySettings: {
    requireLocation: true,
    requirePhoto: true,
    requireDeviceCheck: true,
    enableFraudDetection: true,
    maxAttempts: 3,
    gracePeriod: 300000
  },
  status: 'SCHEDULED',
  qrCode: 'qr-code-123',
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockAttendanceRecord = {
  id: 'record-123',
  sessionId: 'session-123',
  studentId: 'student-123',
  timestamp: new Date('2024-01-15T10:00:00Z'),
  status: 'PRESENT',
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    accuracy: 5
  },
  deviceFingerprint: 'device-fingerprint-123',
  fraudScore: 15,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Helper function to generate JWT token
const generateToken = (user: any) => {
  return jwt.sign(
    { userId: user.id, role: user.role, permissions: user.permissions },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

describe('API Endpoints Integration Tests', () => {
  let authToken: string;
  let studentToken: string;

  beforeEach(() => {
    authToken = generateToken(mockUser);
    studentToken = generateToken(mockStudent);
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock Prisma methods
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.attendanceSession.findUnique.mockResolvedValue(mockSession);
    mockPrisma.attendanceRecord.findFirst.mockResolvedValue(null);
    mockPrisma.attendanceRecord.create.mockResolvedValue(mockAttendanceRecord);
    mockPrisma.attendanceSession.create.mockResolvedValue(mockSession);
    mockPrisma.attendanceSession.findMany.mockResolvedValue([mockSession]);
    mockPrisma.attendanceSession.count.mockResolvedValue(1);
    mockPrisma.fraudAlert.findMany.mockResolvedValue([]);
    mockPrisma.fraudAlert.count.mockResolvedValue(0);
    mockPrisma.deviceFingerprint.findFirst.mockResolvedValue(null);
    mockPrisma.deviceFingerprint.create.mockResolvedValue({
      id: 'device-123',
      studentId: 'student-123',
      fingerprint: 'device-fingerprint-123',
      deviceInfo: {},
      isActive: true,
      lastUsed: new Date(),
      createdAt: new Date()
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication', () => {
    it('should authenticate valid token', async () => {
      const response = await request(app)
        .get('/api/attendance/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/attendance/sessions')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid token');
    });

    it('should reject missing token', async () => {
      const response = await request(app)
        .get('/api/attendance/sessions')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('No token provided');
    });

    it('should reject expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: mockUser.id, role: mockUser.role },
        JWT_SECRET,
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/api/attendance/sessions')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Token expired');
    });
  });

  describe('Session Management', () => {
    describe('POST /api/attendance/sessions', () => {
      it('should create session successfully', async () => {
        const sessionData = {
          courseId: 1,
          title: 'Test Session',
          description: 'Test Description',
          startTime: '2024-01-15T09:00:00Z',
          endTime: '2024-01-15T11:00:00Z',
          location: {
            latitude: 40.7128,
            longitude: -74.0060,
            radius: 100,
            name: 'Test Location'
          },
          securitySettings: {
            requireLocation: true,
            requirePhoto: true,
            requireDeviceCheck: true,
            enableFraudDetection: true,
            maxAttempts: 3,
            gracePeriod: 300000
          }
        };

        const response = await request(app)
          .post('/api/attendance/sessions')
          .set('Authorization', `Bearer ${authToken}`)
          .send(sessionData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.title).toBe(sessionData.title);
      });

      it('should validate required fields', async () => {
        const invalidData = {
          title: 'Test Session'
          // Missing required fields
        };

        const response = await request(app)
          .post('/api/attendance/sessions')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('validation');
      });

      it('should reject invalid time range', async () => {
        const invalidData = {
          courseId: 1,
          title: 'Test Session',
          startTime: '2024-01-15T11:00:00Z',
          endTime: '2024-01-15T09:00:00Z', // End before start
          securitySettings: {
            requireLocation: true,
            requirePhoto: false,
            requireDeviceCheck: false,
            enableFraudDetection: true,
            maxAttempts: 3,
            gracePeriod: 300000
          }
        };

        const response = await request(app)
          .post('/api/attendance/sessions')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Start time must be before end time');
      });

      it('should reject past start time', async () => {
        const invalidData = {
          courseId: 1,
          title: 'Test Session',
          startTime: '2020-01-15T09:00:00Z', // Past date
          endTime: '2024-01-15T11:00:00Z',
          securitySettings: {
            requireLocation: true,
            requirePhoto: false,
            requireDeviceCheck: false,
            enableFraudDetection: true,
            maxAttempts: 3,
            gracePeriod: 300000
          }
        };

        const response = await request(app)
          .post('/api/attendance/sessions')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Start time must be in the future');
      });
    });

    describe('GET /api/attendance/sessions', () => {
      it('should list sessions with pagination', async () => {
        const response = await request(app)
          .get('/api/attendance/sessions?page=1&limit=10')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.sessions).toBeDefined();
        expect(response.body.data.pagination).toBeDefined();
        expect(response.body.data.pagination.page).toBe(1);
        expect(response.body.data.pagination.limit).toBe(10);
      });

      it('should filter sessions by status', async () => {
        const response = await request(app)
          .get('/api/attendance/sessions?status=ACTIVE')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(mockPrisma.attendanceSession.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              status: 'ACTIVE'
            })
          })
        );
      });

      it('should filter sessions by course', async () => {
        const response = await request(app)
          .get('/api/attendance/sessions?courseId=1')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(mockPrisma.attendanceSession.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              courseId: 1
            })
          })
        );
      });
    });

    describe('GET /api/attendance/sessions/:id', () => {
      it('should get session details', async () => {
        const response = await request(app)
          .get('/api/attendance/sessions/session-123')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.id).toBe('session-123');
      });

      it('should return 404 for non-existent session', async () => {
        mockPrisma.attendanceSession.findUnique.mockResolvedValue(null);

        const response = await request(app)
          .get('/api/attendance/sessions/non-existent')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Session not found');
      });

      it('should deny access to other professor\'s session', async () => {
        const otherUser = { ...mockUser, id: 'other-professor' };
        mockPrisma.user.findUnique.mockResolvedValue(otherUser);

        const response = await request(app)
          .get('/api/attendance/sessions/session-123')
          .set('Authorization', `Bearer ${generateToken(otherUser)}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Access denied');
      });
    });

    describe('PUT /api/attendance/sessions/:id', () => {
      it('should update session successfully', async () => {
        const updateData = {
          title: 'Updated Session',
          description: 'Updated Description'
        };

        const response = await request(app)
          .put('/api/attendance/sessions/session-123')
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe(updateData.title);
      });

      it('should reject update of active session', async () => {
        const activeSession = { ...mockSession, status: 'ACTIVE' };
        mockPrisma.attendanceSession.findUnique.mockResolvedValue(activeSession);

        const response = await request(app)
          .put('/api/attendance/sessions/session-123')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: 'Updated Session' })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Cannot update active session');
      });
    });

    describe('DELETE /api/attendance/sessions/:id', () => {
      it('should delete session successfully', async () => {
        const response = await request(app)
          .delete('/api/attendance/sessions/session-123')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted successfully');
      });

      it('should reject deletion of active session', async () => {
        const activeSession = { ...mockSession, status: 'ACTIVE' };
        mockPrisma.attendanceSession.findUnique.mockResolvedValue(activeSession);

        const response = await request(app)
          .delete('/api/attendance/sessions/session-123')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Cannot delete active session');
      });
    });

    describe('POST /api/attendance/sessions/:id/start', () => {
      it('should start session successfully', async () => {
        const response = await request(app)
          .post('/api/attendance/sessions/session-123/start')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('started successfully');
      });

      it('should reject starting non-scheduled session', async () => {
        const activeSession = { ...mockSession, status: 'ACTIVE' };
        mockPrisma.attendanceSession.findUnique.mockResolvedValue(activeSession);

        const response = await request(app)
          .post('/api/attendance/sessions/session-123/start')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('not in scheduled status');
      });
    });

    describe('POST /api/attendance/sessions/:id/stop', () => {
      it('should stop session successfully', async () => {
        const activeSession = { ...mockSession, status: 'ACTIVE' };
        mockPrisma.attendanceSession.findUnique.mockResolvedValue(activeSession);

        const response = await request(app)
          .post('/api/attendance/sessions/session-123/stop')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('stopped successfully');
      });

      it('should reject stopping non-active session', async () => {
        const response = await request(app)
          .post('/api/attendance/sessions/session-123/stop')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('not active');
      });
    });
  });

  describe('Attendance Processing', () => {
    describe('POST /api/attendance/scan', () => {
      it('should scan QR code successfully', async () => {
        const scanData = {
          sessionId: 'session-123',
          qrCode: 'qr-code-123',
          location: {
            latitude: 40.7128,
            longitude: -74.0060,
            accuracy: 5
          },
          deviceFingerprint: 'device-fingerprint-123'
        };

        const response = await request(app)
          .post('/api/attendance/scan')
          .set('Authorization', `Bearer ${studentToken}`)
          .send(scanData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.status).toBe('PRESENT');
      });

      it('should reject invalid QR code', async () => {
        const scanData = {
          sessionId: 'session-123',
          qrCode: 'invalid-qr-code',
          location: {
            latitude: 40.7128,
            longitude: -74.0060,
            accuracy: 5
          }
        };

        const response = await request(app)
          .post('/api/attendance/scan')
          .set('Authorization', `Bearer ${studentToken}`)
          .send(scanData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid QR code');
      });

      it('should reject attendance outside location', async () => {
        const scanData = {
          sessionId: 'session-123',
          qrCode: 'qr-code-123',
          location: {
            latitude: 51.5074, // London (far from NYC)
            longitude: -0.1278,
            accuracy: 5
          }
        };

        const response = await request(app)
          .post('/api/attendance/scan')
          .set('Authorization', `Bearer ${studentToken}`)
          .send(scanData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Location verification failed');
      });

      it('should reject duplicate attendance', async () => {
        mockPrisma.attendanceRecord.findFirst.mockResolvedValue(mockAttendanceRecord);

        const scanData = {
          sessionId: 'session-123',
          qrCode: 'qr-code-123',
          location: {
            latitude: 40.7128,
            longitude: -74.0060,
            accuracy: 5
          }
        };

        const response = await request(app)
          .post('/api/attendance/scan')
          .set('Authorization', `Bearer ${studentToken}`)
          .send(scanData)
          .expect(409);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Attendance already marked');
      });
    });

    describe('POST /api/attendance/mark', () => {
      it('should mark attendance manually', async () => {
        const markData = {
          sessionId: 'session-123',
          studentId: 'student-123',
          status: 'PRESENT',
          notes: 'Manual attendance'
        };

        const response = await request(app)
          .post('/api/attendance/mark')
          .set('Authorization', `Bearer ${authToken}`)
          .send(markData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.status).toBe('PRESENT');
      });

      it('should update existing attendance record', async () => {
        mockPrisma.attendanceRecord.findFirst.mockResolvedValue(mockAttendanceRecord);

        const markData = {
          sessionId: 'session-123',
          studentId: 'student-123',
          status: 'LATE',
          notes: 'Updated attendance'
        };

        const response = await request(app)
          .post('/api/attendance/mark')
          .set('Authorization', `Bearer ${authToken}`)
          .send(markData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('updated successfully');
      });
    });

    describe('GET /api/attendance/status/:sessionId', () => {
      it('should get attendance status', async () => {
        mockPrisma.attendanceRecord.findMany.mockResolvedValue([mockAttendanceRecord]);

        const response = await request(app)
          .get('/api/attendance/status/session-123')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.attendance).toBeDefined();
        expect(response.body.data.attendance.total).toBe(1);
        expect(response.body.data.attendance.present).toBe(1);
      });
    });
  });

  describe('Security & Fraud Detection', () => {
    describe('POST /api/attendance/verify-location', () => {
      it('should verify location successfully', async () => {
        const locationData = {
          sessionId: 'session-123',
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 5
        };

        const response = await request(app)
          .post('/api/attendance/verify-location')
          .set('Authorization', `Bearer ${studentToken}`)
          .send(locationData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.isWithinRadius).toBe(true);
      });

      it('should reject location outside radius', async () => {
        const locationData = {
          sessionId: 'session-123',
          latitude: 51.5074, // London
          longitude: -0.1278,
          accuracy: 5
        };

        const response = await request(app)
          .post('/api/attendance/verify-location')
          .set('Authorization', `Bearer ${studentToken}`)
          .send(locationData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.isWithinRadius).toBe(false);
      });
    });

    describe('POST /api/attendance/verify-device', () => {
      it('should verify device successfully', async () => {
        mockPrisma.deviceFingerprint.findFirst.mockResolvedValue({
          id: 'device-123',
          studentId: 'student-123',
          fingerprint: 'device-fingerprint-123',
          deviceInfo: {},
          isActive: true,
          lastUsed: new Date(),
          createdAt: new Date()
        });

        const deviceData = {
          deviceFingerprint: 'device-fingerprint-123'
        };

        const response = await request(app)
          .post('/api/attendance/verify-device')
          .set('Authorization', `Bearer ${studentToken}`)
          .send(deviceData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.isVerified).toBe(true);
      });

      it('should reject unregistered device', async () => {
        const deviceData = {
          deviceFingerprint: 'unknown-device-fingerprint'
        };

        const response = await request(app)
          .post('/api/attendance/verify-device')
          .set('Authorization', `Bearer ${studentToken}`)
          .send(deviceData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Device verification failed');
      });
    });

    describe('GET /api/attendance/fraud-alerts', () => {
      it('should get fraud alerts', async () => {
        const mockAlerts = [
          {
            id: 'alert-123',
            studentId: 'student-123',
            sessionId: 'session-123',
            alertType: 'LOCATION_FRAUD',
            severity: 'HIGH',
            description: 'Suspicious location detected',
            isResolved: false,
            createdAt: new Date()
          }
        ];

        mockPrisma.fraudAlert.findMany.mockResolvedValue(mockAlerts);
        mockPrisma.fraudAlert.count.mockResolvedValue(1);

        const response = await request(app)
          .get('/api/attendance/fraud-alerts')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.alerts).toBeDefined();
        expect(response.body.data.alerts).toHaveLength(1);
      });

      it('should filter fraud alerts by severity', async () => {
        const response = await request(app)
          .get('/api/attendance/fraud-alerts?severity=HIGH')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(mockPrisma.fraudAlert.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              severity: 'HIGH'
            })
          })
        );
      });
    });
  });

  describe('Analytics & Reporting', () => {
    describe('GET /api/attendance/analytics', () => {
      it('should get analytics data', async () => {
        const response = await request(app)
          .get('/api/attendance/analytics')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.summary).toBeDefined();
        expect(response.body.data.trends).toBeDefined();
      });

      it('should filter analytics by date range', async () => {
        const response = await request(app)
          .get('/api/attendance/analytics?startDate=2024-01-01&endDate=2024-01-31')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(mockPrisma.attendanceRecord.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              timestamp: expect.objectContaining({
                gte: new Date('2024-01-01'),
                lte: new Date('2024-01-31')
              })
            })
          })
        );
      });
    });

    describe('GET /api/attendance/security-metrics', () => {
      it('should get security metrics', async () => {
        const response = await request(app)
          .get('/api/attendance/security-metrics')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.totalSessions).toBeDefined();
        expect(response.body.data.totalAttendance).toBeDefined();
        expect(response.body.data.fraudAttempts).toBeDefined();
      });
    });
  });

  describe('Device Management', () => {
    describe('POST /api/attendance/register-device', () => {
      it('should register device successfully', async () => {
        const deviceData = {
          deviceFingerprint: 'new-device-fingerprint',
          deviceInfo: {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            platform: 'Win32',
            language: 'en-US'
          },
          deviceName: 'Test Device'
        };

        const response = await request(app)
          .post('/api/attendance/register-device')
          .set('Authorization', `Bearer ${studentToken}`)
          .send(deviceData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.message).toContain('registered successfully');
      });

      it('should reject duplicate device registration', async () => {
        mockPrisma.deviceFingerprint.findFirst.mockResolvedValue({
          id: 'device-123',
          studentId: 'student-123',
          fingerprint: 'existing-device-fingerprint',
          deviceInfo: {},
          isActive: true,
          lastUsed: new Date(),
          createdAt: new Date()
        });

        const deviceData = {
          deviceFingerprint: 'existing-device-fingerprint',
          deviceInfo: {},
          deviceName: 'Test Device'
        };

        const response = await request(app)
          .post('/api/attendance/register-device')
          .set('Authorization', `Bearer ${studentToken}`)
          .send(deviceData)
          .expect(409);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Device already registered');
      });

      it('should enforce device limit', async () => {
        // Mock device limit reached
        mockPrisma.deviceFingerprint.count.mockResolvedValue(5);

        const deviceData = {
          deviceFingerprint: 'new-device-fingerprint',
          deviceInfo: {},
          deviceName: 'Test Device'
        };

        const response = await request(app)
          .post('/api/attendance/register-device')
          .set('Authorization', `Bearer ${studentToken}`)
          .send(deviceData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Maximum device limit reached');
      });
    });

    describe('GET /api/attendance/devices', () => {
      it('should list user devices', async () => {
        const mockDevices = [
          {
            id: 'device-123',
            studentId: 'student-123',
            fingerprint: 'device-fingerprint-123',
            deviceInfo: {},
            isActive: true,
            lastUsed: new Date(),
            createdAt: new Date()
          }
        ];

        mockPrisma.deviceFingerprint.findMany.mockResolvedValue(mockDevices);
        mockPrisma.deviceFingerprint.count.mockResolvedValue(1);

        const response = await request(app)
          .get('/api/attendance/devices')
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.devices).toBeDefined();
        expect(response.body.data.devices).toHaveLength(1);
      });
    });

    describe('DELETE /api/attendance/devices/:id', () => {
      it('should remove device successfully', async () => {
        const response = await request(app)
          .delete('/api/attendance/devices/device-123')
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('removed successfully');
      });

      it('should return 404 for non-existent device', async () => {
        mockPrisma.deviceFingerprint.findUnique.mockResolvedValue(null);

        const response = await request(app)
          .delete('/api/attendance/devices/non-existent')
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Device not found');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.attendanceSession.findMany.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get('/api/attendance/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Internal server error');
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        title: '', // Empty title
        courseId: 'invalid' // Invalid course ID
      };

      const response = await request(app)
        .post('/api/attendance/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('validation');
    });

    it('should handle rate limiting', async () => {
      // Mock rate limiting
      const response = await request(app)
        .post('/api/attendance/scan')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          sessionId: 'session-123',
          qrCode: 'qr-code-123'
        })
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('rate limit');
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 10 }, () =>
        request(app)
          .get('/api/attendance/sessions')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should respond within acceptable time', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/attendance/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });
  });
});
