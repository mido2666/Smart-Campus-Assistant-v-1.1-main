const logger = {
  // Production mode check
  isDev: process.env.NODE_ENV === 'development',

  // Log levels
  info: (...args: any[]) => {
    if (logger.isDev) {
      console.log('[INFO]', ...args);
    }
  },

  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },

  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },

  debug: (...args: any[]) => {
    if (logger.isDev) {
      console.log('[DEBUG]', ...args);
    }
  },

  // Silent in production
  log: (...args: any[]) => {
    if (logger.isDev) {
      console.log(...args);
    }
  }
};

export default logger;
