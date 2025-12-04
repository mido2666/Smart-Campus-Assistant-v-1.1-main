// Notification Services Export
export { AttendanceNotificationsService } from './attendance-notifications.service';
export { EmailNotificationsService } from './email-notifications.service';
export { PushNotificationsService } from './push-notifications.service';
export { NotificationTemplatesService } from './notification-templates.service';

// Types Export
export * from './types';

// Notification Service Factory
export class NotificationServiceFactory {
  private static instance: NotificationServiceFactory;
  private services: Map<string, any> = new Map();
  private config: NotificationConfig;

  private constructor(config: NotificationConfig) {
    this.config = config;
  }

  public static getInstance(config?: NotificationConfig): NotificationServiceFactory {
    if (!NotificationServiceFactory.instance) {
      if (!config) {
        throw new Error('NotificationServiceFactory requires configuration on first initialization');
      }
      NotificationServiceFactory.instance = new NotificationServiceFactory(config);
    }
    return NotificationServiceFactory.instance;
  }

  public getAttendanceNotificationsService(): AttendanceNotificationsService {
    if (!this.services.has('attendance')) {
      this.services.set('attendance', new AttendanceNotificationsService(
        this.config.retry,
        this.config.rateLimit
      ));
    }
    return this.services.get('attendance');
  }

  public getEmailNotificationsService(): EmailNotificationsService {
    if (!this.services.has('email')) {
      this.services.set('email', new EmailNotificationsService(
        this.config.retry,
        this.config.rateLimit,
        this.config.smtp
      ));
    }
    return this.services.get('email');
  }

  public getPushNotificationsService(): PushNotificationsService {
    if (!this.services.has('push')) {
      this.services.set('push', new PushNotificationsService(
        this.config.retry,
        this.config.rateLimit,
        this.config.push
      ));
    }
    return this.services.get('push');
  }

  public getNotificationTemplatesService(): NotificationTemplatesService {
    if (!this.services.has('templates')) {
      this.services.set('templates', new NotificationTemplatesService());
    }
    return this.services.get('templates');
  }

  public getNotificationManager(): NotificationManager {
    if (!this.services.has('manager')) {
      this.services.set('manager', new NotificationManager(
        this.getAttendanceNotificationsService(),
        this.getEmailNotificationsService(),
        this.getPushNotificationsService(),
        this.getNotificationTemplatesService()
      ));
    }
    return this.services.get('manager');
  }
}

// Notification Manager
export class NotificationManager {
  private attendanceService: AttendanceNotificationsService;
  private emailService: EmailNotificationsService;
  private pushService: PushNotificationsService;
  private templateService: NotificationTemplatesService;

  constructor(
    attendanceService: AttendanceNotificationsService,
    emailService: EmailNotificationsService,
    pushService: PushNotificationsService,
    templateService: NotificationTemplatesService
  ) {
    this.attendanceService = attendanceService;
    this.emailService = emailService;
    this.pushService = pushService;
    this.templateService = templateService;
  }

