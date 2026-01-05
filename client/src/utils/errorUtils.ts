/**
 * Utility functions for handling errors throughout the application
 */

/**
 * Safely extracts an error message string from various error types
 * Prevents React Error #31 by ensuring we never return an object
 */
export const getErrorMessage = (err: any): string => {
  // If it's already a string, return it
  if (typeof err === 'string') return err;
  
  // Handle null/undefined
  if (!err) return 'An unexpected error occurred';
  
  // Handle Axios error response
  if (err?.response?.data) {
    const data = err.response.data;
    if (typeof data.error === 'string') return data.error;
    if (typeof data.message === 'string') return data.message;
    if (data.error && typeof data.error === 'object') {
      return data.error.message || JSON.stringify(data.error);
    }
  }
  
  // Handle standard Error objects
  if (err?.message && typeof err.message === 'string') return err.message;
  
  // Handle error objects with code and message
  if (err?.code && err?.message) {
    return typeof err.message === 'string' ? err.message : 'An error occurred';
  }
  
  // Last resort - try to stringify, but avoid [object Object]
  try {
    const str = JSON.stringify(err);
    return str !== '{}' ? str : 'An unexpected error occurred';
  } catch {
    return 'An unexpected error occurred';
  }
};

/**
 * Checks if an error is a network error
 */
export const isNetworkError = (err: any): boolean => {
  return err?.code === 'ERR_NETWORK' || 
         err?.message?.includes('Network Error') ||
         err?.message?.includes('ERR_CONNECTION_REFUSED');
};

/**
 * Checks if an error is an authentication error
 */
export const isAuthError = (err: any): boolean => {
  return err?.response?.status === 401 || err?.response?.status === 403;
};
