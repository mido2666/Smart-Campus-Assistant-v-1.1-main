/**
 * Notifications Hook
 * Manages notification state and real-time updates via WebSocket
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';
import {
  NotificationResponse,
  NotificationStats,
  NotificationFilters,
  NotificationType,
  NotificationCategory,
  SocketNotificationData
} from '../types/notification.types';

// WebSocket connection state
interface WebSocketState {
  connected: boolean;
  reconnecting: boolean;
  error: string | null;
}

// Hook state interface
interface UseNotificationsState {
  notifications: NotificationResponse[];
  stats: NotificationStats | null;
  loading: boolean;
  error: string | null;
  wsState: WebSocketState;
}

// Hook options
interface UseNotificationsOptions {
  autoConnect?: boolean;
  realTime?: boolean;
  filters?: NotificationFilters;
}

// WebSocket connection class
class NotificationWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private onMessage: ((data: SocketNotificationData) => void) | null = null;
  private onStateChange: ((state: WebSocketState) => void) | null = null;

  constructor(url: string) {
    this.url = url;
  }

  connect(token: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    if (!token || token === 'undefined' || token === 'null') {
      console.warn('Invalid token for WebSocket connection');
      return;
    }

    this.token = token;
    this.ws = new WebSocket(`${this.url}?token=${token}`);

    this.ws.onopen = () => {
      console.log('Notification WebSocket connected');
      this.reconnectAttempts = 0;
      this.onStateChange?.({
        connected: true,
        reconnecting: false,
        error: null,
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const data: SocketNotificationData = JSON.parse(event.data);
        this.onMessage?.(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('Notification WebSocket disconnected:', event.code, event.reason);
      this.onStateChange?.({
        connected: false,
        reconnecting: false,
        error: event.reason || 'Connection closed',
      });

      // Attempt to reconnect if not a normal closure
      if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('Notification WebSocket error:', error);
      this.onStateChange?.({
        connected: false,
        reconnecting: false,
        error: 'WebSocket connection error',
      });
    };
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    this.onStateChange?.({
      connected: false,
      reconnecting: true,
      error: `Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
    });

    setTimeout(() => {
      if (this.token) {
        this.connect(this.token);
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'User disconnect');
      this.ws = null;
    }
    this.reconnectAttempts = 0;
  }

  setOnMessage(callback: (data: SocketNotificationData) => void) {
    this.onMessage = callback;
  }

  setOnStateChange(callback: (state: WebSocketState) => void) {
    this.onStateChange = callback;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Main hook
export function useNotifications(options: UseNotificationsOptions = {}) {
  const { autoConnect = true, realTime = true, filters } = options;
  const { user, isAuthenticated } = useAuth();

  const [state, setState] = useState<UseNotificationsState>({
    notifications: [],
    stats: null,
    loading: false,
    error: null,
    wsState: {
      connected: false,
      reconnecting: false,
      error: null,
    },
  });

  const wsRef = useRef<NotificationWebSocket | null>(null);

  // WebSocket URL configuration with dynamic port detection
  const getWebSocketUrl = () => {
    if (import.meta.env.VITE_WS_URL) {
      return import.meta.env.VITE_WS_URL;
    }

    // Try to match the API base URL port
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    const url = new URL(apiUrl);
    return `ws://${url.host}`;
  };

  const wsUrl = getWebSocketUrl();

  // Initialize WebSocket
  useEffect(() => {
    if (realTime && isAuthenticated && user) {
      wsRef.current = new NotificationWebSocket(wsUrl);

      wsRef.current.setOnMessage((data: SocketNotificationData) => {
        setState(prev => ({
          ...prev,
          notifications: [data, ...prev.notifications],
        }));
      });

      wsRef.current.setOnStateChange((wsState: WebSocketState) => {
        setState(prev => ({
          ...prev,
          wsState,
        }));
      });

      if (autoConnect) {
        const token = localStorage.getItem('access_token');
        if (token) {
          wsRef.current.connect(token);
        }
      }
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
      }
    };
  }, [isAuthenticated, user, realTime, autoConnect, wsUrl]);

  // Fetch notifications
  const fetchNotifications = useCallback(async (customFilters?: NotificationFilters) => {
    if (!isAuthenticated || !user) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const queryParams = new URLSearchParams();
      const activeFilters = customFilters || filters;

      if (activeFilters?.category) {
        queryParams.append('category', activeFilters.category);
      }
      if (activeFilters?.type) {
        queryParams.append('type', activeFilters.type);
      }
      if (activeFilters?.isRead !== undefined) {
        queryParams.append('isRead', activeFilters.isRead.toString());
      }
      if (activeFilters?.limit) {
        queryParams.append('limit', activeFilters.limit.toString());
      }
      if (activeFilters?.offset) {
        queryParams.append('offset', activeFilters.offset.toString());
      }

      const url = `/api/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get<NotificationResponse[]>(url);

      if (response.success) {
        setState(prev => ({
          ...prev,
          notifications: response.data || [],
          loading: false,
          error: null,
        }));
      } else {
        throw new Error(response.message || 'Failed to fetch notifications');
      }
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
      // Clear stale notifications on error to prevent showing incorrect data
      setState(prev => ({
        ...prev,
        notifications: [],
        loading: false,
        error: error.message || 'Failed to fetch notifications',
      }));
    }
  }, [isAuthenticated, user, filters]);

  // Fetch notification stats
  const fetchStats = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      const response = await apiClient.get<NotificationStats>('/api/notifications/stats');

      if (response.success) {
        setState(prev => ({
          ...prev,
          stats: response.data || null,
        }));
      } else {
        throw new Error(response.message || 'Failed to fetch stats');
      }
    } catch (error: any) {
      console.error('Failed to fetch notification stats:', error);
      // Clear stale stats on error
      setState(prev => ({
        ...prev,
        stats: null,
      }));
    }
  }, [isAuthenticated, user]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      const response = await apiClient.patch(`/api/notifications/${notificationId}/read`);

      if (response.success) {
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(notification =>
            notification.id === notificationId
              ? { ...notification, isRead: true, readAt: new Date() }
              : notification
          ),
        }));

        // Update stats
        if (prev.stats) {
          setState(prev => ({
            ...prev,
            stats: prev.stats ? {
              ...prev.stats,
              unread: Math.max(0, prev.stats.unread - 1),
            } : null,
          }));
        }
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await apiClient.patch('/api/notifications/read-all');

      if (response.success) {
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(notification => ({
            ...notification,
            isRead: true,
            readAt: new Date(),
          })),
          stats: prev.stats ? {
            ...prev.stats,
            unread: 0,
          } : null,
        }));
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      const response = await apiClient.delete(`/api/notifications/${notificationId}`);

      if (response.success) {
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.filter(n => n.id !== notificationId),
        }));

        // Update stats
        if (prev.stats) {
          setState(prev => ({
            ...prev,
            stats: prev.stats ? {
              ...prev.stats,
              total: Math.max(0, prev.stats.total - 1),
              unread: Math.max(0, prev.stats.unread - 1),
            } : null,
          }));
        }
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, []);

  // Create notification (for testing or admin use)
  const createNotification = useCallback(async (notificationData: {
    title: string;
    message: string;
    type: NotificationType;
    category: NotificationCategory;
    metadata?: any;
  }) => {
    try {
      const response = await apiClient.post('/api/notifications', notificationData);

      if (response.success) {
        // Refresh notifications
        await fetchNotifications();
        await fetchStats();
      }
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  }, [fetchNotifications, fetchStats]);

  // Connect WebSocket manually
  const connectWebSocket = useCallback(() => {
    if (wsRef.current && isAuthenticated) {
      const token = localStorage.getItem('access_token');
      if (token) {
        wsRef.current.connect(token);
      }
    }
  }, [isAuthenticated]);

  // Disconnect WebSocket manually
  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect();
    }
  }, []);

  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchNotifications(),
      fetchStats(),
    ]);
  }, [fetchNotifications, fetchStats]);

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated && user) {
      refresh();
    }
  }, [isAuthenticated, user, refresh]);

  return {
    // State
    notifications: state.notifications,
    stats: state.stats,
    loading: state.loading,
    error: state.error,
    wsState: state.wsState,

    // Actions
    fetchNotifications,
    fetchStats,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    refresh,

    // WebSocket
    connectWebSocket,
    disconnectWebSocket,
    isWebSocketConnected: wsRef.current?.isConnected() || false,
  };
}

export default useNotifications;
