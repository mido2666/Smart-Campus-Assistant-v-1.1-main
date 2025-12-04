import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import chatRouter from './api/chat.js';
import prisma from '../config/database.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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

// Request logging middleware for debugging
app.use((req, res, next) => {
  if (req.path === '/api/auth/login') {
    console.log('Login request middleware:', {
      method: req.method,
      path: req.path,
      body: req.body,
      contentType: req.get('Content-Type')
    });
  }
  next();
});

app.use(morgan(config.server.nodeEnv === 'production' ? 'combined' : 'dev'));

// Security headers
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Health check endpoint
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

// User registration endpoint - creates new user in PostgreSQL
app.post('/api/register', async (req, res) => {
  try {
    const { name, universityId, email, password } = req.body;
    
    // Log the raw received data for debugging
    console.log('📥 Backend - Registration attempt - RAW DATA:', { 
      name, 
      universityId, 
      universityIdType: typeof universityId,
      universityIdLength: universityId?.length,
      universityIdValue: universityId,
      email 
    });
    
    // Validation
    if (!name || !universityId || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, University ID, email, and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate password length (minimum 6 characters)
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Validate universityId format
    if (!universityId) {
      return res.status(400).json({
        success: false,
        message: 'University ID is required'
      });
    }

    // Process universityId: convert to string and trim ONLY
    // CRITICAL: Do NOT modify the value in any other way - preserve exactly what user entered
    // The mask in frontend already handles formatting (digits only, max 8)
    let universityIdStr = String(universityId);
    const cleanUniversityId = universityIdStr.trim();
    
    // Ensure we don't accidentally modify the value - it should be preserved exactly
    if (universityIdStr !== String(universityId)) {
      console.warn('⚠️ Warning: University ID was modified during string conversion');
    }
    
    console.log('🔍 Backend - University ID processing steps:', {
      step1_original: universityId,
      step1_type: typeof universityId,
      step2_afterString: universityIdStr,
      step3_afterTrim: cleanUniversityId,
      step4_length: cleanUniversityId.length,
      step5_finalValue: cleanUniversityId
    });
    
    // Verify it's not empty
    if (cleanUniversityId.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'University ID cannot be empty'
      });
    }
    
    // Optional: Log warning if non-digits found (mask should prevent this)
    if (!/^\d+$/.test(cleanUniversityId)) {
      console.warn('⚠️ Backend Warning: University ID contains non-numeric characters:', cleanUniversityId);
      console.warn('⚠️ Expected only digits (0-9). This might indicate a problem with the mask.');
    } else {
      console.log('✅ Backend: University ID contains only digits:', cleanUniversityId);
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered. Please use a different email or login.'
      });
    }

    // Check if universityId already exists
    const existingUniversityId = await prisma.user.findUnique({
      where: { universityId: cleanUniversityId }
    });

    if (existingUniversityId) {
      return res.status(409).json({
        success: false,
        message: 'University ID already registered. Please use a different University ID or login.'
      });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Split name into firstName and lastName (for compatibility with existing schema)
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || name;
    const lastName = nameParts.slice(1).join(' ') || name;

    // Create user in database - store EXACT universityId (trimmed only, no other modifications)
    console.log('💾 Backend - FINAL VALUE BEFORE SAVING TO DATABASE:');
    console.log('   universityId:', cleanUniversityId);
    console.log('   universityId type:', typeof cleanUniversityId);
    console.log('   universityId length:', cleanUniversityId.length);
    console.log('   universityId value:', JSON.stringify(cleanUniversityId));
    
    const dataToSave = {
      name: name.trim(),
      universityId: cleanUniversityId, // ⚠️ Store EXACTLY this value - no modifications!
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      firstName,
      lastName,
      role: 'STUDENT'
    };
    
    console.log('💾 Backend - Data object to save:', JSON.stringify({
      ...dataToSave,
      password: '[HIDDEN]'
    }, null, 2));
    
    const user = await prisma.user.create({
      data: dataToSave,
      select: {
        id: true,
        name: true,
        email: true,
        firstName: true,
        lastName: true,
        universityId: true,
        role: true,
        createdAt: true
      }
    });

    console.log('✅ Backend - Registration successful for user:', user.email);
    console.log('✅ Backend - University ID RETRIEVED from database:', user.universityId);
    console.log('✅ Backend - University ID type from DB:', typeof user.universityId);
    console.log('✅ Backend - University ID length from DB:', user.universityId?.length);
    
    // Critical verification: Check if saved value matches intended value
    console.log('\n🔍 CRITICAL VERIFICATION:');
    console.log('   Value we intended to save:', JSON.stringify(cleanUniversityId));
    console.log('   Value actually saved in DB:', JSON.stringify(user.universityId));
    console.log('   Values are equal:', cleanUniversityId === user.universityId);
    console.log('   Values match (==):', cleanUniversityId == user.universityId);
    
    if (user.universityId !== cleanUniversityId) {
      console.error('\n❌ CRITICAL ERROR: University ID mismatch!');
      console.error('   ⚠️ INTENDED to save:', cleanUniversityId);
      console.error('   ⚠️ ACTUALLY saved:', user.universityId);
      console.error('   ⚠️ This indicates a problem in Prisma save operation!');
    } else {
      console.log('\n✅ VERIFICATION PASSED: Saved universityId matches intended value exactly!');
      console.log('   ✅ Value in database:', user.universityId);
    }

    res.status(201).json({
      success: true,
      message: 'Account created successfully! You can now login.',
      data: {
        user: {
          id: user.id,
          name: user.name || `${user.firstName} ${user.lastName}`,
          email: user.email,
          universityId: user.universityId,
          role: user.role,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle Prisma errors
    if (error.code === 'P2002') {
      // Unique constraint violation
      const field = error.meta?.target?.[0] || 'field';
      return res.status(409).json({
        success: false,
        message: `${field === 'email' ? 'Email' : 'University ID'} already exists. Please use a different ${field}.`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: config.server.nodeEnv === 'development' ? error.message : undefined
    });
  }
});

// User login endpoint - authenticates user with PostgreSQL
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login request received:', {
      body: { ...req.body, password: req.body.password ? '***' : undefined },
      method: req.method,
      url: req.url
    });
    
    const { universityId, password } = req.body;
    
    if (!universityId || !password) {
      return res.status(400).json({
        success: false,
        message: 'University ID and password are required'
      });
    }

    // Clean universityId before querying
    const cleanUniversityId = universityId.trim();
    
    // Find user by universityId only (no longer accepts email)
    const user = await prisma.user.findUnique({
      where: { universityId: cleanUniversityId }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid University ID or Password'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid University ID or Password'
      });
    }

    // Prepare user data for response (exclude password)
    const userData = {
      id: user.id.toString(),
      universityId: user.universityId,
      email: user.email,
      name: user.name || `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.toLowerCase(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };

    console.log('Login successful for user:', user.email);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        accessToken: 'mock-access-token', // In production, generate real JWT token
        refreshToken: 'mock-refresh-token', // In production, generate real refresh token
        expiresIn: 900
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed',
      error: config.server.nodeEnv === 'development' ? error.message : undefined,
      ...(config.server.nodeEnv === 'development' && { stack: error.stack })
    });
  }
});

// Get current user endpoint
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
    const now = new Date();
    const user = {
      id: 'user_1234567890_abc123',
      universityId: '20221245',
      email: '20221245@university.edu',
      role: 'student',
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
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

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Smart Campus Assistant API - Simple Auth Server',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      health: '/api/auth/health',
      chat: '/api/chat'
    },
    features: {
      authentication: 'Mock authentication system for testing',
      cors: 'Configured CORS support',
      security: 'Security headers',
      chatbot: 'AI chatbot endpoint'
    }
  });
});

// API Routes
// IMPORTANT: All API routes must be registered BEFORE 404 handler
app.use('/api/chat', chatRouter);

// 404 handler - MUST be last to catch unmatched routes
app.use('*', (req, res) => {
  // Skip 404 for OPTIONS requests (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler - must have 4 parameters for Express to recognize it
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  console.error('Error stack:', error.stack);
  console.error('Request URL:', req.url);
  console.error('Request method:', req.method);
  
  // Don't send response if it was already sent
  if (res.headersSent) {
    return next(error);
  }
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(config.server.nodeEnv === 'development' && { 
      stack: error.stack,
      url: req.url,
      method: req.method
    })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Smart Campus Assistant API server listening on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${config.server.nodeEnv}`);
  console.log(`🔐 JWT Secret configured: ${config.jwt.secret ? 'Yes' : 'No'}`);
  console.log(`🌐 CORS Origins: ${config.cors.allowedOrigins.join(', ')}`);
  console.log(`📝 Available endpoints:`);
  console.log(`   - Authentication: http://localhost:${PORT}/api/auth`);
  console.log(`   - Health Check: http://localhost:${PORT}/api/auth/health`);
  console.log(`   - Chat: http://localhost:${PORT}/api/chat`);
  console.log(`\n🧪 Test the authentication system:`);
  console.log(`   curl http://localhost:${PORT}/api/auth/health`);
  console.log(`   curl -X POST http://localhost:${PORT}/api/auth/register -H "Content-Type: application/json" -d '{"universityId":"20221245","email":"test@test.com","password":"123456","role":"student","firstName":"Test","lastName":"User"}'`);
  console.log(`   curl -X POST http://localhost:${PORT}/api/auth/login -H "Content-Type: application/json" -d '{"universityId":"20221245","password":"123456"}'`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

export default app;
