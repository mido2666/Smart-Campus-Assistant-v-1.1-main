import { Request, Response } from 'express';
import { AttendanceController } from '../src/controllers/attendance.controller';
import { AttendanceService } from '../src/services/attendance.service';
import { QRService } from '../src/services/qr.service';
import { AttendanceStatsService } from '../src/services/attendanceStats.service';

// Mock the services
jest.mock('../src/services/attendance.service');
jest.mock('../src/services/qr.service');
jest.mock('../src/services/attendanceStats.service');

const MockedAttendanceService = AttendanceService as jest.Mocked<typeof AttendanceService>;
const MockedQRService = QRService as jest.Mocked<typeof QRService>;
const MockedAttendanceStatsService = AttendanceStatsService as jest.Mocked<typeof AttendanceStatsService>;

describe('AttendanceController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('startAttendanceSession', () => {
    it('should start attendance session successfully', async () => {
      const sessionData = {
        courseId: 1,
        title: 'Lecture 1',
        description: 'Introduction to Computer Science',
        durationMinutes: 60
      };

      const mockResult = {
        sessionId: 'session-123',
        qrCode: 'qr-code-data',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      };

      mockRequest.body = sessionData;
      mockRequest.user = { id: 'prof-1', role: 'PROFESSOR' };
      MockedAttendanceService.startAttendanceSession.mockResolvedValue(mockResult);

      await AttendanceController.startAttendanceSession(mockRequest as any, mockResponse as Response);

      expect(MockedAttendanceService.startAttendanceSession).toHaveBeenCalledWith({
        courseId: sessionData.courseId,
        professorId: 'prof-1',
        title: sessionData.title,
        description: sessionData.description,
        durationMinutes: sessionData.durationMinutes
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Attendance session started successfully',
        data: mockResult
      });
    });

    it('should handle missing required fields', async () => {
      const incompleteData = {
        courseId: 1,
        // Missing title
        description: 'Introduction to Computer Science'
      };

      mockRequest.body = incompleteData;
      mockRequest.user = { id: 'prof-1', role: 'PROFESSOR' };

      await AttendanceController.startAttendanceSession(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Course ID and title are required'
      });
    });
  });

  describe('markAttendance', () => {
    it('should mark attendance successfully', async () => {
      const attendanceData = {
        sessionId: 'session-123',
        status: 'PRESENT'
      };

      const mockResult = {
        id: 1,
        sessionId: 'session-123',
        studentId: 'student-1',
        status: 'PRESENT',
        markedAt: new Date()
      };

      mockRequest.body = attendanceData;
      mockRequest.user = { id: 'student-1', role: 'STUDENT' };
      MockedAttendanceService.markAttendance.mockResolvedValue(mockResult);

      await AttendanceController.markAttendance(mockRequest as any, mockResponse as Response);

      expect(MockedAttendanceService.markAttendance).toHaveBeenCalledWith({
        sessionId: attendanceData.sessionId,
        studentId: 'student-1',
        status: attendanceData.status
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Attendance marked successfully',
        data: mockResult
      });
    });

    it('should handle missing session ID', async () => {
      mockRequest.body = { status: 'PRESENT' };
      mockRequest.user = { id: 'student-1', role: 'STUDENT' };

      await AttendanceController.markAttendance(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Session ID is required'
      });
    });
  });

  describe('getAttendanceRecords', () => {
    it('should get student attendance records', async () => {
      const mockRecords = [
        {
          id: 1,
          sessionId: 'session-123',
          status: 'PRESENT',
          markedAt: new Date(),
          session: {
            title: 'Lecture 1',
            course: { courseName: 'CS101' }
          }
        }
      ];

      mockRequest.query = { courseId: '1' };
      mockRequest.user = { id: 'student-1', role: 'STUDENT' };
      MockedAttendanceService.getStudentAttendanceRecords.mockResolvedValue(mockRecords);

      await AttendanceController.getAttendanceRecords(mockRequest as any, mockResponse as Response);

      expect(MockedAttendanceService.getStudentAttendanceRecords).toHaveBeenCalledWith('student-1', 1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockRecords
      });
    });

    it('should get professor course attendance records', async () => {
      const mockRecords = [
        {
          id: 1,
          sessionId: 'session-123',
          studentId: 'student-1',
          status: 'PRESENT',
          student: {
            firstName: 'John',
            lastName: 'Doe'
          }
        }
      ];

      mockRequest.query = { courseId: '1' };
      mockRequest.user = { id: 'prof-1', role: 'PROFESSOR' };
      MockedAttendanceService.getCourseAttendanceRecords.mockResolvedValue(mockRecords);

      await AttendanceController.getAttendanceRecords(mockRequest as any, mockResponse as Response);

      expect(MockedAttendanceService.getCourseAttendanceRecords).toHaveBeenCalledWith(1, 'prof-1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should require course ID for professor requests', async () => {
      mockRequest.query = {};
      mockRequest.user = { id: 'prof-1', role: 'PROFESSOR' };

      await AttendanceController.getAttendanceRecords(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Course ID is required for professor requests'
      });
    });

    it('should deny access to non-student/professor users', async () => {
      mockRequest.user = { id: 'admin-1', role: 'ADMIN' };

      await AttendanceController.getAttendanceRecords(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied'
      });
    });
  });

  describe('getAttendanceStats', () => {
    it('should get student attendance stats', async () => {
      const mockStats = {
        totalSessions: 20,
        presentCount: 18,
        absentCount: 2,
        attendanceRate: 90.0
      };

      mockRequest.query = { courseId: '1' };
      mockRequest.user = { id: 'student-1', role: 'STUDENT' };
      MockedAttendanceService.getStudentAttendanceStats.mockResolvedValue(mockStats);

      await AttendanceController.getAttendanceStats(mockRequest as any, mockResponse as Response);

      expect(MockedAttendanceService.getStudentAttendanceStats).toHaveBeenCalledWith('student-1', 1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });

    it('should get course attendance stats for professor', async () => {
      const mockStats = {
        totalStudents: 30,
        averageAttendance: 85.5,
        attendanceBySession: []
      };

      mockRequest.query = { courseId: '1' };
      mockRequest.user = { id: 'prof-1', role: 'PROFESSOR' };
      MockedAttendanceService.getCourseAttendanceStats.mockResolvedValue(mockStats);

      await AttendanceController.getAttendanceStats(mockRequest as any, mockResponse as Response);

      expect(MockedAttendanceService.getCourseAttendanceStats).toHaveBeenCalledWith(1, 'prof-1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getQRCodeForSession', () => {
    it('should get QR code for session successfully', async () => {
      const mockQRData = {
        qrCode: 'qr-code-data',
        sessionId: 'session-123',
        expiresAt: new Date()
      };

      mockRequest.params = { sessionId: 'session-123' };
      MockedAttendanceService.getQRCodeForSession.mockResolvedValue(mockQRData);

      await AttendanceController.getQRCodeForSession(mockRequest as any, mockResponse as Response);

      expect(MockedAttendanceService.getQRCodeForSession).toHaveBeenCalledWith('session-123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockQRData
      });
    });

    it('should handle missing session ID', async () => {
      mockRequest.params = {};

      await AttendanceController.getQRCodeForSession(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Session ID is required'
      });
    });
  });

  describe('endAttendanceSession', () => {
    it('should end attendance session successfully', async () => {
      mockRequest.params = { sessionId: 'session-123' };
      mockRequest.user = { id: 'prof-1', role: 'PROFESSOR' };
      MockedAttendanceService.endAttendanceSession.mockResolvedValue(true);

      await AttendanceController.endAttendanceSession(mockRequest as any, mockResponse as Response);

      expect(MockedAttendanceService.endAttendanceSession).toHaveBeenCalledWith('session-123', 'prof-1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Attendance session ended successfully'
      });
    });

    it('should handle failed session end', async () => {
      mockRequest.params = { sessionId: 'session-123' };
      mockRequest.user = { id: 'prof-1', role: 'PROFESSOR' };
      MockedAttendanceService.endAttendanceSession.mockResolvedValue(false);

      await AttendanceController.endAttendanceSession(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to end attendance session'
      });
    });
  });

  describe('getActiveAttendanceSessions', () => {
    it('should get active attendance sessions successfully', async () => {
      const mockSessions = [
        {
          id: 'session-123',
          title: 'Lecture 1',
          courseId: 1,
          isActive: true,
          expiresAt: new Date()
        }
      ];

      mockRequest.params = { courseId: '1' };
      mockRequest.user = { id: 'prof-1', role: 'PROFESSOR' };
      MockedAttendanceService.getActiveAttendanceSessions.mockResolvedValue(mockSessions);

      await AttendanceController.getActiveAttendanceSessions(mockRequest as any, mockResponse as Response);

      expect(MockedAttendanceService.getActiveAttendanceSessions).toHaveBeenCalledWith(1, 'prof-1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockSessions
      });
    });

    it('should handle missing course ID', async () => {
      mockRequest.params = {};
      mockRequest.user = { id: 'prof-1', role: 'PROFESSOR' };

      await AttendanceController.getActiveAttendanceSessions(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Course ID is required'
      });
    });
  });

  describe('validateQRCodeSession', () => {
    it('should validate QR code session successfully', async () => {
      const mockValidation = {
        isValid: true,
        sessionId: 'session-123',
        expiresAt: new Date(),
        courseName: 'CS101'
      };

      mockRequest.body = { sessionId: 'session-123' };
      MockedQRService.validateQRCodeSession.mockResolvedValue(mockValidation);

      await AttendanceController.validateQRCodeSession(mockRequest as any, mockResponse as Response);

      expect(MockedQRService.validateQRCodeSession).toHaveBeenCalledWith('session-123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockValidation
      });
    });

    it('should handle missing session ID', async () => {
      mockRequest.body = {};

      await AttendanceController.validateQRCodeSession(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Session ID is required'
      });
    });
  });

  describe('getAttendanceTrends', () => {
    it('should get attendance trends successfully', async () => {
      const mockTrends = {
        dailyAttendance: [],
        weeklyTrend: 85.5,
        monthlyTrend: 88.2
      };

      mockRequest.params = { studentId: '1', courseId: '1' };
      mockRequest.query = { days: '30' };
      mockRequest.user = { id: '1', role: 'STUDENT' };
      MockedAttendanceStatsService.getAttendanceTrends.mockResolvedValue(mockTrends);

      await AttendanceController.getAttendanceTrends(mockRequest as any, mockResponse as Response);

      expect(MockedAttendanceStatsService.getAttendanceTrends).toHaveBeenCalledWith(1, 1, 30);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockTrends
      });
    });

    it('should deny access to other students data', async () => {
      mockRequest.params = { studentId: '2', courseId: '1' };
      mockRequest.user = { id: '1', role: 'STUDENT' };

      await AttendanceController.getAttendanceTrends(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied'
      });
    });
  });

  describe('getQRCodeHistory', () => {
    it('should get QR code history successfully', async () => {
      const mockHistory = [
        {
          id: 'session-123',
          title: 'Lecture 1',
          createdAt: new Date(),
          isActive: false
        }
      ];

      // Mock Prisma client
      const mockPrisma = {
        course: {
          findFirst: jest.fn().mockResolvedValue({
            id: 1,
            courseName: 'CS101',
            professorId: 'prof-1'
          })
        }
      };

      jest.doMock('../generated/prisma', () => ({
        PrismaClient: jest.fn().mockImplementation(() => mockPrisma)
      }));

      mockRequest.params = { courseId: '1' };
      mockRequest.query = { limit: '10' };
      mockRequest.user = { id: 'prof-1', role: 'PROFESSOR' };
      MockedQRService.getQRCodeHistoryForCourse.mockResolvedValue(mockHistory);

      await AttendanceController.getQRCodeHistory(mockRequest as any, mockResponse as Response);

      expect(MockedQRService.getQRCodeHistoryForCourse).toHaveBeenCalledWith(1, 10);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockHistory
      });
    });

    it('should handle course not found', async () => {
      const mockPrisma = {
        course: {
          findFirst: jest.fn().mockResolvedValue(null)
        }
      };

      jest.doMock('../generated/prisma', () => ({
        PrismaClient: jest.fn().mockImplementation(() => mockPrisma)
      }));

      mockRequest.params = { courseId: '999' };
      mockRequest.user = { id: 'prof-1', role: 'PROFESSOR' };

      await AttendanceController.getQRCodeHistory(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Course not found or access denied'
      });
    });
  });
});
