/**
 * API Response Types and Utilities
 * Centralized types for consistent API handling
 */

// ============ API RESPONSE TYPES ============

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * List response (array with optional metadata)
 */
export interface ListResponse<T> {
  data: T[];
  total?: number;
  success?: boolean;
}

// ============ ERROR HANDLING ============

/**
 * Error object with message
 */
export interface ErrorWithMessage {
  message: string;
}

/**
 * Type guard to check if error has a message property
 */
export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

/**
 * Extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

/**
 * Axios error with response
 */
export interface AxiosErrorWithResponse {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
  };
  message: string;
}

/**
 * Type guard for axios error
 */
export function isAxiosError(error: unknown): error is AxiosErrorWithResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  );
}

/**
 * Extract error message from API error (axios or fetch)
 */
export function getApiErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.error || 
           error.response?.data?.message || 
           error.message;
  }
  return getErrorMessage(error);
}

// ============ SERVICE RESULT TYPES ============

/**
 * Standard service result for operations that may fail
 */
export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Create a success result
 */
export function successResult<T>(data: T): ServiceResult<T> {
  return { success: true, data };
}

/**
 * Create an error result
 */
export function errorResult(error: string): ServiceResult<never> {
  return { success: false, error };
}
