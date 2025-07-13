// Type definitions for QuickMH Log application

export interface LogEntry {
  id: string;
  date: string;
  domainKey: string;
  score: number;
  note: string;
}

export interface ScoreInterpretation {
  range: string;
  level: string;
}

export interface DomainInfo {
  name: string;
  description: string;
  scoreRange: string;
  measures: string[];
  scoring: string;
  interpretation: ScoreInterpretation[];
  clinicalNote: string;
}

export interface Translations {
  appTitle: string;
  appSubtitle: string;
  nav: {
    assessments: string;
    history: string;
    importExport: string;
  };
  backBtn: string;
  detail: {
    description: string;
    measures: string;
    scoring: string;
    interpretation: string;
    clinicalNote: string;
  };
  form: {
    title: string;
    date: string;
    score: string;
    note: string;
    notePlaceholder: string;
    save: string;
  };
  history: {
    title: string;
    subtitle: string;
    table: {
      date: string;
      domain: string;
      score: string;
      note: string;
      actions: string;
    };
    empty: string;
  };
  importExport: {
    title: string;
    exportSubtitle: string;
    exportBtn: string;
    importTitle: string;
    importSubtitle: string;
  };
  toast: {
    saved: string;
    deleted: string;
    exported: string;
    imported: (count: number) => string;
    importError: string;
    noDataToExport: string;
  };
  confirmDelete: string;
  domains: Record<string, DomainInfo>;
}

export interface SortConfig {
  column: keyof LogEntry;
  direction: 'asc' | 'desc';
}

export interface DOMElements {
  html: HTMLHtmlElement;
  appTitle: HTMLElement | null;
  appSubtitle: HTMLElement | null;
  langEnBtn: HTMLElement | null;
  langFaBtn: HTMLElement | null;
  views: NodeListOf<Element>;
  navButtons: NodeListOf<Element>;
  assessmentGrid: HTMLElement | null;
  backToAssessmentsBtn: HTMLElement | null;
  logEntryForm: HTMLFormElement | null;
  historyTableBody: HTMLElement | null;
  historyTableHeaders: NodeListOf<Element>;
  exportCsvBtn: HTMLElement | null;
  csvImportInput: HTMLInputElement | null;
  toast: HTMLElement | null;
  entryNoteTextarea: HTMLTextAreaElement | null;
}

export interface PerformanceMetrics {
  count: number;
  totalTime: number;
  averageTime: number;
  lastTime: number;
}

export interface ErrorInfo {
  id: string;
  timestamp: string;
  type: string;
  details: Record<string, unknown>;
  userAgent: string;
  url: string;
}

export interface ValidationRule {
  validate: (value: unknown) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

export interface SecurityValidationResult {
  isValid: boolean;
  sanitized: string;
  error: string | null;
}

export interface MemoryUsage {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usagePercentage: number;
}

export interface CSPViolation {
  timestamp: string;
  directive: string;
  blockedURI: string;
  sourceFile: string;
  lineNumber: number;
  columnNumber: number;
  originalPolicy: string;
}

export interface BrowserFingerprint {
  userAgent: string;
  language: string;
  platform: string;
  screenResolution: string;
  timezone: string;
  cookieEnabled: boolean;
  hasLocalStorage: boolean;
  hasSessionStorage: boolean;
}

export type Language = 'en' | 'fa';
export type ViewId = 'assessments-view' | 'domain-detail-view' | 'history-view' | 'import-export-view';
export type ToastType = 'success' | 'error';
export type ValidationInputType = 'text' | 'html' | 'number' | 'date' | 'email';

// Event handler types
export type EventHandler<T = Event> = (event: T) => void;
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>;

// Utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Function types
export type ValidationFunction = (value: unknown) => boolean;
export type ThrottledFunction<T extends unknown[]> = (...args: T) => void;
export type DebouncedFunction<T extends unknown[]> = (...args: T) => void;