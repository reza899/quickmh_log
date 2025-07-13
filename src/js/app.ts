import type { 
  LogEntry, 
  Language, 
  ViewId, 
  ToastType, 
  SortConfig, 
  DOMElements
} from '../types/index.js';
import { translations } from './translations.js';
import { PerformanceMonitor } from './performance.js';
import { ErrorHandler, FormValidator, SafeJSON } from './errorHandler.js';
import { SecurityManager, SecureStorage } from './security.js';

// Application class to encapsulate all functionality
class QuickMHLogApp {
  private entries: LogEntry[];
  private currentSort: SortConfig;
  private currentLanguage: Language;
  private currentView: ViewId;
  
  // Performance optimizations
  private renderThrottleTimeout: NodeJS.Timeout | null;
  private lastRenderTime: number;
  private readonly RENDER_THROTTLE_MS: number;
  
  // Memory management
  private eventListeners: Map<string, EventListener>;
  
  // Components
  private performanceMonitor: PerformanceMonitor;
  private errorHandler: ErrorHandler;
  private entryValidator!: FormValidator;
  private dom!: DOMElements;

  constructor() {
    this.entries = [];
    this.currentSort = { column: 'date', direction: 'desc' };
    this.currentLanguage = (localStorage.getItem('quickMHLogLanguage') as Language) || 'en';
    this.currentView = 'assessments-view';
    
    // Performance optimizations
    this.renderThrottleTimeout = null;
    this.lastRenderTime = 0;
    this.RENDER_THROTTLE_MS = 16; // ~60fps
    
    // Memory management
    this.eventListeners = new Map<string, EventListener>();
    
    // Performance monitoring
    this.performanceMonitor = new PerformanceMonitor();
    
    // Error handling
    this.errorHandler = new ErrorHandler();
    this.setupFormValidation();
    
    // Security (initialized but not stored as instance variables)
    new SecurityManager();
    new SecureStorage('quickmh_');
    
    this.initializeDOM();
    this.bindEvents();
    this.init();
  }

  private initializeDOM(): void {
    this.dom = {
      html: document.documentElement as HTMLHtmlElement,
      appTitle: document.getElementById('app-title'),
      appSubtitle: document.getElementById('app-subtitle'),
      langEnBtn: document.getElementById('lang-en'),
      langFaBtn: document.getElementById('lang-fa'),
      views: document.querySelectorAll('.view'),
      navButtons: document.querySelectorAll('.nav-btn'),
      assessmentGrid: document.getElementById('assessment-grid'),
      backToAssessmentsBtn: document.getElementById('back-to-assessments-btn'),
      logEntryForm: document.getElementById('log-entry-form') as HTMLFormElement | null,
      historyTableBody: document.getElementById('history-table-body'),
      historyTableHeaders: document.querySelectorAll('#history-table th[data-sort]'),
      exportCsvBtn: document.getElementById('export-csv-btn'),
      csvImportInput: document.getElementById('csv-import') as HTMLInputElement | null,
      toast: document.getElementById('toast'),
      entryNoteTextarea: document.getElementById('entry-note') as HTMLTextAreaElement | null,
    };
  }

  // Form validation setup
  private setupFormValidation(): void {
    this.entryValidator = new FormValidator(this.errorHandler);
    
    // Add validation rules for log entries
    this.entryValidator.addRule('id', [
      FormValidator.required('Entry ID is required')
    ]);
    
    this.entryValidator.addRule('date', [
      FormValidator.required('Date is required'),
      FormValidator.date('Please enter a valid date')
    ]);
    
    this.entryValidator.addRule('domainKey', [
      FormValidator.required('Assessment type is required'),
      FormValidator.custom(
        (value: unknown) => Object.prototype.hasOwnProperty.call(translations['en'].domains, value as string),
        'Invalid assessment type'
      )
    ]);
    
    this.entryValidator.addRule('score', [
      FormValidator.required('Score is required'),
      FormValidator.number('Score must be a number')
    ]);
    
    this.entryValidator.addRule('note', [
      FormValidator.maxLength(1000, 'Note must not exceed 1000 characters'),
      FormValidator.custom(
        (value: unknown) => {
          if (!value) return true; // Note is optional
          return !SecurityManager.containsMaliciousContent(value);
        },
        'Note contains potentially unsafe content'
      )
    ]);
  }

