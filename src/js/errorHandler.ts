import type { ErrorInfo, ValidationRule, ValidationResult, ValidationFunction } from '../types/index.js';

// Centralized error handling and logging
export class ErrorHandler {
  private errors: ErrorInfo[];
  private maxErrors: number;
  private isProduction: boolean;

  constructor() {
    this.errors = [];
    this.maxErrors = 100; // Keep only the last 100 errors
    this.isProduction = (import.meta as unknown as { env: { PROD: boolean } }).env.PROD;
    
    // Setup global error handlers
    this.setupGlobalHandlers();
  }

  private setupGlobalHandlers(): void {
    // Handle uncaught JavaScript errors
    window.addEventListener('error', (event: ErrorEvent) => {
      this.logError('JavaScript Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      this.logError('Unhandled Promise Rejection', {
        reason: event.reason,
        stack: event.reason?.stack
      });
    });
  }

  logError(type: string, details: Record<string, unknown>): void {
    const error: ErrorInfo = {
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
  logStorageError(operation: string, error: Error): void {
    this.logError('Storage Error', {
      operation,
      error: error.message,
      stack: error.stack
    });
  }

  logValidationError(field: string, value: unknown, rule: string): void {
    this.logError('Validation Error', {
      field,
      value: typeof value === 'string' ? value.substring(0, 100) : value,
      rule
    });
  }

  logNetworkError(url: string, error: Error): void {
    this.logError('Network Error', {
      url,
      error: error.message,
      stack: error.stack
    });
  }

  logRenderError(component: string, error: Error): void {
    this.logError('Render Error', {
      component,
      error: error.message,
      stack: error.stack
    });
  }

  // Get error statistics
  getErrorStats(): {
    total: number;
    byType: Record<string, number>;
    recent: ErrorInfo[];
  } {
    const stats = {
      total: this.errors.length,
      byType: {} as Record<string, number>,
      recent: this.errors.slice(-10)
    };

    this.errors.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
    });

    return stats;
  }

  // Clear error log
  clearErrors(): void {
    this.errors = [];
  }

  // Export errors for debugging
  exportErrors(): string {
    return JSON.stringify(this.errors, null, 2);
  }
}

// Input validation utilities
export class Validator {
  static isRequired(value: unknown): boolean {
    return value !== null && value !== undefined && value !== '';
  }

  static isNumber(value: unknown): boolean {
    return !isNaN(value as number) && !isNaN(parseFloat(value as string));
  }

  static isInteger(value: unknown): boolean {
    return Number.isInteger(Number(value));
  }

  static isInRange(value: unknown, min: number, max: number): boolean {
    const num = Number(value);
    return num >= min && num <= max;
  }

  static isDate(value: unknown): boolean {
    const date = new Date(value as string);
    return date instanceof Date && !isNaN(date.getTime());
  }

  static isValidDomainKey(key: string, availableDomains: Record<string, unknown>): boolean {
    return availableDomains && Object.prototype.hasOwnProperty.call(availableDomains, key);
  }

  static maxLength(value: unknown, max: number): boolean {
    return typeof value === 'string' && value.length <= max;
  }

  static minLength(value: unknown, min: number): boolean {
    return typeof value === 'string' && value.length >= min;
  }

  static isEmail(value: unknown): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return typeof value === 'string' && emailRegex.test(value);
  }

  static isSafeString(value: unknown): boolean {
    if (typeof value !== 'string') return true;
    // Check for potentially dangerous characters
    const dangerousChars = /<script|javascript:|on\w+=/i;
    return !dangerousChars.test(value);
  }
}

// Form validation helper
export class FormValidator {
  private errorHandler: ErrorHandler | null;
  private rules: Map<string, ValidationRule[]>;

  constructor(errorHandler?: ErrorHandler) {
    this.errorHandler = errorHandler || null;
    this.rules = new Map<string, ValidationRule[]>();
  }

  addRule(field: string, validators: ValidationRule[]): void {
    this.rules.set(field, validators);
  }

  validate(data: Record<string, unknown>): ValidationResult {
    const errors: Record<string, string[]> = {};
    let isValid = true;

    for (const [field, validators] of this.rules) {
      const value = data[field];
      const fieldErrors: string[] = [];

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
              error: (error as Error).message
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
  static required(message: string = 'This field is required'): ValidationRule {
    return {
      validate: (value: unknown) => Validator.isRequired(value),
      message
    };
  }

  static number(message: string = 'Must be a valid number'): ValidationRule {
    return {
      validate: (value: unknown) => Validator.isNumber(value),
      message
    };
  }

  static range(min: number, max: number, message: string = `Must be between ${min} and ${max}`): ValidationRule {
    return {
      validate: (value: unknown) => Validator.isInRange(value, min, max),
      message
    };
  }

  static maxLength(max: number, message: string = `Must not exceed ${max} characters`): ValidationRule {
    return {
      validate: (value: unknown) => Validator.maxLength(value, max),
      message
    };
  }

  static date(message: string = 'Must be a valid date'): ValidationRule {
    return {
      validate: (value: unknown) => Validator.isDate(value),
      message
    };
  }

  static custom(validateFn: ValidationFunction, message: string): ValidationRule {
    return {
      validate: validateFn,
      message
    };
  }
}

// Retry mechanism for failed operations
export class RetryHandler {
  static async withRetry<T>(
    operation: () => Promise<T>, 
    maxRetries: number = 3, 
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    throw lastError!;
  }
}

// Safe JSON operations
export class SafeJSON {
  static parse<T = unknown>(str: string, defaultValue: T | null = null): T | null {
    try {
      return JSON.parse(str) as T;
    } catch {
      return defaultValue;
    }
  }

  static stringify(obj: unknown, defaultValue: string = '{}'): string {
    try {
      return JSON.stringify(obj);
    } catch {
      return defaultValue;
    }
  }
}