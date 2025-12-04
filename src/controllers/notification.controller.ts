import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service.js';
import { SocketService } from '../services/socket.service.js';
import {
  CreateNotificationRequest,
  UpdateNotificationSettingsRequest,
  NotificationFilters,
  BulkNotificationRequest,
  NotificationType,
  NotificationCategory,
  ExamNotificationData,
  AssignmentNotificationData,
  AttendanceNotificationData,
  CourseNotificationData,
  SystemNotificationData,
} from '../types/notification.types.js';

// Global notification service instance (will be initialized with socket service)
let notificationService: NotificationService;

export const initializeNotificationController = (socketService: SocketService) => {
  notificationService = new NotificationService(socketService);
};

export class NotificationController {
  /**
   * Get user notifications
   * GET /api/notifications
   */
  static async getUserNotifications(req: Request, res: Response) {
    try {
      if (!(req as any).user || !(req as any).user.id) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }
      const userId = parseInt((req as any).user.id);
      const {
        category,
        type,
        isRead,
        startDate,
        endDate,
        limit = 50,
        offset = 0,
      } = req.query;

      const filters: NotificationFilters = {
        category: category as NotificationCategory,
        type: type as NotificationType,
        isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      const notifications = await notificationService.getUserNotifications(userId, filters);

      res.status(200).json({
        success: true,
        data: notifications,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: notifications.length,
        },
      });
    } catch (error: any) {
      console.error('Error getting user notifications:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get notifications',
        error: error.toString(),
        stack: error.stack
      });
    }
  }

  /**
   * Create new notification
   * POST /api/notifications
   */
  static async createNotification(req: Request, res: Response) {
    try {
      const {
        userId,
        title,
        message,
        type,
        category,
        metadata,
        sendEmail = false,
      } = req.body;

      // Validate required fields
      if (!userId || !title || !message || !type || !category) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: userId, title, message, type, category',
        });
      }

      const notificationRequest: CreateNotificationRequest = {
        userId: parseInt(userId),
        title,
        message,
        type,
        category,
        metadata,
        sendEmail,
      };

      const notification = await notificationService.createNotification(notificationRequest);

      res.status(201).json({
        success: true,
        message: 'Notification created successfully',
        data: notification,
      });
    } catch (error: any) {
      console.error('Error creating notification:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create notification',
      });
    }
  }

  /**
   * Create bulk notifications
   * POST /api/notifications/bulk
   */
  static async createBulkNotifications(req: Request, res: Response) {
    try {
      const {
        userIds,
        title,
        message,
        type,
        category,
        metadata,
        sendEmail = false,
      } = req.body;

      // Validate required fields
      if (!userIds || !Array.isArray(userIds) || !title || !message || !type || !category) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: userIds (array), title, message, type, category',
        });
      }

      const bulkRequest: BulkNotificationRequest = {
        userIds: userIds.map((id: any) => parseInt(id)),
        title,
        message,
        type,
        category,
        metadata,
        sendEmail,
      };

      const notifications = await notificationService.createBulkNotifications(bulkRequest);

      res.status(201).json({
        success: true,
        message: `${notifications.length} notifications created successfully`,
        data: notifications,
      });
    } catch (error: any) {
      console.error('Error creating bulk notifications:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create bulk notifications',
      });
    }
  }

  /**
   * Mark notification as read
   * PUT /api/notifications/:id/read
   */
  static async markNotificationAsRead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = parseInt((req as any).user.id);

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Notification ID is required',
        });
      }

      const success = await notificationService.markNotificationAsRead(
        parseInt(id),
        userId
      );

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Notification marked as read',
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Notification not found',
        });
      }
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to mark notification as read',
      });
    }
  }

  /**
   * Mark all notifications as read
   * PUT /api/notifications/read-all
   */
  static async markAllNotificationsAsRead(req: Request, res: Response) {
    try {
      const userId = parseInt((req as any).user.id);

      const count = await notificationService.markAllNotificationsAsRead(userId);

      res.status(200).json({
        success: true,
        message: `${count} notifications marked as read`,
        data: { count },
      });
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to mark all notifications as read',
      });
    }
  }

  /**
   * Delete notification
   * DELETE /api/notifications/:id
   */
  static async deleteNotification(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = parseInt((req as any).user.id);

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Notification ID is required',
        });
      }

      const success = await notificationService.deleteNotification(
        parseInt(id),
        userId
      );

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Notification deleted successfully',
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Notification not found',
        });
      }
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete notification',
      });
    }
  }

  /**
   * Get unread notifications count
   * GET /api/notifications/unread-count
   */
  static async getUnreadCount(req: Request, res: Response) {
    try {
      const userId = parseInt((req as any).user.id);

      const count = await notificationService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: { count },
      });
    } catch (error: any) {
      console.error('Error getting unread count:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get unread count',
      });
    }
  }

  /**
   * Get notification statistics
   * GET /api/notifications/stats
   */
  static async getNotificationStats(req: Request, res: Response) {
    try {
      const userId = parseInt((req as any).user.id);

      const stats = await notificationService.getNotificationStats(userId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Error getting notification stats:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get notification statistics',
        error: error.toString(),
        stack: error.stack
      });
    }
  }

  /**
   * Get notification settings
   * GET /api/notifications/settings
   */
  static async getNotificationSettings(req: Request, res: Response) {
    try {
      const userId = parseInt((req as any).user.id);

      const settings = await notificationService.getNotificationSettings(userId);

      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error: any) {
      console.error('Error getting notification settings:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get notification settings',
      });
    }
  }

  /**
   * Update notification settings
   * PUT /api/notifications/settings
   */
  static async updateNotificationSettings(req: Request, res: Response) {
    try {
      const userId = parseInt((req as any).user.id);
      const settings: UpdateNotificationSettingsRequest = req.body;

      const updatedSettings = await notificationService.updateNotificationSettings(
        userId,
        settings
      );

      res.status(200).json({
        success: true,
        message: 'Notification settings updated successfully',
        data: updatedSettings,
      });
    } catch (error: any) {
      console.error('Error updating notification settings:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update notification settings',
      });
    }
  }

  /**
   * Create exam notification
   * POST /api/notifications/exam
   */
  static async createExamNotification(req: Request, res: Response) {
    try {
      const { userId, sendEmail = true } = req.body;
      const examData: ExamNotificationData = req.body;

      if (!userId || !examData.examTitle || !examData.courseName) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: userId, examTitle, courseName',
        });
      }

      const notification = await notificationService.createExamNotification(
        parseInt(userId),
        examData,
        sendEmail
      );

      res.status(201).json({
        success: true,
        message: 'Exam notification created successfully',
        data: notification,
      });
    } catch (error: any) {
      console.error('Error creating exam notification:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create exam notification',
      });
    }
  }

  /**
   * Create assignment notification
   * POST /api/notifications/assignment
   */
  static async createAssignmentNotification(req: Request, res: Response) {
    try {
      const { userId, sendEmail = true } = req.body;
      const assignmentData: AssignmentNotificationData = req.body;

      if (!userId || !assignmentData.assignmentTitle || !assignmentData.courseName) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: userId, assignmentTitle, courseName',
        });
      }

      const notification = await notificationService.createAssignmentNotification(
        parseInt(userId),
        assignmentData,
        sendEmail
      );

      res.status(201).json({
        success: true,
        message: 'Assignment notification created successfully',
        data: notification,
      });
    } catch (error: any) {
      console.error('Error creating assignment notification:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create assignment notification',
      });
    }
  }

  /**
   * Create attendance notification
   * POST /api/notifications/attendance
   */
  static async createAttendanceNotification(req: Request, res: Response) {
    try {
      const { userId, sendEmail = false } = req.body;
      const attendanceData: AttendanceNotificationData = req.body;

      if (!userId || !attendanceData.courseName) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: userId, courseName',
        });
      }

      const notification = await notificationService.createAttendanceNotification(
        parseInt(userId),
        attendanceData,
        sendEmail
      );

      res.status(201).json({
        success: true,
        message: 'Attendance notification created successfully',
        data: notification,
      });
    } catch (error: any) {
      console.error('Error creating attendance notification:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create attendance notification',
      });
    }
  }

  /**
   * Create course notification
   * POST /api/notifications/course
   */
  static async createCourseNotification(req: Request, res: Response) {
    try {
      const { userId, sendEmail = true } = req.body;
      const courseData: CourseNotificationData = req.body;

      if (!userId || !courseData.courseName || !courseData.notificationMessage) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: userId, courseName, notificationMessage',
        });
      }

      const notification = await notificationService.createCourseNotification(
        parseInt(userId),
        courseData,
        sendEmail
      );

      res.status(201).json({
        success: true,
        message: 'Course notification created successfully',
        data: notification,
      });
    } catch (error: any) {
      console.error('Error creating course notification:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create course notification',
      });
    }
  }

  /**
   * Create system notification
   * POST /api/notifications/system
   */
  static async createSystemNotification(req: Request, res: Response) {
    try {
      const { userId, sendEmail = true } = req.body;
      const systemData: SystemNotificationData = req.body;

      if (!userId || !systemData.systemMessage) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: userId, systemMessage',
        });
      }

      const notification = await notificationService.createSystemNotification(
        parseInt(userId),
        systemData,
        sendEmail
      );

      res.status(201).json({
        success: true,
        message: 'System notification created successfully',
        data: notification,
      });
    } catch (error: any) {
      console.error('Error creating system notification:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create system notification',
      });
    }
  }

  /**
   * Get announcements for dashboard
   * GET /api/notifications/announcements
   */
  static async getAnnouncements(req: Request, res: Response) {
    try {
      const userId = parseInt((req as any).user.id);
      const { limit = 10, offset = 0 } = req.query;

      const filters: NotificationFilters = {
        category: 'ANNOUNCEMENT' as NotificationCategory,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      const announcements = await notificationService.getUserNotifications(userId, filters);

      res.status(200).json({
        success: true,
        data: announcements,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: announcements.length,
        },
      });
    } catch (error: any) {
      console.error('Error getting announcements:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get announcements',
      });
    }
  }
}
