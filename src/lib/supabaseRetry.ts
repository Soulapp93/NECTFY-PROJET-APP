/**
 * Utility for robust Supabase operations with automatic retry on transient failures.
 * This helps stabilize data loading in production when network issues occur.
 */

interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxRetries: 3,
  baseDelayMs: 500,
  maxDelayMs: 5000,
};

/**
 * Check if an error is a transient network error that should be retried.
 */
export function isTransientError(error: unknown): boolean {
  if (!error) return false;
  
  const errorMessage = error instanceof Error 
    ? error.message 
    : typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error);
  
  // Network-related errors
  const transientPatterns = [
    'Load failed',
    'Failed to fetch',
    'Network request failed',
    'NetworkError',
    'net::ERR_',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'socket hang up',
    'timeout',
    'aborted',
    'Request timeout',
    'Connection refused',
    'Connection reset',
  ];
  
  return transientPatterns.some(pattern => 
    errorMessage.toLowerCase().includes(pattern.toLowerCase())
  );
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute an async operation with automatic retry on transient failures.
 * 
 * For Supabase operations, wrap the entire query in a function:
 * 
 * @example
 * const { data, error } = await withRetry(
 *   async () => supabase.rpc('get_current_user_role')
 * );
 */
export async function withRetry<T>(
  operation: () => Promise<T> | PromiseLike<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries, baseDelayMs, maxDelayMs } = { ...DEFAULT_OPTIONS, ...options };
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      
      // For Supabase results, check if there's a transient error in the response
      if (result && typeof result === 'object' && 'error' in result) {
        const response = result as { error: unknown };
        if (response.error && isTransientError(response.error)) {
          // Throw to trigger retry
          const errorMsg = typeof response.error === 'object' && response.error !== null && 'message' in response.error
            ? (response.error as { message: string }).message
            : String(response.error);
          throw new Error(errorMsg);
        }
      }
      
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry if it's not a transient error or if we've exhausted retries
      if (!isTransientError(error) || attempt === maxRetries) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff + jitter
      const delay = Math.min(
        baseDelayMs * Math.pow(2, attempt) + Math.random() * 100,
        maxDelayMs
      );
      
      if (options.onRetry) {
        options.onRetry(attempt + 1, lastError);
      }
      
      // Wait before retrying
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Execute a Supabase RPC call with retry logic.
 * Returns the result in Supabase format { data, error }.
 * 
 * @example
 * const { data, error } = await rpcWithRetry(
 *   () => supabase.rpc('get_current_user_role')
 * );
 */
export async function rpcWithRetry<T>(
  rpcCall: () => PromiseLike<{ data: T | null; error: { message: string } | null }>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: { message: string } | null }> {
  const { maxRetries, baseDelayMs, maxDelayMs } = { ...DEFAULT_OPTIONS, ...options };
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await rpcCall();
      
      // Check for transient errors in the result
      if (result.error && isTransientError(result.error)) {
        throw new Error(result.error.message);
      }
      
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (!isTransientError(error) || attempt === maxRetries) {
        // Return as a Supabase-like result instead of throwing
        return { data: null, error: { message: lastError.message } };
      }
      
      const delay = Math.min(
        baseDelayMs * Math.pow(2, attempt) + Math.random() * 100,
        maxDelayMs
      );
      
      if (options.onRetry) {
        options.onRetry(attempt + 1, lastError);
      }
      
      await sleep(delay);
    }
  }
  
  return { data: null, error: lastError ? { message: lastError.message } : null };
}

/**
 * Execute a Supabase query factory with retry logic.
 * Pass a function that returns the query.
 * 
 * @example
 * const { data, error } = await retryQuery(
 *   () => supabase.from('users').select('*').eq('id', userId).maybeSingle()
 * );
 */
export async function retryQuery<T>(
  queryFactory: () => PromiseLike<{ data: T | null; error: { message: string } | null }>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: { message: string } | null }> {
  const { maxRetries, baseDelayMs, maxDelayMs } = { ...DEFAULT_OPTIONS, ...options };
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await queryFactory();
      
      // Check for transient errors
      if (result.error && isTransientError(result.error)) {
        throw new Error(result.error.message);
      }
      
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (!isTransientError(error) || attempt === maxRetries) {
        return { data: null, error: { message: lastError.message } };
      }
      
      const delay = Math.min(
        baseDelayMs * Math.pow(2, attempt) + Math.random() * 100,
        maxDelayMs
      );
      
      if (options.onRetry) {
        options.onRetry(attempt + 1, lastError);
      }
      
      await sleep(delay);
    }
  }
  
  return { data: null, error: lastError ? { message: lastError.message } : null };
}
