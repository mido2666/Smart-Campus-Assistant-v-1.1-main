import { EmailService } from './email.service.js';
import { SocketService } from './socket.service.js';
import {
  CreateNotificationRequest,
  NotificationResponse,
  NotificationSettingsResponse,
  UpdateNotificationSettingsRequest,
  NotificationStats,
  NotificationFilters,
  BulkNotificationRequest,
  EmailFrequency,
  NotificationType,
  NotificationCategory,
  NotificationMetadata,
  ExamNotificationData,
  AssignmentNotificationData,
  AttendanceNotificationData,
  CourseNotificationData,
  SystemNotificationData,
} from '../types/notification.types.js';

import prisma from '../../config/database.js';

export class NotificationService {
  private emailService: EmailService;
  private socketService?: SocketService;

  constructor(socketService?: SocketService) {
    this.emailService = new EmailService();
    this.socketService = socketService;
  }

  /**
   * Create a new notification
   */
  async createNotification(request: CreateNotificationRequest): Promise<NotificationResponse> {
    try {
      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          userId: request.userId,
          title: request.title,
          message: request.message,
          type: request.type as any,
          category: request.category as any,
          metadata: request.metadata || {},
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Send real-time notification via Socket.io
      if (this.socketService) {
        this.socketService.sendNotificationToUser(request.userId, {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          category: notification.category,
          metadata: notification.metadata as NotificationMetadata,
          createdAt: notification.createdAt,
        });
      }

      // Send email notification if requested
      if (request.sendEmail) {
        await this.sendEmailNotification(notification);
      }

      return {
        id: notification.id,
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type as unknown as NotificationType,
        category: notification.category as unknown as NotificationCategory,
        isRead: notification.isRead,
        isEmailSent: notification.isEmailSent,
        metadata: notification.metadata as NotificationMetadata,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
        readAt: notification.readAt ?? undefined,
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  /**
   * Create bulk notifications
   */
  async createBulkNotifications(request: BulkNotificationRequest): Promise<NotificationResponse[]> {
    try {
      const notifications = await Promise.all(
        request.userIds.map(userId =>
          this.createNotification({
            userId,
            title: request.title,
            message: request.message,
            type: request.type,
            category: request.category,
            metadata: request.metadata,
            sendEmail: request.sendEmail,
          })
        )
      );

      return notifications;
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      throw new Error('Failed to create bulk notifications');
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: number,
    filters?: NotificationFilters
  ): Promise<NotificationResponse[]> {
    try {
      const whereClause: any = { userId };

      if (filters) {
        if (filters.category) whereClause.category = filters.category;
        if (filters.type) whereClause.type = filters.type;
        if (filters.isRead !== undefined) whereClause.isRead = filters.isRead;
        if (filters.startDate || filters.endDate) {
          whereClause.createdAt = {};
          if (filters.startDate) whereClause.createdAt.gte = filters.startDate;
          if (filters.endDate) whereClause.createdAt.lte = filters.endDate;
        }
      }

      const notifications = await prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      });

      return notifications.map(notification => ({
        id: notification.id,
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type as unknown as NotificationType,
        category: notification.category as unknown as NotificationCategory,
        isRead: notification.isRead,
        isEmailSent: notification.isEmailSent,
        metadata: notification.metadata as NotificationMetadata,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
        readAt: notification.readAt ?? undefined,
      }));
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw new Error('Failed to get user notifications');
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: number, userId: number): Promise<boolean> {
    try {
      const notification = await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return notification.count > 0;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllNotificationsAsRead(userId: number): Promise<number> {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return result.count;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: number, userId: number): Promise<boolean> {
    try {
      const result = await prisma.notification.deleteMany({
        where: {
          id: notificationId,
          userId,
        },
      });

      return result.count > 0;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error('Failed to delete notification');
    }
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(userId: number): Promise<number> {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });

      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw new Error('Failed to get unread count');
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId: number): Promise<NotificationStats> {
    try {
      const [total, unread, categoryCounts, typeCounts] = await Promise.all([
        prisma.notification.count({
          where: { userId },
        }),
        prisma.notification.count({
          where: { userId, isRead: false },
        }),
        prisma.notification.groupBy({
          by: ['category'],
          where: { userId },
          _count: { category: true },
        }),
        prisma.notification.groupBy({
          by: ['type'],
          where: { userId },
          _count: { type: true },
        }),
      ]);

      const byCategory = categoryCounts.reduce((acc, item) => {
        acc[item.category] = item._count.category;
        return acc;
      }, {} as { [key in NotificationCategory]: number });

      const byType = typeCounts.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {} as { [key in NotificationType]: number });

      return {
        total,
        unread,
        byCategory,
        byType,
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw new Error('Failed to get notification statistics');
    }
  }

  /**
   * Get or create notification settings for user
   */
  async getNotificationSettings(userId: number): Promise<NotificationSettingsResponse> {
    try {
      let settings = await prisma.notificationSettings.findUnique({
        where: { userId },
      });

      if (!settings) {
        // Create default settings
        settings = await prisma.notificationSettings.create({
          data: { userId },
        });
      }

      return {
        id: settings.id,
        userId: settings.userId,
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        examNotifications: settings.examNotifications,
        assignmentNotifications: settings.assignmentNotifications,
        attendanceNotifications: settings.attendanceNotifications,
        courseNotifications: settings.courseNotifications,
        systemNotifications: settings.systemNotifications,
        emailFrequency: settings.emailFrequency as unknown as EmailFrequency,
        quietHoursStart: settings.quietHoursStart ?? undefined,
        quietHoursEnd: settings.quietHoursEnd ?? undefined,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt,
      };
    } catch (error) {
      console.error('Error getting notification settings:', error);
      throw new Error('Failed to get notification settings');
    }
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(
    userId: number,
    settings: UpdateNotificationSettingsRequest
  ): Promise<NotificationSettingsResponse> {
    try {
      const updatedSettings = await prisma.notificationSettings.upsert({
        where: { userId },
        update: settings,
        create: {
          userId,
          ...settings,
        },
      });

      return {
        id: updatedSettings.id,
        userId: updatedSettings.userId,
        emailNotifications: updatedSettings.emailNotifications,
        pushNotifications: updatedSettings.pushNotifications,
        examNotifications: updatedSettings.examNotifications,
        assignmentNotifications: updatedSettings.assignmentNotifications,
        attendanceNotifications: updatedSettings.attendanceNotifications,
        courseNotifications: updatedSettings.courseNotifications,
        systemNotifications: updatedSettings.systemNotifications,
        emailFrequency: updatedSettings.emailFrequency as unknown as EmailFrequency,
        quietHoursStart: updatedSettings.quietHoursStart ?? undefined,
        quietHoursEnd: updatedSettings.quietHoursEnd ?? undefined,
        createdAt: updatedSettings.createdAt,
        updatedAt: updatedSettings.updatedAt,
      };
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw new Error('Failed to update notification settings');
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(notification: any): Promise<void> {
    try {
      // Check if email notifications are enabled
      const emailEnabled = await this.emailService.isEmailNotificationEnabled(
        notification.userId,
        notification.category
      );

      if (!emailEnabled) {
        console.log(`Email notifications disabled for user ${notification.userId}`);
        return;
      }

      // Check quiet hours
      const inQuietHours = await this.emailService.isWithinQuietHours(notification.userId);
      if (inQuietHours) {
        console.log(`User ${notification.userId} is in quiet hours`);
        return;
      }

      // Generate email template based on category
      let template;
      const user = notification.user;
      const userName = `${user.firstName} ${user.lastName}`;

      switch (notification.category) {
        case NotificationCategory.EXAM:
          template = this.emailService.generateExamNotificationTemplate({
            studentName: userName,
            courseName: notification.metadata?.courseName || 'Unknown Course',
            examTitle: notification.metadata?.examTitle || notification.title,
            examDate: notification.metadata?.examDate || 'TBD',
            examTime: notification.metadata?.examTime || 'TBD',
            examLocation: notification.metadata?.examLocation,
            examDuration: notification.metadata?.examDuration,
          });
          break;

        case NotificationCategory.ASSIGNMENT:
          template = this.emailService.generateAssignmentNotificationTemplate({
            studentName: userName,
            courseName: notification.metadata?.courseName || 'Unknown Course',
            assignmentTitle: notification.metadata?.assignmentTitle || notification.title,
            dueDate: notification.metadata?.dueDate || 'TBD',
            dueTime: notification.metadata?.dueTime || 'TBD',
            assignmentDescription: notification.metadata?.assignmentDescription,
          });
          break;

        case NotificationCategory.ATTENDANCE:
          template = this.emailService.generateAttendanceNotificationTemplate({
            studentName: userName,
            courseName: notification.metadata?.courseName || 'Unknown Course',
            attendanceDate: notification.metadata?.attendanceDate || new Date().toISOString(),
            attendanceStatus: notification.metadata?.attendanceStatus || 'Updated',
            attendancePercentage: notification.metadata?.attendancePercentage,
          });
          break;

        case NotificationCategory.COURSE:
          template = this.emailService.generateCourseNotificationTemplate({
            studentName: userName,
            courseName: notification.metadata?.courseName || 'Unknown Course',
            courseCode: notification.metadata?.courseCode || 'N/A',
            professorName: notification.metadata?.professorName || 'Professor',
            notificationMessage: notification.message,
            actionRequired: notification.metadata?.actionRequired,
          });
          break;

        case NotificationCategory.SYSTEM:
          template = this.emailService.generateSystemNotificationTemplate({
            userName,
            systemMessage: notification.message,
            actionRequired: notification.metadata?.actionRequired,
            supportContact: notification.metadata?.supportContact,
          });
          break;

        default:
          template = this.emailService.generateGenericNotificationTemplate(
            notification.title,
            notification.message,
            userName,
            notification.category,
            notification.type
          );
      }

      // Send email
      const emailSent = await this.emailService.sendEmailNotification(user.email, template);

      // Update notification with email status
      if (emailSent) {
        await prisma.notification.update({
          where: { id: notification.id },
          data: { isEmailSent: true },
        });
      }
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  /**
   * Create exam notification
   */
  async createExamNotification(
    userId: number,
    examData: ExamNotificationData,
    sendEmail: boolean = true
  ): Promise<NotificationResponse> {
    return this.createNotification({
      userId,
      title: `Exam Reminder: ${examData.examTitle}`,
      message: `Upcoming exam in ${examData.courseName} on ${examData.examDate} at ${examData.examTime}`,
      type: NotificationType.WARNING,
      category: NotificationCategory.EXAM,
      metadata: examData,
      sendEmail,
    });
  }

  /**
   * Create assignment notification
   */
  async createAssignmentNotification(
    userId: number,
    assignmentData: AssignmentNotificationData,
    sendEmail: boolean = true
  ): Promise<NotificationResponse> {
    return this.createNotification({
      userId,
      title: `Assignment Due: ${assignmentData.assignmentTitle}`,
      message: `Assignment due in ${assignmentData.courseName} on ${assignmentData.dueDate} at ${assignmentData.dueTime}`,
      type: NotificationType.WARNING,
      category: NotificationCategory.ASSIGNMENT,
      metadata: assignmentData,
      sendEmail,
    });
  }

  /**
   * Create attendance notification
   */
  async createAttendanceNotification(
    userId: number,
    attendanceData: AttendanceNotificationData,
    sendEmail: boolean = false
  ): Promise<NotificationResponse> {
    return this.createNotification({
      userId,
      title: `Attendance Updated: ${attendanceData.courseName}`,
      message: `Your attendance has been marked as ${attendanceData.attendanceStatus}`,
      type: NotificationType.INFO,
      category: NotificationCategory.ATTENDANCE,
      metadata: attendanceData,
      sendEmail,
    });
  }

  /**
   * Create course notification
   */
  async createCourseNotification(
    userId: number,
    courseData: CourseNotificationData,
    sendEmail: boolean = true
  ): Promise<NotificationResponse> {
    return this.createNotification({
      userId,
      title: `Course Update: ${courseData.courseName}`,
      message: courseData.notificationMessage,
      type: courseData.actionRequired ? NotificationType.WARNING : NotificationType.INFO,
      category: NotificationCategory.COURSE,
      metadata: courseData,
      sendEmail,
    });
  }

  /**
   * Create system notification
   */
  async createSystemNotification(
    userId: number,
    systemData: SystemNotificationData,
    sendEmail: boolean = true
  ): Promise<NotificationResponse> {
    return this.createNotification({
      userId,
      title: 'System Notification',
      message: systemData.systemMessage,
      type: systemData.actionRequired ? NotificationType.ERROR : NotificationType.INFO,
      category: NotificationCategory.SYSTEM,
      metadata: systemData,
      sendEmail,
    });
  }
}
