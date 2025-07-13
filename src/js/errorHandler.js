// Centralized error handling and logging
export class ErrorHandler {
  constructor() {
    this.errors = [];
    this.maxErrors = 100; // Keep only the last 100 errors
    this.isProduction = import.meta.env.PROD;
    
    // Setup global error handlers
    this.setupGlobalHandlers();
  }

  setupGlobalHandlers() {
    // Handle uncaught JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError('JavaScript Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError('Unhandled Promise Rejection', {
        reason: event.reason,
        stack: event.reason?.stack
      });
    });
  }

  logError(type, details) {
    const error = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.errors.push(error);
    
    // Keep only the last maxErrors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log to console in development
    if (!this.isProduction) {
      console.error(`[${type}]`, details);
    }

    // You could send errors to a logging service here
    // this.sendToLoggingService(error);
  }

  // Application-specific error types
  logStorageError(operation, error) {
    this.logError('Storage Error', {
      operation,
      error: error.message,
      stack: error.stack
    });
  }

  logValidationError(field, value, rule) {
    this.logError('Validation Error', {
      field,
      value: typeof value === 'string' ? value.substring(0, 100) : value,
      rule
    });
  }

  logNetworkError(url, error) {
    this.logError('Network Error', {
      url,
      error: error.message,
      stack: error.stack
    });
  }

  logRenderError(component, error) {
    this.logError('Render Error', {
      component,
      error: error.message,
      stack: error.stack
    });
  }

  // Get error statistics
  getErrorStats() {
    const stats = {
      total: this.errors.length,
      byType: {},
      recent: this.errors.slice(-10)
    };

    this.errors.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
    });

    return stats;
  }

  // Clear error log
  clearErrors() {
    this.errors = [];
  }

  // Export errors for debugging
  exportErrors() {
    return JSON.stringify(this.errors, null, 2);
  }
}

// Input validation utilities
export class Validator {
  static isRequired(value) {
    return value !== null && value !== undefined && value !== '';
  }

  static isNumber(value) {
    return !isNaN(value) && !isNaN(parseFloat(value));
  }

  static isInteger(value) {
    return Number.isInteger(Number(value));
  }

  static isInRange(value, min, max) {
    const num = Number(value);
    return num >= min && num <= max;
  }

  static isDate(value) {
    const date = new Date(value);
    return date instanceof Date && !isNaN(date);
  }

  static isValidDomainKey(key, availableDomains) {
    return availableDomains && Object.prototype.hasOwnProperty.call(availableDomains, key);
  }

  static maxLength(value, max) {
    return typeof value === 'string' && value.length <= max;
  }

  static minLength(value, min) {
    return typeof value === 'string' && value.length >= min;
  }

  static isEmail(value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  static isSafeString(value) {
    // Check for potentially dangerous characters
    const dangerousChars = /<script|javascript:|on\w+=/i;
    return !dangerousChars.test(value);
  }
}

// Form validation helper
export class FormValidator {
  constructor(errorHandler) {
    this.errorHandler = errorHandler;
    this.rules = new Map();
  }

  addRule(field, validators) {
    this.rules.set(field, validators);
  }

  validate(data) {
    const errors = {};
    let isValid = true;

    for (const [field, validators] of this.rules) {
      const value = data[field];
      const fieldErrors = [];

      for (const validator of validators) {
        try {
          if (!validator.validate(value)) {
            fieldErrors.push(validator.message);
            isValid = false;
            
            if (this.errorHandler) {
              this.errorHandler.logValidationError(field, value, validator.message);
            }
          }
        } catch (error) {
          fieldErrors.push('Validation error occurred');
          isValid = false;
          
          if (this.errorHandler) {
            this.errorHandler.logError('Validator Error', {
              field,
              validator: validator.message,
              error: error.message
            });
          }
        }
      }

      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }
    }

    return { isValid, errors };
  }

  // Common validation rule builders
  static required(message = 'This field is required') {
    return {
      validate: (value) => Validator.isRequired(value),
      message
    };
  }

  static number(message = 'Must be a valid number') {
    return {
      validate: (value) => Validator.isNumber(value),
      message
    };
  }

  static range(min, max, message = `Must be between ${min} and ${max}`) {
    return {
      validate: (value) => Validator.isInRange(value, min, max),
      message
    };
  }

  static maxLength(max, message = `Must not exceed ${max} characters`) {
    return {
      validate: (value) => Validator.maxLength(value, max),
      message
    };
  }

  static date(message = 'Must be a valid date') {
    return {
      validate: (value) => Validator.isDate(value),
      message
    };
  }

  static custom(validateFn, message) {
    return {
      validate: validateFn,
      message
    };
  }
}

// Retry mechanism for failed operations
export class RetryHandler {
  static async withRetry(operation, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    throw lastError;
  }
}

// Safe JSON operations
export class SafeJSON {
  static parse(str, defaultValue = null) {
    try {
      return JSON.parse(str);
    } catch {
      return defaultValue;
    }
  }

  static stringify(obj, defaultValue = '{}') {
    try {
      return JSON.stringify(obj);
    } catch {
      return defaultValue;
    }
  }
}