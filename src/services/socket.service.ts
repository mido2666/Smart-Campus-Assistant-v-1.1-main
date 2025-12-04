import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../config/database.js';

// Types
interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  userPermissions?: string[];
  sessionId?: string;
  courseId?: number;
}

interface NotificationMessage {
  id: string;
  type: 'SECURITY' | 'ATTENDANCE' | 'SYSTEM' | 'EMERGENCY';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  courseId?: number;
}

interface AttendanceEvent {
  sessionId: string;
  studentId: string;
  studentName: string;
  timestamp: Date;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  fraudScore?: number;
  deviceFingerprint?: string;
  photoUrl?: string;
}

interface SecurityEvent {
  type: 'FRAUD_ALERT' | 'RISK_HIGH' | 'DEVICE_CHANGE' | 'LOCATION_SPOOF';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sessionId: string;
  studentId?: string;
  description: string;
  metadata: any;
  timestamp: Date;
}

interface SessionEvent {
  sessionId: string;
  courseId: number;
  professorId: string;
  title: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  timestamp: Date;
  reason?: string;
}

interface ConnectionStats {
  totalConnections: number;
  authenticatedConnections: number;
  sessionConnections: Map<string, number>;
  userConnections: Map<string, number>;
  lastActivity: Date;
}

// Prisma client (using singleton from config/database.ts)

// Event emitter for internal events
const eventEmitter = new EventEmitter();

