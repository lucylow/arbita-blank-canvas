/**
 * Client-side Error Handling Utilities
 */

import { toast } from 'sonner';
import {
  AppError,
  normalizeError,
  getUserFriendlyMessage,
  ErrorCode,
  isAppError,
  NetworkError,
  APIError,
} from '../../../shared/errors';

/**
 * Error logging utility (client-side)
 */
export function logError(error: Error | AppError, context?: Record<string, any>): void {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...(isAppError(error) && {
      code: error.code,
      statusCode: error.statusCode,
      context: error.context,
    }),
    ...context,
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  // In production, you might want to send this to a logging service
  if (import.meta.env.PROD) {
    // Send to error tracking service (e.g., Sentry, LogRocket)
    console.error(JSON.stringify(errorInfo));
  } else {
    console.error('Error:', errorInfo);
  }
}

/**
 * Show error notification to user
 */
export function showErrorNotification(
  error: unknown,
  options?: {
    title?: string;
    duration?: number;
    action?: { label: string; onClick: () => void };
  }
): void {
  const normalizedError = normalizeError(error);
  const message = getUserFriendlyMessage(normalizedError);
  
  logError(normalizedError);

  toast.error(options?.title || 'Error', {
    description: message,
    duration: options?.duration || 5000,
    action: options?.action,
  });
}

/**
 * Show success notification
 */
export function showSuccessNotification(
  message: string,
  options?: { duration?: number }
): void {
  toast.success('Success', {
    description: message,
    duration: options?.duration || 3000,
  });
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  retryableStatusCodes?: number[];
  retryableErrors?: ErrorCode[];
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableErrors: [ErrorCode.NETWORK_ERROR, ErrorCode.TIMEOUT],
};

/**
 * Check if error is retryable
 */
function isRetryableError(error: unknown, config: RetryConfig): boolean {
  const normalizedError = normalizeError(error);
  
  if (isAppError(normalizedError)) {
    // Check if error code is retryable
    if (config.retryableErrors?.includes(normalizedError.code)) {
      return true;
    }
    
    // Check if status code is retryable
    if (
      normalizedError.statusCode &&
      config.retryableStatusCodes?.includes(normalizedError.statusCode)
    ) {
      return true;
    }
  }
  
  return false;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryConfig: RetryConfig = {}
): Promise<Response> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // If response is ok, return it
      if (response.ok) {
        return response;
      }
      
      // Check if error is retryable
      const error = new APIError(
        `Request failed with status ${response.status}`,
        response.status
      );
      
      if (attempt < config.maxRetries && isRetryableError(error, config)) {
        const delay = config.retryDelay * Math.pow(2, attempt); // Exponential backoff
        await sleep(delay);
        continue;
      }
      
      // If not retryable or max retries reached, throw error
      throw error;
    } catch (error) {
      lastError = error;
      
      // Handle abort (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new NetworkError('Request timeout');
        if (attempt < config.maxRetries && isRetryableError(timeoutError, config)) {
          const delay = config.retryDelay * Math.pow(2, attempt);
          await sleep(delay);
          continue;
        }
        throw timeoutError;
      }
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError = new NetworkError('Network request failed');
        if (attempt < config.maxRetries && isRetryableError(networkError, config)) {
          const delay = config.retryDelay * Math.pow(2, attempt);
          await sleep(delay);
          continue;
        }
        throw networkError;
      }
      
      // If not retryable or max retries reached, throw error
      if (attempt >= config.maxRetries || !isRetryableError(error, config)) {
        throw normalizeError(error);
      }
      
      // Wait before retry
      const delay = config.retryDelay * Math.pow(2, attempt);
      await sleep(delay);
    }
  }
  
  throw normalizeError(lastError);
}

/**
 * API client with built-in error handling
 */
export class APIClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string = '', defaultHeaders: Record<string, string> = {}) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders,
    };
  }

  /**
   * Make API request with error handling
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryConfig?: RetryConfig
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetchWithRetry(
        url,
        {
          ...options,
          headers: {
            ...this.defaultHeaders,
            ...options.headers,
          },
        },
        retryConfig
      );

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        if (!response.ok) {
          throw new APIError(text || 'Request failed', response.status);
        }
        return text as unknown as T;
      }

      const data = await response.json();

      // Check for error response format
      if (!response.ok) {
        const errorMessage = data.error?.message || data.message || 'Request failed';
        const errorCode = data.error?.code || ErrorCode.API_ERROR;
        throw new APIError(errorMessage, response.status, errorCode, data.error?.context);
      }

      return data;
    } catch (error) {
      // Re-throw AppError as-is
      if (isAppError(error)) {
        throw error;
      }
      
      // Normalize other errors
      throw normalizeError(error);
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, retryConfig?: RetryConfig): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, retryConfig);
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any, retryConfig?: RetryConfig): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      retryConfig
    );
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any, retryConfig?: RetryConfig): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      retryConfig
    );
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, retryConfig?: RetryConfig): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' }, retryConfig);
  }
}

// Default API client instance
// Uses relative URLs for same-origin requests (server serves both API and static files)
export const apiClient = new APIClient(import.meta.env.VITE_API_URL || '');

