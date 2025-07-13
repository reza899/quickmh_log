import { translations } from './translations.js';
import { PerformanceMonitor } from './performance.js';
import { ErrorHandler, FormValidator, SafeJSON } from './errorHandler.js';
import { SecurityManager, SecureStorage } from './security.js';

// Application class to encapsulate all functionality
class QuickMHLogApp {
  constructor() {
    this.entries = [];
    this.currentSort = { column: 'date', direction: 'desc' };
    this.currentLanguage = localStorage.getItem('quickMHLogLanguage') || 'en';
    this.currentView = 'assessments-view';
    
    // Performance optimizations
    this.renderThrottleTimeout = null;
    this.lastRenderTime = 0;
    this.RENDER_THROTTLE_MS = 16; // ~60fps
    
    // Memory management
    this.eventListeners = new Map();
    
    // Performance monitoring
    this.performanceMonitor = new PerformanceMonitor();
    
    // Error handling
    this.errorHandler = new ErrorHandler();
    this.setupFormValidation();
    
    // Security
    this.securityManager = new SecurityManager();
    this.secureStorage = new SecureStorage('quickmh_');
    
    this.initializeDOM();
    this.bindEvents();
    this.init();
  }

  initializeDOM() {
    this.dom = {
      html: document.documentElement,
      appTitle: document.getElementById('app-title'),
      appSubtitle: document.getElementById('app-subtitle'),
      langEnBtn: document.getElementById('lang-en'),
      langFaBtn: document.getElementById('lang-fa'),
      views: document.querySelectorAll('.view'),
      navButtons: document.querySelectorAll('.nav-btn'),
      assessmentGrid: document.getElementById('assessment-grid'),
      backToAssessmentsBtn: document.getElementById('back-to-assessments-btn'),
      logEntryForm: document.getElementById('log-entry-form'),
      historyTableBody: document.getElementById('history-table-body'),
      historyTableHeaders: document.querySelectorAll('#history-table th[data-sort]'),
      exportCsvBtn: document.getElementById('export-csv-btn'),
      csvImportInput: document.getElementById('csv-import'),
      toast: document.getElementById('toast'),
      entryNoteTextarea: document.getElementById('entry-note'),
    };
  }