  // LocalStorage methods with error handling
  private saveEntries(): void {
    try {
      const jsonString = SafeJSON.stringify(this.entries);
      localStorage.setItem('quickMHLogEntries', jsonString);
    } catch (error) {
      this.errorHandler.logStorageError('save', error as Error);
      this.showToast('Failed to save data to local storage', 'error');
    }
  }

  private loadEntries(): void {
    try {
      const storedEntries = localStorage.getItem('quickMHLogEntries');
      if (storedEntries) {
        const parsed = SafeJSON.parse<LogEntry[]>(storedEntries, []);
        this.entries = Array.isArray(parsed) ? parsed : [];
      }
    } catch (error) {
      this.errorHandler.logStorageError('load', error as Error);
      this.showToast('Failed to load data from local storage', 'error');
      this.entries = [];
    }
  }

  // Language and UI methods
  private setLanguage(lang: Language): void {
    if (!['en', 'fa'].includes(lang)) {
      console.warn('Unsupported language:', lang);
      return;
    }

    this.currentLanguage = lang;
    localStorage.setItem('quickMHLogLanguage', lang);

    this.dom.html.lang = lang;
    this.dom.html.dir = lang === 'fa' ? 'rtl' : 'ltr';

    this.dom.langEnBtn?.classList.toggle('active', lang === 'en');
    this.dom.langFaBtn?.classList.toggle('active', lang === 'fa');

    this.updateUIText();
    this.renderAll();
  }

