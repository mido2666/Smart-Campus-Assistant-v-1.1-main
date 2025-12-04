import { Request, Response } from 'express';
import UserService, { 
  UpdateProfileRequest, 
  ChangePasswordRequest, 
  AvatarUploadRequest,
  SearchUsersRequest 
} from '../services/user.service.js';
import { AuthenticatedRequest } from './auth.controller.js';

/**
 * User Controller
 * Handles HTTP requests for user management operations
 */
export class UserController {
  /**
   * Get user profile
   * GET /api/users/profile
   */
  static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const user = await UserService.getUserProfile(req.user.id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User profile not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: { user }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get profile',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Update user profile
   * PUT /api/users/profile
   */
  static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const updateData: UpdateProfileRequest = {
        userId: req.user.id,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        universityId: req.body.universityId,
        phone: req.body.phone,
        bio: req.body.bio,
        department: req.body.department,
        year: req.body.year,
        major: req.body.major
      };

      const updatedUser = await UserService.updateProfile(updateData);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: updatedUser }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update profile',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Change user password
   * POST /api/users/change-password
   */
  static async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
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

      await UserService.changePassword(changePasswordData);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to change password',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Upload user avatar
   * POST /api/users/upload-avatar
   */
  static async uploadAvatar(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'Avatar file is required'
        });
        return;
      }

      const avatarData: AvatarUploadRequest = {
        userId: req.user.id,
        file: req.file
      };

      const updatedUser = await UserService.uploadAvatar(avatarData);

      res.status(200).json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: { 
          user: updatedUser,
          avatarUrl: updatedUser.avatarUrl
        }
      });
    } catch (error) {
      console.error('Upload avatar error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to upload avatar',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Delete user avatar
   * DELETE /api/users/avatar
   */
  static async deleteAvatar(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const updatedUser = await UserService.deleteAvatar(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Avatar deleted successfully',
        data: { user: updatedUser }
      });
    } catch (error) {
      console.error('Delete avatar error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete avatar',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Get user by ID (admin only)
   * GET /api/users/:userId
   */
  static async getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Check if user is admin or accessing their own profile
      if (req.user.role !== 'admin' && req.user.id !== req.params.userId) {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      const user = await UserService.getUserProfile(req.params.userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: { user }
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get user',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Search users (admin only)
   * GET /api/users/search
   */
  static async searchUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      if (req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
        return;
      }

      const searchData: SearchUsersRequest = {
        query: req.query.query as string,
        role: req.query.role as 'STUDENT' | 'PROFESSOR' | 'ADMIN',
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10
      };

      const result = await UserService.searchUsers(searchData);

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to search users',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Get all users (admin only)
   * GET /api/users
   */
  static async getAllUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      if (req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
        return;
      }

      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const result = await UserService.getAllUsers(page, limit);

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get users',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Get user statistics (admin only)
   * GET /api/users/stats
   */
  static async getUserStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      if (req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
        return;
      }

      const stats = await UserService.getUserStats();

      res.status(200).json({
        success: true,
        message: 'User statistics retrieved successfully',
        data: { stats }
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get user statistics',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Deactivate user (admin only)
   * PUT /api/users/:userId/deactivate
   */
  static async deactivateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      if (req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
        return;
      }

      await UserService.deactivateUser(req.params.userId);

      res.status(200).json({
        success: true,
        message: 'User deactivated successfully'
      });
    } catch (error) {
      console.error('Deactivate user error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to deactivate user',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Activate user (admin only)
   * PUT /api/users/:userId/activate
   */
  static async activateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      if (req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
        return;
      }

      await UserService.activateUser(req.params.userId);

      res.status(200).json({
        success: true,
        message: 'User activated successfully'
      });
    } catch (error) {
      console.error('Activate user error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to activate user',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Delete user (admin only)
   * DELETE /api/users/:userId
   */
  static async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      if (req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
        return;
      }

      // Prevent admin from deleting themselves
      if (req.user.id === req.params.userId) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete your own account'
        });
        return;
      }

      await UserService.deleteUser(req.params.userId);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete user',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Get student statistics for dashboard
   * GET /api/users/student/stats
   */
  static async getStudentStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Only allow students to access their own stats
      // Check both lowercase and uppercase (database stores uppercase, JWT might have lowercase)
      const userRole = req.user.role.toLowerCase();
      if (userRole !== 'student') {
        console.log('[getStudentStats] Access denied - role:', req.user.role, 'normalized:', userRole);
        res.status(403).json({
          success: false,
          message: 'Access denied. Student role required.'
        });
        return;
      }

      const stats = await UserService.getStudentStats(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Student statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      console.error('Get student stats error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get student statistics',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Health check endpoint
   * GET /api/users/health
   */
  static async healthCheck(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      message: 'User management service is healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  }
}

export default UserController;