  /**
   * Send comprehensive notification across all channels
   */
  public async sendNotification(
    user: NotificationUser,
    type: NotificationType,
    data: any,
    channels: NotificationChannel[] = ['EMAIL', 'PUSH', 'IN_APP']
  ): Promise<NotificationDelivery[]> {
    const deliveries: NotificationDelivery[] = [];

    try {
      // Get template for notification type
      const template = await this.templateService.getTemplate(`${type.toLowerCase()}-${user.language}`);
      
      // Render template
      const rendered = await this.templateService.renderTemplate(template.id, data);

      // Send to each channel
      for (const channel of channels) {
        try {
          let delivery: NotificationDelivery;

          switch (channel) {
            case 'EMAIL':
              delivery = await this.emailService.send({
                id: this.generateMessageId(),
                type,
                category: 'notification',
                priority: { level: 'MEDIUM', escalation: { enabled: false, delay: 0, escalateTo: [] } },
                recipient: user,
                subject: template.subject || 'Notification',
                content: rendered,
                data,
                channels: [{ type: 'EMAIL', enabled: true, priority: { level: 'MEDIUM', escalation: { enabled: false, delay: 0, escalateTo: [] } } }],
                status: 'PENDING',
                deliveryAttempts: 0,
                maxRetries: 3,
                createdAt: new Date(),
                updatedAt: new Date()
              });
              break;

            case 'PUSH':
              delivery = await this.pushService.send({
                id: this.generateMessageId(),
                type,
                category: 'notification',
                priority: { level: 'MEDIUM', escalation: { enabled: false, delay: 0, escalateTo: [] } },
                recipient: user,
                subject: template.subject || 'Notification',
                content: rendered,
                data,
                channels: [{ type: 'PUSH', enabled: true, priority: { level: 'MEDIUM', escalation: { enabled: false, delay: 0, escalateTo: [] } } }],
                status: 'PENDING',
                deliveryAttempts: 0,
                maxRetries: 3,
                createdAt: new Date(),
                updatedAt: new Date()
              });
              break;

            case 'IN_APP':
              delivery = await this.attendanceService.send({
                id: this.generateMessageId(),
                type,
                category: 'notification',
                priority: { level: 'MEDIUM', escalation: { enabled: false, delay: 0, escalateTo: [] } },
                recipient: user,
                subject: template.subject || 'Notification',
                content: rendered,
                data,
                channels: [{ type: 'IN_APP', enabled: true, priority: { level: 'MEDIUM', escalation: { enabled: false, delay: 0, escalateTo: [] } } }],
                status: 'PENDING',
                deliveryAttempts: 0,
                maxRetries: 3,
                createdAt: new Date(),
                updatedAt: new Date()
              });
              break;

            default:
              throw new Error(`Unsupported channel: ${channel}`);
          }

          deliveries.push(delivery);
        } catch (error) {
          console.error(`Failed to send notification via ${channel}:`, error);
        }
      }

      return deliveries;
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }

  /**
   * Send attendance notification
   */
  public async sendAttendanceNotification(
    user: NotificationUser,
    data: AttendanceNotificationData
  ): Promise<NotificationDelivery[]> {
    return this.sendNotification(user, NotificationType.ATTENDANCE, data);
  }

  /**
   * Send fraud alert notification
   */
  public async sendFraudAlertNotification(
    user: NotificationUser,
    data: FraudAlertNotificationData
  ): Promise<NotificationDelivery[]> {
    return this.sendNotification(user, NotificationType.FRAUD_ALERT, data);
  }

  /**
   * Send emergency notification
   */
  public async sendEmergencyNotification(
    users: NotificationUser[],
    data: EmergencyNotificationData
  ): Promise<NotificationDelivery[]> {
    const allDeliveries: NotificationDelivery[] = [];

    for (const user of users) {
      try {
        const deliveries = await this.sendNotification(user, NotificationType.EMERGENCY, data);
        allDeliveries.push(...deliveries);
      } catch (error) {
        console.error(`Failed to send emergency notification to user ${user.id}:`, error);
      }
    }

    return allDeliveries;
  }

  /**
   * Generate message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Default Notification Configuration
export const defaultNotificationConfig: NotificationConfig = {
  retry: {
    maxAttempts: 3,
    backoffStrategy: 'EXPONENTIAL',
    initialDelay: 1000,
    maxDelay: 30000,
    retryableErrors: ['TIMEOUT', 'NETWORK_ERROR', 'RATE_LIMIT']
  },
  rateLimit: {
    enabled: true,
    maxPerMinute: 60,
    maxPerHour: 1000,
    maxPerDay: 10000,
    windowSize: 1
  },
  smtp: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    },
    from: process.env.SMTP_FROM || 'noreply@smartcampus.edu',
    replyTo: process.env.SMTP_REPLY_TO || 'support@smartcampus.edu'
  },
  push: {
    vapid: {
      subject: 'mailto:admin@smartcampus.edu',
      publicKey: process.env.VAPID_PUBLIC_KEY || '',
      privateKey: process.env.VAPID_PRIVATE_KEY || ''
    },
    ttl: 86400, // 24 hours
    topic: 'smart-campus-assistant',
    icon: '/icons/notification-icon.png',
    badge: '/icons/badge-icon.png',
    image: '/images/notification-image.png'
  },
  analytics: {
    enabled: true,
    retentionDays: 90,
    metricsInterval: 60,
    alertThresholds: {
      deliveryRate: 0.95,
      failureRate: 0.05,
      responseTime: 5000
    }
  }
};

// Notification Configuration Interface
export interface NotificationConfig {
  retry: {
    maxAttempts: number;
    backoffStrategy: 'LINEAR' | 'EXPONENTIAL' | 'FIXED';
    initialDelay: number;
    maxDelay: number;
    retryableErrors: string[];
  };
  rateLimit: {
    enabled: boolean;
    maxPerMinute: number;
    maxPerHour: number;
    maxPerDay: number;
    windowSize: number;
  };
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
    from: string;
    replyTo?: string;
  };
  push: {
    vapid: {
      subject: string;
      publicKey: string;
      privateKey: string;
    };
    ttl: number;
    topic?: string;
    icon?: string;
    badge?: string;
    image?: string;
  };
  analytics: {
    enabled: boolean;
    retentionDays: number;
    metricsInterval: number;
    alertThresholds: {
      deliveryRate: number;
      failureRate: number;
      responseTime: number;
    };
  };
}

// Notification Channel Type
export type NotificationChannel = 'EMAIL' | 'PUSH' | 'SMS' | 'IN_APP' | 'WEBHOOK';

// Re-export types for convenience
export type {
  NotificationUser,
  NotificationMessage,
  NotificationDelivery,
  NotificationTemplate,
  NotificationType,
  NotificationStatus,
  NotificationPriority,
  AttendanceNotificationData,
  FraudAlertNotificationData,
  LocationVerificationNotificationData,
  SessionStatusNotificationData,
  EmergencyNotificationData,
  SecurityWarningNotificationData,
  ReportNotificationData
} from './types';
