import type { Request, Response, NextFunction } from 'express';
import { JWTUtils } from '../utils/jwt.js';
import type { JWTPayload } from '../utils/jwt.js';
import AuthService from '../services/auth.service.js';
import type { AuthenticatedRequest } from '../controllers/auth.controller.js';

// Role types
export type UserRole = 'student' | 'professor' | 'admin';

// Rate limit store - module-level Map to persist across requests
// In production, consider using Redis or similar for distributed systems
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Middleware options interface
export interface AuthMiddlewareOptions {
  requiredRoles?: UserRole[];
  allowExpiredToken?: boolean;
  skipVerification?: boolean;
}

/**
 * Authentication middleware to protect routes
 * Verifies JWT tokens and adds user information to request
 */
export class AuthMiddleware {
  /**
   * Main authentication middleware
   * Verifies JWT token and adds user to request object
   */
  static authenticate(options: AuthMiddlewareOptions = {}): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void> {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Skip authentication if specified
        if (options.skipVerification) {
          return next();
        }

        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          res.status(401).json({
            success: false,
            message: 'Access token is required',
            code: 'MISSING_TOKEN'
          });
          return;
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        let payload: JWTPayload;
        try {
          payload = JWTUtils.verifyAccessToken(token);
        } catch (error) {
          if (options.allowExpiredToken && error instanceof Error && error.message.includes('expired')) {
            // Allow expired tokens if specified
            payload = JWTUtils.decodeToken(token) as JWTPayload;
          } else {
            res.status(401).json({
              success: false,
              message: 'Invalid or expired token',
              code: 'INVALID_TOKEN'
            });
            return;
          }
        }

        // Get user from service
        const user = await AuthService.getUserById(payload.userId);
        if (!user) {
          res.status(401).json({
            success: false,
            message: 'User not found',
            code: 'USER_NOT_FOUND'
          });
          return;
        }

        // Note: User model doesn't have isActive field in current schema
        // All users are considered active by default
        // If you need to deactivate users, add isActive field to User model in schema.prisma

        // Add user to request object
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role
        };

        next();
      } catch (error) {
        console.error('Authentication middleware error:', error);
        res.status(500).json({
          success: false,
          message: 'Authentication failed',
          code: 'AUTH_ERROR',
          error: process.env.NODE_ENV === 'development' ? error : undefined
        });
      }
    };
  }

  /**
   * Role-based access control middleware
   * Checks if user has required role(s)
   */
  static requireRole(requiredRoles: UserRole | UserRole[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      try {
        if (!req.user) {
          res.status(401).json({
            success: false,
            message: 'Authentication required',
            code: 'AUTH_REQUIRED'
          });
          return;
        }

        const userRole = req.user.role;
        const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

        if (!roles.includes(userRole)) {
          res.status(403).json({
            success: false,
            message: 'Insufficient permissions',
            code: 'INSUFFICIENT_PERMISSIONS',
            required: roles,
            current: userRole
          });
          return;
        }

        next();
      } catch (error) {
        console.error('Role check middleware error:', error);
        res.status(500).json({
          success: false,
          message: 'Authorization check failed',
          code: 'AUTH_CHECK_ERROR',
          error: process.env.NODE_ENV === 'development' ? error : undefined
        });
      }
    };
  }

  /**
   * Admin-only middleware
   * Shortcut for requiring admin role
   */
  static requireAdmin(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void {
    return this.requireRole('admin');
  }

  /**
   * Professor or Admin middleware
   * Allows access to professors and admins
   */
  static requireProfessorOrAdmin(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void {
    return this.requireRole(['professor', 'admin']);
  }

  /**
   * Student or Professor or Admin middleware
   * Allows access to all authenticated users
   */
  static requireAnyRole(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void {
    return this.requireRole(['student', 'professor', 'admin']);
  }

  /**
   * Optional authentication middleware
   * Adds user to request if token is present, but doesn't require it
   */
  static optionalAuth(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void> {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return next();
        }

        const token = authHeader.substring(7);

        try {
          const payload = JWTUtils.verifyAccessToken(token);
          const user = await AuthService.getUserById(payload.userId);
          
          if (user && user.isActive) {
            req.user = {
              id: user.id,
              email: user.email,
              role: user.role
            };
          }
        } catch (error) {
          // Ignore token errors for optional auth
          console.log('Optional auth token error (ignored):', error);
        }

        next();
      } catch (error) {
        console.error('Optional authentication middleware error:', error);
        next(); // Continue even if there's an error
      }
    };
  }

  /**
   * Rate limiting middleware (basic implementation)
   * Prevents brute force attacks
   */
  static rateLimit(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction): void => {
      // In development mode, allow bypassing rate limit for testing
      const isDevelopment = process.env.NODE_ENV === 'development';
      const bypassRateLimit = req.headers['x-bypass-rate-limit'] === 'true' && isDevelopment;
      
      if (bypassRateLimit) {
        console.warn('⚠️ Rate limit bypassed (development mode only)');
        return next();
      }

      // Clean up old entries periodically (every 100 requests to avoid performance impact)
      if (Math.random() < 0.01) {
        const now = Date.now();
        for (const [key, value] of rateLimitStore.entries()) {
          if (now > value.resetTime) {
            rateLimitStore.delete(key);
          }
        }
      }

      const clientId = req.ip || req.connection.remoteAddress || 'unknown';
      const now = Date.now();
      const clientAttempts = rateLimitStore.get(clientId);

      if (!clientAttempts || now > clientAttempts.resetTime) {
        // Reset or create new attempt record
        rateLimitStore.set(clientId, {
          count: 1,
          resetTime: now + windowMs
        });
        return next();
      }

      if (clientAttempts.count >= maxAttempts) {
        const retryAfterSeconds = Math.ceil((clientAttempts.resetTime - now) / 1000);
        const retryAfterMinutes = Math.ceil(retryAfterSeconds / 60);
        
        res.status(429).json({
          success: false,
          message: `Too many login attempts. Please try again in ${retryAfterMinutes} minute${retryAfterMinutes !== 1 ? 's' : ''}.`,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: retryAfterSeconds,
          retryAfterMinutes: retryAfterMinutes,
          timestamp: new Date().toISOString()
        });
        return;
      }

      clientAttempts.count++;
      next();
    };
  }

  /**
   * Reset rate limit for a specific client (development only)
   * Useful for testing and debugging
   */
  static resetRateLimit(clientId?: string): void {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('Rate limit reset is only available in development mode');
      return;
    }
    
    if (clientId) {
      rateLimitStore.delete(clientId);
      console.log(`Rate limit reset for client: ${clientId} (development mode)`);
    } else {
      rateLimitStore.clear();
      console.log('All rate limits reset (development mode)');
    }
  }

  /**
   * CORS middleware for authentication endpoints
   */
  static corsOptions(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction): void => {
      const origin = req.headers.origin;
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'];

      if (origin && allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
      }

      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Access-Control-Allow-Credentials', 'true');

      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
      }

      next();
    };
  }

  /**
   * Request logging middleware
   */
  static requestLogger(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction): void => {
      const start = Date.now();
      const originalSend = res.send;

      res.send = function(data) {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
        return originalSend.call(this, data);
      };

      next();
    };
  }
}

export default AuthMiddleware;
