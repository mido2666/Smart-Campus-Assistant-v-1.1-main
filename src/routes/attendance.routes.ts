import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { PrismaClient, UserRole, FraudAlertType, EnrollmentStatus } from '@prisma/client';
import { NotificationType, NotificationCategory } from '../types/notification.types.js';
import prisma from '../../config/database.js';
import { NotificationService } from '../services/notification.service.js';
import { SocketService } from '../services/socket.service.js';

// Helper to get SocketService instance (if available)
// This will be set from server/index.ts
let globalSocketService: SocketService | undefined;

export const setAttendanceSocketService = (socketService: SocketService) => {
  globalSocketService = socketService;
};

// Types
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    permissions: string[];
  };
}

interface AttendanceSession {
  id: string;
  courseId: number;
  professorId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
    name: string;
  };
  securitySettings: {
    requireLocation: boolean;
    requirePhoto: boolean;
    requireDeviceCheck: boolean;
    enableFraudDetection: boolean;
    maxAttempts: number;
    gracePeriod: number;
  };
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  qrCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  timestamp: Date;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  deviceFingerprint?: string;
  photoUrl?: string;
  fraudScore?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SecurityMetrics {
  totalSessions: number;
  totalAttendance: number;
  fraudAttempts: number;
  securityScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  trends: {
    attendance: number[];
    fraud: number[];
    security: number[];
  };
}

// Create router
const router = Router();

// Rate limiting middleware
const createRateLimit = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// General rate limiting (disabled in development)
const generalLimiter = process.env.NODE_ENV === 'development'
  ? (req: Request, res: Response, next: NextFunction) => next() // No rate limit in dev
  : createRateLimit(15 * 60 * 1000, 100, 'Too many requests from this IP, please try again later.');

// Strict rate limiting for sensitive operations (disabled in development)
const strictLimiter = process.env.NODE_ENV === 'development'
  ? (req: Request, res: Response, next: NextFunction) => next() // No rate limit in dev
  : createRateLimit(15 * 60 * 1000, 10, 'Too many sensitive requests from this IP, please try again later.');

// Root route - simple readiness/info (no auth)
router.get('/', generalLimiter, (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Attendance API is available',
    data: {
      version: '1.0',
      routes: [
        '/sessions',
        '/sessions/stats',
        '/sessions/active',
        '/sessions/scheduled',
        '/sessions/completed',
        '/scan',
        '/mark',
        '/status/:sessionId',
        '/records/:id',
        '/verify-location',
        '/verify-device',
        '/upload-photo',
        '/fraud-alerts',
        '/report-fraud',
        '/fraud-alerts/:id/resolve',
        '/analytics',
        '/security-metrics',
        '/reports',
        '/export/:format',
        '/devices',
        '/devices/:id'
      ]
    }
  });
});

// Authentication middleware
const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({
      where: { id: parseInt(decoded.userId) },
      select: {
        id: true,
        email: true,
        role: true,
        universityId: true,
        firstName: true,
        lastName: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Note: User model doesn't have isActive or permissions fields in current schema
    // All users are considered active by default
    req.user = user as any;
    next();
  } catch (error) {
    console.error('[authenticateToken] Error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Authorization middleware
const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Note: permissions system not implemented in current schema
    // For now, allow based on role
    // Professors can mark attendance, students cannot
    if (permission === 'mark_attendance' && req.user?.role !== 'PROFESSOR') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Validation middleware
const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Error handling middleware
const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Attendance API Error:', error);

  if (error.code === 'P2002') {
    return res.status(409).json({ error: 'Duplicate entry' });
  }

  if (error.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    stack: error.stack,
    details: error
  });
};

// Multer configuration for photo uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Validation schemas
const createSessionSchema = z.object({
  courseId: z.number().positive(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    radius: z.number().positive(),
    name: z.string().min(1)
  }).optional(),
  securitySettings: z.object({
    requireLocation: z.boolean(),
    requirePhoto: z.boolean(),
    requireDeviceCheck: z.boolean(),
    enableFraudDetection: z.boolean(),
    maxAttempts: z.number().positive(),
    gracePeriod: z.number().nonnegative()
  })
});

const scanAttendanceSchema = z.object({
  sessionId: z.string().uuid(),
  qrCode: z.string().min(1),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracy: z.number().positive()
  }).optional(),
  deviceFingerprint: z.string().optional(),
  photo: z.string().optional()
});

// Utility functions
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const generateQRCode = (sessionId: string): string => {
  return `attendance-${sessionId}-${Date.now()}`;
};

const calculateFraudScore = (data: any): number => {
  let score = 0;

  // Location fraud detection
  if (data.location) {
    const distance = calculateDistance(
      data.location.latitude,
      data.location.longitude,
      data.sessionLocation.latitude,
      data.sessionLocation.longitude
    );

    if (distance > data.sessionLocation.radius) {
      score += 50;
    }
  }

  // Device fraud detection
  if (data.deviceFingerprint) {
    // Check if device is registered
    if (!data.registeredDevices.includes(data.deviceFingerprint)) {
      score += 30;
    }
  }

  // Time fraud detection
  const now = new Date();
  const sessionStart = new Date(data.sessionStartTime);
  const sessionEnd = new Date(data.sessionEndTime);

  if (now < sessionStart || now > sessionEnd) {
    score += 40;
  }

  return Math.min(100, score);
};

// Session Management Routes