  // Form validation setup
  setupFormValidation() {
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
        (value) => Object.prototype.hasOwnProperty.call(translations.en.domains, value),
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
        (value) => {
          if (!value) {return true;} // Note is optional
          return !SecurityManager.containsMaliciousContent(value);
        },
        'Note contains potentially unsafe content'
      )
    ]);
  }

  // LocalStorage methods with error handling
  saveEntries() {
    try {
      const jsonString = SafeJSON.stringify(this.entries);
      localStorage.setItem('quickMHLogEntries', jsonString);
    } catch (error) {
      this.errorHandler.logStorageError('save', error);
      this.showToast('Failed to save data to local storage', 'error');
    }
  }

  loadEntries() {
    try {
      const storedEntries = localStorage.getItem('quickMHLogEntries');
      if (storedEntries) {
        const parsed = SafeJSON.parse(storedEntries, []);
        this.entries = Array.isArray(parsed) ? parsed : [];
      }
    } catch (error) {
      this.errorHandler.logStorageError('load', error);
      this.showToast('Failed to load data from local storage', 'error');
      this.entries = [];
    }
  }

  // Language and UI methods
  setLanguage(lang) {
    if (!['en', 'fa'].includes(lang)) {
      console.warn('Unsupported language:', lang);
      return;
    }

    this.currentLanguage = lang;
    localStorage.setItem('quickMHLogLanguage', lang);

    this.dom.html.lang = lang;
    this.dom.html.dir = lang === 'fa' ? 'rtl' : 'ltr';

    this.dom.langEnBtn.classList.toggle('active', lang === 'en');
    this.dom.langFaBtn.classList.toggle('active', lang === 'fa');

    this.updateUIText();
    this.renderAll();
  }

  updateUIText() {
    const t = translations[this.currentLanguage];
    if (!t) {return;}

    document.title = t.appTitle;
    this.dom.appTitle.textContent = t.appTitle;
    this.dom.appSubtitle.textContent = t.appSubtitle;

    const navButtons = {
      'nav-assessments': t.nav.assessments,
      'nav-history': t.nav.history,
      'nav-import-export': t.nav.importExport
    };

    Object.entries(navButtons).forEach(([id, text]) => {
      const element = document.getElementById(id);
      if (element) {element.textContent = text;}
    });

    this.dom.backToAssessmentsBtn.innerHTML = t.backBtn;
    this.dom.entryNoteTextarea.placeholder = t.form.notePlaceholder;

    // Update all elements with data-i18n attributes
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      const keys = key.split('.');
      let text = t;
      
      try {
        keys.forEach((k) => {
          text = text[k];
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
  showView(viewId) {
    if (!document.getElementById(viewId)) {
      console.warn('View not found:', viewId);
      return;
    }

    this.currentView = viewId;
    this.dom.views.forEach((view) => view.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');

    this.dom.navButtons.forEach((btn) => btn.classList.remove('active'));
    
    // Set active nav button based on view
    if (viewId.includes('assessments') || viewId.includes('domain-detail')) {
      const assessmentsBtn = document.getElementById('nav-assessments');
      if (assessmentsBtn) {assessmentsBtn.classList.add('active');}
    } else if (viewId.includes('history')) {
      const historyBtn = document.getElementById('nav-history');
      if (historyBtn) {historyBtn.classList.add('active');}
    } else if (viewId.includes('import-export')) {
      const importExportBtn = document.getElementById('nav-import-export');
      if (importExportBtn) {importExportBtn.classList.add('active');}
    }
  }

  // Rendering methods
  renderAll() {
    this.throttledRender(() => {
      this.renderAssessmentCards();
      this.renderHistoryTable();
      
      // Re-render detail view if active
      const domainKey = document.getElementById('domain-key-input')?.value;
      if (this.currentView === 'domain-detail-view' && domainKey) {
        this.showDomainDetail(domainKey, false);
      }
    });
  }

  // Performance optimization: throttle expensive render operations
  throttledRender(renderFunction) {
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

  renderAssessmentCards() {
    const domainData = translations[this.currentLanguage]?.domains;
    if (!domainData) {return;}

    const scoreRangeText = this.currentLanguage === 'fa' ? 'محدوده نمره' : 'Score Range';
    this.dom.assessmentGrid.innerHTML = '';

    Object.entries(domainData).forEach(([key, domain]) => {
      const card = document.createElement('div');
      card.className = 'assessment-card card';
      card.dataset.key = key;
      
      // Safely truncate description
      const description = domain.description || '';
      const truncatedDescription = description.length > 120 
        ? `${description.substring(0, 120) }...`
        : description;

      card.innerHTML = `
        <h3>${this.escapeHtml(domain.name || '')}</h3>
        <p>${this.escapeHtml(truncatedDescription)}</p>
        <span class="score-preview">${scoreRangeText}: ${this.escapeHtml(domain.scoreRange || '')}</span>
      `;
      
      card.addEventListener('click', () => this.showDomainDetail(key));
      this.dom.assessmentGrid.appendChild(card);
    });
  }

  showDomainDetail(key, switchView = true) {
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
      if (element) {element.textContent = text || '';}
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

    // Render interpretation grid
    const interpretationGrid = document.getElementById('detail-interpretation');
    if (interpretationGrid && domain.interpretation) {
      interpretationGrid.innerHTML = '';
      domain.interpretation.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'score-interpretation-item';
        div.innerHTML = `
          <div class="range">${this.escapeHtml(item.range || '')}</div>
          <div class="level">${this.escapeHtml(item.level || '')}</div>
        `;
        interpretationGrid.appendChild(div);
      });
    }

    // Setup form
    this.setupDomainForm(key, domain);

    if (switchView) {this.showView('domain-detail-view');}
  }

  setupDomainForm(key, domain) {
    if (this.dom.logEntryForm) {
      this.dom.logEntryForm.reset();
    }

    const domainKeyInput = document.getElementById('domain-key-input');
    if (domainKeyInput) {domainKeyInput.value = key;}

    const entryDateInput = document.getElementById('entry-date');
    if (entryDateInput) {entryDateInput.valueAsDate = new Date();}

    const scoreInput = document.getElementById('entry-score');
    if (scoreInput && domain.scoreRange) {
      // Handle Persian numbers in score range
      const scoreRange = domain.scoreRange.replace(
        /[\u06F0-\u06F9]/g,
        (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()
      );
      
      const rangeParts = scoreRange.split('-');
      if (rangeParts.length >= 2) {
        const min = parseInt(rangeParts[0]);
        const max = parseInt(rangeParts[1]);
        if (!isNaN(min)) {scoreInput.min = min;}
        if (!isNaN(max)) {scoreInput.max = max;}
        else {scoreInput.removeAttribute('max');}
      }
    }
  }

  renderHistoryTable() {
    this.sortEntries();
    this.updateSortIndicators();

    if (!this.dom.historyTableBody) {return;}

    if (this.entries.length === 0) {
      const emptyMessage = translations[this.currentLanguage]?.history?.empty || 'No entries yet.';
      this.dom.historyTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 2rem;">
            ${this.escapeHtml(emptyMessage)}
          </td>
        </tr>
      `;
      return;
    }

    // Use virtual scrolling for large datasets (>100 entries)
    if (this.entries.length > 100) {
      this.renderVirtualizedTable();
    } else {
      this.renderFullTable();
    }
  }

  renderFullTable() {
    this.performanceMonitor.startTiming('renderFullTable');
    
    this.dom.historyTableBody.innerHTML = '';
    const domainNames = translations[this.currentLanguage]?.domains || {};
    
    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    
    this.entries.forEach((entry) => {
      const row = this.createHistoryRow(entry, domainNames);
      fragment.appendChild(row);
    });
    
    this.dom.historyTableBody.appendChild(fragment);
    
    this.performanceMonitor.endTiming('renderFullTable');
  }

  renderVirtualizedTable() {
    // Simple virtualization: show only first 50 entries with a "Load More" button
    const BATCH_SIZE = 50;
    const currentBatch = this.currentHistoryBatch || 1;
    const startIndex = 0;
    const endIndex = Math.min(BATCH_SIZE * currentBatch, this.entries.length);
    
    this.dom.historyTableBody.innerHTML = '';
    const domainNames = translations[this.currentLanguage]?.domains || {};
    const fragment = document.createDocumentFragment();
    
    for (let i = startIndex; i < endIndex; i++) {
      const entry = this.entries[i];
      const row = this.createHistoryRow(entry, domainNames);
      fragment.appendChild(row);
    }
    
    // Add "Load More" button if there are more entries
    if (endIndex < this.entries.length) {
      const loadMoreRow = document.createElement('tr');
      loadMoreRow.innerHTML = `
        <td colspan="5" style="text-align: center; padding: 1rem;">
          <button class="btn btn-secondary" id="load-more-entries">
            Load More (${this.entries.length - endIndex} remaining)
          </button>
        </td>
      `;
      
      const loadMoreBtn = loadMoreRow.querySelector('#load-more-entries');
      loadMoreBtn.addEventListener('click', () => {
        this.currentHistoryBatch = (this.currentHistoryBatch || 1) + 1;
        this.renderHistoryTable();
      });
      
      fragment.appendChild(loadMoreRow);
    }
    
    this.dom.historyTableBody.appendChild(fragment);
  }

  createHistoryRow(entry, domainNames) {
    const row = document.createElement('tr');
    const dateLocale = this.currentLanguage === 'fa' ? 'fa-IR' : 'en-CA';
    const numberLocale = this.currentLanguage === 'fa' ? 'fa-IR' : 'en-US';
    
    const domainName = domainNames[entry.domainKey]?.name || 'Unknown';
    const formattedDate = new Date(entry.date).toLocaleDateString(dateLocale);
    const formattedScore = entry.score.toLocaleString(numberLocale);
    const safeNote = this.escapeHtml(entry.note || '');

    row.innerHTML = `
      <td>${formattedDate}</td>
      <td>${this.escapeHtml(domainName)}</td>
      <td>${formattedScore}</td>
      <td>${safeNote}</td>
      <td>
        <button class="btn-danger" data-id="${entry.id}" aria-label="Delete entry">&times;</button>
      </td>
    `;

    const deleteBtn = row.querySelector('.btn-danger');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        const confirmMessage = translations[this.currentLanguage]?.confirmDelete || 'Are you sure?';
        if (confirm(confirmMessage)) {
          this.deleteEntry(e.target.dataset.id);
        }
      });
    }

    return row;
  }

  sortEntries() {
    this.entries.sort((a, b) => {
      const valA = a[this.currentSort.column];
      const valB = b[this.currentSort.column];
      let comparison = 0;

      if (valA > valB) {comparison = 1;}
      else if (valA < valB) {comparison = -1;}

      return this.currentSort.direction === 'desc' ? comparison * -1 : comparison;
    });
  }

  updateSortIndicators() {
    this.dom.historyTableHeaders.forEach((th) => {
      th.classList.remove('sorted-asc', 'sorted-desc');
      if (th.dataset.sort === this.currentSort.column) {
        th.classList.add(
          this.currentSort.direction === 'asc' ? 'sorted-asc' : 'sorted-desc'
        );
      }
    });
  }

  // Entry management with validation
  addEntry(entry) {
    try {
      // Validate entry using form validator
      const validation = this.entryValidator.validate(entry);
      
      if (!validation.isValid) {
        const errorMessages = Object.values(validation.errors).flat();
        this.showToast(errorMessages[0] || 'Invalid entry data', 'error');
        return false;
      }

      // Additional domain-specific score validation
      const domain = translations[this.currentLanguage]?.domains?.[entry.domainKey];
      if (domain && !this.validateScoreRange(entry.score, domain.scoreRange)) {
        this.showToast(`Score must be within range: ${domain.scoreRange}`, 'error');
        return false;
      }

      this.entries.push(entry);
      this.saveEntries();
      this.renderHistoryTable();
      
      const successMessage = translations[this.currentLanguage]?.toast?.saved || 'Entry saved!';
      this.showToast(successMessage, 'success');
      return true;
    } catch (error) {
      this.errorHandler.logError('Add Entry Error', {
        entry,
        error: error.message,
        stack: error.stack
      });
      this.showToast('Failed to save entry', 'error');
      return false;
    }
  }

  deleteEntry(id) {
    try {
      if (!id) {
        throw new Error('Entry ID is required for deletion');
      }

      const initialLength = this.entries.length;
      this.entries = this.entries.filter((entry) => entry.id !== id);
      
      if (this.entries.length < initialLength) {
        this.saveEntries();
        this.renderHistoryTable();
        
        const deleteMessage = translations[this.currentLanguage]?.toast?.deleted || 'Entry deleted.';
        this.showToast(deleteMessage, 'success');
        return true;
      } 
        this.showToast('Entry not found', 'error');
        return false;
      
    } catch (error) {
      this.errorHandler.logError('Delete Entry Error', {
        id,
        error: error.message,
        stack: error.stack
      });
      this.showToast('Failed to delete entry', 'error');
      return false;
    }
  }

  validateScoreRange(score, scoreRange) {
    try {
      if (!scoreRange || typeof score !== 'number') {return false;}
      
      // Handle Persian numbers in score range
      const normalizedRange = scoreRange.replace(
        /[\u06F0-\u06F9]/g,
        (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()
      );
      
      const rangeParts = normalizedRange.split('-');
      if (rangeParts.length !== 2) {return true;} // If range format is unclear, allow it
      
      const min = parseInt(rangeParts[0]);
      const max = parseInt(rangeParts[1]);
      
      if (isNaN(min) || isNaN(max)) {return true;} // If can't parse, allow it
      
      return score >= min && score <= max;
    } catch (error) {
      this.errorHandler.logValidationError('scoreRange', score, `Range validation failed: ${error.message}`);
      return true; // If validation fails, be permissive
    }
  }

  // Sorting
  handleSort(column) {
    if (this.currentSort.column === column) {
      this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSort.column = column;
      this.currentSort.direction = 'desc';
    }
    this.renderHistoryTable();
  }

  // CSV utilities with enhanced error handling
  exportToCSV() {
    try {
      if (this.entries.length === 0) {
        const noDataMessage = translations[this.currentLanguage]?.toast?.noDataToExport || 'No data to export.';
        this.showToast(noDataMessage, 'error');
        return false;
      }

      const headers = ['id', 'date', 'domainKey', 'score', 'note'];
      const csvRows = [headers.join(',')];
      
      // Validate each entry before export
      const validEntries = this.entries.filter(entry => {
        try {
          const validation = this.entryValidator.validate(entry);
          return validation.isValid;
        } catch {
          return false;
        }
      });

      if (validEntries.length !== this.entries.length) {
        const skippedCount = this.entries.length - validEntries.length;
        this.showToast(`Warning: ${skippedCount} invalid entries were skipped`, 'error');
      }
      
      validEntries.forEach((entry) => {
        const row = [
          this.sanitizeCSVValue(entry.id),
          this.sanitizeCSVValue(entry.date),
          this.sanitizeCSVValue(entry.domainKey),
          this.sanitizeCSVValue(entry.score),
          this.escapeCSV(entry.note || '')
        ].join(',');
        csvRows.push(row);
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([`\uFEFF${ csvContent}`], {
        type: 'text/csv;charset=utf-8;'
      });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `QuickMHLog_Export_${new Date().toISOString().split('T')[0]}.csv`;
      
      // Safely append and remove link
      document.body.appendChild(link);
      link.click();
      
      // Clean up with timeout to ensure download starts
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      }, 100);

      const exportMessage = translations[this.currentLanguage]?.toast?.exported || 'Data exported.';
      this.showToast(exportMessage, 'success');
      return true;
    } catch (error) {
      this.errorHandler.logError('CSV Export Error', {
        error: error.message,
        stack: error.stack,
        entriesCount: this.entries.length
      });
      this.showToast('Export failed. Please try again.', 'error');
      return false;
    }
  }

  sanitizeCSVValue(value) {
    if (value === null || value === undefined) {return '';}
    const str = String(value);
    // Remove potentially problematic characters
    return str.replace(/[\r\n\t]/g, ' ').trim();
  }

  importFromCSV(event) {
    const file = event.target.files[0];
    if (!file) {return;}

    // Validate file type and size
    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.showToast('Please select a CSV file', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      this.showToast('File is too large. Maximum size is 10MB.', 'error');
      return;
    }

    const reader = new FileReader();
    
    reader.onerror = () => {
      this.errorHandler.logError('File Read Error', {
        fileName: file.name,
        fileSize: file.size,
        error: 'Failed to read file'
      });
      this.showToast('Failed to read file', 'error');
      this.dom.csvImportInput.value = '';
    };

    reader.onload = (e) => {
      try {
        const text = e.target.result;
        if (!text || text.trim().length === 0) {
          this.showToast('File appears to be empty', 'error');
          return;
        }

        const rows = text.split('\n').slice(1); // Skip header
        let importedCount = 0;
        let skippedCount = 0;
        const maxImportRows = 10000; // Safety limit

        rows.slice(0, maxImportRows).forEach((rowStr, index) => {
          if (!rowStr.trim()) {return;}
          
          try {
            const [id, date, domainKey, score, note] = this.parseCSVRow(rowStr);
            
            if (this.isValidImportRow(id, date, domainKey, score, note)) {
              // Check for duplicates
              if (!this.entries.some((entry) => entry.id === id)) {
                const newEntry = {
                  id,
                  date,
                  domainKey,
                  score: Number(score),
                  note: note ? note.replace(/^"|"$/g, '').replace(/""/g, '"') : ''
                };

                // Validate the complete entry
                const validation = this.entryValidator.validate(newEntry);
                if (validation.isValid) {
                  this.entries.push(newEntry);
                  importedCount++;
                } else {
                  skippedCount++;
                }
              } else {
                skippedCount++; // Duplicate entry
              }
            } else {
              skippedCount++;
            }
          } catch (rowError) {
            this.errorHandler.logError('CSV Row Parse Error', {
              rowIndex: index + 2, // +2 because we skip header and 0-based index
              rowContent: rowStr.substring(0, 100), // Log first 100 chars
              error: rowError.message
            });
            skippedCount++;
          }
        });

        if (rows.length > maxImportRows) {
          this.showToast(`Warning: Only the first ${maxImportRows} rows were processed`, 'error');
        }

        this.saveEntries();
        this.renderHistoryTable();
        
        let message = '';
        if (importedCount > 0) {
          const importedMessage = translations[this.currentLanguage]?.toast?.imported?.(importedCount) || 
                                 `${importedCount} entries imported!`;
          message = importedMessage;
        }
        
        if (skippedCount > 0) {
          message += skippedCount > 0 ? ` (${skippedCount} entries were skipped)` : '';
        }

        if (importedCount === 0 && skippedCount === 0) {
          message = 'No valid entries found in the file';
        }

        this.showToast(message, importedCount > 0 ? 'success' : 'error');
      } catch (error) {
        this.errorHandler.logError('CSV Import Error', {
          fileName: file.name,
          fileSize: file.size,
          error: error.message,
          stack: error.stack
        });
        
        const errorMessage = translations[this.currentLanguage]?.toast?.importError || 'Import failed.';
        this.showToast(errorMessage, 'error');
      } finally {
        this.dom.csvImportInput.value = '';
      }
    };

    reader.readAsText(file, 'UTF-8');
  }

  parseCSVRow(rowStr) {
    // Simple CSV parsing - could be enhanced for more complex cases
    const parts = rowStr.split(',');
    return [
      parts[0]?.trim(),
      parts[1]?.trim(),
      parts[2]?.trim(),
      parts[3]?.trim(),
      parts.slice(4).join(',').trim()
    ];
  }

  isValidImportRow(id, date, domainKey, score, note) {
    return id && 
           date && 
           domainKey && 
           score && 
           note !== undefined &&
           translations.en.domains[domainKey] &&
           !isNaN(Number(score));
  }

  // Utility methods with security
  escapeHtml(text) {
    return SecurityManager.sanitizeHTML(text);
  }

  escapeCSV(str) {
    return `"${(str || '').replace(/"/g, '""')}"`;
  }

  // Notifications
  showToast(message, type = 'success') {
    if (!this.dom.toast || !message) {return;}

    this.dom.toast.textContent = message;
    this.dom.toast.className = `toast show ${type}`;
    
    setTimeout(() => {
      this.dom.toast.classList.remove('show');
    }, 3000);
  }

  // Event binding
  bindEvents() {
    // Language switching
    this.dom.langEnBtn?.addEventListener('click', () => this.setLanguage('en'));
    this.dom.langFaBtn?.addEventListener('click', () => this.setLanguage('fa'));

    // Navigation
    this.dom.navButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const viewId = `${e.target.id.replace('nav-', '') }-view`;
        this.showView(viewId);
      });
    });

    // Back button
    this.dom.backToAssessmentsBtn?.addEventListener('click', () => {
      this.showView('assessments-view');
    });

    // Form submission
    this.dom.logEntryForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const formData = {
        id: Date.now().toString(),
        date: document.getElementById('entry-date')?.value,
        domainKey: document.getElementById('domain-key-input')?.value,
        score: Number(document.getElementById('entry-score')?.value),
        note: this.dom.entryNoteTextarea?.value?.trim() || ''
      };

      this.addEntry(formData);
      this.dom.logEntryForm.reset();
      this.showView('history-view');
    });

    // Table sorting
    this.dom.historyTableHeaders.forEach((th) => {
      th.addEventListener('click', () => {
        const column = th.dataset.sort;
        if (column) {this.handleSort(column);}
      });
    });

    // Import/Export
    this.dom.exportCsvBtn?.addEventListener('click', () => this.exportToCSV());
    this.dom.csvImportInput?.addEventListener('change', (e) => this.importFromCSV(e));
  }

  // Memory management and cleanup
  cleanup() {
    // Clear timeouts
    if (this.renderThrottleTimeout) {
      clearTimeout(this.renderThrottleTimeout);
      this.renderThrottleTimeout = null;
    }
    
    // Remove event listeners
    this.eventListeners.forEach((listener, element) => {
      if (element && typeof element.removeEventListener === 'function') {
        element.removeEventListener(listener.event, listener.handler);
      }
    });
    this.eventListeners.clear();
    
    // Clear references
    this.entries = null;
    this.dom = null;
  }

  // Helper to track event listeners for cleanup
  addManagedEventListener(element, event, handler) {
    element.addEventListener(event, handler);
    this.eventListeners.set(element, { event, handler });
  }

  // Initialization
  init() {
    this.loadEntries();
    this.setLanguage(this.currentLanguage);
    this.showView('assessments-view');
    
    // Setup cleanup on page unload
    window.addEventListener('beforeunload', () => this.cleanup());
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.quickMHLogApp = new QuickMHLogApp();
});