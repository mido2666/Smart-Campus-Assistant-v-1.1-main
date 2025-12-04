import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import chatRouter from './api/chat.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server for Socket.io
const httpServer = createServer(app);

// Environment configuration
const config = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-make-it-very-long-and-random',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12')
  },
  server: {
    port: parseInt(process.env.PORT || '3001'),
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:4173'
    ]
  }
};

// Middleware
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan(config.server.nodeEnv === 'production' ? 'combined' : 'dev'));

// Initialize Socket.io
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.cors.allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('WebSocket client connected:', socket.id);

  // Handle authentication
  socket.on('authenticate', (token) => {
    try {
      // In a real app, you would verify the JWT token here
      console.log('WebSocket authentication attempt with token:', token ? 'provided' : 'missing');
      socket.emit('authenticated', { success: true });
    } catch (error) {
      console.error('WebSocket authentication failed:', error);
      socket.emit('authentication_error', { message: 'Invalid token' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('WebSocket client disconnected:', socket.id);
  });

  // Handle notification subscription
  socket.on('subscribe_notifications', (userId) => {
    console.log('User subscribed to notifications:', userId);
    socket.join(`notifications_${userId}`);
  });

  // Handle notification unsubscription
  socket.on('unsubscribe_notifications', (userId) => {
    console.log('User unsubscribed from notifications:', userId);
    socket.leave(`notifications_${userId}`);
  });
});

// Security headers
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Simple authentication endpoints for testing
app.post('/api/auth/register', (req, res) => {
  try {
    const { universityId, email, password, role, firstName, lastName } = req.body;

    console.log('Registration attempt:', { universityId, email, role, firstName, lastName });

    if (!universityId || !email || !password || !role || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate university ID format (8 digits)
    if (!/^\d{8}$/.test(universityId)) {
      return res.status(400).json({
        success: false,
        message: 'University ID must be 8 digits'
      });
    }

    // Validate password format (1-9 digits)
    if (!/^[1-9]\d{0,8}$/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be 1-9 digits'
      });
    }

    if (!['student', 'professor', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    // Mock user creation (in production, this would save to database)
    const user = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      universityId: universityId,
      email: email.toLowerCase(),
      role,
      firstName,
      lastName,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Registration successful for user:', user.universityId);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 900
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: config.server.nodeEnv === 'development' ? error.message : undefined
    });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { universityId, password } = req.body;

    console.log('Login attempt:', { universityId, password: password ? '***' : 'missing' });

    if (!universityId || !password) {
      return res.status(400).json({
        success: false,
        message: 'University ID and password are required'
      });
    }

    // Validate university ID format (8 digits)
    if (!/^\d{8}$/.test(universityId)) {
      return res.status(400).json({
        success: false,
        message: 'University ID must be 8 digits'
      });
    }

    // Validate password format (1-9 digits)
    if (!/^[1-9]\d{0,8}$/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be 1-9 digits'
      });
    }

    // Mock authentication - accept any valid format for testing
    const user = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      universityId: universityId,
      email: `${universityId}@university.edu`,
      role: 'student',
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Login successful for user:', user.universityId);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        accessToken: 'mock-access-token',
        expiresIn: 900
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: config.server.nodeEnv === 'development' ? error.message : undefined
    });
  }
});

app.get('/api/auth/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Mock user data (in production, this would verify token and get user from database)
    const user = {
      id: 'user_1234567890_abc123',
      email: 'test@university.edu',
      role: 'student',
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: config.server.nodeEnv === 'development' ? error.message : undefined
    });
  }
});

app.get('/api/auth/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authentication service is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    config: {
      jwtConfigured: !!config.jwt.secret,
      corsOrigins: config.cors.allowedOrigins,
      environment: config.server.nodeEnv
    }
  });
});

// Notifications API endpoints
app.get('/api/notifications', (req, res) => {
  try {
    const notifications = [];

    res.status(200).json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: { notifications }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications',
      error: config.server.nodeEnv === 'development' ? error.message : undefined
    });
  }
});

app.get('/api/notifications/stats', (req, res) => {
  try {
    const stats = {
      total: 0,
      unread: 0,
      read: 0,
      byType: {
        info: 0,
        assignment: 0,
        reminder: 0,
        announcement: 0
      }
    };

    res.status(200).json({
      success: true,
      message: 'Notification statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get notification statistics',
      error: config.server.nodeEnv === 'development' ? error.message : undefined
    });
  }
});

