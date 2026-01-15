// Production-safe logging utility
declare const __DEV__: boolean;

type LogLevel = 'log' | 'info' | 'warn' | 'error';

interface Logger {
  log: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

// Production logger that only logs errors and warnings
const createLogger = (): Logger => {
  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development';

  const noop = () => {};

  return {
    log: isDev ? console.log.bind(console) : noop,
    info: isDev ? console.info.bind(console) : noop,
    warn: console.warn.bind(console), // Always show warnings
    error: console.error.bind(console), // Always show errors
  };
};

export const logger = createLogger();

// Error reporting utility for production
export const reportError = (error: Error, context?: string) => {
  logger.error(`[${context || 'App'}] Error:`, error);
  
  // In production, you could send to monitoring service
  if (typeof __DEV__ === 'undefined' || !__DEV__) {
    // Example: Send to monitoring service
    // analytics.track('error', { message: error.message, context });
  }
};