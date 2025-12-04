/**
 * Environment Configuration
 * Centralized configuration for environment variables
 */

export interface EnvironmentConfig {
  // JWT Configuration
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };

  // Bcrypt Configuration
  bcrypt: {
    saltRounds: number;
  };

  // Server Configuration
  server: {
    port: number;
    nodeEnv: string;
  };

  // CORS Configuration
  cors: {
    allowedOrigins: string[];
  };

  // Security Configuration
  security: {
    sessionSecret?: string;
    cookieSecret?: string;
  };

  // Rate Limiting Configuration
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };

  // Logging Configuration
  logging: {
    level: string;
    file?: string;
  };

  // OpenAI Configuration
  openai: {
    apiKey: string;
    model: string;
    maxTokens: number;
    baseUrl: string;
  };

  // Database Configuration
  database: {
    url: string;
    directUrl?: string;
  };

  // Redis Configuration
  redis: {
    url: string;
    password?: string;
    tls: boolean;
  };
}

/**
 * Get environment configuration
 * @returns Environment configuration object
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  return {
    jwt: {
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-make-it-very-long-and-random',
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    },

    bcrypt: {
      saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12')
    },

    server: {
      port: parseInt(process.env.PORT || '3001'),
      nodeEnv: process.env.NODE_ENV || 'development'
    },

    cors: {
      allowedOrigins: [
        ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
        'http://localhost:5177',
        'http://localhost:5178',
        'http://localhost:5179',
        'http://localhost:5180',
        'http://localhost:4173',
        'http://192.168.1.4:5173',
        'http://192.168.1.4:3001',
        'https://smart-campus-assistant.netlify.app',
        'https://smart-campus-assistant-v-11-production.up.railway.app',
        'https://smart-campus-assistant-v-1-1.vercel.app',
        'https://smart-campus-assistant-v-1-1-238qoqigu.vercel.app',
        'https://smart-campus-assistant-v-1-1-git-main-mohameds-projects-4fd39966.vercel.app'
      ].filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
    },

    security: {
      sessionSecret: process.env.SESSION_SECRET,
      cookieSecret: process.env.COOKIE_SECRET
    },

    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
    },

    logging: {
      level: process.env.LOG_LEVEL || 'info',
      file: process.env.LOG_FILE
    },

    openai: {
      apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key-here',
      model: process.env.OPENAI_MODEL || 'deepseek/deepseek-chat',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000'),
      baseUrl: process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1'
    },

    database: {
      url: process.env.DATABASE_URL || '',
      directUrl: process.env.DIRECT_URL
    },

    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      password: process.env.REDIS_PASSWORD,
      tls: process.env.REDIS_TLS === 'true'
    }
  };
}

/**
 * Validate environment configuration
 * @param config - Environment configuration to validate
 * @throws Error if configuration is invalid
 */
export function validateEnvironmentConfig(config: EnvironmentConfig): void {
  // Validate JWT secret
  if (!config.jwt.secret || config.jwt.secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  // Validate bcrypt salt rounds
  if (config.bcrypt.saltRounds < 10 || config.bcrypt.saltRounds > 15) {
    throw new Error('BCRYPT_SALT_ROUNDS must be between 10 and 15');
  }

  // Validate server port
  if (config.server.port < 1000 || config.server.port > 65535) {
    throw new Error('PORT must be between 1000 and 65535');
  }

  // Validate node environment
  if (!['development', 'production', 'test'].includes(config.server.nodeEnv)) {
    throw new Error('NODE_ENV must be development, production, or test');
  }

  // Validate CORS origins
  if (config.cors.allowedOrigins.length === 0) {
    throw new Error('At least one CORS origin must be specified');
  }
}

/**
 * Get default environment configuration
 * @returns Default environment configuration
 */
export function getDefaultEnvironmentConfig(): EnvironmentConfig {
  return {
    jwt: {
      secret: 'your-super-secret-jwt-key-change-in-production-make-it-very-long-and-random',
      expiresIn: '15m',
      refreshExpiresIn: '7d'
    },

    bcrypt: {
      saltRounds: 12
    },

    server: {
      port: 3001,
      nodeEnv: 'development'
    },

    cors: {
      allowedOrigins: [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
        'http://localhost:5177',
        'http://localhost:5178',
        'http://localhost:5179',
        'http://localhost:5180',
        'http://localhost:4173',
        'http://192.168.1.4:5173',
        'http://192.168.1.4:3001',
        'https://smart-campus-assistant.netlify.app'
      ]
    },

    security: {
      sessionSecret: 'your-session-secret-key',
      cookieSecret: 'your-cookie-secret-key'
    },

    rateLimit: {
      windowMs: 900000, // 15 minutes
      maxRequests: 100
    },

    logging: {
      level: 'info',
      file: 'logs/app.log'
    },

    openai: {
      apiKey: 'your-openai-api-key-here',
      model: 'deepseek/deepseek-chat',
      maxTokens: 1000,
      baseUrl: 'https://openrouter.ai/api/v1'
    },

    database: {
      url: 'postgresql://user:password@localhost:5432/database',
      directUrl: undefined
    },

    redis: {
      url: 'redis://localhost:6379',
      password: undefined,
      tls: false
    }
  };
}

/**
 * Environment configuration instance
 */
export const envConfig = getEnvironmentConfig();

// Validate configuration on import
try {
  validateEnvironmentConfig(envConfig);
} catch (error) {
  console.warn('Environment configuration validation warning:', error);
  console.warn('Using default configuration. Please check your environment variables.');
}

export default envConfig;
