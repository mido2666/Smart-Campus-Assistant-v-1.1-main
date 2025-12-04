/**
 * Frontend Environment Configuration
 * Centralized configuration for frontend environment variables
 */

export interface FrontendConfig {
  // API Configuration
  api: {
    baseUrl: string;
    wsUrl: string;
    timeout: number;
  };

  // Environment
  environment: {
    nodeEnv: string;
    debug: boolean;
  };

  // Feature Flags
  features: {
    analytics: boolean;
    notifications: boolean;
    chatbot: boolean;
  };

  // External Services
  services: {
    openai?: string;
    emailService?: string;
  };
}

/**
 * Get frontend environment configuration
 * @returns Frontend configuration object
 */
export function getFrontendConfig(): FrontendConfig {
  // Auto-detect production environment
  const isProduction = import.meta.env.PROD;
  const defaultApiUrl = isProduction
    ? import.meta.env.VITE_API_BASE_URL || 'https://smart-campus-assistant.fly.dev'
    : 'http://localhost:3001';
  const defaultWsUrl = isProduction
    ? import.meta.env.VITE_WS_URL || 'wss://smart-campus-assistant.fly.dev'
    : 'ws://localhost:3001';

  return {
    api: {
      baseUrl: import.meta.env.VITE_API_BASE_URL || defaultApiUrl,
      wsUrl: import.meta.env.VITE_WS_URL || defaultWsUrl,
      timeout: 10000
    },

    environment: {
      nodeEnv: import.meta.env.VITE_NODE_ENV || 'development',
      debug: import.meta.env.VITE_DEBUG === 'true'
    },

    features: {
      analytics: import.meta.env.VITE_ENABLE_ANALYTICS !== 'false',
      notifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS !== 'false',
      chatbot: import.meta.env.VITE_ENABLE_CHATBOT !== 'false'
    },

    services: {
      openai: import.meta.env.VITE_OPENAI_API_KEY,
      emailService: import.meta.env.VITE_EMAIL_SERVICE_URL
    }
  };
}

/**
 * Validate frontend configuration
 * @param config - Frontend configuration to validate
 * @throws Error if configuration is invalid
 */
export function validateFrontendConfig(config: FrontendConfig): void {
  // Validate API base URL
  if (!config.api.baseUrl) {
    throw new Error('VITE_API_BASE_URL is required');
  }

  // Validate WebSocket URL
  if (!config.api.wsUrl) {
    throw new Error('VITE_WS_URL is required');
  }

  // Validate environment
  if (!['development', 'production', 'test'].includes(config.environment.nodeEnv)) {
    throw new Error('VITE_NODE_ENV must be development, production, or test');
  }
}

/**
 * Get default frontend configuration
 * @returns Default frontend configuration
 */
export function getDefaultFrontendConfig(): FrontendConfig {
  return {
    api: {
      baseUrl: 'http://localhost:3001',
      wsUrl: 'ws://localhost:3001',
      timeout: 10000
    },

    environment: {
      nodeEnv: 'development',
      debug: true
    },

    features: {
      analytics: true,
      notifications: true,
      chatbot: true
    },

    services: {}
  };
}

/**
 * Frontend configuration instance
 */
export const frontendConfig = getFrontendConfig();

// Validate configuration on import
try {
  validateFrontendConfig(frontendConfig);
} catch (error) {
  console.warn('Frontend configuration validation warning:', error);
  console.warn('Using default configuration. Please check your environment variables.');
}

export default frontendConfig;
