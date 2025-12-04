import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// Security headers configuration
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

// Rate limiting configurations
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: message || 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.round(windowMs / 1000),
      });
    },
  });
};

// Specific rate limits
export const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts, please try again later.'
);

export const apiRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests
  'Too many API requests, please try again later.'
);

export const strictRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  10, // 10 requests
  'Too many requests, please try again later.'
);

// Input validation and sanitization
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Remove potentially dangerous characters
  const sanitizeString = (str: string): string => {
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  };

  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return sanitizeString(obj);
      } else if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      } else if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const key in obj) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
        return sanitized;
      }
      return obj;
    };

    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key] as string);
      }
    }
  }

  next();
};

// CORS configuration
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      process.env.APP_URL || 'http://localhost:3000',
      'https://your-domain.com',
    ];

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Security middleware for API endpoints
export const apiSecurity = (req: Request, res: Response, next: NextFunction) => {
  // Add security headers for API responses
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Log security-relevant requests
  if (req.path.includes('/api/auth/') || req.path.includes('/api/admin/')) {
    console.log(`Security: ${req.method} ${req.path} from ${req.ip} at ${new Date().toISOString()}`);
  }

  next();
};

// File upload security
export const fileUploadSecurity = (req: Request, res: Response, next: NextFunction) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
  ];

  const maxFileSize = 10 * 1024 * 1024; // 10MB

  if (req.file) {
    // Check file type
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only images and PDF files are allowed.',
      });
    }

    // Check file size
    if (req.file.size > maxFileSize) {
      return res.status(400).json({
        error: 'File too large',
        message: 'File size must be less than 10MB.',
      });
    }

    // Check for malicious content
    const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'txt'];

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({
        error: 'Invalid file extension',
        message: 'File extension not allowed.',
      });
    }
  }

  next();
};

// SQL injection prevention
export const sqlInjectionPrevention = (req: Request, res: Response, next: NextFunction) => {
  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /(\b(OR|AND)\s+['"]\s*=\s*['"])/gi,
    /(\b(OR|AND)\s+1\s*=\s*1)/gi,
    /(\b(OR|AND)\s+0\s*=\s*0)/gi,
    /(UNION\s+SELECT)/gi,
    /(DROP\s+TABLE)/gi,
    /(DELETE\s+FROM)/gi,
    /(INSERT\s+INTO)/gi,
    /(UPDATE\s+SET)/gi,
  ];

  const checkForInjection = (input: string): boolean => {
    return dangerousPatterns.some(pattern => pattern.test(input));
  };

  // Check request body
  if (req.body && typeof req.body === 'object') {
    const checkObject = (obj: any): boolean => {
      if (typeof obj === 'string') {
        return checkForInjection(obj);
      } else if (Array.isArray(obj)) {
        return obj.some(checkObject);
      } else if (obj && typeof obj === 'object') {
        return Object.values(obj).some(checkObject);
      }
      return false;
    };

    if (checkObject(req.body)) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Potentially malicious input detected.',
      });
    }
  }

  // Check query parameters
  if (req.query && typeof req.query === 'object') {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string' && checkForInjection(req.query[key] as string)) {
        return res.status(400).json({
          error: 'Invalid input',
          message: 'Potentially malicious input detected.',
        });
      }
    }
  }

  next();
};

// XSS prevention
export const xssPrevention = (req: Request, res: Response, next: NextFunction) => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
    /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi,
  ];

  const checkForXSS = (input: string): boolean => {
    return xssPatterns.some(pattern => pattern.test(input));
  };

  // Check request body
  if (req.body && typeof req.body === 'object') {
    const checkObject = (obj: any): boolean => {
      if (typeof obj === 'string') {
        return checkForXSS(obj);
      } else if (Array.isArray(obj)) {
        return obj.some(checkObject);
      } else if (obj && typeof obj === 'object') {
        return Object.values(obj).some(checkObject);
      }
      return false;
    };

    if (checkObject(req.body)) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Potentially malicious input detected.',
      });
    }
  }

  next();
};

// Session security
export const sessionSecurity = (req: Request, res: Response, next: NextFunction) => {
  // Regenerate session ID on authentication
  if (req.path === '/api/auth/login' && req.method === 'POST') {
    (req as any).session.regenerate((err: any) => {
      if (err) {
        console.error('Session regeneration error:', err);
      }
      next();
    });
  } else {
    next();
  }
};

// IP whitelist for admin endpoints
export const adminIPWhitelist = (req: Request, res: Response, next: NextFunction) => {
  const allowedIPs = [
    '127.0.0.1',
    '::1',
    // Add your admin IPs here
    process.env.ADMIN_IP_1,
    process.env.ADMIN_IP_2,
  ].filter(Boolean);

  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

  if (req.path.startsWith('/api/admin/') && !allowedIPs.includes(clientIP)) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Admin access restricted to whitelisted IPs.',
    });
  }

  next();
};

// Security logging
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
    };

    // Log security-relevant events
    if (res.statusCode >= 400 || req.path.includes('/api/auth/') || req.path.includes('/api/admin/')) {
      console.log('Security Event:', JSON.stringify(logData));
    }
  });

  next();
};

// Export all security configurations
export const securityConfig = {
  securityHeaders,
  authRateLimit,
  apiRateLimit,
  strictRateLimit,
  sanitizeInput,
  corsOptions,
  apiSecurity,
  fileUploadSecurity,
  sqlInjectionPrevention,
  xssPrevention,
  sessionSecurity,
  adminIPWhitelist,
  securityLogger,
};