// POST /api/attendance/sessions - Create session
router.post('/sessions',
  generalLimiter,
  authenticateToken,
  requirePermission('create_session'),
  [
    body('courseId').isInt().withMessage('Course ID must be an integer'),
    body('title').isLength({ min: 1, max: 255 }).withMessage('Title must be between 1 and 255 characters'),
    body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
    body('startTime').isISO8601().withMessage('Start time must be a valid ISO 8601 date'),
    body('endTime').isISO8601().withMessage('End time must be a valid ISO 8601 date'),
    body('location.latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
    body('location.longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
    body('location.radius').optional().isFloat({ min: 1 }).withMessage('Radius must be positive'),
    body('securitySettings.requireLocation').isBoolean().withMessage('Require location must be boolean'),
    body('securitySettings.requirePhoto').isBoolean().withMessage('Require photo must be boolean'),
    body('securitySettings.requireDeviceCheck').isBoolean().withMessage('Require device check must be boolean'),
    body('securitySettings.enableFraudDetection').isBoolean().withMessage('Enable fraud detection must be boolean'),
    body('securitySettings.maxAttempts').isInt({ min: 1 }).withMessage('Max attempts must be positive'),
    body('securitySettings.gracePeriod').isInt({ min: 0 }).withMessage('Grace period must be non-negative')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const sessionData = createSessionSchema.parse(req.body);

      // Verify course exists and user has access
      const professorId = typeof req.user!.id === 'string' ? parseInt(req.user!.id) : req.user!.id;
      const course = await prisma.course.findFirst({
        where: {
          id: sessionData.courseId,
          OR: [
            { professorId: professorId },
            { schedules: { some: { professorId: professorId } } }
          ]
        }
      });

      if (!course) {
        return res.status(404).json({ error: 'Course not found or access denied' });
      }

      // Create session using QRCode model
      const sessionId = uuidv4();
      const session = await prisma.qRCode.create({
        data: {
          sessionId: sessionId,
          courseId: sessionData.courseId,
          professorId: professorId,
          title: sessionData.title,
          description: sessionData.description || '',
          validFrom: new Date(sessionData.startTime),
          validTo: new Date(sessionData.endTime),
          expiresAt: new Date(sessionData.endTime),
          latitude: sessionData.location?.latitude || 0,
          longitude: sessionData.location?.longitude || 0,
          radius: sessionData.location?.radius || 50,
          isLocationRequired: sessionData.securitySettings?.requireLocation ?? true,
          isPhotoRequired: sessionData.securitySettings?.requirePhoto ?? false,
          isDeviceCheckRequired: sessionData.securitySettings?.requireDeviceCheck ?? true,
          fraudDetectionEnabled: sessionData.securitySettings?.enableFraudDetection ?? true,
          maxAttempts: sessionData.securitySettings?.maxAttempts || 3,
          gracePeriod: sessionData.securitySettings?.gracePeriod || 5,
          isActive: true,
        },
        include: {
          course: {
            select: {
              id: true,
              courseName: true,
              courseCode: true,
              enrollments: {
                select: {
                  studentId: true,
                  student: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true,
                    }
                  }
                },
                where: {
                  status: 'ACTIVE'
                }
              }
            }
          }
        }
      });

      // Send response immediately
      res.status(201).json({
        success: true,
        data: session,
        message: 'Session created successfully'
      });

      // Send notifications to all enrolled students asynchronously
      // We don't await this to avoid blocking the response
      (async () => {
        try {
          const enrolledStudents = session.course.enrollments;

          if (enrolledStudents && enrolledStudents.length > 0) {
            // Format session time
            const startTime = new Date(sessionData.startTime);
            const endTime = new Date(sessionData.endTime);
            const timeFormat = new Intl.DateTimeFormat('ar', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            // Create NotificationService instance for sending real-time notifications
            // SocketService will be injected if available from server/index.ts
            const notificationService = new NotificationService(globalSocketService);

            // Create notifications for all students
            const notifications = await Promise.all(
              enrolledStudents.map(async (enrollment) => {
                const student = enrollment.student;

                const notificationTitle = `محاضرة جديدة: ${session.course.courseName}`;
                const notificationMessage = `تم إنشاء محاضرة جديدة بعنوان "${session.title}" لمقرر ${session.course.courseCode} - ${session.course.courseName}. تبدأ المحاضرة في ${timeFormat.format(startTime)} وتنتهي في ${timeFormat.format(endTime)}.${session.description ? `\n\n${session.description}` : ''}`;

                // Create notification using NotificationService (includes Socket.io broadcast)
                const notification = await notificationService.createNotification({
                  userId: student.id,
                  title: notificationTitle,
                  message: notificationMessage,
                  type: NotificationType.INFO,
                  category: NotificationCategory.ATTENDANCE,
                  metadata: {
                    qrCodeId: session.id,
                    courseId: session.courseId,
                    courseName: session.course.courseName,
                    courseCode: session.course.courseCode,
                    sessionTitle: session.title,
                    startTime: sessionData.startTime,
                    endTime: sessionData.endTime,
                    location: sessionData.location
                  },
                  sendEmail: false // Set to true if you want to send emails too
                });

                return notification;
              })
            );

            console.log(`✅ Sent ${notifications.length} notifications to students for new session: ${session.title}`);
          }
        } catch (notificationError) {
          // Log error but don't fail the session creation
          console.error('⚠️ Error sending notifications to students:', notificationError);
        }
      })();
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/attendance/sessions - List sessions
router.get('/sessions',
  generalLimiter,
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).withMessage('Invalid status'),
    query('courseId').optional().isInt().withMessage('Course ID must be an integer'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO 8601 date')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const where: any = {};

      // Filter by user role
      if (req.user!.role === 'PROFESSOR') {
        // Convert user.id to number if it's a string (from JWT)
        where.professorId = typeof req.user!.id === 'string' ? parseInt(req.user!.id) : req.user!.id;
      } else if (req.user!.role === 'STUDENT') {
        where.course = {
          enrollments: {
            some: {
              studentId: req.user!.id
            }
          }
        };
      }

      // Apply filters (QRCode model uses validFrom/validTo instead of startTime/endTime)
      if (req.query.courseId) {
        where.courseId = parseInt(req.query.courseId as string);
      }

      if (req.query.startDate) {
        where.validFrom = {
          gte: new Date(req.query.startDate as string)
        };
      }

      if (req.query.endDate) {
        where.validTo = {
          lte: new Date(req.query.endDate as string)
        };
      }

      // Status filter requires calculation based on isActive and validFrom/validTo dates
      if (req.query.status) {
        const now = new Date();
        switch (req.query.status) {
          case 'SCHEDULED':
            where.isActive = true;
            where.validFrom = { gt: now };
            break;
          case 'ACTIVE':
            where.isActive = true;
            where.validFrom = { lte: now };
            where.validTo = { gte: now };
            break;
          case 'COMPLETED':
            where.validTo = { lt: now };
            break;
          case 'CANCELLED':
            where.isActive = false;
            break;
        }
      }

      const [sessions, total] = await Promise.all([
        prisma.qRCode.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            course: {
              select: {
                id: true,
                courseName: true,
                courseCode: true,
                _count: {
                  select: {
                    enrollments: {
                      where: {
                        status: EnrollmentStatus.ACTIVE
                      }
                    }
                  }
                }
              }
            },
            _count: {
              select: {
                attendanceRecords: true
              }
            }
          }
        }),
        prisma.qRCode.count({ where })
      ]);

      // Transform QRCode data to AttendanceSession format for frontend compatibility
      const formattedSessions = sessions.map(session => {
        const now = new Date();
        let status: string;
        if (!session.isActive) {
          status = 'CANCELLED';
        } else if (now < session.validFrom) {
          status = 'SCHEDULED';
        } else if (now > session.validTo) {
          // Check if session is paused (expiresAt contains original validTo and is in the future)
          // A session is PAUSED only if expiresAt is significantly greater than validTo (more than 1 second)
          // This prevents stopped sessions from being detected as paused due to timing differences
          const timeDiff = session.expiresAt.getTime() - session.validTo.getTime();
          if (timeDiff > 1000 && session.expiresAt > now) {
            status = 'PAUSED';
          } else {
            status = 'ENDED';
          }
        } else {
          status = 'ACTIVE';
        }

        return {
          id: String(session.id), // Use Prisma ID, convert to string for consistency
          sessionId: session.sessionId, // Also include sessionId for reference
          professorId: String(session.professorId),
          courseId: session.courseId,
          courseName: session.course.courseName,
          courseCode: session.course.courseCode,
          title: session.title,
          description: session.description || '',
          startTime: session.validFrom.toISOString(),
          endTime: session.validTo.toISOString(),
          location: {
            latitude: session.latitude,
            longitude: session.longitude,
            radius: session.radius,
            name: 'Campus Location'
          },
          security: {
            isLocationRequired: session.isLocationRequired,
            isPhotoRequired: session.isPhotoRequired,
            isDeviceCheckRequired: session.isDeviceCheckRequired,
            fraudDetectionEnabled: session.fraudDetectionEnabled,
            gracePeriod: session.gracePeriod,
            maxAttempts: session.maxAttempts,
            riskThreshold: 70
          },
          status,
          totalStudents: session.course._count.enrollments,
          presentStudents: session._count.attendanceRecords,
          absentStudents: session.course._count.enrollments - session._count.attendanceRecords,
          lateStudents: 0,
          fraudAlerts: 0,
          qrCode: session.sessionId,
          createdAt: session.createdAt.toISOString(),
          updatedAt: session.updatedAt.toISOString()
        };
      });

      res.json({
        success: true,
        data: {
          data: formattedSessions,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/attendance/sessions/stats - Get session statistics
router.get('/sessions/stats',
  generalLimiter,
  authenticateToken,
  [
    query('professorId').optional().isUUID().withMessage('Professor ID must be a valid UUID'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO 8601 date')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { professorId, startDate, endDate } = req.query;

      const where: any = {};

      // Filter by professor
      if (professorId) {
        where.professorId = professorId;
      } else if (req.user!.role === 'PROFESSOR') {
        where.professorId = req.user!.id;
      }

      // Apply date filters
      if (startDate) {
        where.createdAt = {
          ...where.createdAt,
          gte: new Date(startDate as string)
        };
      }

      if (endDate) {
        where.createdAt = {
          ...where.createdAt,
          lte: new Date(endDate as string)
        };
      }

      const now = new Date();
      const [totalSessions, activeSessions, scheduledSessions, completedSessions] = await Promise.all([
        prisma.qRCode.count({ where }),
        prisma.qRCode.count({ where: { ...where, isActive: true, validFrom: { lte: now }, validTo: { gte: now } } }),
        prisma.qRCode.count({ where: { ...where, isActive: true, validFrom: { gt: now } } }),
        prisma.qRCode.count({ where: { ...where, validTo: { lt: now } } })
      ]);

      // Get attendance statistics
      const attendanceStats = await prisma.attendanceRecord.aggregate({
        where: {
          qrCode: where
        },
        _count: {
          id: true
        },
        _avg: {
          fraudScore: true
        }
      });

      const fraudAlerts = await prisma.fraudAlert.count({
        where: {
          qrCode: where
        }
      });

      const stats = {
        totalSessions,
        activeSessions,
        scheduledSessions,
        completedSessions,
        totalStudents: attendanceStats._count?.id || 0,
        averageAttendance: totalSessions > 0 ? ((attendanceStats._count?.id || 0) / totalSessions) : 0,
        fraudAlerts,
        averageFraudScore: attendanceStats._avg?.fraudScore || 0
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/attendance/sessions/active - Get active sessions
router.get('/sessions/active',
  generalLimiter,
  authenticateToken,
  [
    query('professorId').optional().isUUID().withMessage('Professor ID must be a valid UUID')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { professorId } = req.query;

      const now = new Date();
      const where: any = { isActive: true, validFrom: { lte: now }, validTo: { gte: now } };

      if (professorId) {
        where.professorId = professorId;
      } else if (req.user!.role === 'PROFESSOR') {
        where.professorId = req.user!.id;
      }

      const sessions = await prisma.qRCode.findMany({
        where,
        include: {
          course: {
            select: {
              id: true,
              courseName: true,
              courseCode: true
            }
          },
          _count: {
            select: {
              attendanceRecords: true
            }
          }
        },
        orderBy: { validFrom: 'asc' }
      });

      res.json({
        success: true,
        data: sessions
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/attendance/sessions/scheduled - Get scheduled sessions
router.get('/sessions/scheduled',
  generalLimiter,
  authenticateToken,
  [
    query('professorId').optional().isUUID().withMessage('Professor ID must be a valid UUID')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { professorId } = req.query;

      const now = new Date();
      const where: any = { isActive: true, validFrom: { gt: now } };

      if (professorId) {
        where.professorId = professorId;
      } else if (req.user!.role === 'PROFESSOR') {
        where.professorId = req.user!.id;
      }

      const sessions = await prisma.qRCode.findMany({
        where,
        include: {
          course: {
            select: {
              id: true,
              courseName: true,
              courseCode: true
            }
          }
        },
        orderBy: { validFrom: 'asc' }
      });

      res.json({
        success: true,
        data: sessions
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/attendance/sessions/completed - Get completed sessions
router.get('/sessions/completed',
  generalLimiter,
  authenticateToken,
  [
    query('professorId').optional().isUUID().withMessage('Professor ID must be a valid UUID'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { professorId } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const now = new Date();
      const where: any = { validTo: { lt: now } };

      if (professorId) {
        where.professorId = professorId;
      } else if (req.user!.role === 'PROFESSOR') {
        where.professorId = req.user!.id;
      }

      const [sessions, total] = await Promise.all([
        prisma.qRCode.findMany({
          where,
          skip: offset,
          take: limit,
          include: {
            course: {
              select: {
                id: true,
                courseName: true,
                courseCode: true
              }
            },
            _count: {
              select: {
                attendanceRecords: true
              }
            }
          },
          orderBy: { validTo: 'desc' }
        }),
        prisma.qRCode.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          sessions,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/attendance/settings - Get attendance settings
router.get('/settings',
  generalLimiter,
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const professorId = req.user!.id;

      // Default settings structure matching frontend expectations
      const defaultSettings = {
        security: {
          requireLocation: true,
          requirePhoto: false,
          requireDeviceCheck: true,
          enableFraudDetection: true,
          maxAttempts: 3,
          gracePeriod: 5
        },
        notifications: {
          onSessionStart: true,
          onSessionEnd: true,
          onFraudDetected: true,
          onAttendanceMarked: false
        },
        defaults: {
          sessionDuration: 60,
          locationRadius: 50,
          autoStopAfterDuration: true,
          requirePhotoByDefault: false
        }
      };

      // TODO: If you have settings storage, fetch from database here
      // const settings = await prisma.attendanceSettings.findUnique({
      //   where: { professorId: parseInt(professorId) }
      // });
      // return settings || defaultSettings;

      res.json({
        success: true,
        data: defaultSettings
      });
    } catch (error) {
      console.error('Error fetching attendance settings:', error);
      next(error);
    }
  }
);

// POST /api/attendance/settings - Update attendance settings
router.post('/settings',
  generalLimiter,
  authenticateToken,
  [
    body('security.requireLocation').optional().isBoolean().withMessage('requireLocation must be boolean'),
    body('security.requirePhoto').optional().isBoolean().withMessage('requirePhoto must be boolean'),
    body('security.requireDeviceCheck').optional().isBoolean().withMessage('requireDeviceCheck must be boolean'),
    body('security.enableFraudDetection').optional().isBoolean().withMessage('enableFraudDetection must be boolean'),
    body('security.maxAttempts').optional().isInt({ min: 1, max: 10 }).withMessage('maxAttempts must be between 1 and 10'),
    body('security.gracePeriod').optional().isInt({ min: 0, max: 60 }).withMessage('gracePeriod must be between 0 and 60'),
    body('notifications').optional().isObject().withMessage('notifications must be an object'),
    body('defaults').optional().isObject().withMessage('defaults must be an object')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const professorId = req.user!.id;
      const settings = req.body;

      // TODO: If you have settings storage, save to database here
      // await prisma.attendanceSettings.upsert({
      //   where: { professorId: parseInt(professorId) },
      //   update: settings,
      //   create: {
      //     professorId: parseInt(professorId),
      //     ...settings
      //   }
      // });

      // For now, just validate and return success
      // In production, you should save to database

      res.json({
        success: true,
        message: 'Settings saved successfully',
        data: settings
      });
    } catch (error) {
      console.error('Error saving attendance settings:', error);
      next(error);
    }
  }
);

// GET /api/attendance/sessions/:id - Get session details
router.get('/sessions/:id',
  generalLimiter,
  authenticateToken,
  [
    // Allow both UUID and Integer IDs
    param('id').custom((value) => {
      const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);
      const isInt = /^\d+$/.test(value);
      if (!isUUID && !isInt) {
        throw new Error('Session ID must be a valid UUID or Integer');
      }
      return true;
    })
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const idParam = req.params.id;
      const isInt = /^\d+$/.test(idParam);

      const where = isInt
        ? { id: parseInt(idParam) }
        : { sessionId: idParam };

      const session = await prisma.qRCode.findUnique({
        where: where as any,
        include: {
          course: {
            select: {
              id: true,
              courseName: true,
              courseCode: true,
              description: true
            }
          },
          attendanceRecords: {
            include: {
              student: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true
                }
              }
            },
            orderBy: { markedAt: 'desc' }
          },
          _count: {
            select: {
              attendanceRecords: true
            }
          }
        }
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Check access permissions
      if (req.user!.role === 'PROFESSOR' && session.professorId !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({
        success: true,
        data: session
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/attendance/sessions/:id/records - Get session attendance records
router.get('/sessions/:id/records',
  generalLimiter,
  authenticateToken,
  [
    param('id').custom((value) => {
      const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);
      const isInt = /^\d+$/.test(value);
      if (!isUUID && !isInt) {
        throw new Error('Session ID must be a valid UUID or Integer');
      }
      return true;
    }),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']).withMessage('Invalid status'),
    query('search').optional().isString().withMessage('Search term must be a string')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const idParam = req.params.id;
      const isInt = /^\d+$/.test(idParam);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;
      const status = req.query.status as string;
      const search = req.query.search as string;

      const whereSession = isInt
        ? { id: parseInt(idParam) }
        : { sessionId: idParam };

      const session = await prisma.qRCode.findUnique({
        where: whereSession as any
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Check access permissions
      if (req.user!.role === 'PROFESSOR' && session.professorId !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Build query for records
      const whereRecords: any = {
        qrCodeId: session.id
      };

      if (status) {
        whereRecords.status = status;
      }

      if (search) {
        whereRecords.student = {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { universityId: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        };
      }

      const [records, total] = await Promise.all([
        prisma.attendanceRecord.findMany({
          where: whereRecords,
          skip: offset,
          take: limit,
          include: {
            student: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                universityId: true,
                email: true
              }
            }
          },
          orderBy: { markedAt: 'desc' }
        }),
        prisma.attendanceRecord.count({ where: whereRecords })
      ]);

      res.json({
        success: true,
        data: {
          records,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/attendance/sessions/:id - Update session
router.put('/sessions/:id',
  generalLimiter,
  authenticateToken,
  requirePermission('update_session'),
  [
    // Allow both UUID and Integer IDs
    param('id').custom((value) => {
      const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);
      const isInt = /^\d+$/.test(value);
      if (!isUUID && !isInt) {
        throw new Error('Session ID must be a valid UUID or Integer');
      }
      return true;
    }),
    body('title').optional().isLength({ min: 1, max: 255 }).withMessage('Title must be between 1 and 255 characters'),
    body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
    body('startTime').optional().isISO8601().withMessage('Start time must be a valid ISO 8601 date'),
    body('endTime').optional().isISO8601().withMessage('End time must be a valid ISO 8601 date'),
    body('status').optional().isIn(['SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).withMessage('Invalid status')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const idParam = req.params.id;
      const isInt = /^\d+$/.test(idParam);

      const where = isInt
        ? { id: parseInt(idParam) }
        : { sessionId: idParam };

      const session = await prisma.qRCode.findUnique({
        where: where as any
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      if (session.professorId !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updatedSession = await prisma.qRCode.update({
        where: { sessionId: req.params.id },
        data: {
          ...req.body,
          updatedAt: new Date()
        }
      });

      res.json({
        success: true,
        data: updatedSession,
        message: 'Session updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/attendance/sessions/:id - Delete session
router.delete('/sessions/:id',
  generalLimiter,
  authenticateToken,
  requirePermission('delete_session'),
  [
    // Allow both UUID and Integer IDs
    param('id').custom((value) => {
      const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);
      const isInt = /^\d+$/.test(value);
      if (!isUUID && !isInt) {
        throw new Error('Session ID must be a valid UUID or Integer');
      }
      return true;
    })
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const idParam = req.params.id;
      const isInt = /^\d+$/.test(idParam);

      const where = isInt
        ? { id: parseInt(idParam) }
        : { sessionId: idParam };

      const session = await prisma.qRCode.findUnique({
        where: where as any
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      if (session.professorId !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Calculate session status from QRCode model fields
      const now = new Date();
      let currentStatus: string;
      if (!session.isActive) {
        currentStatus = 'CANCELLED';
      } else if (now < session.validFrom) {
        currentStatus = 'SCHEDULED';
      } else if (now > session.validTo) {
        // Check if session is paused
        if (session.expiresAt > session.validTo && session.expiresAt > now) {
          currentStatus = 'PAUSED';
        } else {
          currentStatus = 'ENDED';
        }
      } else {
        currentStatus = 'ACTIVE';
      }

      if (currentStatus === 'ACTIVE') {
        return res.status(400).json({ error: 'Cannot delete active session' });
      }

      await prisma.qRCode.delete({
        where: where as any
      });

      res.json({
        success: true,
        message: 'Session deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/attendance/sessions/:id/start - Start session
router.post('/sessions/:id/start',
  generalLimiter,
  authenticateToken,
  requirePermission('start_session'),
  [
    // Allow both UUID and Integer IDs
    param('id').custom((value) => {
      const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);
      const isInt = /^\d+$/.test(value);
      if (!isUUID && !isInt) {
        throw new Error('Session ID must be a valid UUID or Integer');
      }
      return true;
    })
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const idParam = req.params.id;
      const isInt = /^\d+$/.test(idParam);

      const where = isInt
        ? { id: parseInt(idParam) }
        : { sessionId: idParam };

      const session = await prisma.qRCode.findUnique({
        where: where as any
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      if (session.professorId !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Calculate session status from QRCode model fields
      const now = new Date();
      let currentStatus: string;
      if (!session.isActive) {
        currentStatus = 'CANCELLED';
      } else if (now < session.validFrom) {
        currentStatus = 'SCHEDULED';
      } else if (now > session.validTo) {
        // Check if session is paused (expiresAt contains original validTo)
        // If expiresAt > validTo and expiresAt > now, session is paused
        if (session.expiresAt > session.validTo && session.expiresAt > now) {
          currentStatus = 'PAUSED';
        } else {
          currentStatus = 'ENDED';
        }
      } else {
        currentStatus = 'ACTIVE';
      }

      // Allow starting from SCHEDULED, DRAFT (implicit if validFrom is future but we want to force start), or resuming from PAUSED
      // Note: DRAFT isn't explicitly calculated above, but we should allow starting if it's not already active/ended
      if (currentStatus === 'ACTIVE') {
        // Already active, just return success
        return res.json({
          success: true,
          data: session,
          message: 'Session is already active'
        });
      }

      if (currentStatus === 'ENDED' || currentStatus === 'CANCELLED') {
        return res.status(400).json({ error: 'Cannot start ended or cancelled session' });
      }

      // Start or resume the session
      let updateData: any = {
        isActive: true,
        updatedAt: new Date()
      };

      if (currentStatus === 'PAUSED') {
        // Resume: restore original validTo from expiresAt
        updateData.validTo = session.expiresAt;
        // Reset expiresAt to original value (endTime)
        updateData.expiresAt = session.expiresAt;
      } else {
        // Start: set validFrom to now
        updateData.validFrom = now;
        // Ensure validTo is in the future (maintain duration)
        const duration = session.validTo.getTime() - session.validFrom.getTime();
        updateData.validTo = new Date(now.getTime() + duration);
        updateData.expiresAt = updateData.validTo;
      }

      const updatedSession = await prisma.qRCode.update({
        where: where as any,
        data: updateData
      });

      res.json({
        success: true,
        data: updatedSession,
        message: 'Session started successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/attendance/sessions/:id/stop - Stop session
router.post('/sessions/:id/stop',
  generalLimiter,
  authenticateToken,
  requirePermission('stop_session'),
  [
    // Allow both UUID and Integer IDs
    param('id').custom((value) => {
      const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);
      const isInt = /^\d+$/.test(value);
      if (!isUUID && !isInt) {
        throw new Error('Session ID must be a valid UUID or Integer');
      }
      return true;
    })
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const idParam = req.params.id;
      const isInt = /^\d+$/.test(idParam);

      const where = isInt
        ? { id: parseInt(idParam) }
        : { sessionId: idParam };

      const session = await prisma.qRCode.findUnique({
        where: where as any
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      if (session.professorId !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Calculate session status from QRCode model fields
      const now = new Date();
      let currentStatus: string;
      if (!session.isActive) {
        currentStatus = 'CANCELLED';
      } else if (now < session.validFrom) {
        currentStatus = 'SCHEDULED';
      } else if (now > session.validTo) {
        // Check if session is paused (expiresAt contains original validTo and is in the future)
        if (session.expiresAt > session.validTo && session.expiresAt > now) {
          currentStatus = 'PAUSED';
        } else {
          currentStatus = 'ENDED';
        }
      } else {
        currentStatus = 'ACTIVE';
      }

      // Allow stopping if session is ACTIVE or PAUSED
      // If already ENDED or CANCELLED, return a more informative message
      if (currentStatus === 'ENDED' || currentStatus === 'CANCELLED') {
        return res.status(400).json({
          error: `Session is already ${currentStatus.toLowerCase()}`,
          details: `Cannot stop a session that is already ${currentStatus.toLowerCase()}.`
        });
      }

      // If paused, we need to restore the original validTo from expiresAt first
      // Note: 'now' variable is already declared above
      let updateData: any = {
        updatedAt: now
      };

      if (currentStatus === 'PAUSED') {
        // Restore original validTo from expiresAt, then set it to now to stop
        updateData.validTo = now; // Set to now to stop
        updateData.expiresAt = now; // Set expiresAt to now to mark as completed, not paused
      } else {
        // ACTIVE: Set both validTo and expiresAt to now to mark as completed
        updateData.validTo = now;
        updateData.expiresAt = now; // Important: Set expiresAt to now to prevent it from being detected as PAUSED
      }

      // End the session by setting validTo and expiresAt to now
      const updatedSession = await prisma.qRCode.update({
        where: where as any,
        data: updateData
      });

      res.json({
        success: true,
        data: updatedSession,
        message: 'Session stopped successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/attendance/sessions/:id/pause - Pause session
router.post('/sessions/:id/pause',
  generalLimiter,
  authenticateToken,
  requirePermission('pause_session'),
  [
    // Allow both UUID and Integer IDs
    param('id').custom((value) => {
      const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);
      const isInt = /^\d+$/.test(value);
      if (!isUUID && !isInt) {
        throw new Error('Session ID must be a valid UUID or Integer');
      }
      return true;
    })
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const idParam = req.params.id;
      const isInt = /^\d+$/.test(idParam);

      const where = isInt
        ? { id: parseInt(idParam) }
        : { sessionId: idParam };

      const session = await prisma.qRCode.findUnique({
        where: where as any
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      if (session.professorId !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Calculate session status from QRCode model fields
      const now = new Date();
      let currentStatus: string;
      if (!session.isActive) {
        currentStatus = 'CANCELLED';
      } else if (now < session.validFrom) {
        currentStatus = 'SCHEDULED';
      } else if (now > session.validTo) {
        currentStatus = 'ENDED';
      } else {
        currentStatus = 'ACTIVE';
      }

      if (currentStatus !== 'ACTIVE') {
        return res.status(400).json({ error: 'Session is not active' });
      }

      // Pause the session by storing the original validTo and setting validTo to now
      // This effectively pauses the session by making it "ended" temporarily
      // When resuming, we'll need to restore the original validTo
      // Store the original validTo in expiresAt for now (as a workaround)
      const originalValidTo = session.validTo;
      const updatedSession = await prisma.qRCode.update({
        where: where as any,
        data: {
          expiresAt: originalValidTo, // Store original validTo in expiresAt
          validTo: new Date(), // Set validTo to now to pause
          updatedAt: new Date()
        }
      });

      res.json({
        success: true,
        data: updatedSession,
        message: 'Session paused successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/attendance/sessions/:id/qr-code - Generate QR code
router.post('/sessions/:id/qr-code',
  generalLimiter,
  authenticateToken,
  requirePermission('generate_qr_code'),
  [
    param('id').isUUID().withMessage('Session ID must be a valid UUID')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const session = await prisma.qRCode.findUnique({
        where: { sessionId: req.params.id }
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      if (session.professorId !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Generate new QR code
      const qrCode = generateQRCode(String(session.id));

      const updatedSession = await prisma.qRCode.update({
        where: { sessionId: req.params.id },
        data: {
          updatedAt: new Date()
        }
      });

      res.json({
        success: true,
        data: {
          qrCode,
          qrCodeData: JSON.stringify({
            sessionId: session.id,
            markedAt: new Date().toISOString(),
            security: {
              requireLocation: session.isLocationRequired,
              requirePhoto: session.isPhotoRequired,
              requireDeviceCheck: session.isDeviceCheckRequired,
              enableFraudDetection: session.fraudDetectionEnabled
            }
          })
        },
        message: 'QR code generated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Attendance Processing Routes

// POST /api/attendance/scan - Secure QR scanning
router.post('/scan',
  strictLimiter,
  authenticateToken,
  [
    body('sessionId').isUUID().withMessage('Session ID must be a valid UUID'),
    body('qrCode').isLength({ min: 1 }).withMessage('QR code is required'),
    body('location.latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
    body('location.longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
    body('location.accuracy').optional().isFloat({ min: 0 }).withMessage('Accuracy must be non-negative'),
    body('deviceFingerprint').optional().isLength({ min: 1 }).withMessage('Device fingerprint must not be empty')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { sessionId, qrCode, location, deviceFingerprint } = scanAttendanceSchema.parse(req.body);

      // Verify session exists and is active
      const session = await prisma.qRCode.findUnique({
        where: { sessionId: sessionId },
        include: {
          course: {
            select: {
              enrollments: {
                select: {
                  studentId: true
                }
              }
            }
          }
        }
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Calculate session status from QRCode model fields
      const now = new Date();
      let currentStatus: string;
      if (!session.isActive) {
        currentStatus = 'CANCELLED';
      } else if (now < session.validFrom) {
        currentStatus = 'SCHEDULED';
      } else if (now > session.validTo) {
        // Check if session is paused
        if (session.expiresAt > session.validTo && session.expiresAt > now) {
          currentStatus = 'PAUSED';
        } else {
          currentStatus = 'ENDED';
        }
      } else {
        currentStatus = 'ACTIVE';
      }

      if (currentStatus !== 'ACTIVE') {
        return res.status(400).json({ error: 'Session is not active' });
      }

      // Verify QR code - in QRCode model, we need to check if qrCode field exists or use sessionId
      // For now, we'll check if sessionId matches
      if (session.sessionId !== sessionId) {
        return res.status(400).json({ error: 'Invalid QR code or session ID' });
      }

      // Check if student is enrolled in course
      const isEnrolled = session.course.enrollments.some(
        enrollment => enrollment.studentId === req.user!.id
      );

      if (!isEnrolled) {
        return res.status(403).json({ error: 'Student not enrolled in course' });
      }

      // Check if already marked attendance
      const existingRecord = await prisma.attendanceRecord.findFirst({
        where: {
          qrCodeId: session.id,
          studentId: req.user!.id
        }
      });

      if (existingRecord) {
        return res.status(409).json({ error: 'Attendance already marked' });
      }

      // Location verification - use QRCode model fields
      if (session.isLocationRequired && location) {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          session.latitude,
          session.longitude
        );

        if (distance > session.radius) {
          return res.status(400).json({
            error: 'Location verification failed',
            details: 'You are outside the allowed area'
          });
        }
      }

      // Device verification
      if (session.isDeviceCheckRequired && deviceFingerprint) {
        const device = await prisma.deviceFingerprint.findFirst({
          where: {
            fingerprint: deviceFingerprint,
            studentId: req.user!.id,
            isActive: true
          }
        });

        if (!device) {
          return res.status(400).json({
            error: 'Device verification failed',
            details: 'Device not registered'
          });
        }
      }

      // Get registered devices for fraud calculation
      const registeredDevices = await prisma.deviceFingerprint.findMany({
        where: {
          studentId: req.user!.id,
          isActive: true
        },
        select: {
          fingerprint: true,
          lastUsed: true
        }
      });

      // Calculate fraud score - use QRCode model fields
      const fraudScore = calculateFraudScore({
        location,
        sessionLocation: {
          latitude: session.latitude,
          longitude: session.longitude,
          radius: session.radius
        },
        deviceFingerprint,
        registeredDevices: registeredDevices.map(d => d.fingerprint),
        sessionStartTime: session.validFrom,
        sessionEndTime: session.validTo
      });

      // Create attendance record
      const attendanceRecord = await prisma.attendanceRecord.create({
        data: {
          qrCodeId: session.id,
          studentId: req.user!.id,
          courseId: session.courseId,
          status: 'PRESENT',
          location: location ? {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy
          } : undefined,
          deviceFingerprint,
          fraudScore,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Create fraud alert if score is high
      if (fraudScore > 70) {
        await prisma.fraudAlert.create({
          data: {
            // id is autoincrement, do not provide uuid
            studentId: req.user!.id,
            qrCodeId: session.id, // Use session.id (Int) for qrCodeId relation
            alertType: FraudAlertType.SUSPICIOUS_PATTERN,
            severity: 'HIGH',
            description: `High fraud score detected: ${fraudScore}`,
            metadata: {
              fraudScore,
              location,
              deviceFingerprint
            },
            isResolved: false,
            createdAt: new Date()
          }
        });
      }

      res.json({
        success: true,
        data: attendanceRecord,
        message: 'Attendance marked successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/attendance/mark - Manual attendance marking
router.post('/mark',
  strictLimiter,
  authenticateToken,
  requirePermission('mark_attendance'),
  [
    body('sessionId').isUUID().withMessage('Session ID must be a valid UUID'),
    body('studentId').isUUID().withMessage('Student ID must be a valid UUID'),
    body('status').isIn(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']).withMessage('Invalid status'),
    body('notes').optional().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { sessionId, studentId, status, notes } = req.body;

      // Verify session exists and user has access
      const session = await prisma.qRCode.findUnique({
        where: {
          sessionId: sessionId
        }
      });

      if (!session || (req.user!.role === 'PROFESSOR' && session.professorId !== req.user!.id)) {
        return res.status(404).json({ error: 'Session not found or access denied' });
      }

      // Check if student is enrolled in course
      const enrollment = await prisma.courseEnrollment.findFirst({
        where: {
          courseId: session.courseId,
          studentId
        }
      });

      if (!enrollment) {
        return res.status(400).json({ error: 'Student not enrolled in course' });
      }

      // Check if record already exists
      const existingRecord = await prisma.attendanceRecord.findFirst({
        where: {
          qrCodeId: session.id,
          studentId
        }
      });

      if (existingRecord) {
        // Update existing record
        const updatedRecord = await prisma.attendanceRecord.update({
          where: { id: existingRecord.id },
          data: {
            status,
            updatedAt: new Date()
          }
        });

        res.json({
          success: true,
          data: updatedRecord,
          message: 'Attendance record updated successfully'
        });
      } else {
        // Create new record
        const attendanceRecord = await prisma.attendanceRecord.create({
          data: {
            qrCodeId: session.id,
            studentId,
            courseId: session.courseId,
            status,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        res.status(201).json({
          success: true,
          data: attendanceRecord,
          message: 'Attendance record created successfully'
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/attendance/status/:sessionId - Real-time status
router.get('/status/:sessionId',
  generalLimiter,
  authenticateToken,
  [
    param('sessionId').isUUID().withMessage('Session ID must be a valid UUID')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const session = await prisma.qRCode.findUnique({
        where: { sessionId: req.params.sessionId },
        include: {
          attendanceRecords: {
            include: {
              student: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          _count: {
            select: {
              attendanceRecords: true
            }
          }
        }
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Check access permissions
      if (req.user!.role === 'PROFESSOR' && session.professorId !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Calculate session status from QRCode model fields
      const now = new Date();
      let currentStatus: string;
      if (!session.isActive) {
        currentStatus = 'CANCELLED';
      } else if (now < session.validFrom) {
        currentStatus = 'SCHEDULED';
      } else if (now > session.validTo) {
        // Check if session is paused
        if (session.expiresAt > session.validTo && session.expiresAt > now) {
          currentStatus = 'PAUSED';
        } else {
          currentStatus = 'ENDED';
        }
      } else {
        currentStatus = 'ACTIVE';
      }

      const status = {
        qrCode: {
          id: session.id,
          title: session.title,
          status: currentStatus,
          startTime: session.validFrom,
          endTime: session.validTo,
          location: {
            latitude: session.latitude,
            longitude: session.longitude,
            radius: session.radius,
            name: 'Campus Location'
          }
        },
        attendance: {
          total: session._count.attendanceRecords,
          present: session.attendanceRecords.filter(r => r.status === 'PRESENT').length,
          absent: session.attendanceRecords.filter(r => r.status === 'ABSENT').length,
          late: session.attendanceRecords.filter(r => r.status === 'LATE').length,
          excused: session.attendanceRecords.filter(r => r.status === 'EXCUSED').length
        },
        records: session.attendanceRecords
      };

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/attendance/records/:id - Update attendance record
router.put('/records/:id',
  generalLimiter,
  authenticateToken,
  requirePermission('update_attendance'),
  [
    param('id').isInt().withMessage('Record ID must be a valid integer'),
    body('status').optional().isIn(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']).withMessage('Invalid status'),
    body('notes').optional().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const record = await prisma.attendanceRecord.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
          qrCode: {
            select: {
              professorId: true
            }
          }
        }
      });

      if (!record) {
        return res.status(404).json({ error: 'Record not found' });
      }

      // Check access permissions
      if (req.user!.role === 'PROFESSOR' && record.qrCode.professorId !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (req.user!.role === 'STUDENT' && record.studentId !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updatedRecord = await prisma.attendanceRecord.update({
        where: { id: record.id },
        data: {
          status: req.body.status,
          updatedAt: new Date()
        }
      });

      res.json({
        success: true,
        data: updatedRecord,
        message: 'Attendance record updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Security & Fraud Detection Routes

// POST /api/attendance/verify-location - Location verification
router.post('/verify-location',
  strictLimiter,
  authenticateToken,
  [
    body('sessionId').isUUID().withMessage('Session ID must be a valid UUID'),
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
    body('accuracy').isFloat({ min: 0 }).withMessage('Accuracy must be non-negative')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { sessionId, latitude, longitude, accuracy } = req.body;

      const session = await prisma.qRCode.findUnique({
        where: { sessionId: sessionId } // Changed from id to sessionId
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      if (!session.isLocationRequired) {
        return res.status(400).json({ error: 'Session does not require location verification' });
      }

      console.log('--- Location Verification Debug ---');
      console.log('Session ID:', sessionId);
      console.log('User Location:', { latitude, longitude, accuracy });
      console.log('Session Location:', { lat: session.latitude, lng: session.longitude, radius: session.radius });

      const distance = calculateDistance(
        latitude,
        longitude,
        session.latitude,
        session.longitude
      );

      console.log('Calculated Distance:', distance);

      // Add 50m buffer for GPS drift/accuracy issues
      const buffer = 50;
      const isWithinRadius = distance <= (session.radius + buffer);
      console.log('Is Within Radius:', isWithinRadius, '(Limit:', session.radius + buffer, ')');
      console.log('-----------------------------------');

      const fraudScore = isWithinRadius ? 0 : Math.min(100, (distance / session.radius) * 100);

      res.json({
        success: true,
        data: {
          isWithinRadius,
          distance,
          requiredRadius: session.radius,
          accuracy,
          fraudScore
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/attendance/verify-device - Device verification
router.post('/verify-device',
  strictLimiter,
  authenticateToken,
  [
    body('deviceFingerprint').isLength({ min: 1 }).withMessage('Device fingerprint is required')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { deviceFingerprint } = req.body;

      const device = await prisma.deviceFingerprint.findFirst({
        where: {
          fingerprint: deviceFingerprint,
          studentId: req.user!.id,
          isActive: true
        }
      });

      if (!device) {
        return res.status(400).json({
          error: 'Device verification failed',
          details: 'Device not registered or inactive'
        });
      }

      // Update last used timestamp
      await prisma.deviceFingerprint.update({
        where: { id: device.id },
        data: { lastUsed: new Date() }
      });

      res.json({
        success: true,
        data: {
          isVerified: true,
          deviceInfo: device.deviceInfo,
          lastUsed: device.lastUsed,
          confidence: 95
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/attendance/upload-photo - Photo verification
router.post('/upload-photo',
  strictLimiter,
  authenticateToken,
  upload.single('photo'),
  [
    body('sessionId').isUUID().withMessage('Session ID must be a valid UUID')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: 'Photo is required' });
      }

      const session = await prisma.qRCode.findUnique({
        where: { sessionId: sessionId } // Changed from id to sessionId
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      if (!session.isPhotoRequired) {
        return res.status(400).json({ error: 'Session does not require photo verification' });
      }

      // Process and optimize image (optional - skip if sharp not installed)
      let processedImage: Buffer = req.file.buffer;
      try {
        const sharp = (await import('sharp')).default;
        processedImage = await sharp(req.file.buffer)
          .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();
      } catch (e) {
        console.warn('sharp not available, skipping image optimization');
      }

      // Generate unique filename
      const filename = `attendance-${sessionId}-${req.user!.id}-${Date.now()}.jpg`;

      // Note: Photo storage currently returns a mock URL
      // Future: Implement cloud storage (AWS S3, Azure Blob, Google Cloud Storage)
      // See BACKLOG.md for details
      const photoUrl = `https://storage.example.com/photos/${filename}`;

      // Note: Face detection currently returns mock values
      // Future: Integrate AWS Rekognition, Azure Face API, or similar
      // See BACKLOG.md for details
      const qualityScore = 85;
      const hasFace = true;

      res.json({
        success: true,
        data: {
          photoUrl,
          qualityScore,
          hasFace,
          size: processedImage.length,
          format: 'JPEG'
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/attendance/fraud-alerts - Get fraud alerts
router.get('/fraud-alerts',
  generalLimiter,
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('severity').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Invalid severity'),
    query('isResolved').optional().isBoolean().withMessage('isResolved must be boolean')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const where: any = {};

      // Filter by user role
      if (req.user!.role === 'STUDENT') {
        where.studentId = req.user!.id;
      } else if (req.user!.role === 'PROFESSOR') {
        where.qrCode = { // Changed from session to qrCode
          professorId: req.user!.id
        };
      }

      // Apply filters
      if (req.query.severity) {
        where.severity = req.query.severity;
      }

      if (req.query.isResolved !== undefined) {
        where.isResolved = req.query.isResolved === 'true';
      }

      const [alerts, total] = await Promise.all([
        prisma.fraudAlert.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            student: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            },
            qrCode: {
              select: {
                id: true,
                title: true,
                courseId: true
              }
            }
          }
        }),
        prisma.fraudAlert.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          alerts,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/attendance/report-fraud - Report fraud
router.post('/report-fraud',
  strictLimiter,
  authenticateToken,
  [
    body('sessionId').isUUID().withMessage('Session ID must be a valid UUID'),
    body('alertType').isIn(['LOCATION_FRAUD', 'DEVICE_FRAUD', 'PHOTO_FRAUD', 'BEHAVIOR_FRAUD', 'NETWORK_FRAUD']).withMessage('Invalid alert type'),
    body('severity').isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Invalid severity'),
    body('description').isLength({ min: 1, max: 1000 }).withMessage('Description must be between 1 and 1000 characters'),
    body('metadata').optional().isObject().withMessage('Metadata must be an object')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { sessionId, alertType, severity, description, metadata } = req.body;

      const session = await prisma.qRCode.findUnique({
        where: { sessionId: sessionId } // Changed from id to sessionId
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const fraudAlert = await prisma.fraudAlert.create({
        data: {
          studentId: req.user!.id,
          qrCodeId: session.id,
          alertType,
          severity,
          description,
          metadata: metadata || {},
          isResolved: false,
          createdAt: new Date()
        }
      });

      res.status(201).json({
        success: true,
        data: fraudAlert,
        message: 'Fraud alert reported successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/attendance/fraud-alerts/:id/resolve - Resolve fraud alert
router.put('/fraud-alerts/:id/resolve',
  generalLimiter,
  authenticateToken,
  requirePermission('resolve_fraud_alert'),
  [
    param('id').isInt().withMessage('Alert ID must be a valid integer'),
    body('resolution').isLength({ min: 1, max: 500 }).withMessage('Resolution must be between 1 and 500 characters')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { resolution } = req.body;

      const alert = await prisma.fraudAlert.findUnique({
        where: { id: parseInt(req.params.id) } // Changed from sessionId to id, and removed parseInt as id is UUID
      });

      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }

      const updatedAlert = await prisma.fraudAlert.update({
        where: { id: alert.id },
        data: {
          isResolved: true,
          resolvedAt: new Date(),
          resolvedBy: req.user!.id,
          metadata: {
            ...(alert.metadata as object),
            resolution
          }
        }
      });

      res.json({
        success: true,
        data: updatedAlert,
        message: 'Fraud alert resolved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Analytics & Reporting Routes

// GET /api/attendance/analytics - Attendance analytics
router.get('/analytics',
  generalLimiter,
  authenticateToken,
  [
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO 8601 date'),
    query('courseId').optional().isInt().withMessage('Course ID must be an integer'),
    query('groupBy').optional().isIn(['day', 'week', 'month']).withMessage('Group by must be day, week, or month')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate, courseId, groupBy = 'day' } = req.query;

      const where: any = {};

      // Filter by user role
      if (req.user!.role === 'PROFESSOR') {
        where.qrCode = {
          professorId: req.user!.id
        };
      } else if (req.user!.role === 'STUDENT') {
        where.studentId = req.user!.id;
      }

      // Apply date filters
      if (startDate) {
        where.markedAt = {
          ...where.markedAt,
          gte: new Date(startDate as string)
        };
      }

      if (endDate) {
        where.markedAt = {
          ...where.markedAt,
          lte: new Date(endDate as string)
        };
      }

      // Apply course filter
      if (courseId) {
        where.qrCode = {
          ...where.qrCode,
          courseId: parseInt(courseId as string)
        };
      }

      // Get attendance records
      const records = await prisma.attendanceRecord.findMany({
        where,
        include: {
          qrCode: {
            select: {
              id: true,
              title: true,
              courseId: true
            }
          }
        },
        orderBy: { markedAt: 'asc' }
      });

      // Calculate analytics
      const totalRecords = records.length;
      const presentCount = records.filter(r => r.status === 'PRESENT').length;
      const absentCount = records.filter(r => r.status === 'ABSENT').length;
      const lateCount = records.filter(r => r.status === 'LATE').length;
      const excusedCount = records.filter(r => r.status === 'EXCUSED').length;

      const attendanceRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

      // Group by time period
      const groupedData = records.reduce((acc, record) => {
        const date = new Date(record.markedAt);
        let key: string;

        switch (groupBy) {
          case 'day':
            key = date.toISOString().split('T')[0];
            break;
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = weekStart.toISOString().split('T')[0];
            break;
          case 'month':
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          default:
            key = date.toISOString().split('T')[0];
        }

        if (!acc[key]) {
          acc[key] = {
            date: key,
            total: 0,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            attendanceRate: 0
          };
        }

        acc[key].total++;
        acc[key][record.status.toLowerCase()]++;
        acc[key].attendanceRate = (acc[key].present / acc[key].total) * 100;

        return acc;
      }, {} as any);

      const analytics = {
        summary: {
          totalRecords,
          presentCount,
          absentCount,
          lateCount,
          excusedCount,
          attendanceRate: Math.round(attendanceRate * 100) / 100
        },
        trends: Object.values(groupedData),
        records: records.slice(0, 100) // Limit to first 100 records
      };

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/attendance/security-metrics - Security metrics
router.get('/security-metrics',
  generalLimiter,
  authenticateToken,
  [
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO 8601 date')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate } = req.query;

      const where: any = {};

      // Filter by user role
      if (req.user!.role === 'PROFESSOR') {
        where.qrCode = {
          professorId: req.user!.id
        };
      }

      // Apply date filters
      if (startDate) {
        where.createdAt = {
          ...where.createdAt,
          gte: new Date(startDate as string)
        };
      }

      if (endDate) {
        where.createdAt = {
          ...where.createdAt,
          lte: new Date(endDate as string)
        };
      }

      // Get security metrics
      const [totalSessions, totalAttendance, fraudAttempts, securityScore] = await Promise.all([
        prisma.qRCode.count({ where: { professorId: req.user!.id } }),
        prisma.attendanceRecord.count({ where }),
        prisma.fraudAlert.count({ where }),
        prisma.attendanceRecord.aggregate({
          where: {
            ...where,
            fraudScore: { not: null }
          },
          _avg: {
            fraudScore: true
          }
        })
      ]);

      const metrics: SecurityMetrics = {
        totalSessions,
        totalAttendance,
        fraudAttempts,
        securityScore: securityScore._avg.fraudScore ? Math.round(securityScore._avg.fraudScore * 100) / 100 : 0,
        riskLevel: (securityScore._avg.fraudScore || 0) > 70 ? 'HIGH' : (securityScore._avg.fraudScore || 0) > 40 ? 'MEDIUM' : 'LOW',
        trends: {
          // Note: Trend calculation not yet implemented
          // Future: Implement 7-day rolling average trend analysis
          // See BACKLOG.md for details
          attendance: [],
          fraud: [],
          security: []
        }
      };

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/attendance/reports - Generate reports
router.get('/reports',
  generalLimiter,
  authenticateToken,
  [
    query('type').isIn(['attendance', 'security', 'fraud']).withMessage('Report type must be attendance, security, or fraud'),
    query('format').optional().isIn(['json', 'csv', 'pdf']).withMessage('Format must be json, csv, or pdf'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO 8601 date')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { type, format = 'json', startDate, endDate } = req.query;

      // Note: Report generation currently returns placeholder
      // Future: Implement PDF/Excel generation with charts
      // See BACKLOG.md for details
      const report = {
        type,
        format,
        generatedAt: new Date(),
        data: {
          message: 'Report generation not yet implemented'
        }
      };

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/attendance/export/:format - Export data
router.get('/export/:format',
  generalLimiter,
  authenticateToken,
  [
    param('format').isIn(['json', 'csv', 'xlsx']).withMessage('Format must be json, csv, or xlsx'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO 8601 date')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { format } = req.params;
      const { startDate, endDate } = req.query;

      // Note: Data export currently returns placeholder
      // Future: Implement CSV/XLSX generation with exceljs
      // See BACKLOG.md for details
      const exportData = {
        format,
        generatedAt: new Date(),
        data: {
          message: 'Data export not yet implemented'
        }
      };

      res.json({
        success: true,
        data: exportData
      });
    } catch (error) {
      next(error);
    }
  }
);

// Device Management Routes

// POST /api/attendance/devices - Register device
router.post('/devices',
  strictLimiter,
  authenticateToken,
  [
    body('deviceFingerprint').isLength({ min: 1 }).withMessage('Device fingerprint is required'),
    body('deviceInfo').isObject().withMessage('Device info must be an object'),
    body('deviceName').optional().isLength({ min: 1, max: 100 }).withMessage('Device name must be between 1 and 100 characters')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { deviceFingerprint, deviceInfo, deviceName } = req.body;

      // Check if device already exists
      const existingDevice = await prisma.deviceFingerprint.findFirst({
        where: {
          fingerprint: deviceFingerprint,
          studentId: req.user!.id
        }
      });

      if (existingDevice) {
        return res.status(409).json({ error: 'Device already registered' });
      }

      // Check device limit
      const deviceCount = await prisma.deviceFingerprint.count({
        where: {
          studentId: req.user!.id,
          isActive: true
        }
      });

      if (deviceCount >= 5) { // Max 5 devices per user
        return res.status(400).json({ error: 'Maximum device limit reached' });
      }

      const device = await prisma.deviceFingerprint.create({
        data: {
          studentId: req.user!.id,
          fingerprint: deviceFingerprint,
          deviceInfo: {
            ...deviceInfo,
            name: deviceName || 'Unknown Device'
          },
          isActive: true,
          lastUsed: new Date(),
          createdAt: new Date()
        }
      });

      res.status(201).json({
        success: true,
        data: device,
        message: 'Device registered successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/attendance/devices - List devices
router.get('/devices',
  generalLimiter,
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const [devices, total] = await Promise.all([
        prisma.deviceFingerprint.findMany({
          where: {
            studentId: req.user!.id
          },
          skip: offset,
          take: limit,
          orderBy: { lastUsed: 'desc' }
        }),
        prisma.deviceFingerprint.count({
          where: {
            studentId: req.user!.id
          }
        })
      ]);

      res.json({
        success: true,
        data: {
          devices,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/attendance/devices/:id - Remove device
router.delete('/devices/:id',
  generalLimiter,
  authenticateToken,
  [
    param('id').isInt().withMessage('Device ID must be a valid integer')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const device = await prisma.deviceFingerprint.findUnique({
        where: { id: parseInt(req.params.id) }
      });

      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }

      if (device.studentId !== req.user!.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await prisma.deviceFingerprint.delete({
        where: { id: parseInt(req.params.id) }
      });

      res.json({
        success: true,
        message: 'Device removed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/attendance/courses - Get enrolled courses
router.get('/courses',
  generalLimiter,
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const courses = await prisma.course.findMany({
        where: {
          enrollments: {
            some: {
              studentId: req.user!.id
            }
          }
        },
        select: {
          id: true,
          courseCode: true,
          courseName: true,
          professor: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      res.json({
        success: true,
        data: courses
      });
    } catch (error) {
      next(error);
    }
  }
);

// Student attendance routes - Simple endpoints for frontend

// GET /api/attendance/records - Get attendance records for student
router.get('/records',
  generalLimiter,
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;

      const records = await prisma.attendanceRecord.findMany({
        where: { studentId: userIdNum },
        include: {
          course: {
            include: {
              professor: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          qrCode: {
            select: {
              title: true,
              description: true
            }
          }
        },
        orderBy: {
          markedAt: 'desc'
        }
      });

      const formattedRecords = records.map(record => ({
        id: String(record.id),
        courseCode: record.course.courseCode,
        courseName: record.course.courseName,
        date: record.markedAt.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        status: record.status.toLowerCase(),
        time: record.markedAt.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        instructor: record.course.professor
          ? `Dr. ${record.course.professor.firstName} ${record.course.professor.lastName}`
          : 'TBA',
        type: record.qrCode?.title || 'Lecture'
      }));

      res.json({
        success: true,
        data: formattedRecords
      });
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      next(error);
    }
  }
);

// GET /api/attendance/courses - Get attendance courses for student
router.get('/courses',
  generalLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // For demo purposes, we'll use Mohamed Hassan's ID (20221245)
      const userId = req.query.userId || '20221245';

      console.log('🔍 Fetching attendance courses for user:', userId);

      // Find user by university ID
      const user = await prisma.user.findUnique({
        where: { universityId: userId as string },
        select: { id: true, universityId: true, firstName: true, lastName: true }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Get user's enrolled courses with attendance data
      const enrollments = await prisma.courseEnrollment.findMany({
        where: { studentId: user.id },
        include: {
          course: {
            include: {
              professor: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });

      // Calculate attendance statistics for each course
      const coursesWithStats = await Promise.all(
        enrollments.map(async (enrollment) => {
          // Get total past sessions for this course
          const now = new Date();
          const totalCourseSessions = await prisma.qRCode.count({
            where: {
              courseId: enrollment.courseId,
              validTo: { lt: now },
              isActive: true,
              validFrom: { gte: enrollment.enrolledAt }
            }
          });

          const attendanceRecords = await prisma.attendanceRecord.findMany({
            where: {
              studentId: user.id,
              courseId: enrollment.courseId
            }
          });

          const attendedSessions = attendanceRecords.filter(r => r.status === 'PRESENT').length;
          const lateSessions = attendanceRecords.filter(r => r.status === 'LATE').length;
          const excusedSessions = attendanceRecords.filter(r => r.status === 'EXCUSED').length;

          // Calculate absent sessions (including implied absence)
          const absentSessions = Math.max(0, totalCourseSessions - (attendedSessions + lateSessions + excusedSessions));

          const totalSessions = totalCourseSessions;

          const attendancePercentage = totalSessions > 0
            ? Math.round(((attendedSessions + lateSessions) / totalSessions) * 100)
            : 0;

          return {
            id: enrollment.course.id.toString(),
            courseCode: enrollment.course.courseCode,
            courseName: enrollment.course.courseName,
            attendancePercentage,
            totalSessions,
            attendedSessions: attendedSessions + lateSessions,
            lateSessions,
            absentSessions,
            instructor: `${enrollment.course.professor.firstName} ${enrollment.course.professor.lastName}`
          };
        })
      );

      // Remove duplicate courses by courseName and aggregate their statistics
      const uniqueCoursesMap = new Map<string, typeof coursesWithStats[0]>();

      coursesWithStats.forEach(course => {
        const existing = uniqueCoursesMap.get(course.courseName);
        if (existing) {
          // Aggregate statistics from duplicate courses
          const totalSessions = existing.totalSessions + course.totalSessions;
          const totalAttended = existing.attendedSessions + course.attendedSessions;
          const totalLate = existing.lateSessions + course.lateSessions;
          const totalAbsent = existing.absentSessions + course.absentSessions;

          uniqueCoursesMap.set(course.courseName, {
            ...existing,
            totalSessions,
            attendedSessions: totalAttended,
            lateSessions: totalLate,
            absentSessions: totalAbsent,
            attendancePercentage: totalSessions > 0
              ? Math.round((totalAttended / totalSessions) * 100)
              : existing.attendancePercentage
          });
        } else {
          uniqueCoursesMap.set(course.courseName, course);
        }
      });

      const uniqueCourses = Array.from(uniqueCoursesMap.values());

      console.log('📚 Found', enrollments.length, 'enrollments,', uniqueCourses.length, 'unique courses');

      res.json({
        success: true,
        message: 'Attendance courses retrieved successfully',
        data: uniqueCourses
      });

    } catch (error) {
      console.error('❌ Error fetching attendance courses:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch attendance courses',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// GET /api/attendance/stats - Get attendance stats for student
router.get('/stats',
  generalLimiter,
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Get user from token or query parameter
      let targetUserId: string | number;

      if (req.query.userId) {
        // If userId is provided in query, find by university ID
        const user = await prisma.user.findUnique({
          where: { universityId: req.query.userId as string },
          select: { id: true }
        });

        if (!user) {
          return res.status(404).json({
            success: false,
            error: 'User not found'
          });
        }

        targetUserId = user.id;
      } else if (req.user) {
        // Use authenticated user's ID
        targetUserId = typeof req.user.id === 'string' ? parseInt(req.user.id) : req.user.id;
      } else {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      console.log('🔍 Fetching attendance stats for user ID:', targetUserId);

      // Get enrolled courses to calculate total expected sessions
      const enrollments = await prisma.courseEnrollment.findMany({
        where: {
          studentId: targetUserId,
          status: 'ACTIVE'
        },
        select: { courseId: true, enrolledAt: true }
      });

      const enrolledCourseIds = enrollments.map(e => e.courseId);
      const now = new Date();

      // Calculate total expected sessions by iterating over enrollments
      // This ensures we only count sessions that happened AFTER the student enrolled
      let totalExpectedSessions = 0;
      for (const enrollment of enrollments) {
        const count = await prisma.qRCode.count({
          where: {
            courseId: enrollment.courseId,
            validTo: { lt: now },
            isActive: true,
            validFrom: { gte: enrollment.enrolledAt }
          }
        });
        totalExpectedSessions += count;
      }

      // Get all attendance records for the user
      // Filter by enrolled courses to match the expected sessions scope
      const attendanceRecords = await prisma.attendanceRecord.findMany({
        where: {
          studentId: targetUserId,
          courseId: { in: enrolledCourseIds }
        },
        include: {
          course: {
            select: {
              courseName: true,
              courseCode: true
            }
          }
        }
      });

      // Calculate overall statistics
      const attendedSessions = attendanceRecords.filter(r => r.status === 'PRESENT').length;
      const lateSessions = attendanceRecords.filter(r => r.status === 'LATE').length;
      const excusedSessions = attendanceRecords.filter(r => r.status === 'EXCUSED').length;

      // Missed classes = Total Expected - (Present + Late + Excused)
      // This implicitly includes records with status 'ABSENT' and sessions with NO record
      const missedClasses = Math.max(0, totalExpectedSessions - (attendedSessions + lateSessions + excusedSessions));

      const totalSessions = totalExpectedSessions;

      const attendancePercentage = totalSessions > 0
        ? Math.round(((attendedSessions + lateSessions) / totalSessions) * 100)
        : 0;

      // Get course-specific statistics
      const courseStats = await prisma.attendanceRecord.groupBy({
        by: ['courseId'],
        where: {
          studentId: targetUserId,
          courseId: { in: enrolledCourseIds }
        },
        _count: {
          id: true
        }
      });

      const stats = {
        totalSessions,
        attendedSessions: attendedSessions + lateSessions,
        attendancePercentage,
        averageAttendance: attendancePercentage,
        lateCount: lateSessions,
        lateSessions: lateSessions,
        absentCount: missedClasses,
        absentSessions: missedClasses,
        excusedCount: excusedSessions,
        coursesCount: enrollments.length
      };

      console.log('📊 Calculated stats:', stats);

      res.json({
        success: true,
        message: 'Attendance stats retrieved successfully',
        data: stats
      });

    } catch (error) {
      console.error('❌ Error fetching attendance stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch attendance stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Error handling middleware
router.use(errorHandler);

// GET /api/attendance/courses - Get student's enrolled courses
router.get('/courses',
  generalLimiter,
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const studentId = typeof req.user!.id === 'string' ? parseInt(req.user!.id) : req.user!.id;

      const enrollments = await prisma.courseEnrollment.findMany({
        where: {
          studentId: studentId,
          status: 'ACTIVE'
        },
        include: {
          course: {
            select: {
              id: true,
              courseName: true,
              courseCode: true,
              description: true,
              professor: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });

      const courses = enrollments.map(enrollment => ({
        id: enrollment.course.id,
        name: enrollment.course.courseName,
        code: enrollment.course.courseCode,
        description: enrollment.course.description,
        professorName: `${enrollment.course.professor.firstName} ${enrollment.course.professor.lastName}`
      }));

      res.json({
        success: true,
        data: courses
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/attendance/devices - Register device fingerprint
router.post('/devices',
  strictLimiter,
  authenticateToken,
  [
    body('fingerprint').isString().notEmpty().withMessage('Fingerprint is required'),
    body('deviceInfo').isString().notEmpty().withMessage('Device info is required')
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { fingerprint, deviceInfo } = req.body;
      const studentId = typeof req.user!.id === 'string' ? parseInt(req.user!.id) : req.user!.id;

      // Check if device already exists
      let device = await prisma.deviceFingerprint.findUnique({
        where: { fingerprint }
      });

      if (device) {
        // If device exists but belongs to another student, flag it
        if (device.studentId !== studentId) {
          console.warn(`Device fingerprint collision or sharing detected: ${fingerprint}`);
          // We might want to create a fraud alert here
        }

        // Update last used
        device = await prisma.deviceFingerprint.update({
          where: { id: device.id },
          data: {
            lastUsed: new Date(),
            isActive: true
          }
        });
      } else {
        // Register new device
        device = await prisma.deviceFingerprint.create({
          data: {
            studentId,
            fingerprint,
            deviceInfo: deviceInfo, // Store directly as it matches Json type
            lastUsed: new Date(),
            isActive: true
          }
        });
      }

      res.json({
        success: true,
        data: device,
        message: 'Device registered successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;