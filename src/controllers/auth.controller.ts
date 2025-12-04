import type { Request, Response } from 'express';
import AuthService from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  ChangePasswordRequest
} from '../services/auth.service.js';

// Extended Request interface to include user data
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'student' | 'professor' | 'admin';
  };
}

/**
 * Authentication Controller
 * Handles HTTP requests for authentication operations
 */
export class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  static register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const registerData: RegisterRequest = {
      universityId: req.body.universityId,
      email: req.body.email,
      password: req.body.password,
      role: 'student', // Force student role for public registration
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      name: req.body.name,
      major: req.body.major,
      level: req.body.level
    };

    const result = await AuthService.register(registerData);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  });

  /**
   * Login user
   * POST /api/auth/login
   */
  static login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const loginData: LoginRequest = {
      universityId: req.body.universityId,
      password: req.body.password
    };

    try {
      const result = await AuthService.login(loginData);

      // Set refresh token as HTTP-only cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn
        }
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid university ID or password') {
        res.status(401).json({
          success: false,
          message: 'Invalid university ID or password'
        });
        return;
      }
      throw error;
    }
  });

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  static refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      });
      return;
    }

    const refreshData: RefreshTokenRequest = { refreshToken };
    try {
      const result = await AuthService.refreshToken(refreshData);

      // Set new refresh token as HTTP-only cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          expiresIn: result.expiresIn
        }
      });
    } catch (error: any) {
      if (
        error.message === 'Invalid refresh token' ||
        error.message === 'Refresh token expired' ||
        error.message === 'Token version mismatch' ||
        error.message.includes('verification failed')
      ) {
        res.status(401).json({
          success: false,
          message: error.message
        });
        return;
      }
      throw error;
    }
  });

  /**
   * Logout user
   * POST /api/auth/logout
   */
  static logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (refreshToken) {
      await AuthService.logout(refreshToken);
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  });

  /**
   * Change user password
   * POST /api/auth/change-password
   */
  static changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const changePasswordData: ChangePasswordRequest = {
      userId: req.user.id,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword
    };

    await AuthService.changePassword(changePasswordData);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  });

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  static getCurrentUser = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const user = await AuthService.getUserById(req.user.id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: { user }
    });
  });

  /**
   * Update user profile
   * PUT /api/auth/profile
   */
  static updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // This would typically update user profile in database
    // For now, we'll return a success message
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: req.user
      }
    });
  });

  /**
   * Verify token endpoint
   * GET /api/auth/verify
   */
  static verifyToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token is required'
      });
      return;
    }

    const user = await AuthService.verifyAccessToken(token);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: { user }
    });
  });

  /**
   * Health check endpoint
   * GET /api/auth/health
   */
  static async healthCheck(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      message: 'Authentication service is healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  }
}

export default AuthController;
