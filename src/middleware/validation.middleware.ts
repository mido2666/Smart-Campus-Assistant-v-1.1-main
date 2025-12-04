import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Middleware to check for validation errors
 * If errors exist, responds with 400 and the error details
 */
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: (err as any).path || (err as any).param,
        message: err.msg,
        value: (err as any).value
      }))
    });
  }

  next();
};
