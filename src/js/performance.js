// Performance monitoring utilities
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.isEnabled = 'performance' in window && 'mark' in performance;
  }

  // Start timing an operation
  startTiming(name) {
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
  endTiming(name) {
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
  getMetrics(name) {
    return this.metrics.get(name) || null;
  }

  // Get all metrics
  getAllMetrics() {
    return Object.fromEntries(this.metrics);
  }

  // Report slow operations
  getSlowOperations(threshold = 16) { // 16ms = 60fps threshold
    const slowOps = [];
    
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
  getMemoryUsage() {
    if ('memory' in performance) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        usagePercentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
      };
    }
    return null;
  }

  // Reset metrics
  reset() {
    this.metrics.clear();
    if (this.isEnabled) {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }
}

// Debounce utility for performance optimization
export function debounce(func, wait, immediate = false) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) {func.apply(this, args);}
    };
    
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) {func.apply(this, args);}
  };
}

// Throttle utility for performance optimization
export function throttle(func, limit) {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Intersection Observer for lazy loading
export class LazyLoader {
  constructor(options = {}) {
    this.options = {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    };
    
    this.observer = null;
    this.init();
  }

  init() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => this.handleIntersection(entries),
        this.options
      );
    }
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;
        const callback = element.dataset.lazyCallback;
        
        if (callback && window[callback]) {
          window[callback](element);
        }
        
        this.observer.unobserve(element);
      }
    });
  }

  observe(element) {
    if (this.observer && element) {
      this.observer.observe(element);
    }
  }

  unobserve(element) {
    if (this.observer && element) {
      this.observer.unobserve(element);
    }
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Performance-aware animation frame scheduler
export class FrameScheduler {
  constructor() {
    this.tasks = [];
    this.isRunning = false;
    this.frameDeadline = 16; // Target 60fps
  }

  schedule(task, priority = 0) {
    this.tasks.push({ task, priority, id: Date.now() });
    this.tasks.sort((a, b) => b.priority - a.priority);
    
    if (!this.isRunning) {
      this.start();
    }
  }

  start() {
    this.isRunning = true;
    requestAnimationFrame((timestamp) => this.processFrame(timestamp));
  }

  processFrame(_timestamp) {
    const frameStart = performance.now();
    
    while (this.tasks.length > 0 && (performance.now() - frameStart) < this.frameDeadline) {
      const { task } = this.tasks.shift();
      try {
        task();
      } catch (error) {
        console.error('Scheduled task error:', error);
      }
    }
    
    if (this.tasks.length > 0) {
      requestAnimationFrame((timestamp) => this.processFrame(timestamp));
    } else {
      this.isRunning = false;
    }
  }

  clear() {
    this.tasks = [];
    this.isRunning = false;
  }
}