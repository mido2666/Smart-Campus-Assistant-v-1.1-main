import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.js';
import { AuthMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(AuthMiddleware.authenticate());

/**
 * @route GET /api/notifications
 * @desc Get user notifications with optional filters
 * @access Private
 * @query { category?: NotificationCategory, type?: NotificationType, isRead?: boolean, startDate?: Date, endDate?: Date, limit?: number, offset?: number }
 */
router.get('/', NotificationController.getUserNotifications);

/**
 * @route GET /api/notifications/announcements
 * @desc Get announcements for dashboard
 * @access Private
 * @query { limit?: number, offset?: number }
 */
router.get('/announcements', NotificationController.getAnnouncements);

/**
 * @route POST /api/notifications
 * @desc Create a new notification
 * @access Private (Admin/Professor)
 * @body { userId: number, title: string, message: string, type: NotificationType, category: NotificationCategory, metadata?: object, sendEmail?: boolean }
 */
router.post('/', NotificationController.createNotification);

/**
 * @route POST /api/notifications/bulk
 * @desc Create bulk notifications for multiple users
 * @access Private (Admin/Professor)
 * @body { userIds: number[], title: string, message: string, type: NotificationType, category: NotificationCategory, metadata?: object, sendEmail?: boolean }
 */
router.post('/bulk', NotificationController.createBulkNotifications);

/**
 * @route PUT /api/notifications/:id/read
 * @desc Mark a specific notification as read
 * @access Private
 * @params { id: number }
 */
router.put('/:id/read', NotificationController.markNotificationAsRead);

/**
 * @route PUT /api/notifications/read-all
 * @desc Mark all notifications as read for the current user
 * @access Private
 */
router.put('/read-all', NotificationController.markAllNotificationsAsRead);

/**
 * @route DELETE /api/notifications/:id
 * @desc Delete a specific notification
 * @access Private
 * @params { id: number }
 */
router.delete('/:id', NotificationController.deleteNotification);

/**
 * @route GET /api/notifications/unread-count
 * @desc Get unread notifications count for the current user
 * @access Private
 */
router.get('/unread-count', NotificationController.getUnreadCount);

/**
 * @route GET /api/notifications/stats
 * @desc Get notification statistics for the current user
 * @access Private
 */
router.get('/stats', NotificationController.getNotificationStats);

/**
 * @route GET /api/notifications/settings
 * @desc Get notification settings for the current user
 * @access Private
 */
router.get('/settings', NotificationController.getNotificationSettings);

/**
 * @route PUT /api/notifications/settings
 * @desc Update notification settings for the current user
 * @access Private
 * @body { emailNotifications?: boolean, pushNotifications?: boolean, examNotifications?: boolean, assignmentNotifications?: boolean, attendanceNotifications?: boolean, courseNotifications?: boolean, systemNotifications?: boolean, emailFrequency?: EmailFrequency, quietHoursStart?: string, quietHoursEnd?: string }
 */
router.put('/settings', NotificationController.updateNotificationSettings);

/**
 * @route POST /api/notifications/exam
 * @desc Create exam notification
 * @access Private (Admin/Professor)
 * @body { userId: number, studentName: string, courseName: string, examTitle: string, examDate: string, examTime: string, examLocation?: string, examDuration?: string, sendEmail?: boolean }
 */
router.post('/exam', NotificationController.createExamNotification);

/**
 * @route POST /api/notifications/assignment
 * @desc Create assignment notification
 * @access Private (Admin/Professor)
 * @body { userId: number, studentName: string, courseName: string, assignmentTitle: string, dueDate: string, dueTime: string, assignmentDescription?: string, sendEmail?: boolean }
 */
router.post('/assignment', NotificationController.createAssignmentNotification);

/**
 * @route POST /api/notifications/attendance
 * @desc Create attendance notification
 * @access Private (Admin/Professor)
 * @body { userId: number, studentName: string, courseName: string, attendanceDate: string, attendanceStatus: string, attendancePercentage?: number, sendEmail?: boolean }
 */
router.post('/attendance', NotificationController.createAttendanceNotification);

/**
 * @route POST /api/notifications/course
 * @desc Create course notification
 * @access Private (Admin/Professor)
 * @body { userId: number, studentName: string, courseName: string, courseCode: string, professorName: string, notificationMessage: string, actionRequired?: boolean, sendEmail?: boolean }
 */
router.post('/course', NotificationController.createCourseNotification);

/**
 * @route POST /api/notifications/system
 * @desc Create system notification
 * @access Private (Admin)
 * @body { userId: number, userName: string, systemMessage: string, actionRequired?: boolean, supportContact?: string, sendEmail?: boolean }
 */
router.post('/system', NotificationController.createSystemNotification);

export default router;
