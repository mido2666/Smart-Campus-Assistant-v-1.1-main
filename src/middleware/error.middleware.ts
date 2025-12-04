import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorType } from '../utils/errorHandler';
import logger from '../utils/logger';

// Error response interface
interface ErrorResponse {
  success: false;
  message: string;
  code: string;
  timestamp: string;
  path: string;
  method: string;
  details?: any;
  stack?: string;
}

// Custom error class for API errors
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_SERVER_ERROR',
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error factory functions
export const createApiError = {
  badRequest: (message: string, details?: any) =>
    new ApiError(message, 400, 'BAD_REQUEST', true, details),

  unauthorized: (message: string = 'Unauthorized', details?: any) =>
    new ApiError(message, 401, 'UNAUTHORIZED', true, details),

  forbidden: (message: string = 'Forbidden', details?: any) =>
    new ApiError(message, 403, 'FORBIDDEN', true, details),

  notFound: (message: string = 'Resource not found', details?: any) =>
    new ApiError(message, 404, 'NOT_FOUND', true, details),

  conflict: (message: string, details?: any) =>
    new ApiError(message, 409, 'CONFLICT', true, details),

  validation: (message: string, details?: any) =>
    new ApiError(message, 422, 'VALIDATION_ERROR', true, details),

  tooManyRequests: (message: string = 'Too many requests', details?: any) =>
    new ApiError(message, 429, 'TOO_MANY_REQUESTS', true, details),

  internal: (message: string = 'Internal server error', details?: any) =>
    new ApiError(message, 500, 'INTERNAL_SERVER_ERROR', false, details),

  serviceUnavailable: (message: string = 'Service unavailable', details?: any) =>
    new ApiError(message, 503, 'SERVICE_UNAVAILABLE', false, details)
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Error logging utility
const logError = (error: Error, req: Request) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    userId: (req as any).user?.id,
    body: req.body,
    query: req.query,
    params: req.params
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    logger.error('Error Details:', errorInfo);
  }

  // In production, you would log to a proper logging service
  // e.g., Winston, Bunyan, or external service like Sentry
  if (process.env.NODE_ENV === 'production') {
    // Note: Currently using console logging
    // Future: Integrate Winston/Bunyan or Sentry for structured logging
    // See BACKLOG.md for details
    logger.error('Production Error:', {
      message: error.message,
      code: error instanceof ApiError ? error.code : 'UNKNOWN',
      statusCode: error instanceof ApiError ? error.statusCode : 500,
      timestamp: errorInfo.timestamp,
      userId: errorInfo.userId
    });
  }
};

// Main error handling middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error
  logError(error, req);

  // Default error response
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'Internal server error';
  let details: any = undefined;

  // Handle different error types
  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.details;
  } else if (error instanceof AppError) {
    // Convert AppError to appropriate HTTP status
    switch (error.type) {
      case ErrorType.VALIDATION:
        statusCode = 422;
        code = 'VALIDATION_ERROR';
        break;
      case ErrorType.AUTHENTICATION:
        statusCode = 401;
        code = 'AUTHENTICATION_ERROR';
        break;
      case ErrorType.AUTHORIZATION:
        statusCode = 403;
        code = 'AUTHORIZATION_ERROR';
        break;
      case ErrorType.NOT_FOUND:
        statusCode = 404;
        code = 'NOT_FOUND_ERROR';
        break;
      case ErrorType.NETWORK:
        statusCode = 503;
        code = 'NETWORK_ERROR';
        break;
      case ErrorType.SERVER:
        statusCode = 500;
        code = 'SERVER_ERROR';
        break;
      default:
        statusCode = 500;
        code = 'UNKNOWN_ERROR';
    }
    message = error.userMessage;
    details = error.context;
  } else if (error.name === 'ValidationError') {
    // Handle Mongoose validation errors
    statusCode = 422;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = error.message;
  } else if (error.name === 'CastError') {
    // Handle Mongoose cast errors
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid ID format';
  } else if (error.name === 'MongoError' && (error as any).code === 11000) {
    // Handle MongoDB duplicate key errors
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    message = 'Resource already exists';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Token has expired';
  } else if (error.name === 'MulterError') {
    statusCode = 400;
    code = 'FILE_UPLOAD_ERROR';
    message = 'File upload error';
    details = error.message;
  }

  // Prepare error response
  const errorResponse: ErrorResponse = {
    success: false,
    message,
    code,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  // Add details if available
  if (details) {
    errorResponse.details = details;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

// 404 handler for undefined routes
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = createApiError.notFound(`Route ${req.originalUrl} not found`);
  next(error);
};

// Rate limiting error handler
export const rateLimitHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = createApiError.tooManyRequests('Too many requests, please try again later');
  next(error);
};

// Validation error handler
export const validationErrorHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = createApiError.validation('Request validation failed');
  next(error);
};

// Authentication error handler
export const authErrorHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = createApiError.unauthorized('Authentication required');
  next(error);
};

// Authorization error handler
export const authorizationErrorHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = createApiError.forbidden('Insufficient permissions');
  next(error);
};

// Database error handler
export const databaseErrorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error.name === 'MongoError' || error.name === 'MongooseError') {
    const dbError = createApiError.internal('Database operation failed');
    next(dbError);
  } else {
    next(error);
  }
};

// File upload error handler
export const fileUploadErrorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error.name === 'MulterError') {
    const uploadError = createApiError.badRequest('File upload failed', {
      code: (error as any).code,
      message: error.message
    });
    next(uploadError);
  } else {
    next(error);
  }
};

// CORS error handler
export const corsErrorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error.name === 'CorsError') {
    const corsError = createApiError.forbidden('CORS policy violation');
    next(corsError);
  } else {
    next(error);
  }
};

// Request timeout handler
export const timeoutHandler = (timeout: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timer = setTimeout(() => {
      const error = createApiError.serviceUnavailable('Request timeout');
      next(error);
    }, timeout);

    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));
    next();
  };
};

// Error monitoring and reporting
export const errorMonitoring = {
  // Report error to external service
  report: async (error: Error, context: any) => {
    // In production, integrate with services like Sentry, Bugsnag, etc.
    if (process.env.NODE_ENV === 'production') {
      // Note: Currently using console logging
      // Future: Integrate Sentry or similar for error tracking
      // See BACKLOG.md for details
      logger.error('Error reported to monitoring service:', {
        message: error.message,
        stack: error.stack,
        context
      });
    }
  },

  // Track error metrics
  track: (error: Error, req: Request) => {
    // Track error metrics for monitoring
    const metrics = {
      errorType: error.constructor.name,
      statusCode: error instanceof ApiError ? error.statusCode : 500,
      endpoint: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    };

    // Note: Currently logging metrics to console
    // Future: Send to DataDog, CloudWatch, or New Relic
    // Future: Send to DataDog, CloudWatch, or New Relic
    // See BACKLOG.md for details
    logger.info('Error metrics:', metrics);
  }
};

export default errorHandler;
