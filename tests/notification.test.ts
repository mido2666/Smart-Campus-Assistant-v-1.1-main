import { Request, Response } from 'express';
import { NotificationController } from '../src/controllers/notification.controller';
import { NotificationService } from '../src/services/notification.service';
import { SocketService } from '../src/services/socket.service';

// Mock the services
jest.mock('../src/services/notification.service');
jest.mock('../src/services/socket.service');

const MockedNotificationService = NotificationService as jest.Mocked<typeof NotificationService>;
const MockedSocketService = SocketService as jest.Mocked<typeof SocketService>;

describe('NotificationController', () => {
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

  describe('getUserNotifications', () => {
    it('should get user notifications successfully', async () => {
      const mockNotifications = [
        {
          id: 1,
          title: 'New Assignment',
          message: 'Assignment 1 is due tomorrow',
          type: 'ASSIGNMENT',
          category: 'ACADEMIC',
          isRead: false,
          createdAt: new Date()
        }
      ];

      mockRequest.user = { id: '1', role: 'STUDENT' };
      mockRequest.query = {
        category: 'ACADEMIC',
        type: 'ASSIGNMENT',
        isRead: 'false',
        limit: '50',
        offset: '0'
      };

      MockedNotificationService.prototype.getUserNotifications.mockResolvedValue(mockNotifications);

      await NotificationController.getUserNotifications(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockNotifications,
        pagination: {
          limit: 50,
          offset: 0,
          total: mockNotifications.length
        }
      });
    });
  });

  describe('createNotification', () => {
    it('should create notification successfully', async () => {
      const notificationData = {
        userId: 1,
        title: 'New Assignment',
        message: 'Assignment 1 is due tomorrow',
        type: 'ASSIGNMENT',
        category: 'ACADEMIC',
        metadata: { assignmentId: 1 },
        sendEmail: false
      };

      const mockNotification = {
        id: 1,
        ...notificationData,
        isRead: false,
        createdAt: new Date()
      };

      mockRequest.body = notificationData;
      MockedNotificationService.prototype.createNotification.mockResolvedValue(mockNotification);

      await NotificationController.createNotification(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Notification created successfully',
        data: mockNotification
      });
    });

    it('should handle missing required fields', async () => {
      const incompleteData = {
        userId: 1,
        title: 'New Assignment',
        // Missing message, type, category
      };

      mockRequest.body = incompleteData;

      await NotificationController.createNotification(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Missing required fields: userId, title, message, type, category'
      });
    });
  });

  describe('createBulkNotifications', () => {
    it('should create bulk notifications successfully', async () => {
      const bulkData = {
        userIds: [1, 2, 3],
        title: 'System Maintenance',
        message: 'System will be down for maintenance',
        type: 'SYSTEM',
        category: 'SYSTEM',
        sendEmail: true
      };

      const mockNotifications = [
        { id: 1, userId: 1, ...bulkData },
        { id: 2, userId: 2, ...bulkData },
        { id: 3, userId: 3, ...bulkData }
      ];

      mockRequest.body = bulkData;
      MockedNotificationService.prototype.createBulkNotifications.mockResolvedValue(mockNotifications);

      await NotificationController.createBulkNotifications(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '3 notifications created successfully',
        data: mockNotifications
      });
    });

    it('should handle invalid userIds array', async () => {
      const invalidData = {
        userIds: 'not-an-array',
        title: 'System Maintenance',
        message: 'System will be down for maintenance',
        type: 'SYSTEM',
        category: 'SYSTEM'
      };

      mockRequest.body = invalidData;

      await NotificationController.createBulkNotifications(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Missing required fields: userIds (array), title, message, type, category'
      });
    });
  });

  describe('markNotificationAsRead', () => {
    it('should mark notification as read successfully', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.user = { id: '1', role: 'STUDENT' };
      MockedNotificationService.prototype.markNotificationAsRead.mockResolvedValue(true);

      await NotificationController.markNotificationAsRead(mockRequest as any, mockResponse as Response);

      expect(MockedNotificationService.prototype.markNotificationAsRead).toHaveBeenCalledWith(1, '1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Notification marked as read'
      });
    });

    it('should handle notification not found', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.user = { id: '1', role: 'STUDENT' };
      MockedNotificationService.prototype.markNotificationAsRead.mockResolvedValue(false);

      await NotificationController.markNotificationAsRead(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Notification not found'
      });
    });

    it('should handle missing notification ID', async () => {
      mockRequest.params = {};
      mockRequest.user = { id: '1', role: 'STUDENT' };

      await NotificationController.markNotificationAsRead(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Notification ID is required'
      });
    });
  });

  describe('markAllNotificationsAsRead', () => {
    it('should mark all notifications as read successfully', async () => {
      mockRequest.user = { id: '1', role: 'STUDENT' };
      MockedNotificationService.prototype.markAllNotificationsAsRead.mockResolvedValue(5);

      await NotificationController.markAllNotificationsAsRead(mockRequest as any, mockResponse as Response);

      expect(MockedNotificationService.prototype.markAllNotificationsAsRead).toHaveBeenCalledWith('1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: '5 notifications marked as read',
        data: { count: 5 }
      });
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification successfully', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.user = { id: '1', role: 'STUDENT' };
      MockedNotificationService.prototype.deleteNotification.mockResolvedValue(true);

      await NotificationController.deleteNotification(mockRequest as any, mockResponse as Response);

      expect(MockedNotificationService.prototype.deleteNotification).toHaveBeenCalledWith(1, '1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Notification deleted successfully'
      });
    });

    it('should handle notification not found', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.user = { id: '1', role: 'STUDENT' };
      MockedNotificationService.prototype.deleteNotification.mockResolvedValue(false);

      await NotificationController.deleteNotification(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Notification not found'
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should get unread count successfully', async () => {
      mockRequest.user = { id: '1', role: 'STUDENT' };
      MockedNotificationService.prototype.getUnreadCount.mockResolvedValue(3);

      await NotificationController.getUnreadCount(mockRequest as any, mockResponse as Response);

      expect(MockedNotificationService.prototype.getUnreadCount).toHaveBeenCalledWith('1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { count: 3 }
      });
    });
  });

  describe('getNotificationStats', () => {
    it('should get notification statistics successfully', async () => {
      const mockStats = {
        totalNotifications: 50,
        unreadCount: 5,
        readCount: 45,
        notificationsByType: {
          ASSIGNMENT: 20,
          EXAM: 15,
          SYSTEM: 10,
          COURSE: 5
        }
      };

      mockRequest.user = { id: '1', role: 'STUDENT' };
      MockedNotificationService.prototype.getNotificationStats.mockResolvedValue(mockStats);

      await NotificationController.getNotificationStats(mockRequest as any, mockResponse as Response);

      expect(MockedNotificationService.prototype.getNotificationStats).toHaveBeenCalledWith('1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });
  });

  describe('getNotificationSettings', () => {
    it('should get notification settings successfully', async () => {
      const mockSettings = {
        emailNotifications: true,
        pushNotifications: true,
        assignmentReminders: true,
        examReminders: true,
        systemNotifications: false
      };

      mockRequest.user = { id: '1', role: 'STUDENT' };
      MockedNotificationService.prototype.getNotificationSettings.mockResolvedValue(mockSettings);

      await NotificationController.getNotificationSettings(mockRequest as any, mockResponse as Response);

      expect(MockedNotificationService.prototype.getNotificationSettings).toHaveBeenCalledWith('1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockSettings
      });
    });
  });

  describe('updateNotificationSettings', () => {
    it('should update notification settings successfully', async () => {
      const settingsData = {
        emailNotifications: false,
        pushNotifications: true,
        assignmentReminders: true
      };

      const updatedSettings = {
        id: 1,
        userId: '1',
        ...settingsData,
        examReminders: true,
        systemNotifications: true
      };

      mockRequest.user = { id: '1', role: 'STUDENT' };
      mockRequest.body = settingsData;
      MockedNotificationService.prototype.updateNotificationSettings.mockResolvedValue(updatedSettings);

      await NotificationController.updateNotificationSettings(mockRequest as any, mockResponse as Response);

      expect(MockedNotificationService.prototype.updateNotificationSettings).toHaveBeenCalledWith('1', settingsData);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Notification settings updated successfully',
        data: updatedSettings
      });
    });
  });

  describe('createExamNotification', () => {
    it('should create exam notification successfully', async () => {
      const examData = {
        userId: 1,
        examTitle: 'Midterm Exam',
        courseName: 'CS101',
        examDate: '2024-01-15',
        examTime: '10:00 AM',
        location: 'Room 101',
        sendEmail: true
      };

      const mockNotification = {
        id: 1,
        userId: 1,
        title: 'Upcoming Exam: Midterm Exam',
        message: 'Midterm Exam for CS101 is scheduled for 2024-01-15 at 10:00 AM in Room 101',
        type: 'EXAM',
        category: 'ACADEMIC'
      };

      mockRequest.body = examData;
      MockedNotificationService.prototype.createExamNotification.mockResolvedValue(mockNotification);

      await NotificationController.createExamNotification(mockRequest as any, mockResponse as Response);

      expect(MockedNotificationService.prototype.createExamNotification).toHaveBeenCalledWith(1, examData, true);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Exam notification created successfully',
        data: mockNotification
      });
    });

    it('should handle missing required exam fields', async () => {
      const incompleteData = {
        userId: 1,
        examTitle: 'Midterm Exam',
        // Missing courseName
      };

      mockRequest.body = incompleteData;

      await NotificationController.createExamNotification(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Missing required fields: userId, examTitle, courseName'
      });
    });
  });

  describe('createAssignmentNotification', () => {
    it('should create assignment notification successfully', async () => {
      const assignmentData = {
        userId: 1,
        assignmentTitle: 'Homework 1',
        courseName: 'CS101',
        dueDate: '2024-01-10',
        sendEmail: true
      };

      const mockNotification = {
        id: 1,
        userId: 1,
        title: 'New Assignment: Homework 1',
        message: 'Homework 1 for CS101 is due on 2024-01-10',
        type: 'ASSIGNMENT',
        category: 'ACADEMIC'
      };

      mockRequest.body = assignmentData;
      MockedNotificationService.prototype.createAssignmentNotification.mockResolvedValue(mockNotification);

      await NotificationController.createAssignmentNotification(mockRequest as any, mockResponse as Response);

      expect(MockedNotificationService.prototype.createAssignmentNotification).toHaveBeenCalledWith(1, assignmentData, true);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Assignment notification created successfully',
        data: mockNotification
      });
    });
  });

  describe('createAttendanceNotification', () => {
    it('should create attendance notification successfully', async () => {
      const attendanceData = {
        userId: 1,
        courseName: 'CS101',
        attendanceRate: 85.5,
        message: 'Your attendance rate is below 90%',
        sendEmail: false
      };

      const mockNotification = {
        id: 1,
        userId: 1,
        title: 'Attendance Alert - CS101',
        message: 'Your attendance rate is below 90%',
        type: 'ATTENDANCE',
        category: 'ACADEMIC'
      };

      mockRequest.body = attendanceData;
      MockedNotificationService.prototype.createAttendanceNotification.mockResolvedValue(mockNotification);

      await NotificationController.createAttendanceNotification(mockRequest as any, mockResponse as Response);

      expect(MockedNotificationService.prototype.createAttendanceNotification).toHaveBeenCalledWith(1, attendanceData, false);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Attendance notification created successfully',
        data: mockNotification
      });
    });
  });

  describe('createCourseNotification', () => {
    it('should create course notification successfully', async () => {
      const courseData = {
        userId: 1,
        courseName: 'CS101',
        notificationMessage: 'Class is cancelled tomorrow',
        sendEmail: true
      };

      const mockNotification = {
        id: 1,
        userId: 1,
        title: 'Course Update - CS101',
        message: 'Class is cancelled tomorrow',
        type: 'COURSE',
        category: 'ACADEMIC'
      };

      mockRequest.body = courseData;
      MockedNotificationService.prototype.createCourseNotification.mockResolvedValue(mockNotification);

      await NotificationController.createCourseNotification(mockRequest as any, mockResponse as Response);

      expect(MockedNotificationService.prototype.createCourseNotification).toHaveBeenCalledWith(1, courseData, true);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Course notification created successfully',
        data: mockNotification
      });
    });
  });

  describe('createSystemNotification', () => {
    it('should create system notification successfully', async () => {
      const systemData = {
        userId: 1,
        systemMessage: 'System maintenance scheduled for tonight',
        sendEmail: true
      };

      const mockNotification = {
        id: 1,
        userId: 1,
        title: 'System Notification',
        message: 'System maintenance scheduled for tonight',
        type: 'SYSTEM',
        category: 'SYSTEM'
      };

      mockRequest.body = systemData;
      MockedNotificationService.prototype.createSystemNotification.mockResolvedValue(mockNotification);

      await NotificationController.createSystemNotification(mockRequest as any, mockResponse as Response);

      expect(MockedNotificationService.prototype.createSystemNotification).toHaveBeenCalledWith(1, systemData, true);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'System notification created successfully',
        data: mockNotification
      });
    });
  });
});