export class SocketService {
  private io: SocketIOServer;
  private connections: Map<string, AuthenticatedSocket> = new Map();
  private userSessions: Map<string, Set<string>> = new Map();
  private sessionUsers: Map<string, Set<string>> = new Map();
  private connectionStats: ConnectionStats = {
    totalConnections: 0,
    authenticatedConnections: 0,
    sessionConnections: new Map(),
    userConnections: new Map(),
    lastActivity: new Date()
  };

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupEventHandlers();
    this.setupInternalEvents();
    this.startHealthCheck();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`New connection: ${socket.id}`);
      this.connectionStats.totalConnections++;
      this.connectionStats.lastActivity = new Date();

      // Handle authentication
      socket.on('authenticate', async (data: { token: string }) => {
        try {
          const decoded = jwt.verify(data.token, process.env.JWT_SECRET!) as any;
          const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
              id: true,
              email: true,
              role: true
            }
          });

          if (!user) {
            socket.emit('auth_error', { message: 'Invalid user' });
            return;
          }

          socket.userId = String(user.id);
          socket.userRole = user.role;
          this.connections.set(socket.id, socket);
          this.connectionStats.authenticatedConnections++;

          // Join user-specific room
          socket.join(`user:${user.id}`);

          // Join role-based rooms
          socket.join(`role:${user.role}`);

          socket.emit('authenticated', {
            userId: user.id,
            role: user.role,
            // permissions: user.permissions
          });

          console.log(`User authenticated: ${user.id} (${user.role})`);
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('auth_error', { message: 'Authentication failed' });
        }
      });

      // Handle session joining
      socket.on('join_session', async (data: { sessionId: string }) => {
        try {
          if (!socket.userId) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          const session = await (prisma as any).attendanceSession.findUnique({
            where: { id: data.sessionId },
            include: {
              course: {
                select: {
                  students: {
                    select: { studentId: true }
                  }
                }
              }
            }
          });

          if (!session) {
            socket.emit('error', { message: 'Session not found' });
            return;
          }

          // Check access permissions
          if (socket.userRole === 'PROFESSOR' && session.professorId !== socket.userId) {
            socket.emit('error', { message: 'Access denied' });
            return;
          }

          if (socket.userRole === 'STUDENT') {
            const isEnrolled = session.course.students.some(
              (enrollment: any) => enrollment.studentId === socket.userId
            );
            if (!isEnrolled) {
              socket.emit('error', { message: 'Not enrolled in course' });
              return;
            }
          }

          socket.sessionId = data.sessionId;
          socket.courseId = session.courseId;

          // Join session room
          socket.join(`session:${data.sessionId}`);
          socket.join(`course:${session.courseId}`);

          // Update tracking
          if (!this.userSessions.has(socket.userId)) {
            this.userSessions.set(socket.userId, new Set());
          }
          this.userSessions.get(socket.userId)!.add(data.sessionId);

          if (!this.sessionUsers.has(data.sessionId)) {
            this.sessionUsers.set(data.sessionId, new Set());
          }
          this.sessionUsers.get(data.sessionId)!.add(socket.userId);

          // Update connection stats
          const currentCount = this.connectionStats.sessionConnections.get(data.sessionId) || 0;
          this.connectionStats.sessionConnections.set(data.sessionId, currentCount + 1);

          socket.emit('session_joined', {
            sessionId: data.sessionId,
            courseId: session.courseId,
            title: session.title
          });

          console.log(`User ${socket.userId} joined session ${data.sessionId}`);
        } catch (error) {
          console.error('Join session error:', error);
          socket.emit('error', { message: 'Failed to join session' });
        }
      });

      // Handle session leaving
      socket.on('leave_session', (data: { sessionId: string }) => {
        if (socket.sessionId === data.sessionId) {
          socket.leave(`session:${data.sessionId}`);
          socket.sessionId = undefined;
          socket.courseId = undefined;

          // Update tracking
          if (this.userSessions.has(socket.userId!)) {
            this.userSessions.get(socket.userId!)!.delete(data.sessionId);
          }

          if (this.sessionUsers.has(data.sessionId)) {
            this.sessionUsers.get(data.sessionId)!.delete(socket.userId!);
          }

          // Update connection stats
          const currentCount = this.connectionStats.sessionConnections.get(data.sessionId) || 0;
          if (currentCount > 0) {
            this.connectionStats.sessionConnections.set(data.sessionId, currentCount - 1);
          }

          socket.emit('session_left', { sessionId: data.sessionId });
          console.log(`User ${socket.userId} left session ${data.sessionId}`);
        }
      });

      // Handle custom events
      socket.on('custom_event', (data: any) => {
        console.log(`Custom event from ${socket.userId}:`, data);
        // Handle custom events here
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`User ${socket.userId} disconnected: ${reason}`);
        this.handleDisconnection(socket);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.userId}:`, error);
      });
    });
  }

  private setupInternalEvents(): void {
    // Attendance events
    eventEmitter.on('attendance:marked', (data: AttendanceEvent) => {
      this.broadcastToSession(data.sessionId, 'attendance:marked', data);
      this.sendNotification({
        type: 'ATTENDANCE',
        priority: 'MEDIUM',
        title: 'Attendance Marked',
        message: `${data.studentName} marked attendance`,
        data,
        sessionId: data.sessionId,
        timestamp: new Date(),
        id: uuidv4()
      });
    });

    eventEmitter.on('attendance:failed', (data: any) => {
      this.broadcastToUser(data.studentId, 'attendance:failed', data);
      this.sendNotification({
        type: 'ATTENDANCE',
        priority: 'HIGH',
        title: 'Attendance Failed',
        message: data.reason || 'Attendance marking failed',
        data,
        userId: data.studentId,
        timestamp: new Date(),
        id: uuidv4()
      });
    });

    eventEmitter.on('attendance:fraud_detected', (data: any) => {
      this.broadcastToSession(data.sessionId, 'attendance:fraud_detected', data);
      this.broadcastToRole('PROFESSOR', 'attendance:fraud_detected', data);
      this.sendNotification({
        type: 'SECURITY',
        priority: 'CRITICAL',
        title: 'Fraud Detected',
        message: `Fraud detected for ${data.studentName}`,
        data,
        sessionId: data.sessionId,
        timestamp: new Date(),
        id: uuidv4()
      });
    });

    eventEmitter.on('attendance:location_warning', (data: any) => {
      this.broadcastToUser(data.studentId, 'attendance:location_warning', data);
      this.sendNotification({
        type: 'SECURITY',
        priority: 'HIGH',
        title: 'Location Warning',
        message: 'Location verification failed',
        data,
        userId: data.studentId,
        timestamp: new Date(),
        id: uuidv4()
      });
    });

    eventEmitter.on('attendance:device_warning', (data: any) => {
      this.broadcastToUser(data.studentId, 'attendance:device_warning', data);
      this.sendNotification({
        type: 'SECURITY',
        priority: 'HIGH',
        title: 'Device Warning',
        message: 'Device verification failed',
        data,
        userId: data.studentId,
        timestamp: new Date(),
        id: uuidv4()
      });
    });

    // Security events
    eventEmitter.on('security:fraud_alert', (data: SecurityEvent) => {
      this.broadcastToSession(data.sessionId, 'security:fraud_alert', data);
      this.broadcastToRole('PROFESSOR', 'security:fraud_alert', data);
      this.sendNotification({
        type: 'SECURITY',
        priority: data.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        title: 'Fraud Alert',
        message: data.description,
        data,
        sessionId: data.sessionId,
        timestamp: new Date(),
        id: uuidv4()
      });
    });

    eventEmitter.on('security:risk_high', (data: any) => {
      this.broadcastToSession(data.sessionId, 'security:risk_high', data);
      this.broadcastToRole('PROFESSOR', 'security:risk_high', data);
      this.sendNotification({
        type: 'SECURITY',
        priority: 'HIGH',
        title: 'High Risk Activity',
        message: 'High-risk activity detected',
        data,
        sessionId: data.sessionId,
        timestamp: new Date(),
        id: uuidv4()
      });
    });

    eventEmitter.on('security:device_change', (data: any) => {
      this.broadcastToUser(data.studentId, 'security:device_change', data);
      this.sendNotification({
        type: 'SECURITY',
        priority: 'MEDIUM',
        title: 'Device Change Detected',
        message: 'New device detected for your account',
        data,
        userId: data.studentId,
        timestamp: new Date(),
        id: uuidv4()
      });
    });

    eventEmitter.on('security:location_spoof', (data: any) => {
      this.broadcastToSession(data.sessionId, 'security:location_spoof', data);
      this.broadcastToRole('PROFESSOR', 'security:location_spoof', data);
      this.sendNotification({
        type: 'SECURITY',
        priority: 'CRITICAL',
        title: 'Location Spoofing Detected',
        message: 'Potential location spoofing detected',
        data,
        sessionId: data.sessionId,
        timestamp: new Date(),
        id: uuidv4()
      });
    });

    // Session events
    eventEmitter.on('session:started', (data: SessionEvent) => {
      this.broadcastToCourse(data.courseId, 'session:started', data);
      this.sendNotification({
        type: 'ATTENDANCE',
        priority: 'MEDIUM',
        title: 'Session Started',
        message: `Session "${data.title}" has started`,
        data,
        courseId: data.courseId,
        timestamp: new Date(),
        id: uuidv4()
      });
    });

    eventEmitter.on('session:ended', (data: SessionEvent) => {
      this.broadcastToCourse(data.courseId, 'session:ended', data);
      this.sendNotification({
        type: 'ATTENDANCE',
        priority: 'MEDIUM',
        title: 'Session Ended',
        message: `Session "${data.title}" has ended`,
        data,
        courseId: data.courseId,
        timestamp: new Date(),
        id: uuidv4()
      });
    });

    eventEmitter.on('session:updated', (data: SessionEvent) => {
      this.broadcastToSession(data.sessionId, 'session:updated', data);
      this.sendNotification({
        type: 'SYSTEM',
        priority: 'LOW',
        title: 'Session Updated',
        message: `Session "${data.title}" has been updated`,
        data,
        sessionId: data.sessionId,
        timestamp: new Date(),
        id: uuidv4()
      });
    });

    eventEmitter.on('session:emergency_stop', (data: SessionEvent) => {
      this.broadcastToSession(data.sessionId, 'session:emergency_stop', data);
      this.broadcastToCourse(data.courseId, 'session:emergency_stop', data);
      this.sendNotification({
        type: 'EMERGENCY',
        priority: 'CRITICAL',
        title: 'Emergency Session Stop',
        message: `Session "${data.title}" has been emergency stopped`,
        data,
        sessionId: data.sessionId,
        courseId: data.courseId,
        timestamp: new Date(),
        id: uuidv4()
      });
    });
  }

  private handleDisconnection(socket: AuthenticatedSocket): void {
    if (socket.userId) {
      // Update connection stats
      const currentCount = this.connectionStats.userConnections.get(socket.userId) || 0;
      if (currentCount > 0) {
        this.connectionStats.userConnections.set(socket.userId, currentCount - 1);
      }

      // Clean up session tracking
      if (socket.sessionId) {
        const currentSessionCount = this.connectionStats.sessionConnections.get(socket.sessionId) || 0;
        if (currentSessionCount > 0) {
          this.connectionStats.sessionConnections.set(socket.sessionId, currentSessionCount - 1);
        }

        if (this.sessionUsers.has(socket.sessionId)) {
          this.sessionUsers.get(socket.sessionId)!.delete(socket.userId);
        }
      }

      if (this.userSessions.has(socket.userId)) {
        this.userSessions.delete(socket.userId);
      }
    }

    this.connections.delete(socket.id);
    this.connectionStats.totalConnections--;
    this.connectionStats.authenticatedConnections--;
    this.connectionStats.lastActivity = new Date();
  }

  private startHealthCheck(): void {
    setInterval(() => {
      this.io.emit('health_check', {
        timestamp: new Date(),
        stats: this.connectionStats
      });
    }, 30000); // Every 30 seconds
  }

  // Public methods for broadcasting
  public broadcastToSession(sessionId: string, event: string, data: any): void {
    this.io.to(`session:${sessionId}`).emit(event, data);
    console.log(`Broadcasted ${event} to session ${sessionId}`);
  }

  public broadcastToCourse(courseId: number, event: string, data: any): void {
    this.io.to(`course:${courseId}`).emit(event, data);
    console.log(`Broadcasted ${event} to course ${courseId}`);
  }

  public broadcastToUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
    console.log(`Broadcasted ${event} to user ${userId}`);
  }

  public broadcastToRole(role: string, event: string, data: any): void {
    this.io.to(`role:${role}`).emit(event, data);
    console.log(`Broadcasted ${event} to role ${role}`);
  }

  public sendNotification(notification: NotificationMessage): void {
    const notificationData = {
      id: notification.id || uuidv4(),
      type: notification.type,
      priority: notification.priority,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      timestamp: notification.timestamp
    };

    // Send to specific user
    if (notification.userId) {
      this.broadcastToUser(notification.userId, 'notification', notificationData);
    }

    // Send to session
    if (notification.sessionId) {
      this.broadcastToSession(notification.sessionId, 'notification', notificationData);
    }

    // Send to course
    if (notification.courseId) {
      this.broadcastToCourse(notification.courseId, 'notification', notificationData);
    }

    // Store notification in database
    this.storeNotification(notificationData);
  }

  public sendNotificationToUser(userId: number, notification: any): void {
    this.sendNotification({
      id: String(notification.id),
      userId: String(userId),
      type: notification.type || 'SYSTEM',
      priority: 'MEDIUM',
      title: notification.title,
      message: notification.message,
      data: notification.metadata,
      timestamp: notification.createdAt || new Date()
    } as any);
  }

  private async storeNotification(notification: any): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          // id: notification.id, // Let Prisma generate ID or use if compatible
          userId: parseInt(notification.userId),
          title: notification.title || 'Notification',
          type: notification.type as any,
          category: (notification.category || 'SYSTEM') as any,
          message: notification.message,
          metadata: notification.data || {},
          isRead: false,
          createdAt: notification.timestamp
        }
      });
    } catch (error) {
      console.error('Failed to store notification:', error);
    }
  }

  // Event emitters for external use
  public emitAttendanceMarked(data: AttendanceEvent): void {
    eventEmitter.emit('attendance:marked', data);
  }

  public emitAttendanceFailed(data: any): void {
    eventEmitter.emit('attendance:failed', data);
  }

  public emitFraudDetected(data: any): void {
    eventEmitter.emit('attendance:fraud_detected', data);
  }

  public emitLocationWarning(data: any): void {
    eventEmitter.emit('attendance:location_warning', data);
  }

  public emitDeviceWarning(data: any): void {
    eventEmitter.emit('attendance:device_warning', data);
  }

  public emitFraudAlert(data: SecurityEvent): void {
    eventEmitter.emit('security:fraud_alert', data);
  }

  public emitHighRisk(data: any): void {
    eventEmitter.emit('security:risk_high', data);
  }

  public emitDeviceChange(data: any): void {
    eventEmitter.emit('security:device_change', data);
  }

  public emitLocationSpoof(data: any): void {
    eventEmitter.emit('security:location_spoof', data);
  }

  public emitSessionStarted(data: SessionEvent): void {
    eventEmitter.emit('session:started', data);
  }

  public emitSessionEnded(data: SessionEvent): void {
    eventEmitter.emit('session:ended', data);
  }

  public emitSessionUpdated(data: SessionEvent): void {
    eventEmitter.emit('session:updated', data);
  }

  public emitEmergencyStop(data: SessionEvent): void {
    eventEmitter.emit('session:emergency_stop', data);
  }

  // Utility methods
  public getConnectionStats(): ConnectionStats {
    return { ...this.connectionStats };
  }

  public getSessionConnections(sessionId: string): number {
    return this.connectionStats.sessionConnections.get(sessionId) || 0;
  }

  public getUserConnections(userId: string): number {
    return this.connectionStats.userConnections.get(userId) || 0;
  }

  public isUserConnected(userId: string): boolean {
    return Array.from(this.connections.values()).some(
      socket => socket.userId === userId
    );
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.connections.values())
      .map(socket => socket.userId)
      .filter(Boolean) as string[];
  }

  public getSessionUsers(sessionId: string): string[] {
    return Array.from(this.sessionUsers.get(sessionId) || []);
  }

  // Cleanup methods
  public async cleanup(): Promise<void> {
    try {
      await prisma.$disconnect();
      this.io.close();
      console.log('Socket service cleaned up');
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

// Export singleton instance
let socketService: SocketService | null = null;

export const initializeSocketService = (server: HTTPServer): SocketService => {
  if (!socketService) {
    socketService = new SocketService(server);
  }
  return socketService;
};

export const getSocketService = (): SocketService | null => {
  return socketService;
};

export default SocketService;