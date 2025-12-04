/**
 * Production Configuration
 * Production-specific settings and optimizations
 */

export interface ProductionConfig {
  app: {
    name: string;
    version: string;
    environment: string;
    port: number;
    host: string;
  };
  database: {
    url: string;
    ssl: boolean;
    pool: {
      min: number;
      max: number;
      acquireTimeoutMillis: number;
      createTimeoutMillis: number;
      destroyTimeoutMillis: number;
      idleTimeoutMillis: number;
      reapIntervalMillis: number;
      createRetryIntervalMillis: number;
    };
  };
  redis: {
    url: string;
    password?: string;
    db: number;
    retryDelayOnFailover: number;
    maxRetriesPerRequest: number;
    lazyConnect: boolean;
  };
  security: {
    jwt: {
      secret: string;
      expiresIn: string;
      refreshExpiresIn: string;
    };
    session: {
      secret: string;
      maxAge: number;
      secure: boolean;
      httpOnly: boolean;
      sameSite: 'strict' | 'lax' | 'none';
    };
    cors: {
      origin: string[];
      credentials: boolean;
    };
    rateLimit: {
      windowMs: number;
      max: number;
    };
  };
  logging: {
    level: string;
    enableConsole: boolean;
    enableFile: boolean;
    enableDatabase: boolean;
    logDirectory: string;
    maxFileSize: number;
    maxFiles: number;
  };
  monitoring: {
    enableMetrics: boolean;
    enableHealthChecks: boolean;
    enableProfiling: boolean;
    metricsPort: number;
    healthCheckPort: number;
  };
  cache: {
    enableMemoryCache: boolean;
    enableRedisCache: boolean;
    enableFileCache: boolean;
    defaultTTL: number;
    maxSize: number;
  };
  performance: {
    enableCompression: boolean;
    enableMinification: boolean;
    enableTreeShaking: boolean;
    enableCodeSplitting: boolean;
    enableLazyLoading: boolean;
    enableCaching: boolean;
  };
  features: {
    enableAnalytics: boolean;
    enableErrorTracking: boolean;
    enablePerformanceMonitoring: boolean;
    enableUserTracking: boolean;
    enableAPIDocumentation: boolean;
  };
  external: {
    analytics: {
      googleAnalytics?: string;
      mixpanel?: string;
      amplitude?: string;
    };
    errorTracking: {
      sentry?: string;
      bugsnag?: string;
    };
    monitoring: {
      newRelic?: string;
      datadog?: string;
    };
  };
}

// Default production configuration
export const defaultProductionConfig: ProductionConfig = {
  app: {
    name: process.env.APP_NAME || 'Student Management System',
    version: process.env.APP_VERSION || '1.0.0',
    environment: 'production',
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0'
  },
  database: {
    url: process.env.DATABASE_URL || '',
    ssl: process.env.NODE_ENV === 'production',
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200
    }
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true
  },
  security: {
    jwt: {
      secret: process.env.JWT_SECRET || '',
      expiresIn: '1h',
      refreshExpiresIn: '7d'
    },
    session: {
      secret: process.env.SESSION_SECRET || '',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: true,
      httpOnly: true,
      sameSite: 'strict'
    },
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') || ['https://yourdomain.com'],
      credentials: true
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000 // requests per window
    }
  },
  logging: {
    level: 'info',
    enableConsole: true,
    enableFile: true,
    enableDatabase: false,
    logDirectory: './logs',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5
  },
  monitoring: {
    enableMetrics: true,
    enableHealthChecks: true,
    enableProfiling: false,
    metricsPort: parseInt(process.env.METRICS_PORT || '9090', 10),
    healthCheckPort: parseInt(process.env.HEALTH_CHECK_PORT || '9091', 10)
  },
  cache: {
    enableMemoryCache: true,
    enableRedisCache: true,
    enableFileCache: false,
    defaultTTL: 3600, // 1 hour
    maxSize: 1000
  },
  performance: {
    enableCompression: true,
    enableMinification: true,
    enableTreeShaking: true,
    enableCodeSplitting: true,
    enableLazyLoading: true,
    enableCaching: true
  },
  features: {
    enableAnalytics: true,
    enableErrorTracking: true,
    enablePerformanceMonitoring: true,
    enableUserTracking: true,
    enableAPIDocumentation: true
  },
  external: {
    analytics: {
      googleAnalytics: process.env.GOOGLE_ANALYTICS_ID,
      mixpanel: process.env.MIXPANEL_TOKEN,
      amplitude: process.env.AMPLITUDE_API_KEY
    },
    errorTracking: {
      sentry: process.env.SENTRY_DSN,
      bugsnag: process.env.BUGSNAG_API_KEY
    },
    monitoring: {
      newRelic: process.env.NEW_RELIC_LICENSE_KEY,
      datadog: process.env.DATADOG_API_KEY
    }
  }
};

