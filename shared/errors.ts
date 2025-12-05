/**
 * Shared Error Types and Utilities
 * Provides consistent error handling across client and server
 */

export enum ErrorCode {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
  
  // API errors
  API_ERROR = 'API_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  BAD_REQUEST = 'BAD_REQUEST',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Business logic errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  OPERATION_FAILED = 'OPERATION_FAILED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Contract/Web3 errors
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  
  // Unknown errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  statusCode?: number;
  field?: string;
  context?: Record<string, any>;
  timestamp?: string;
  stack?: string;
}

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly context?: Record<string, any>;
  public readonly timestamp: string;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    context?: Record<string, any>,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.isOperational = isOperational;

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

/**
 * API Error - for HTTP/API related errors
 */
export class APIError extends AppError {
  constructor(
    message: string,
    statusCode: number = 500,
    code: ErrorCode = ErrorCode.API_ERROR,
    context?: Record<string, any>
  ) {
    super(code, message, statusCode, context);
  }
}

/**
 * Validation Error - for input validation failures
 */
export class ValidationError extends AppError {
  public readonly field?: string;

  constructor(
    message: string,
    field?: string,
    context?: Record<string, any>
  ) {
    super(
      ErrorCode.VALIDATION_ERROR,
      message,
      400,
      { ...context, field },
      true
    );
    this.field = field;
  }
}

/**
 * Network Error - for network-related failures
 */
export class NetworkError extends AppError {
  constructor(
    message: string = 'Network request failed',
    context?: Record<string, any>
  ) {
    super(
      ErrorCode.NETWORK_ERROR,
      message,
      0,
      context,
      true
    );
  }
}

/**
 * Not Found Error - for resource not found
 */
export class NotFoundError extends AppError {
  constructor(
    resource: string,
    identifier?: string,
    context?: Record<string, any>
  ) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(
      ErrorCode.NOT_FOUND,
      message,
      404,
      { resource, identifier, ...context },
      true
    );
  }
}

/**
 * Unauthorized Error - for authentication failures
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', context?: Record<string, any>) {
    super(
      ErrorCode.UNAUTHORIZED,
      message,
      401,
      context,
      true
    );
  }
}

/**
 * Forbidden Error - for authorization failures
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', context?: Record<string, any>) {
    super(
      ErrorCode.FORBIDDEN,
      message,
      403,
      context,
      true
    );
  }
}

/**
 * Contract Error - for blockchain/contract related errors
 */
export class ContractError extends AppError {
  constructor(
    message: string,
    context?: Record<string, any>
  ) {
    super(
      ErrorCode.CONTRACT_ERROR,
      message,
      500,
      context,
      true
    );
  }
}

/**
 * Check if error is an AppError instance
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Convert unknown error to AppError
 */
export function normalizeError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(
      ErrorCode.UNKNOWN_ERROR,
      error.message,
      500,
      { originalError: error.name },
      false
    );
  }

  return new AppError(
    ErrorCode.UNKNOWN_ERROR,
    'An unknown error occurred',
    500,
    { originalError: String(error) },
    false
  );
}

/**
 * Extract user-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
  const normalized = normalizeError(error);
  
  // Return operational errors as-is
  if (normalized.isOperational) {
    return normalized.message;
  }

  // For non-operational errors, return generic message
  switch (normalized.code) {
    case ErrorCode.NETWORK_ERROR:
      return 'Network connection failed. Please check your internet connection and try again.';
    case ErrorCode.TIMEOUT:
      return 'Request timed out. Please try again.';
    case ErrorCode.INTERNAL_SERVER_ERROR:
      return 'An internal error occurred. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

