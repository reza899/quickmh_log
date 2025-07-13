import type { CSPViolation, BrowserFingerprint, SecurityValidationResult, ValidationInputType } from '../types/index.js';

// Security utilities and Content Security Policy helpers
export class SecurityManager {
  private cspViolations: CSPViolation[];

  constructor() {
    this.cspViolations = [];
    this.setupCSPReporting();
  }

  // Content Security Policy violation reporting
  private setupCSPReporting(): void {
    document.addEventListener('securitypolicyviolation', (event: SecurityPolicyViolationEvent) => {
      const violation: CSPViolation = {
        timestamp: new Date().toISOString(),
        directive: event.violatedDirective,
        blockedURI: event.blockedURI,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber,
        columnNumber: event.columnNumber,
        originalPolicy: event.originalPolicy
      };
      
      this.cspViolations.push(violation);
      console.warn('CSP Violation:', violation);
      
      // Keep only last 50 violations
      if (this.cspViolations.length > 50) {
        this.cspViolations = this.cspViolations.slice(-50);
      }
    });
  }

  // Get CSP violations for debugging
  getCSPViolations(): CSPViolation[] {
    return this.cspViolations;
  }

  // Input sanitization
  static sanitizeInput(input: unknown): string {
    if (typeof input !== 'string') {
      return String(input);
    }

    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/data:/gi, '') // Remove data: protocol
      .trim();
  }

  // HTML sanitization (more aggressive)
  static sanitizeHTML(html: unknown): string {
    if (typeof html !== 'string') {
      return '';
    }

    // Create a temporary div to use browser's HTML parsing
    const temp = document.createElement('div');
    temp.textContent = html; // This will escape HTML entities
    return temp.innerHTML;
  }

  // URL validation
  static isValidURL(url: string): boolean {
    try {
      const urlObj = new URL(url);
      // Only allow http and https protocols
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  // Check for malicious patterns in text
  static containsMaliciousContent(text: unknown): boolean {
    if (typeof text !== 'string') {
      return false;
    }

    const maliciousPatterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[\s\S]*?>/gi,
      /<object[\s\S]*?>/gi,
      /<embed[\s\S]*?>/gi,
      /<form[\s\S]*?>/gi,
      /eval\s*\(/gi,
      /function\s*\(/gi,
      /setTimeout\s*\(/gi,
      /setInterval\s*\(/gi
    ];

    return maliciousPatterns.some(pattern => pattern.test(text));
  }

  // Rate limiting for API calls
  static createRateLimiter(maxCalls: number, timeWindow: number): <T>(fn: () => T) => T {
    const calls: number[] = [];
    
    return function<T>(fn: () => T): T {
      const now = Date.now();
      
      // Remove old calls outside the time window
      while (calls.length > 0 && calls[0] < now - timeWindow) {
        calls.shift();
      }
      
      if (calls.length >= maxCalls) {
        throw new Error('Rate limit exceeded');
      }
      
      calls.push(now);
      return fn();
    };
  }

  // Generate secure random tokens
  static generateSecureToken(length: number = 16): string {
    if (crypto && crypto.getRandomValues) {
      const array = new Uint8Array(length);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    } 
    // Fallback for older browsers
    return Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  // Constant-time string comparison to prevent timing attacks
  static constantTimeEquals(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  // Browser fingerprinting detection
  static detectBrowserFingerprinting(): BrowserFingerprint {
    const fingerprint: BrowserFingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cookieEnabled: navigator.cookieEnabled,
      hasLocalStorage: !!window.localStorage,
      hasSessionStorage: !!window.sessionStorage
    };

    return fingerprint;
  }
}

// Secure localStorage wrapper
export class SecureStorage {
  private keyPrefix: string;
  private isAvailable: boolean;

  constructor(keyPrefix: string = 'quickmh_') {
    this.keyPrefix = keyPrefix;
    this.isAvailable = this.checkAvailability();
  }

  private checkAvailability(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  // Encrypt data before storing (simple XOR for demonstration)
  private encrypt(data: unknown, key: string = 'default'): string {
    let dataStr: string;
    if (typeof data !== 'string') {
      dataStr = JSON.stringify(data);
    } else {
      dataStr = data;
    }

    let result = '';
    for (let i = 0; i < dataStr.length; i++) {
      result += String.fromCharCode(
        dataStr.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return btoa(result); // Base64 encode
  }

  // Decrypt data after retrieving
  private decrypt(encryptedData: string, key: string = 'default'): string | null {
    try {
      const data = atob(encryptedData); // Base64 decode
      let result = '';
      for (let i = 0; i < data.length; i++) {
        result += String.fromCharCode(
          data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
      return result;
    } catch {
      return null;
    }
  }

  setItem(key: string, value: unknown, encrypt: boolean = false): boolean {
    if (!this.isAvailable) {
      throw new Error('Storage not available');
    }

    const fullKey = this.keyPrefix + key;
    let dataToStore: string;

    if (encrypt) {
      dataToStore = this.encrypt(value);
    } else if (typeof value !== 'string') {
      dataToStore = JSON.stringify(value);
    } else {
      dataToStore = value;
    }

    try {
      localStorage.setItem(fullKey, dataToStore);
      return true;
    } catch (error) {
      console.error('Failed to store data:', error);
      return false;
    }
  }

  getItem<T = unknown>(key: string, decrypt: boolean = false): T | null {
    if (!this.isAvailable) {
      return null;
    }

    const fullKey = this.keyPrefix + key;
    try {
      const value = localStorage.getItem(fullKey);
      if (value === null) {
        return null;
      }

      if (decrypt) {
        const decrypted = this.decrypt(value);
        if (decrypted === null) {
          return null;
        }
        try {
          return JSON.parse(decrypted) as T;
        } catch {
          return decrypted as T;
        }
      }

      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    } catch (error) {
      console.error('Failed to retrieve data:', error);
      return null;
    }
  }

  removeItem(key: string): boolean {
    if (!this.isAvailable) {
      return false;
    }

    const fullKey = this.keyPrefix + key;
    try {
      localStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error('Failed to remove data:', error);
      return false;
    }
  }

  clear(): boolean {
    if (!this.isAvailable) {
      return false;
    }

    try {
      // Only remove items with our prefix
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.keyPrefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Failed to clear data:', error);
      return false;
    }
  }
}

// Input validation security wrapper
export class SecureValidator {
  static validateAndSanitize(
    input: unknown, 
    type: ValidationInputType = 'text', 
    options: { maxLength?: number; minLength?: number } = {}
  ): SecurityValidationResult {
    if (input === null || input === undefined) {
      return { isValid: false, sanitized: '', error: 'Input is required' };
    }

    // Convert to string for processing
    const value = String(input);

    // Check for malicious content first
    if (SecurityManager.containsMaliciousContent(value)) {
      return { isValid: false, sanitized: '', error: 'Input contains potentially malicious content' };
    }

    // Sanitize based on type
    let sanitized = value;
    switch (type) {
      case 'text':
        sanitized = SecurityManager.sanitizeInput(value);
        break;
      case 'html':
        sanitized = SecurityManager.sanitizeHTML(value);
        break;
      case 'number':
        sanitized = value.replace(/[^\d.-]/g, '');
        break;
      case 'date':
        // Basic date format validation
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return { isValid: false, sanitized: '', error: 'Invalid date format' };
        }
        sanitized = value;
        break;
      case 'email':
        sanitized = value.toLowerCase().trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized)) {
          return { isValid: false, sanitized: '', error: 'Invalid email format' };
        }
        break;
      default:
        sanitized = SecurityManager.sanitizeInput(value);
    }

    // Apply length limits
    const maxLength = options.maxLength || 10000;
    if (sanitized.length > maxLength) {
      return { isValid: false, sanitized: sanitized.substring(0, maxLength), error: `Input too long (max ${maxLength} characters)` };
    }

    const minLength = options.minLength || 0;
    if (sanitized.length < minLength) {
      return { isValid: false, sanitized, error: `Input too short (min ${minLength} characters)` };
    }

    return { isValid: true, sanitized, error: null };
  }
}