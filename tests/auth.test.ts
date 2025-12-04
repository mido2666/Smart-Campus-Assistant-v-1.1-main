import { Request, Response } from 'express';
import { AuthController } from '../src/controllers/auth.controller';
import AuthService from '../src/services/auth.service';

// Mock the AuthService
jest.mock('../src/services/auth.service');
const MockedAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe('AuthController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'student',
        firstName: 'John',
        lastName: 'Doe'
      };

      const mockResult = {
        user: {
          id: '1',
          email: userData.email,
          role: userData.role,
          firstName: userData.firstName,
          lastName: userData.lastName
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600
      };

      MockedAuthService.register.mockResolvedValue(mockResult);
      mockRequest.body = userData;

      await AuthController.register(mockRequest as Request, mockResponse as Response);

      expect(MockedAuthService.register).toHaveBeenCalledWith(userData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'User registered successfully',
        data: mockResult
      });
    });

    it('should handle registration errors', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'student',
        firstName: 'John',
        lastName: 'Doe'
      };

      const error = new Error('Email already exists');
      MockedAuthService.register.mockRejectedValue(error);
      mockRequest.body = userData;

      await AuthController.register(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email already exists',
        error: error
      });
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockResult = {
        user: {
          id: '1',
          email: loginData.email,
          role: 'student'
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600
      };

      MockedAuthService.login.mockResolvedValue(mockResult);
      mockRequest.body = loginData;

      await AuthController.login(mockRequest as Request, mockResponse as Response);

      expect(MockedAuthService.login).toHaveBeenCalledWith(loginData);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        mockResult.refreshToken,
        expect.objectContaining({
          httpOnly: true,
          secure: false, // NODE_ENV is 'test'
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: {
          user: mockResult.user,
          accessToken: mockResult.accessToken,
          expiresIn: mockResult.expiresIn
        }
      });
    });

    it('should handle login errors', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const error = new Error('Invalid credentials');
      MockedAuthService.login.mockRejectedValue(error);
      mockRequest.body = loginData;

      await AuthController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid credentials',
        error: error
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshToken = 'mock-refresh-token';
      const mockResult = {
        user: {
          id: '1',
          email: 'test@example.com',
          role: 'student'
        },
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600
      };

      MockedAuthService.refreshToken.mockResolvedValue(mockResult);
      mockRequest.cookies = { refreshToken };

      await AuthController.refreshToken(mockRequest as Request, mockResponse as Response);

      expect(MockedAuthService.refreshToken).toHaveBeenCalledWith({ refreshToken });
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        mockResult.refreshToken,
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle missing refresh token', async () => {
      mockRequest.cookies = {};

      await AuthController.refreshToken(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Refresh token is required'
      });
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const refreshToken = 'mock-refresh-token';
      mockRequest.cookies = { refreshToken };

      MockedAuthService.logout.mockResolvedValue(undefined);

      await AuthController.logout(mockRequest as Request, mockResponse as Response);

      expect(MockedAuthService.logout).toHaveBeenCalledWith(refreshToken);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logout successful'
      });
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const changePasswordData = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword'
      };

      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: 'student' as const
      };

      mockRequest.user = mockUser;
      mockRequest.body = changePasswordData;

      MockedAuthService.changePassword.mockResolvedValue(undefined);

      await AuthController.changePassword(mockRequest as any, mockResponse as Response);

      expect(MockedAuthService.changePassword).toHaveBeenCalledWith({
        userId: mockUser.id,
        currentPassword: changePasswordData.currentPassword,
        newPassword: changePasswordData.newPassword
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password changed successfully'
      });
    });

    it('should handle missing user', async () => {
      mockRequest.user = undefined;
      mockRequest.body = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword'
      };

      await AuthController.changePassword(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: 'student' as const
      };

      const mockUserProfile = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'student'
      };

      mockRequest.user = mockUser;
      MockedAuthService.getUserById.mockResolvedValue(mockUserProfile);

      await AuthController.getCurrentUser(mockRequest as any, mockResponse as Response);

      expect(MockedAuthService.getUserById).toHaveBeenCalledWith(mockUser.id);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'User profile retrieved successfully',
        data: { user: mockUserProfile }
      });
    });

    it('should handle user not found', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: 'student' as const
      };

      mockRequest.user = mockUser;
      MockedAuthService.getUserById.mockResolvedValue(null);

      await AuthController.getCurrentUser(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });
  });

  describe('verifyToken', () => {
    it('should verify token successfully', async () => {
      const token = 'valid-token';
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: 'student'
      };

      mockRequest.headers = { authorization: `Bearer ${token}` };
      MockedAuthService.verifyAccessToken.mockResolvedValue(mockUser);

      await AuthController.verifyToken(mockRequest as Request, mockResponse as Response);

      expect(MockedAuthService.verifyAccessToken).toHaveBeenCalledWith(token);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Token is valid',
        data: { user: mockUser }
      });
    });

    it('should handle missing token', async () => {
      mockRequest.headers = {};

      await AuthController.verifyToken(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token is required'
      });
    });
  });

  describe('healthCheck', () => {
    it('should return health status', async () => {
      await AuthController.healthCheck(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Authentication service is healthy',
        timestamp: expect.any(String),
        version: '1.0.0'
      });
    });
  });
});
