import { Router } from 'express';
import UserController from '../controllers/user.controller.js';
import {
  validateProfileUpdate,
  validatePasswordChange,
  validateAvatarUpload,
  validateUserId,
  validateRole,
  validateSearchQuery,
  handleValidationErrors
} from '../utils/validation.js';
import { uploadAvatar, handleUploadError } from '../middleware/upload.middleware.js';
import { AuthMiddleware } from '../middleware/auth.middleware.js';

/**
 * User Routes
 * Defines API endpoints for user management
 */
const router = Router();

// Apply authentication middleware to all routes
router.use(AuthMiddleware.authenticate());

// Profile management routes
router.get('/profile', UserController.getProfile);
router.put('/profile',
  ...validateProfileUpdate,
  handleValidationErrors,
  UserController.updateProfile
);

// Student dashboard routes
router.get('/student/stats', UserController.getStudentStats);

// Password management routes
router.post('/change-password',
  ...validatePasswordChange,
  handleValidationErrors,
  UserController.changePassword
);

// Avatar management routes
router.post('/upload-avatar',
  uploadAvatar,
  handleUploadError,
  ...validateAvatarUpload,
  UserController.uploadAvatar
);
router.delete('/avatar', UserController.deleteAvatar);

// User management routes (admin only)
router.get('/search',
  ...validateSearchQuery,
  handleValidationErrors,
  UserController.searchUsers
);
router.get('/', UserController.getAllUsers);
router.get('/stats', UserController.getUserStats);

// Individual user routes
router.get('/:userId',
  ...validateUserId,
  UserController.getUserById
);
router.put('/:userId/activate',
  ...validateUserId,
  UserController.activateUser
);
router.put('/:userId/deactivate',
  ...validateUserId,
  UserController.deactivateUser
);
router.delete('/:userId',
  ...validateUserId,
  UserController.deleteUser
);

// Health check route
router.get('/health', UserController.healthCheck);

export default router;
