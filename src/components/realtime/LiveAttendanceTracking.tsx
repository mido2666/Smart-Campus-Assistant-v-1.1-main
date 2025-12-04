import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Progress } from '../../ui/progress';
import { Alert, AlertDescription } from '../../ui/alert';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  MapPin,
  Shield
} from 'lucide-react';

interface AttendanceRecord {
  id: string;
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

interface LiveAttendanceTrackingProps {
  sessionId: string;
  isProfessor?: boolean;
}

export const LiveAttendanceTracking: React.FC<LiveAttendanceTrackingProps> = ({
  sessionId,
  isProfessor = false
}) => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    attendanceRate: 0
  });
  const [fraudAlerts, setFraudAlerts] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const socketRef = useRef<any>(null);
  const activityTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Initialize socket connection
    const initializeSocket = () => {
      if (typeof window !== 'undefined' && window.io) {
        socketRef.current = window.io();
        
        socketRef.current.on('connect', () => {
          console.log('Connected to server');
          setConnectionStatus('connected');
          
          // Authenticate
          const token = localStorage.getItem('token');
          if (token) {
            socketRef.current.emit('authenticate', { token });
          }
        });

        socketRef.current.on('disconnect', () => {
          console.log('Disconnected from server');
          setConnectionStatus('disconnected');
        });

        socketRef.current.on('authenticated', (data: any) => {
          console.log('Authenticated:', data);
          
          // Join session
          socketRef.current.emit('join_session', { sessionId });
        });

        // Attendance events
        socketRef.current.on('attendance:marked', (data: AttendanceRecord) => {
          setAttendanceRecords(prev => [data, ...prev.slice(0, 49)]); // Keep last 50 records
          addRecentActivity({
            type: 'attendance',
            message: `${data.studentName} marked ${data.status.toLowerCase()}`,
            timestamp: new Date(),
            status: data.status
          });
          updateStats();
        });

        socketRef.current.on('attendance:failed', (data: any) => {
          addRecentActivity({
            type: 'error',
            message: `Attendance failed: ${data.reason}`,
            timestamp: new Date()
          });
        });

        socketRef.current.on('attendance:fraud_detected', (data: any) => {
          setFraudAlerts(prev => [data, ...prev.slice(0, 9)]); // Keep last 10 alerts
          addRecentActivity({
            type: 'fraud',
            message: `Fraud detected for ${data.studentName}`,
            timestamp: new Date(),
            severity: data.severity
          });
        });

        socketRef.current.on('attendance:location_warning', (data: any) => {
          addRecentActivity({
            type: 'warning',
            message: `Location warning: ${data.reason}`,
            timestamp: new Date()
          });
        });

        socketRef.current.on('attendance:device_warning', (data: any) => {
          addRecentActivity({
            type: 'warning',
            message: `Device warning: ${data.reason}`,
            timestamp: new Date()
          });
        });

        // Security events
        socketRef.current.on('security:fraud_alert', (data: any) => {
          setFraudAlerts(prev => [data, ...prev.slice(0, 9)]);
          addRecentActivity({
            type: 'security',
            message: `Security alert: ${data.description}`,
            timestamp: new Date(),
            severity: data.severity
          });
        });

        socketRef.current.on('security:risk_high', (data: any) => {
          addRecentActivity({
            type: 'high_risk',
            message: `High risk activity detected`,
            timestamp: new Date()
          });
        });

        // Session events
        socketRef.current.on('session:started', (data: any) => {
          addRecentActivity({
            type: 'session',
            message: `Session "${data.title}" started`,
            timestamp: new Date()
          });
        });

        socketRef.current.on('session:ended', (data: any) => {
          addRecentActivity({
            type: 'session',
            message: `Session "${data.title}" ended`,
            timestamp: new Date()
          });
        });

        socketRef.current.on('session:emergency_Square', (data: any) => {
          addRecentActivity({
            type: 'emergency',
            message: `Emergency Square: ${data.reason}`,
            timestamp: new Date()
          });
        });

        // Notifications
        socketRef.current.on('notification', (data: any) => {
          addRecentActivity({
            type: 'notification',
            message: data.message,
            timestamp: new Date(),
            priority: data.priority
          });
        });

        // Health check
        socketRef.current.on('health_check', (data: any) => {
          console.log('Health check:', data);
        });

        socketRef.current.on('error', (error: any) => {
          console.error('Socket error:', error);
          addRecentActivity({
            type: 'error',
            message: `Connection error: ${error.message}`,
            timestamp: new Date()
          });
        });
      }
    };

    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [sessionId]);

  const addRecentActivity = (activity: any) => {
    setRecentActivity(prev => [activity, ...prev.slice(0, 19)]); // Keep last 20 activities
    
    // Auto-remove activity after 10 seconds
    activityTimeoutRef.current = setTimeout(() => {
      setRecentActivity(prev => prev.slice(0, -1));
    }, 10000);
  };

  const updateStats = () => {
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(r => r.status === 'PRESENT').length;
    const absent = attendanceRecords.filter(r => r.status === 'ABSENT').length;
    const late = attendanceRecords.filter(r => r.status === 'LATE').length;
    const excused = attendanceRecords.filter(r => r.status === 'EXCUSED').length;
    const attendanceRate = total > 0 ? (present / total) * 100 : 0;

    setStats({
      total,
      present,
      absent,
      late,
      excused,
      attendanceRate
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'ABSENT':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'LATE':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'EXCUSED':
        return <UserX className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-100 text-green-800';
      case 'ABSENT':
        return 'bg-red-100 text-red-800';
      case 'LATE':
        return 'bg-yellow-100 text-yellow-800';
      case 'EXCUSED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'attendance':
        return <UserCheck className="h-4 w-4 text-green-500" />;
      case 'fraud':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'session':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'emergency':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'disconnected':
        return 'bg-red-500';
      case 'reconnecting':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Live Attendance Tracking</CardTitle>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`} />
              <span className="text-sm text-gray-600 capitalize">{connectionStatus}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.present}</div>
              <div className="text-sm text-gray-600">Present</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
              <div className="text-sm text-gray-600">Absent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
              <div className="text-sm text-gray-600">Late</div>
            </div>
          </div>

          {/* Attendance Rate */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Attendance Rate</span>
              <span className="text-sm text-gray-600">{stats.attendanceRate.toFixed(1)}%</span>
            </div>
            <Progress value={stats.attendanceRate} className="h-2" />
          </div>

          {/* Fraud Alerts */}
          {fraudAlerts.length > 0 && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {fraudAlerts.length} fraud alert{fraudAlerts.length > 1 ? 's' : ''} detected
              </AlertDescription>
            </Alert>
          )}

          {/* Recent Activity Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full"
          >
            {isExpanded ? 'Hide' : 'Show'} Recent Activity ({recentActivity.length})
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentActivity.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">
                      No recent activity
                    </div>
                  ) : (
                    recentActivity.map((activity, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                      >
                        {getActivityIcon(activity.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.message}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        {activity.severity && (
                          <Badge variant="destructive" className="text-xs">
                            {activity.severity}
                          </Badge>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attendance Records */}
      {attendanceRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {attendanceRecords.slice(0, 10).map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(record.status)}
                    <div>
                      <p className="font-medium">{record.studentName}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(record.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(record.status)}>
                      {record.status}
                    </Badge>
                    {record.fraudScore && record.fraudScore > 70 && (
                      <Badge variant="destructive">High Risk</Badge>
                    )}
                    {record.location && (
                      <MapPin className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LiveAttendanceTracking;
