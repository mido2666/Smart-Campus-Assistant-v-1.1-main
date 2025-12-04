import { getWebSocketService } from './websocket.service';
import { apiClient } from './api';

// Get WebSocket service instance
const wsService = getWebSocketService();

// Types
export interface AttendanceSession {
  id: string;
  professorId: string;
  courseId: number;
  courseName: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location: {
    latitude: number;
    longitude: number;
    radius: number;
    name: string;
  };
  security: {
    isLocationRequired: boolean;
    isPhotoRequired: boolean;
    isDeviceCheckRequired: boolean;
    fraudDetectionEnabled: boolean;
    gracePeriod: number;
    maxAttempts: number;
    riskThreshold: number;
  };
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'PAUSED' | 'ENDED' | 'CANCELLED';
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  lateStudents: number;
  fraudAlerts: number;
  qrCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSessionData {
  courseId: number;
  courseName: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location: {
    latitude: number;
    longitude: number;
    radius: number;
    name: string;
  };
  security: {
    isLocationRequired: boolean;
    isPhotoRequired: boolean;
    isDeviceCheckRequired: boolean;
    fraudDetectionEnabled: boolean;
    gracePeriod: number;
    maxAttempts: number;
    riskThreshold: number;
  };
}

export interface UpdateSessionData {
  title?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
    name: string;
  };
  security?: {
    isLocationRequired: boolean;
    isPhotoRequired: boolean;
    isDeviceCheckRequired: boolean;
    fraudDetectionEnabled: boolean;
    gracePeriod: number;
    maxAttempts: number;
    riskThreshold: number;
  };
}

