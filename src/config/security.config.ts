/**
 * Security Configuration
 * Centralized security settings and configurations
 */

import { CorsOptions } from 'cors';
import { RateLimitRequestHandler } from 'express-rate-limit';

export interface SecurityConfig {
  cors: CorsOptions;
  rateLimits: {
    auth: RateLimitRequestHandler;
    api: RateLimitRequestHandler;
    upload: RateLimitRequestHandler;
    strict: RateLimitRequestHandler;
  };
  helmet: any;
  fileUpload: {
    maxSize: number;
    allowedTypes: string[];
    allowedExtensions: string[];
    uploadPath: string;
  };
  session: {
    secret: string;
    maxAge: number;
    secure: boolean;
    httpOnly: boolean;
    sameSite: 'strict' | 'lax' | 'none';
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
    issuer: string;
    audience: string;
  };
  encryption: {
    algorithm: string;
    keyLength: number;
    ivLength: number;
  };
  allowedIPs: string[];
  blockedIPs: string[];
  trustedProxies: string[];
}

// Default security configuration
export const defaultSecurityConfig: SecurityConfig = {
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://yourdomain.com',
        process.env.FRONTEND_URL
      ].filter(Boolean);

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
      'Pragma',
      'X-CSRF-Token'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count']
  },

  rateLimits: {
    auth: null as any, // Will be set by middleware
    api: null as any,
    upload: null as any,
    strict: null as any
  },

  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
        connectSrc: ["'self'", "https://api.openai.com"]
      }
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  },

  fileUpload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    allowedExtensions: [
      '.jpg', '.jpeg', '.png', '.gif', '.webp',
      '.pdf', '.txt', '.doc', '.docx', '.xls', '.xlsx'
    ],
    uploadPath: process.env.UPLOAD_PATH || './uploads'
  },

  session: {
    secret: process.env.SESSION_SECRET || 'your-super-secret-session-key',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict'
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: '1h',
    refreshExpiresIn: '7d',
    issuer: 'your-app-name',
    audience: 'your-app-users'
  },

  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16
  },

  allowedIPs: [
    '127.0.0.1',
    '::1',
    'localhost'
  ],

  blockedIPs: [],

  trustedProxies: [
    '127.0.0.1',
    '::1'
  ]
};

// Production security configuration
export const productionSecurityConfig: SecurityConfig = {
  ...defaultSecurityConfig,
  
  cors: {
    ...defaultSecurityConfig.cors,
    origin: process.env.FRONTEND_URL || 'https://yourdomain.com'
  },

  helmet: {
    ...defaultSecurityConfig.helmet,
    contentSecurityPolicy: {
      directives: {
        ...defaultSecurityConfig.helmet.contentSecurityPolicy.directives,
        upgradeInsecureRequests: []
      }
    }
  },

  session: {
    ...defaultSecurityConfig.session,
    secure: true,
    sameSite: 'strict'
  },

  fileUpload: {
    ...defaultSecurityConfig.fileUpload,
    maxSize: 5 * 1024 * 1024 // 5MB in production
  }
};

// Development security configuration
export const developmentSecurityConfig: SecurityConfig = {
  ...defaultSecurityConfig,
  
  cors: {
    ...defaultSecurityConfig.cors,
    origin: true // Allow all origins in development
  },

  helmet: {
    ...defaultSecurityConfig.helmet,
    contentSecurityPolicy: false // Disable CSP in development
  },

  session: {
    ...defaultSecurityConfig.session,
    secure: false
  }
};

// Get security configuration based on environment
export const getSecurityConfig = (): SecurityConfig => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return productionSecurityConfig;
    case 'development':
      return developmentSecurityConfig;
    default:
      return defaultSecurityConfig;
  }
};

// Security validation functions
export const validateSecurityConfig = (config: SecurityConfig): string[] => {
  const errors: string[] = [];

  // Validate JWT secret
  if (!config.jwt.secret || config.jwt.secret.length < 32) {
    errors.push('JWT secret must be at least 32 characters long');
  }

  // Validate session secret
  if (!config.session.secret || config.session.secret.length < 32) {
    errors.push('Session secret must be at least 32 characters long');
  }

  // Validate file upload settings
  if (config.fileUpload.maxSize <= 0) {
    errors.push('File upload max size must be greater than 0');
  }

  if (config.fileUpload.allowedTypes.length === 0) {
    errors.push('At least one file type must be allowed');
  }

  // Validate rate limits
  if (config.rateLimits.auth && typeof config.rateLimits.auth !== 'function') {
    errors.push('Auth rate limit must be a function');
  }

  // Validate CORS settings
  if (!config.cors.origin) {
    errors.push('CORS origin must be configured');
  }

  return errors;
};

// Security headers configuration
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self'"
};

// Security middleware configuration
export const securityMiddlewareConfig = {
  trustProxy: true,
  enableCORS: true,
  enableHelmet: true,
  enableRateLimit: true,
  enableXSSProtection: true,
  enableCSRFProtection: true,
  enableSQLInjectionProtection: true,
  enableFileUploadSecurity: true,
  enableRequestLogging: true,
  enableIPWhitelist: false,
  enableSecurityHeaders: true
};

export default getSecurityConfig;