  private updateUIText(): void {
    const t = translations[this.currentLanguage];
    if (!t) return;

    document.title = t.appTitle;
    if (this.dom.appTitle) this.dom.appTitle.textContent = t.appTitle;
    if (this.dom.appSubtitle) this.dom.appSubtitle.textContent = t.appSubtitle;

    const navButtons = {
      'nav-assessments': t.nav.assessments,
      'nav-history': t.nav.history,
      'nav-import-export': t.nav.importExport
    };

    Object.entries(navButtons).forEach(([id, text]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = text;
    });

    if (this.dom.backToAssessmentsBtn) this.dom.backToAssessmentsBtn.innerHTML = t.backBtn;
    if (this.dom.entryNoteTextarea) this.dom.entryNoteTextarea.placeholder = t.form.notePlaceholder;

    // Update all elements with data-i18n attributes
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = (el as HTMLElement).dataset['i18n'];
      if (!key) return;
      
      const keys = key.split('.');
      let text: unknown = t;
      
      try {
        keys.forEach((k) => {
          text = (text as Record<string, unknown>)[k];
        });
        if (text && typeof text === 'string') {
          el.innerHTML = text;
        }
      } catch (error) {
        console.warn('Missing translation key:', key);
      }
    });
  }

  // View management
  private showView(viewId: ViewId): void {
    if (!document.getElementById(viewId)) {
      console.warn('View not found:', viewId);
      return;
    }

    this.currentView = viewId;
    this.dom.views.forEach((view) => view.classList.remove('active'));
    document.getElementById(viewId)?.classList.add('active');

    this.dom.navButtons.forEach((btn) => btn.classList.remove('active'));
    
    // Set active nav button based on view
    if (viewId.includes('assessments') || viewId.includes('domain-detail')) {
      const assessmentsBtn = document.getElementById('nav-assessments');
      if (assessmentsBtn) assessmentsBtn.classList.add('active');
    } else if (viewId.includes('history')) {
      const historyBtn = document.getElementById('nav-history');
      if (historyBtn) historyBtn.classList.add('active');
    } else if (viewId.includes('import-export')) {
      const importExportBtn = document.getElementById('nav-import-export');
      if (importExportBtn) importExportBtn.classList.add('active');
    }
  }

  // Rendering methods
  private renderAll(): void {
    this.throttledRender(() => {
      this.renderAssessmentCards();
      this.renderHistoryTable();
      
      // Re-render detail view if active
      const domainKey = (document.getElementById('domain-key-input') as HTMLInputElement)?.value;
      if (this.currentView === 'domain-detail-view' && domainKey) {
        this.showDomainDetail(domainKey, false);
      }
    });
  }

  // Performance optimization: throttle expensive render operations
  private throttledRender(renderFunction: () => void): void {
    const now = performance.now();
    
    if (now - this.lastRenderTime >= this.RENDER_THROTTLE_MS) {
      this.lastRenderTime = now;
      renderFunction();
    } else {
      if (this.renderThrottleTimeout) {
        clearTimeout(this.renderThrottleTimeout);
      }
      
      this.renderThrottleTimeout = setTimeout(() => {
        this.lastRenderTime = performance.now();
        renderFunction();
        this.renderThrottleTimeout = null;
      }, this.RENDER_THROTTLE_MS);
    }
  }

  private renderAssessmentCards(): void {
    const domainData = translations[this.currentLanguage]?.domains;
    if (!domainData || !this.dom.assessmentGrid) return;

    const scoreRangeText = this.currentLanguage === 'fa' ? 'محدوده نمره' : 'Score Range';
    this.dom.assessmentGrid.innerHTML = '';

    Object.entries(domainData).forEach(([key, domain]) => {
      const card = document.createElement('div');
      card.className = 'assessment-card card';
      card.dataset['key'] = key;
      
      // Safely truncate description
      const description = domain.description || '';
      const truncatedDescription = description.length > 120 
        ? `${description.substring(0, 120)}...`
        : description;

      card.innerHTML = `
        <h3>${this.escapeHtml(domain.name || '')}</h3>
        <p>${this.escapeHtml(truncatedDescription)}</p>
        <span class="score-preview">${scoreRangeText}: ${this.escapeHtml(domain.scoreRange || '')}</span>
      `;
      
      card.addEventListener('click', () => this.showDomainDetail(key));
      if (this.dom.assessmentGrid) {
        this.dom.assessmentGrid.appendChild(card);
      }
    });
  }

  private showDomainDetail(key: string, switchView: boolean = true): void {
    const domain = translations[this.currentLanguage]?.domains?.[key];
    if (!domain) {
      console.warn('Domain not found:', key);
      return;
    }

    // Update detail elements safely
    const detailElements = {
      'detail-title': domain.name,
      'detail-description': domain.description,
      'detail-scoring': domain.scoring,
      'detail-clinical-note': domain.clinicalNote
    };

    Object.entries(detailElements).forEach(([id, text]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = text || '';
    });

    // Render measures list
    const measuresList = document.getElementById('detail-measures');
    if (measuresList && domain.measures) {
      measuresList.innerHTML = '';
      domain.measures.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        measuresList.appendChild(li);
      });
    }

    // Render interpretation table
    const interpretationTable = document.getElementById('interpretation-table');
    if (interpretationTable && domain.interpretation) {
      const t = translations[this.currentLanguage];
      interpretationTable.innerHTML = `
        <thead>
          <tr>
            <th>${this.escapeHtml(t.detail.scoring)}</th>
            <th>${this.escapeHtml(t.detail.interpretation)}</th>
          </tr>
        </thead>
        <tbody>
          ${domain.interpretation.map(item => `
            <tr>
              <td>${this.escapeHtml(item.range)}</td>
              <td>${this.escapeHtml(item.level)}</td>
            </tr>
          `).join('')}
        </tbody>
      `;
    }

    // Update form
    const domainKeyInput = document.getElementById('domain-key-input') as HTMLInputElement;
    const entryDateInput = document.getElementById('entry-date') as HTMLInputElement;
    
    if (domainKeyInput) {
      domainKeyInput.value = key;
    }
    if (entryDateInput) entryDateInput.value = new Date().toISOString().split('T')[0];

    if (switchView) {
      this.showView('domain-detail-view');
    }
  }

  // Utility method for HTML escaping
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Continue with remaining methods...
  // Due to length constraints, I'll need to continue this in parts
  
  private bindEvents(): void {
    // Language switcher events
    this.addEventListenerWithCleanup(this.dom.langEnBtn, 'click', () => this.setLanguage('en'));
    this.addEventListenerWithCleanup(this.dom.langFaBtn, 'click', () => this.setLanguage('fa'));

    // Navigation events
    this.dom.navButtons.forEach((btn) => {
      this.addEventListenerWithCleanup(btn, 'click', (e) => {
        const viewId = (e.target as HTMLElement).dataset['view'] as ViewId;
        if (viewId) this.showView(viewId);
      });
    });

    // Back button
    this.addEventListenerWithCleanup(this.dom.backToAssessmentsBtn, 'click', () => this.showView('assessments-view'));

    // Form submission
    this.addEventListenerWithCleanup(this.dom.logEntryForm, 'submit', (e) => this.handleFormSubmit(e as SubmitEvent));

    // Table sorting
    this.dom.historyTableHeaders.forEach((header) => {
      this.addEventListenerWithCleanup(header, 'click', () => {
        const column = (header as HTMLElement).dataset['sort'] as keyof LogEntry;
        if (column) this.sortTable(column);
      });
    });

    // Export/Import
    this.addEventListenerWithCleanup(this.dom.exportCsvBtn, 'click', () => this.exportToCsv());
    this.addEventListenerWithCleanup(this.dom.csvImportInput, 'change', (e) => this.handleCsvImport(e as Event));

    // Toast close
    const toastCloseBtn = document.getElementById('toast-close');
    this.addEventListenerWithCleanup(toastCloseBtn, 'click', () => this.hideToast());
  }

  private addEventListenerWithCleanup(
    element: Element | null, 
    event: string, 
    handler: EventListener
  ): void {
    if (!element) return;
    
    const key = `${element.id || element.className}-${event}`;
    
    // Remove existing listener if present
    const existingHandler = this.eventListeners.get(key);
    if (existingHandler) {
      element.removeEventListener(event, existingHandler);
    }
    
    // Add new listener
    element.addEventListener(event, handler);
    this.eventListeners.set(key, handler);
  }

  private init(): void {
    this.loadEntries();
    this.setLanguage(this.currentLanguage);
    this.showView('assessments-view');
  }

  private handleFormSubmit(e: SubmitEvent): void {
    e.preventDefault();
    this.saveEntry();
  }

  private saveEntry(): void {
    if (!this.dom.logEntryForm) return;

    const formData = new FormData(this.dom.logEntryForm);
    const entry: Partial<LogEntry> = {
      id: Date.now().toString(),
      date: formData.get('date') as string,
      domainKey: formData.get('domainKey') as string,
      score: Number(formData.get('score')),
      note: SecurityManager.sanitizeInput(formData.get('note') as string || '')
    };

    // Validate entry
    const validation = this.entryValidator.validate(entry);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0]?.[0];
      this.showToast(firstError || 'Validation failed', 'error');
      return;
    }

    this.entries.push(entry as LogEntry);
    this.saveEntries();
    this.showToast(translations[this.currentLanguage].toast.saved, 'success');
    this.dom.logEntryForm.reset();
    this.renderHistoryTable();
  }

  private sortTable(column: keyof LogEntry): void {
    if (this.currentSort.column === column) {
      this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSort = { column, direction: 'asc' };
    }
    this.renderHistoryTable();
  }

  private renderHistoryTable(): void {
    if (!this.dom.historyTableBody) return;

    const t = translations[this.currentLanguage];
    if (!t) return;

    if (this.entries.length === 0) {
      this.dom.historyTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center">${this.escapeHtml(t.history.empty)}</td>
        </tr>
      `;
      return;
    }

    // Sort entries
    const sortedEntries = [...this.entries].sort((a, b) => {
      const aVal = a[this.currentSort.column];
      const bVal = b[this.currentSort.column];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return this.currentSort.direction === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return this.currentSort.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      return 0;
    });

    this.dom.historyTableBody.innerHTML = sortedEntries.map(entry => {
      const domain = t.domains[entry.domainKey];
      const domainName = domain ? domain.name : entry.domainKey;
      
      return `
        <tr>
          <td>${this.escapeHtml(entry.date)}</td>
          <td>${this.escapeHtml(domainName)}</td>
          <td>${entry.score}</td>
          <td>${this.escapeHtml(entry.note || '')}</td>
          <td>
            <button onclick="app.deleteEntry('${entry.id}')" class="btn-delete" title="${this.escapeHtml(t.confirmDelete)}">
              🗑️
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  deleteEntry(id: string): void {
    const t = translations[this.currentLanguage];
    if (!confirm(t.confirmDelete)) return;

    this.entries = this.entries.filter(entry => entry.id !== id);
    this.saveEntries();
    this.showToast(t.toast.deleted, 'success');
    this.renderHistoryTable();
  }

  private exportToCsv(): void {
    const t = translations[this.currentLanguage];
    
    if (this.entries.length === 0) {
      this.showToast(t.toast.noDataToExport, 'error');
      return;
    }

    const headers = ['id', 'date', 'domainKey', 'score', 'note'];
    const csvContent = [
      headers.join(','),
      ...this.entries.map(entry => headers.map(header => 
        JSON.stringify(entry[header as keyof LogEntry] || '')
      ).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quickmh-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    this.showToast(t.toast.exported, 'success');
  }

  private handleCsvImport(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        const newEntries: LogEntry[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const entry: Partial<LogEntry> = {};
          
          headers.forEach((header, index) => {
            if (header === 'score') {
              entry[header] = Number(values[index]);
            } else {
              entry[header as keyof LogEntry] = values[index] as never;
            }
          });
          
          if (entry.id && entry.date && entry.domainKey && typeof entry.score === 'number') {
            newEntries.push(entry as LogEntry);
          }
        }
        
        const existingIds = new Set(this.entries.map(e => e.id));
        const uniqueNewEntries = newEntries.filter(e => !existingIds.has(e.id));
        
        this.entries.push(...uniqueNewEntries);
        this.saveEntries();
        this.renderHistoryTable();
        
        const t = translations[this.currentLanguage];
        this.showToast(t.toast.imported(uniqueNewEntries.length), 'success');
        
      } catch (error) {
        const t = translations[this.currentLanguage];
        this.showToast(t.toast.importError, 'error');
      }
    };
    
    reader.readAsText(file);
  }

  private showToast(message: string, type: ToastType = 'success'): void {
    if (!this.dom.toast) return;

    this.dom.toast.textContent = message;
    this.dom.toast.className = `toast show ${type}`;
    
    setTimeout(() => this.hideToast(), 3000);
  }

  private hideToast(): void {
    if (!this.dom.toast) return;
    this.dom.toast.classList.remove('show');
  }

  // Cleanup method for memory management
  destroy(): void {
    // Clear event listeners
    this.eventListeners.forEach((handler, key) => {
      const [elementId, event] = key.split('-');
      const element = document.getElementById(elementId) || document.querySelector(`.${elementId}`);
      if (element) {
        element.removeEventListener(event, handler);
      }
    });
    this.eventListeners.clear();

    // Clear timeouts
    if (this.renderThrottleTimeout) {
      clearTimeout(this.renderThrottleTimeout);
    }

    // Reset performance monitor
    this.performanceMonitor.reset();
  }
}

// Initialize the application
const app = new QuickMHLogApp();

// Make app available globally for backwards compatibility
(window as unknown as { app: QuickMHLogApp }).app = app;

export default QuickMHLogApp;