// Environment-specific configurations
export const getProductionConfig = (): ProductionConfig => {
  const config = { ...defaultProductionConfig };

  // Override with environment-specific settings
  if (process.env.NODE_ENV === 'production') {
    // Production-specific overrides
    config.logging.level = 'warn';
    config.monitoring.enableProfiling = false;
    config.performance.enableCompression = true;
    config.performance.enableMinification = true;
  } else if (process.env.NODE_ENV === 'staging') {
    // Staging-specific overrides
    config.logging.level = 'debug';
    config.monitoring.enableProfiling = true;
    config.performance.enableCompression = true;
    config.performance.enableMinification = false;
  }

  return config;
};

// Configuration validation
export const validateProductionConfig = (config: ProductionConfig): string[] => {
  const errors: string[] = [];

  // Validate required environment variables
  if (!config.database.url) {
    errors.push('DATABASE_URL is required');
  }

  if (!config.security.jwt.secret) {
    errors.push('JWT_SECRET is required');
  }

  if (!config.security.session.secret) {
    errors.push('SESSION_SECRET is required');
  }

  // Validate port numbers
  if (config.app.port < 1 || config.app.port > 65535) {
    errors.push('Invalid port number');
  }

  if (config.monitoring.metricsPort < 1 || config.monitoring.metricsPort > 65535) {
    errors.push('Invalid metrics port number');
  }

  if (config.monitoring.healthCheckPort < 1 || config.monitoring.healthCheckPort > 65535) {
    errors.push('Invalid health check port number');
  }

  // Validate database pool settings
  if (config.database.pool.min < 0 || config.database.pool.max < config.database.pool.min) {
    errors.push('Invalid database pool configuration');
  }

  // Validate cache settings
  if (config.cache.maxSize < 1) {
    errors.push('Cache max size must be greater than 0');
  }

  if (config.cache.defaultTTL < 1) {
    errors.push('Cache default TTL must be greater than 0');
  }

  // Validate logging settings
  if (config.logging.maxFileSize < 1024) {
    errors.push('Log file max size must be at least 1KB');
  }

  if (config.logging.maxFiles < 1) {
    errors.push('Log max files must be at least 1');
  }

  return errors;
};

// Configuration loader
export const loadProductionConfig = (): ProductionConfig => {
  const config = getProductionConfig();
  const errors = validateProductionConfig(config);

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
  }

  return config;
};

// Environment variable helpers
export const getEnvVar = (name: string, defaultValue?: string): string => {
  const value = process.env[name];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value || defaultValue || '';
};

export const getEnvNumber = (name: string, defaultValue?: number): number => {
  const value = process.env[name];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${name} is required`);
  }
  const parsed = parseInt(value || '', 10);
  if (isNaN(parsed) && defaultValue === undefined) {
    throw new Error(`Environment variable ${name} must be a number`);
  }
  return isNaN(parsed) ? defaultValue || 0 : parsed;
};

export const getEnvBoolean = (name: string, defaultValue?: boolean): boolean => {
  const value = process.env[name];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${name} is required`);
  }
  if (!value) return defaultValue || false;
  return value.toLowerCase() === 'true';
};

export const getEnvArray = (name: string, defaultValue?: string[]): string[] => {
  const value = process.env[name];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${name} is required`);
  }
  if (!value) return defaultValue || [];
  return value.split(',').map(item => item.trim());
};

export default loadProductionConfig;
