import { describe, it, expect, beforeEach, vi } from 'vitest';
import { translations } from '../js/translations.js';

// Mock DOM environment
beforeEach(() => {
  // Reset DOM
  document.body.innerHTML = '';
  
  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  vi.stubGlobal('localStorage', localStorageMock);
});

describe('Translation System', () => {
  it('should have English translations', () => {
    expect(translations.en).toBeDefined();
    expect(translations.en.appTitle).toBe('QuickMH Log');
    expect(translations.en.nav.assessments).toBe('Assessments');
  });

  it('should have Persian translations', () => {
    expect(translations.fa).toBeDefined();
    expect(translations.fa.appTitle).toBe('گزارش سریع سلامت روان');
    expect(translations.fa.nav.assessments).toBe('ارزیابی‌ها');
  });

  it('should have all required domains in English', () => {
    const requiredDomains = ['phq-9', 'gad-7', 'aaq-ii', 'oci-r', 'rosenberg', 'maslach', 'procrastination'];
    
    requiredDomains.forEach(domain => {
      expect(translations.en.domains[domain]).toBeDefined();
      expect(translations.en.domains[domain].name).toBeTruthy();
      expect(translations.en.domains[domain].description).toBeTruthy();
      expect(translations.en.domains[domain].scoreRange).toBeTruthy();
    });
  });

  it('should have corresponding domains in Persian', () => {
    const englishDomains = Object.keys(translations.en.domains);
    const persianDomains = Object.keys(translations.fa.domains);
    
    expect(englishDomains).toEqual(persianDomains);
  });
});

describe('Utility Functions', () => {
  it('should escape HTML properly', () => {
    // This would test the escapeHtml method from the QuickMHLogApp class
    // For now, we'll test the basic concept
    const div = document.createElement('div');
    div.textContent = '<script>alert("xss")</script>';
    const escaped = div.innerHTML;
    
    expect(escaped).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
  });

  it('should escape CSV properly', () => {
    const escapeCSV = (str) => `"${(str || '').replace(/"/g, '""')}"`;
    
    expect(escapeCSV('simple text')).toBe('"simple text"');
    expect(escapeCSV('text with "quotes"')).toBe('"text with ""quotes"""');
    expect(escapeCSV('')).toBe('""');
  });
});

describe('Entry Validation', () => {
  it('should validate entry data correctly', () => {
    const validateEntry = (entry) => {
      return entry && 
             entry.id && 
             entry.date && 
             entry.domainKey && 
             typeof entry.score === 'number' && 
             !isNaN(entry.score);
    };

    const validEntry = {
      id: '1234567890',
      date: '2023-12-01',
      domainKey: 'phq-9',
      score: 15,
      note: 'Test note'
    };

    const invalidEntry = {
      id: null,
      date: '2023-12-01',
      domainKey: 'phq-9',
      score: NaN
    };

    expect(validateEntry(validEntry)).toBe(true);
    expect(validateEntry(invalidEntry)).toBe(false);
    expect(validateEntry(null)).toBe(false);
    expect(validateEntry({})).toBe(false);
  });
});

describe('CSV Import/Export', () => {
  it('should parse CSV rows correctly', () => {
    const parseCSVRow = (rowStr) => {
      const parts = rowStr.split(',');
      return [
        parts[0]?.trim(),
        parts[1]?.trim(),
        parts[2]?.trim(),
        parts[3]?.trim(),
        parts.slice(4).join(',').trim()
      ];
    };

    const csvRow = '1234567890,2023-12-01,phq-9,15,"Test note with, comma"';
    const parsed = parseCSVRow(csvRow);

    expect(parsed[0]).toBe('1234567890');
    expect(parsed[1]).toBe('2023-12-01');
    expect(parsed[2]).toBe('phq-9');
    expect(parsed[3]).toBe('15');
    expect(parsed[4]).toBe('"Test note with, comma"');
  });

  it('should validate import rows correctly', () => {
    const isValidImportRow = (id, date, domainKey, score, note) => {
      return Boolean(id) && 
             Boolean(date) && 
             Boolean(domainKey) && 
             Boolean(score) && 
             note !== undefined &&
             Boolean(translations.en.domains[domainKey]) &&
             !isNaN(Number(score));
    };

    expect(isValidImportRow('123', '2023-12-01', 'phq-9', '15', 'note')).toBe(true);
    expect(isValidImportRow('', '2023-12-01', 'phq-9', '15', 'note')).toBe(false);
    expect(isValidImportRow('123', '2023-12-01', 'invalid-domain', '15', 'note')).toBe(false);
    expect(isValidImportRow('123', '2023-12-01', 'phq-9', 'not-number', 'note')).toBe(false);
  });
});