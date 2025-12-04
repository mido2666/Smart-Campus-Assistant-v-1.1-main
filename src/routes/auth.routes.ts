import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication management
 */
import AuthMiddleware from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import {
  registerValidator,
  loginValidator,
  changePasswordValidator
} from '../middleware/validators/auth.validator.js';

// Create router instance
const authRouter = Router();

// Apply CORS middleware to all auth routes
authRouter.use(AuthMiddleware.corsOptions());

// Apply request logging middleware
authRouter.use(AuthMiddleware.requestLogger());

/**
 * Public Authentication Routes
 * These routes don't require authentication
 */

// Health check endpoint
authRouter.get('/health', AuthController.healthCheck);

// User registration
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - universityId
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               universityId:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [student, professor, admin]
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 */
const registerRateLimit = process.env.NODE_ENV === 'development'
  ? AuthMiddleware.rateLimit(20, 15 * 60 * 1000) // 20 attempts per 15 minutes in dev
  : AuthMiddleware.rateLimit(10, 15 * 60 * 1000); // 10 attempts per 15 minutes in prod

authRouter.post(
  '/register',
  registerRateLimit,
  registerValidator,
  validate,
  AuthController.register
);

// User login
// In development, rate limit is more lenient (10 attempts per 15 minutes)
// In production, it's stricter (5 attempts per 15 minutes)
const loginRateLimit = process.env.NODE_ENV === 'development'
  ? AuthMiddleware.rateLimit(10, 15 * 60 * 1000) // 10 attempts per 15 minutes in dev
  : AuthMiddleware.rateLimit(5, 15 * 60 * 1000); // 5 attempts per 15 minutes in prod

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - universityId
 *               - password
 *             properties:
 *               universityId:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
authRouter.post(
  '/login',
  loginRateLimit,
  loginValidator,
  validate,
  AuthController.login
);

// Token refresh
authRouter.post('/refresh', AuthController.refreshToken);

// Rate limit reset endpoint (development only)
if (process.env.NODE_ENV === 'development') {
  authRouter.post('/reset-rate-limit', (req, res) => {
    const { clientId } = req.body;
    AuthMiddleware.resetRateLimit(clientId);

    res.json({
      success: true,
      message: clientId
        ? `Rate limit reset for client: ${clientId}`
        : 'All rate limits reset',
      warning: 'This endpoint is only available in development mode'
    });
  });
}

// Token verification
authRouter.get('/verify', AuthController.verifyToken);

/**
 * Protected Authentication Routes
 * These routes require authentication
 */

// Logout (requires authentication)
authRouter.post(
  '/logout',
  AuthMiddleware.authenticate(),
  AuthController.logout
);

// Get current user profile
authRouter.get(
  '/me',
  AuthMiddleware.authenticate(),
  AuthController.getCurrentUser
);

// Update user profile
authRouter.put(
  '/profile',
  AuthMiddleware.authenticate(),
  AuthController.updateProfile
);

// Change password
authRouter.post(
  '/change-password',
  AuthMiddleware.authenticate(),
  changePasswordValidator,
  validate,
  AuthController.changePassword
);

/**
 * Role-based Protected Routes
 * These routes require specific roles
 */

// Admin-only routes
authRouter.get(
  '/admin/users',
  AuthMiddleware.authenticate(),
  AuthMiddleware.requireAdmin(),
  async (req, res) => {
    try {
      // This would typically fetch all users from database
      res.status(200).json({
        success: true,
        message: 'Admin users endpoint - implement user listing logic',
        data: { users: [] }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

// Professor or Admin routes
authRouter.get(
  '/professor/dashboard',
  AuthMiddleware.authenticate(),
  AuthMiddleware.requireProfessorOrAdmin(),
  async (req, res) => {
    try {
      res.status(200).json({
        success: true,
        message: 'Professor dashboard endpoint - implement dashboard logic',
        data: { dashboard: {} }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch professor dashboard',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

// Student routes
authRouter.get(
  '/student/dashboard',
  AuthMiddleware.authenticate(),
  AuthMiddleware.requireRole('student'),
  async (req, res) => {
    try {
      res.status(200).json({
        success: true,
        message: 'Student dashboard endpoint - implement dashboard logic',
        data: { dashboard: {} }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch student dashboard',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * Utility Routes
 * These routes provide additional functionality
 */

// Check if email is available
authRouter.get(
  '/check-email/:email',
  AuthMiddleware.rateLimit(10, 60 * 1000), // 10 attempts per minute
  async (req, res) => {
    try {
      const { email } = req.params;

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
        return;
      }

      // This would typically check database for email availability
      // For now, we'll return available
      res.status(200).json({
        success: true,
        message: 'Email availability checked',
        data: { available: true, email }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to check email availability',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

// Password strength checker
authRouter.post(
  '/check-password-strength',
  AuthMiddleware.rateLimit(20, 60 * 1000), // 20 attempts per minute
  async (req, res) => {
    try {
      const { password } = req.body;

      if (!password) {
        res.status(400).json({
          success: false,
          message: 'Password is required'
        });
        return;
      }

      // Basic password strength checking
      const strength = {
        length: password.length >= 8,
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasNumbers: /\d/.test(password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
      };

      const score = Object.values(strength).filter(Boolean).length;
      const strengthLevel = score < 2 ? 'weak' : score < 4 ? 'medium' : 'strong';

      res.status(200).json({
        success: true,
        message: 'Password strength analyzed',
        data: {
          strength: strengthLevel,
          score,
          checks: strength,
          recommendations: score < 4 ? [
            'Use at least 8 characters',
            'Include uppercase and lowercase letters',
            'Add numbers and special characters'
          ] : []
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to check password strength',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

// Session info endpoint
authRouter.get(
  '/session',
  AuthMiddleware.optionalAuth(),
  async (req, res) => {
    try {
      const { user } = req as any;

      res.status(200).json({
        success: true,
        message: 'Session information retrieved',
        data: {
          authenticated: !!user,
          user: user || null,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get session information',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * Error handling middleware for auth routes
 */
authRouter.use((error: any, req: any, res: any, next: any) => {
  console.error('Auth route error:', error);

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

/**
 * 404 handler for auth routes
 */
authRouter.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Authentication endpoint not found',
    path: req.originalUrl
  });
});

export default authRouter;