export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  scheduledSessions: number;
  completedSessions: number;
  totalStudents: number;
  averageAttendance: number;
  fraudAlerts: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  status?: string;
  courseId?: number;
  professorId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class AttendanceService {
  // Use the centralized apiClient which handles token refresh automatically
  // No need for manual token management or fetch calls

  // Session Management Methods
  async createSession(sessionData: CreateSessionData): Promise<ApiResponse<AttendanceSession>> {
    try {
      // Transform data to match backend expectations
      const transformedData = {
        courseId: sessionData.courseId,
        title: sessionData.title,
        description: sessionData.description || '',
        startTime: sessionData.startTime instanceof Date
          ? sessionData.startTime.toISOString()
          : typeof sessionData.startTime === 'string'
            ? sessionData.startTime
            : new Date(sessionData.startTime).toISOString(),
        endTime: sessionData.endTime instanceof Date
          ? sessionData.endTime.toISOString()
          : typeof sessionData.endTime === 'string'
            ? sessionData.endTime
            : new Date(sessionData.endTime).toISOString(),
        location: sessionData.location ? {
          latitude: sessionData.location.latitude,
          longitude: sessionData.location.longitude,
          radius: sessionData.location.radius,
          name: sessionData.location.name
        } : undefined,
        securitySettings: {
          requireLocation: sessionData.security?.isLocationRequired ?? true,
          requirePhoto: sessionData.security?.isPhotoRequired ?? false,
          requireDeviceCheck: sessionData.security?.isDeviceCheckRequired ?? true,
          enableFraudDetection: sessionData.security?.fraudDetectionEnabled ?? true,
          maxAttempts: sessionData.security?.maxAttempts ?? 3,
          gracePeriod: sessionData.security?.gracePeriod ?? 5
        }
      };

      const response = await apiClient.post('/attendance/sessions', transformedData);

      if (response.success && response.data) {
        // Emit real-time update
        wsService.send('session:created', {
          session: response.data,
          timestamp: new Date().toISOString(),
        });
      }

      return {
        success: response.success,
        data: response.data,
        message: response.message,
        error: response.error
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Failed to create session',
      };
    }
  }

  async getSessions(params: PaginationParams = {}): Promise<ApiResponse<PaginatedResponse<AttendanceSession>>> {
    try {
      const queryParams: Record<string, string> = {};
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams[key] = value.toString();
        }
      });

      const response = await apiClient.get('/attendance/sessions', { params: queryParams });

      return {
        success: response.success,
        data: response.data,
        message: response.message,
        error: response.error
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Failed to get sessions',
      };
    }
  }

  async getSessionById(sessionId: string): Promise<ApiResponse<AttendanceSession>> {
    try {
      const response = await apiClient.get(`/attendance/sessions/${sessionId}`);

      return {
        success: response.success,
        data: response.data,
        message: response.message,
        error: response.error
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Failed to get session',
      };
    }
  }

  async updateSession(sessionId: string, updates: UpdateSessionData): Promise<ApiResponse<AttendanceSession>> {
    try {
      const response = await apiClient.put(`/attendance/sessions/${sessionId}`, updates);

      if (response.success && response.data) {
        // Emit real-time update
        wsService.send('session:updated', {
          sessionId,
          session: response.data,
          timestamp: new Date().toISOString(),
        });
      }

      return {
        success: response.success,
        data: response.data,
        message: response.message,
        error: response.error
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Failed to update session',
      };
    }
  }

  async deleteSession(sessionId: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete(`/attendance/sessions/${sessionId}`);

      if (response.success) {
        // Emit real-time update
        wsService.send('session:deleted', {
          sessionId,
          timestamp: new Date().toISOString(),
        });
      }

      return {
        success: response.success,
        message: response.message,
        error: response.error
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Failed to delete session',
      };
    }
  }

  async startSession(sessionId: string): Promise<ApiResponse<AttendanceSession>> {
    try {
      const response = await apiClient.post(`/attendance/sessions/${sessionId}/start`, {});

      if (response.success && response.data) {
        // Emit real-time update
        wsService.send('session:started', {
          sessionId,
          session: response.data,
          timestamp: new Date().toISOString(),
        });
      }

      return {
        success: response.success,
        data: response.data,
        message: response.message,
        error: response.error
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Failed to start session',
      };
    }
  }

  async getSessionRecords(sessionId: string, params: PaginationParams = {}): Promise<ApiResponse<PaginatedResponse<any>>> {
    try {
      const queryParams: Record<string, string> = {};
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams[key] = value.toString();
        }
      });

      const response = await apiClient.get(`/attendance/sessions/${sessionId}/records`, { params: queryParams });

      return {
        success: response.success,
        data: response.data,
        message: response.message,
        error: response.error
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Failed to get session records',
      };
    }
  }

  async stopSession(sessionId: string): Promise<ApiResponse<AttendanceSession>> {
    try {
      const response = await apiClient.post(`/attendance/sessions/${sessionId}/stop`, {});

      if (response.success && response.data) {
        // Emit real-time update
        wsService.send('session:ended', {
          sessionId,
          session: response.data,
          timestamp: new Date().toISOString(),
        });
      }

      // If response failed, extract error message from response
      if (!response.success) {
        const errorMessage = response.error || response.message || 'Failed to stop session';
        return {
          success: false,
          data: undefined,
          message: response.message,
          error: errorMessage
        };
      }

      return {
        success: response.success,
        data: response.data,
        message: response.message,
        error: response.error
      };
    } catch (error: any) {
      // Extract error message from response if available
      // Check both error and details fields
      const errorMessage = error?.response?.data?.error
        || error?.response?.data?.details
        || error?.message
        || 'Failed to stop session';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async pauseSession(sessionId: string): Promise<ApiResponse<AttendanceSession>> {
    try {
      const response = await apiClient.post(`/attendance/sessions/${sessionId}/pause`, {});

      if (response.success && response.data) {
        // Emit real-time update
        wsService.send('session:paused', {
          sessionId,
          session: response.data,
          timestamp: new Date().toISOString(),
        });
      }

      // If response failed, extract error message from response
      if (!response.success) {
        const errorMessage = response.error || response.message || 'Failed to pause session';
        return {
          success: false,
          data: undefined,
          message: response.message,
          error: errorMessage
        };
      }

      return {
        success: response.success,
        data: response.data,
        message: response.message,
        error: response.error
      };
    } catch (error: any) {
      // Extract error message from response if available
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to pause session';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async generateQRCode(sessionId: string): Promise<ApiResponse<{ qrCode: string; qrCodeData: string }>> {
    try {
      const response = await apiClient.post(`/attendance/sessions/${sessionId}/qr-code`, {});

      if (response.success && response.data) {
        // Emit real-time update
        wsService.send('session:qr_generated', {
          sessionId,
          qrCode: response.data.qrCode || (response.data as any).qrCodeData,
          timestamp: new Date().toISOString(),
        });
      }

      return {
        success: response.success,
        data: response.data,
        message: response.message,
        error: response.error
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Failed to generate QR code',
      };
    }
  }

  async getSessionStats(professorId?: string): Promise<ApiResponse<SessionStats>> {
    try {
      const params = professorId ? { params: { professorId } } : {};
      const response = await apiClient.get('/attendance/sessions/stats', params);

      return {
        success: response.success,
        data: response.data,
        message: response.message,
        error: response.error
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Failed to get session stats',
      };
    }
  }

  async getActiveSessions(professorId?: string): Promise<ApiResponse<AttendanceSession[]>> {
    try {
      const params = professorId ? { params: { professorId } } : {};
      const response = await apiClient.get('/attendance/sessions/active', params);

      return {
        success: response.success,
        data: response.data,
        message: response.message,
        error: response.error
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Failed to get active sessions',
      };
    }
  }

  async getScheduledSessions(professorId?: string): Promise<ApiResponse<AttendanceSession[]>> {
    try {
      const params = professorId ? { params: { professorId } } : {};
      const response = await apiClient.get('/attendance/sessions/scheduled', params);

      return {
        success: response.success,
        data: response.data,
        message: response.message,
        error: response.error
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Failed to get scheduled sessions',
      };
    }
  }

  async getCompletedSessions(professorId?: string): Promise<ApiResponse<AttendanceSession[]>> {
    try {
      const params = professorId ? { params: { professorId } } : {};
      const response = await apiClient.get('/attendance/sessions/completed', params);

      return {
        success: response.success,
        data: response.data,
        message: response.message,
        error: response.error
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Failed to get completed sessions',
      };
    }
  }

  // Real-time event listeners
  onSessionCreated(callback: (session: AttendanceSession) => void) {
    wsService.on('session:created', (data: { session: AttendanceSession }) => {
      callback(data.session);
    });
  }

  onSessionUpdated(callback: (sessionId: string, session: AttendanceSession) => void) {
    wsService.on('session:updated', (data: { sessionId: string; session: AttendanceSession }) => {
      callback(data.sessionId, data.session);
    });
  }

  onSessionDeleted(callback: (sessionId: string) => void) {
    wsService.on('session:deleted', (data: { sessionId: string }) => {
      callback(data.sessionId);
    });
  }

  onSessionStarted(callback: (sessionId: string, session: AttendanceSession) => void) {
    wsService.on('session:started', (data: { sessionId: string; session: AttendanceSession }) => {
      callback(data.sessionId, data.session);
    });
  }

  onSessionEnded(callback: (sessionId: string, session: AttendanceSession) => void) {
    wsService.on('session:ended', (data: { sessionId: string; session: AttendanceSession }) => {
      callback(data.sessionId, data.session);
    });
  }

  onSessionPaused(callback: (sessionId: string, session: AttendanceSession) => void) {
    wsService.on('session:paused', (data: { sessionId: string; session: AttendanceSession }) => {
      callback(data.sessionId, data.session);
    });
  }

  onQRCodeGenerated(callback: (sessionId: string, qrCode: string) => void) {
    wsService.on('session:qr_generated', (data: { sessionId: string; qrCode: string }) => {
      callback(data.sessionId, data.qrCode);
    });
  }

  // Cleanup method
  removeAllListeners() {
    wsService.off('session:created');
    wsService.off('session:updated');
    wsService.off('session:deleted');
    wsService.off('session:started');
    wsService.off('session:ended');
    wsService.off('session:paused');
    wsService.off('session:qr_generated');
  }
}

// Create and export singleton instance
export const attendanceService = new AttendanceService();
export default attendanceService;