app.get('/api/notifications/announcements', (req, res) => {
  try {
    const announcements = [
      {
        id: 'ann_1',
        title: 'Midterm Exam Schedule',
        content: 'Midterm exams will be held from March 15-20. Please check your schedule.',
        priority: 'high',
        createdAt: new Date().toISOString()
      },
      {
        id: 'ann_2',
        title: 'Library Hours Extended',
        content: 'The library will be open 24/7 during exam period.',
        priority: 'medium',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];

    res.status(200).json({
      success: true,
      message: 'Announcements retrieved successfully',
      data: { announcements }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get announcements',
      error: config.server.nodeEnv === 'development' ? error.message : undefined
    });
  }
});

// Attendance API endpoints
app.get('/api/attendance/records', (req, res) => {
  try {
    const records = [
      {
        id: 'att_1',
        courseId: 'CS101',
        courseName: 'Introduction to Computer Science',
        date: '2024-10-10',
        status: 'present',
        time: '09:00'
      },
      {
        id: 'att_2',
        courseId: 'CS201',
        courseName: 'Data Structures and Algorithms',
        date: '2024-10-11',
        status: 'present',
        time: '10:30'
      },
      {
        id: 'att_3',
        courseId: 'CS301',
        courseName: 'Database Systems',
        date: '2024-10-12',
        status: 'absent',
        time: '12:00'
      }
    ];

    res.status(200).json({
      success: true,
      message: 'Attendance records retrieved successfully',
      data: { records }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance records',
      error: config.server.nodeEnv === 'development' ? error.message : undefined
    });
  }
});

app.get('/api/attendance/stats', (req, res) => {
  try {
    const stats = {
      totalClasses: 45,
      attended: 42,
      absent: 3,
      attendanceRate: 93.3,
      byCourse: {
        'CS101': { attended: 15, total: 15, rate: 100 },
        'CS201': { attended: 14, total: 15, rate: 93.3 },
        'CS301': { attended: 13, total: 15, rate: 86.7 }
      }
    };

    res.status(200).json({
      success: true,
      message: 'Attendance statistics retrieved successfully',
      data: { stats }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance statistics',
      error: config.server.nodeEnv === 'development' ? error.message : undefined
    });
  }
});

app.get('/api/attendance/courses', (req, res) => {
  try {
    const courses = [
      {
        id: 'CS101',
        name: 'Introduction to Computer Science',
        professor: 'Dr. Ahmed El-Sayed',
        schedule: 'Mon, Wed, Fri 09:00-10:30',
        attendanceRate: 100,
        lastClass: '2024-10-12'
      },
      {
        id: 'CS201',
        name: 'Data Structures and Algorithms',
        professor: 'Dr. Ahmed El-Sayed',
        schedule: 'Tue, Thu 10:30-12:00',
        attendanceRate: 93.3,
        lastClass: '2024-10-11'
      },
      {
        id: 'CS301',
        name: 'Database Systems',
        professor: 'Dr. Mona Ibrahim',
        schedule: 'Mon, Wed 12:00-13:30',
        attendanceRate: 86.7,
        lastClass: '2024-10-10'
      }
    ];

    res.status(200).json({
      success: true,
      message: 'Course attendance retrieved successfully',
      data: { courses }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get course attendance',
      error: config.server.nodeEnv === 'development' ? error.message : undefined
    });
  }
});

// Schedule API endpoints
app.get('/api/schedule/today', (req, res) => {
  try {
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });

    const schedule = [
      {
        id: 'sched_1',
        courseId: 'CS101',
        courseName: 'Introduction to Computer Science',
        professor: 'Dr. Ahmed El-Sayed',
        time: '09:00-10:30',
        room: 'A101',
        type: 'lecture'
      },
      {
        id: 'sched_2',
        courseId: 'CS301',
        courseName: 'Database Systems',
        professor: 'Dr. Mona Ibrahim',
        time: '12:00-13:30',
        room: 'B101',
        type: 'lecture'
      }
    ];

    res.status(200).json({
      success: true,
      message: 'Today\'s schedule retrieved successfully',
      data: {
        date: today.toISOString().split('T')[0],
        dayOfWeek,
        schedule
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get today\'s schedule',
      error: config.server.nodeEnv === 'development' ? error.message : undefined
    });
  }
});

// User API endpoints
app.get('/api/users/student/stats', (req, res) => {
  try {
    const stats = {
      totalCourses: 4,
      completedAssignments: 12,
      pendingAssignments: 3,
      gpa: 3.8,
      attendanceRate: 93.3,
      upcomingExams: 2,
      recentActivity: [
        {
          type: 'assignment_submitted',
          course: 'CS101',
          description: 'Submitted Assignment 3',
          date: new Date().toISOString()
        },
        {
          type: 'class_attended',
          course: 'CS201',
          description: 'Attended Data Structures class',
          date: new Date(Date.now() - 3600000).toISOString()
        }
      ]
    };

    res.status(200).json({
      success: true,
      message: 'Student statistics retrieved successfully',
      data: { stats }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get student statistics',
      error: config.server.nodeEnv === 'development' ? error.message : undefined
    });
  }
});

// API Routes
app.use('/api', chatRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv,
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Smart Campus Assistant API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      chat: '/api',
      health: '/health'
    },
    features: {
      authentication: 'JWT-based authentication system',
      chat: 'AI-powered chatbot',
      cors: 'Configured CORS support',
      security: 'Security headers and rate limiting'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(config.server.nodeEnv === 'development' && { stack: error.stack })
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Smart Campus Assistant API server listening on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${config.server.nodeEnv}`);
  console.log(`🔐 JWT Secret configured: ${config.jwt.secret ? 'Yes' : 'No'}`);
  console.log(`🌐 CORS Origins: ${config.cors.allowedOrigins.join(', ')}`);
  console.log(`🔌 WebSocket server initialized`);
  console.log(`📝 Available endpoints:`);
  console.log(`   - Authentication: http://localhost:${PORT}/api/auth`);
  console.log(`   - Notifications: http://localhost:${PORT}/api/notifications`);
  console.log(`   - Attendance: http://localhost:${PORT}/api/attendance`);
  console.log(`   - Schedule: http://localhost:${PORT}/api/schedule`);
  console.log(`   - Users: http://localhost:${PORT}/api/users`);
  console.log(`   - Health Check: http://localhost:${PORT}/health`);
  console.log(`   - Chat API: http://localhost:${PORT}/api`);
  console.log(`   - WebSocket: ws://localhost:${PORT}`);
  console.log(`\n🧪 Test the authentication system:`);
  console.log(`   curl http://localhost:${PORT}/api/auth/health`);
  console.log(`   curl -X POST http://localhost:${PORT}/api/auth/login -H "Content-Type: application/json" -d '{"universityId":"20221245","password":"123456"}'`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default app;
