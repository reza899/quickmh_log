import type { PerformanceMetrics, MemoryUsage, ThrottledFunction, DebouncedFunction } from '../types/index.js';

// Performance monitoring utilities
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics>;
  private isEnabled: boolean;

  constructor() {
    this.metrics = new Map<string, PerformanceMetrics>();
    this.isEnabled = 'performance' in window && 'mark' in performance;
  }

  // Start timing an operation
  startTiming(name: string): void {
    if (!this.isEnabled) {return;}
    
    const markName = `${name}-start`;
    performance.mark(markName);
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, {
        count: 0,
        totalTime: 0,
        averageTime: 0,
        lastTime: 0
      });
    }
  }

  // End timing an operation
  endTiming(name: string): void {
    if (!this.isEnabled) {return;}
    
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;
    const measureName = `${name}-measure`;
    
    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);
    
    const measure = performance.getEntriesByName(measureName)[0];
    if (measure) {
      const metrics = this.metrics.get(name);
      if (metrics) {
        metrics.count++;
        metrics.totalTime += measure.duration;
        metrics.averageTime = metrics.totalTime / metrics.count;
        metrics.lastTime = measure.duration;
      }
    }
    
    // Clean up marks and measures
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(measureName);
  }

  // Get performance metrics
  getMetrics(name: string): PerformanceMetrics | null {
    return this.metrics.get(name) || null;
  }

  // Get all metrics
  getAllMetrics(): Record<string, PerformanceMetrics> {
    return Object.fromEntries(this.metrics);
  }

  // Report slow operations
  getSlowOperations(threshold: number = 16): Array<{name: string; averageTime: number; count: number}> {
    const slowOps: Array<{name: string; averageTime: number; count: number}> = [];
    
    this.metrics.forEach((metrics, name) => {
      if (metrics.averageTime > threshold) {
        slowOps.push({
          name,
          averageTime: metrics.averageTime,
          count: metrics.count
        });
      }
    });
    
    return slowOps.sort((a, b) => b.averageTime - a.averageTime);
  }

  // Memory usage (if available)
  getMemoryUsage(): MemoryUsage | null {
    if ('memory' in performance) {
      const memory = (performance as unknown as {memory: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      }}).memory;
      
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };
    }
    return null;
  }

  // Reset metrics
  reset(): void {
    this.metrics.clear();
    if (this.isEnabled) {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }
}

// Debounce utility for performance optimization
export function debounce<T extends unknown[]>(
  func: (...args: T) => void, 
  wait: number, 
  immediate: boolean = false
): DebouncedFunction<T> {
  let timeout: NodeJS.Timeout | undefined;
  
  return function executedFunction(this: unknown, ...args: T): void {
    const later = (): void => {
      timeout = undefined;
      if (!immediate) {func.apply(this, args);}
    };
    
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) {func.apply(this, args);}
  };
}

// Throttle utility for performance optimization
export function throttle<T extends unknown[]>(
  func: (...args: T) => void, 
  limit: number
): ThrottledFunction<T> {
  let inThrottle: boolean;
  
  return function executedFunction(this: unknown, ...args: T): void {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limit);
    }
  };
}

// Intersection Observer for lazy loading
export class LazyLoader {
  private options: IntersectionObserverInit;
  private observer: IntersectionObserver | null;

  constructor(options: IntersectionObserverInit = {}) {
    this.options = {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    };
    
    this.observer = null;
    this.init();
  }

  private init(): void {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => this.handleIntersection(entries),
        this.options
      );
    }
  }

  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target as HTMLElement;
        const callback = element.dataset['lazyCallback'];
        
        if (callback && (window as unknown as Record<string, unknown>)[callback]) {
          const callbackFn = (window as unknown as Record<string, unknown>)[callback] as (element: HTMLElement) => void;
          callbackFn(element);
        }
        
        this.observer?.unobserve(element);
      }
    });
  }

  observe(element: Element): void {
    if (this.observer && element) {
      this.observer.observe(element);
    }
  }

  unobserve(element: Element): void {
    if (this.observer && element) {
      this.observer.unobserve(element);
    }
  }

  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Performance-aware animation frame scheduler
export class FrameScheduler {
  private tasks: Array<{task: () => void; priority: number; id: number}>;
  private isRunning: boolean;
  private frameDeadline: number;

  constructor() {
    this.tasks = [];
    this.isRunning = false;
    this.frameDeadline = 16; // Target 60fps
  }

  schedule(task: () => void, priority: number = 0): void {
    this.tasks.push({ task, priority, id: Date.now() });
    this.tasks.sort((a, b) => b.priority - a.priority);
    
    if (!this.isRunning) {
      this.start();
    }
  }

  private start(): void {
    this.isRunning = true;
    requestAnimationFrame((timestamp) => this.processFrame(timestamp));
  }

  private processFrame(_timestamp: number): void {
    const frameStart = performance.now();
    
    while (this.tasks.length > 0 && (performance.now() - frameStart) < this.frameDeadline) {
      const taskItem = this.tasks.shift();
      if (taskItem) {
        try {
          taskItem.task();
        } catch (error) {
          console.error('Scheduled task error:', error);
        }
      }
    }
    
    if (this.tasks.length > 0) {
      requestAnimationFrame((timestamp) => this.processFrame(timestamp));
    } else {
      this.isRunning = false;
    }
  }

  clear(): void {
    this.tasks = [];
    this.isRunning = false;
  }
}