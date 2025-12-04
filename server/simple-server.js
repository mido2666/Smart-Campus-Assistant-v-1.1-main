import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Smart Campus Assistant API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth (coming soon)',
      users: '/api/users (coming soon)',
      courses: '/api/courses (coming soon)',
      schedule: '/api/schedule (coming soon)',
      attendance: '/api/attendance (coming soon)',
      notifications: '/api/notifications (coming soon)',
      chat: '/api/chat (coming soon)'
    },
    documentation: 'https://github.com/your-repo/docs'
  });
});

// Placeholder API routes
app.get('/api/auth/health', (req, res) => {
  res.json({ message: 'Auth service is running' });
});

app.get('/api/users/health', (req, res) => {
  res.json({ message: 'User service is running' });
});

app.get('/api/courses/health', (req, res) => {
  res.json({ message: 'Course service is running' });
});

app.get('/api/schedule/health', (req, res) => {
  res.json({ message: 'Schedule service is running' });
});

app.get('/api/attendance/health', (req, res) => {
  res.json({ message: 'Attendance service is running' });
});

app.get('/api/notifications/health', (req, res) => {
  res.json({ message: 'Notification service is running' });
});

app.get('/api/chat/health', (req, res) => {
  res.json({ message: 'Chat service is running' });
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
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Smart Campus Assistant API server listening on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📝 Available endpoints:`);
  console.log(`   - Health Check: http://localhost:${PORT}/health`);
  console.log(`   - API Status: http://localhost:${PORT}/`);
  console.log(`   - Auth Health: http://localhost:${PORT}/api/auth/health`);
  console.log(`   - User Health: http://localhost:${PORT}/api/users/health`);
  console.log(`   - Course Health: http://localhost:${PORT}/api/courses/health`);
  console.log(`   - Schedule Health: http://localhost:${PORT}/api/schedule/health`);
  console.log(`   - Attendance Health: http://localhost:${PORT}/api/attendance/health`);
  console.log(`   - Notification Health: http://localhost:${PORT}/api/notifications/health`);
  console.log(`   - Chat Health: http://localhost:${PORT}/api/chat/health`);
});

export default app;

