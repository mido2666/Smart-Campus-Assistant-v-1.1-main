import { Request, Response } from 'express';
import { UserController } from '../src/controllers/user.controller';
import UserService from '../src/services/user.service';

// Mock the UserService
jest.mock('../src/services/user.service');
const MockedUserService = UserService as jest.Mocked<typeof UserService>;

describe('UserController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should get user profile successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: 'student' as const
      };

      const mockProfile = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'student',
        universityId: 'U123',
        phone: '1234567890',
        bio: 'Test bio',
        department: 'Computer Science',
        year: 2024,
        major: 'Software Engineering'
      };

      mockRequest.user = mockUser;
      MockedUserService.getUserProfile.mockResolvedValue(mockProfile);

      await UserController.getProfile(mockRequest as any, mockResponse as Response);

      expect(MockedUserService.getUserProfile).toHaveBeenCalledWith(mockUser.id);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile retrieved successfully',
        data: { user: mockProfile }
      });
    });

    it('should handle missing user', async () => {
      mockRequest.user = undefined;

      await UserController.getProfile(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
    });

    it('should handle profile not found', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: 'student' as const
      };

      mockRequest.user = mockUser;
      MockedUserService.getUserProfile.mockResolvedValue(null);

      await UserController.getProfile(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'User profile not found'
      });
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: 'student' as const
      };

      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        universityId: 'U456',
        phone: '0987654321',
        bio: 'Updated bio',
        department: 'Mathematics',
        year: 2025,
        major: 'Data Science'
      };

      const updatedProfile = {
        id: '1',
        ...updateData,
        role: 'student'
      };

      mockRequest.user = mockUser;
      mockRequest.body = updateData;
      MockedUserService.updateProfile.mockResolvedValue(updatedProfile);

      await UserController.updateProfile(mockRequest as any, mockResponse as Response);

      expect(MockedUserService.updateProfile).toHaveBeenCalledWith({
        userId: mockUser.id,
        ...updateData
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile updated successfully',
        data: { user: updatedProfile }
      });
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: 'student' as const
      };

      const passwordData = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword'
      };

      mockRequest.user = mockUser;
      mockRequest.body = passwordData;
      MockedUserService.changePassword.mockResolvedValue(undefined);

      await UserController.changePassword(mockRequest as any, mockResponse as Response);

      expect(MockedUserService.changePassword).toHaveBeenCalledWith({
        userId: mockUser.id,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password changed successfully'
      });
    });
  });

  describe('uploadAvatar', () => {
    it('should upload avatar successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: 'student' as const
      };

      const mockFile = {
        fieldname: 'avatar',
        originalname: 'avatar.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('mock-file-data')
      };

      const updatedUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'student',
        avatarUrl: '/uploads/avatar-123.jpg'
      };

      mockRequest.user = mockUser;
      mockRequest.file = mockFile as any;
      MockedUserService.uploadAvatar.mockResolvedValue(updatedUser);

      await UserController.uploadAvatar(mockRequest as any, mockResponse as Response);

      expect(MockedUserService.uploadAvatar).toHaveBeenCalledWith({
        userId: mockUser.id,
        file: mockFile
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          user: updatedUser,
          avatarUrl: updatedUser.avatarUrl
        }
      });
    });

    it('should handle missing file', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: 'student' as const
      };

      mockRequest.user = mockUser;
      mockRequest.file = undefined;

      await UserController.uploadAvatar(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Avatar file is required'
      });
    });
  });

  describe('deleteAvatar', () => {
    it('should delete avatar successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: 'student' as const
      };

      const updatedUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'student',
        avatarUrl: null
      };

      mockRequest.user = mockUser;
      MockedUserService.deleteAvatar.mockResolvedValue(updatedUser);

      await UserController.deleteAvatar(mockRequest as any, mockResponse as Response);

      expect(MockedUserService.deleteAvatar).toHaveBeenCalledWith(mockUser.id);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Avatar deleted successfully',
        data: { user: updatedUser }
      });
    });
  });

  describe('getUserById', () => {
    it('should get user by ID successfully (admin)', async () => {
      const mockAdmin = {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'admin' as const
      };

      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'student'
      };

      mockRequest.user = mockAdmin;
      mockRequest.params = { userId: '1' };
      MockedUserService.getUserProfile.mockResolvedValue(mockUser);

      await UserController.getUserById(mockRequest as any, mockResponse as Response);

      expect(MockedUserService.getUserProfile).toHaveBeenCalledWith('1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'User retrieved successfully',
        data: { user: mockUser }
      });
    });

    it('should allow user to access their own profile', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: 'student' as const
      };

      const mockProfile = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'student'
      };

      mockRequest.user = mockUser;
      mockRequest.params = { userId: '1' };
      MockedUserService.getUserProfile.mockResolvedValue(mockProfile);

      await UserController.getUserById(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should deny access to other users profile', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: 'student' as const
      };

      mockRequest.user = mockUser;
      mockRequest.params = { userId: '2' };

      await UserController.getUserById(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied'
      });
    });
  });

  describe('searchUsers', () => {
    it('should search users successfully (admin only)', async () => {
      const mockAdmin = {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'admin' as const
      };

      const searchResult = {
        users: [
          {
            id: '1',
            email: 'student1@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'student'
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1
        }
      };

      mockRequest.user = mockAdmin;
      mockRequest.query = {
        query: 'john',
        role: 'student',
        page: '1',
        limit: '10'
      };
      MockedUserService.searchUsers.mockResolvedValue(searchResult);

      await UserController.searchUsers(mockRequest as any, mockResponse as Response);

      expect(MockedUserService.searchUsers).toHaveBeenCalledWith({
        query: 'john',
        role: 'student',
        page: 1,
        limit: 10
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Users retrieved successfully',
        data: searchResult
      });
    });

    it('should deny access to non-admin users', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: 'student' as const
      };

      mockRequest.user = mockUser;
      mockRequest.query = { query: 'john' };

      await UserController.searchUsers(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Admin access required'
      });
    });
  });

  describe('getAllUsers', () => {
    it('should get all users successfully (admin only)', async () => {
      const mockAdmin = {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'admin' as const
      };

      const usersResult = {
        users: [
          {
            id: '1',
            email: 'student1@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'student'
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1
        }
      };

      mockRequest.user = mockAdmin;
      mockRequest.query = { page: '1', limit: '10' };
      MockedUserService.getAllUsers.mockResolvedValue(usersResult);

      await UserController.getAllUsers(mockRequest as any, mockResponse as Response);

      expect(MockedUserService.getAllUsers).toHaveBeenCalledWith(1, 10);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getUserStats', () => {
    it('should get user statistics successfully (admin only)', async () => {
      const mockAdmin = {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'admin' as const
      };

      const stats = {
        totalUsers: 100,
        students: 80,
        professors: 15,
        admins: 5,
        activeUsers: 95,
        inactiveUsers: 5
      };

      mockRequest.user = mockAdmin;
      MockedUserService.getUserStats.mockResolvedValue(stats);

      await UserController.getUserStats(mockRequest as any, mockResponse as Response);

      expect(MockedUserService.getUserStats).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'User statistics retrieved successfully',
        data: { stats }
      });
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully (admin only)', async () => {
      const mockAdmin = {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'admin' as const
      };

      mockRequest.user = mockAdmin;
      mockRequest.params = { userId: '1' };
      MockedUserService.deactivateUser.mockResolvedValue(undefined);

      await UserController.deactivateUser(mockRequest as any, mockResponse as Response);

      expect(MockedUserService.deactivateUser).toHaveBeenCalledWith('1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'User deactivated successfully'
      });
    });
  });

  describe('activateUser', () => {
    it('should activate user successfully (admin only)', async () => {
      const mockAdmin = {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'admin' as const
      };

      mockRequest.user = mockAdmin;
      mockRequest.params = { userId: '1' };
      MockedUserService.activateUser.mockResolvedValue(undefined);

      await UserController.activateUser(mockRequest as any, mockResponse as Response);

      expect(MockedUserService.activateUser).toHaveBeenCalledWith('1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'User activated successfully'
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully (admin only)', async () => {
      const mockAdmin = {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'admin' as const
      };

      mockRequest.user = mockAdmin;
      mockRequest.params = { userId: '1' };
      MockedUserService.deleteUser.mockResolvedValue(undefined);

      await UserController.deleteUser(mockRequest as any, mockResponse as Response);

      expect(MockedUserService.deleteUser).toHaveBeenCalledWith('1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'User deleted successfully'
      });
    });

    it('should prevent admin from deleting themselves', async () => {
      const mockAdmin = {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'admin' as const
      };

      mockRequest.user = mockAdmin;
      mockRequest.params = { userId: 'admin-1' };

      await UserController.deleteUser(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cannot delete your own account'
      });
    });
  });

  describe('healthCheck', () => {
    it('should return health status', async () => {
      await UserController.healthCheck(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'User management service is healthy',
        timestamp: expect.any(String),
        version: '1.0.0'
      });
    });
  });
});
