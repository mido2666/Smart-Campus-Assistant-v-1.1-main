import { body } from 'express-validator';

export const registerValidator = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2 }).withMessage('First name must be at least 2 characters long'),

  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2 }).withMessage('Last name must be at least 2 characters long'),

  body('universityId')
    .trim()
    .notEmpty().withMessage('University ID is required')
    .isLength({ min: 5 }).withMessage('University ID must be at least 5 characters long'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),

  body('role')
    .optional()
    .isIn(['student', 'professor', 'admin']).withMessage('Invalid role')
];

export const loginValidator = [
  body('universityId')
    .trim()
    .notEmpty().withMessage('University ID is required'),

  body('password')
    .notEmpty().withMessage('Password is required')
];

export const changePasswordValidator = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),

  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    })
];
