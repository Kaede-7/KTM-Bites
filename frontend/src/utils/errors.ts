/**
 * Utility to extract human-readable error messages from Axios/Backend responses.
 * Handles:
 * 1. DRF 'detail' field
 * 2. Custom 'error' field
 * 3. Validation field errors (e.g. {"email": ["..."], "password": ["..."]})
 * 4. Fallback default messages
 */
export const getErrorMessage = (err: any, defaultMsg: string = "Something went wrong. Please try again."): string => {
  const data = err.response?.data;
  
  if (!data) return defaultMsg;

  // 1. Check for 'detail' or 'error' keys
  if (data.detail) return data.detail;
  if (data.error) return data.error;

  // 2. Check for field-level validation errors (get the first one)
  if (typeof data === 'object') {
    const firstKey = Object.keys(data)[0];
    const firstVal = data[firstKey];
    
    if (Array.isArray(firstVal)) {
      return firstVal[0];
    }
    if (typeof firstVal === 'string') {
      return firstVal;
    }
  }

  return defaultMsg;
};
