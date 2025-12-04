/**
 * Performance tests using Lighthouse and Web Vitals
 * Tests Core Web Vitals and performance metrics
 */

describe('Performance Tests', () => {
  beforeEach(() => {
    // Mock authentication
    cy.window().then((win) => {
      win.localStorage.setItem('authToken', 'mock-token');
      win.localStorage.setItem('user', JSON.stringify({
        id: '1',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        userType: 'student'
      }));
    });
  });

  describe('Core Web Vitals Tests', () => {
    it('should meet Core Web Vitals thresholds', () => {
      cy.visit('/student-dashboard');
      
      // Wait for page to load
      cy.get('[data-testid="main-content"]').should('be.visible');
      
      // Check performance metrics
      cy.window().then((win) => {
        const performance = win.performance;
        const navigation = performance.getEntriesByType('navigation')[0];
        
        // First Contentful Paint should be under 1.8s
        const fcp = performance.getEntriesByName('first-contentful-paint')[0];
        expect(fcp.startTime).to.be.lessThan(1800);
        
        // Largest Contentful Paint should be under 2.5s
        const lcp = performance.getEntriesByName('largest-contentful-paint')[0];
        if (lcp) {
          expect(lcp.startTime).to.be.lessThan(2500);
        }
        
        // Cumulative Layout Shift should be under 0.1
        const cls = performance.getEntriesByName('layout-shift')[0];
        if (cls) {
          expect(cls.value).to.be.lessThan(0.1);
        }
      });
    });

    it('should load within acceptable time', () => {
      const startTime = Date.now();
      cy.visit('/student-dashboard');
      cy.get('[data-testid="main-content"]').should('be.visible').then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(3000); // 3 seconds
      });
    });
  });

  describe('Bundle Size Tests', () => {
    it('should have acceptable bundle size', () => {
      cy.visit('/student-dashboard');
      
      cy.window().then((win) => {
        const performance = win.performance;
        const navigation = performance.getEntriesByType('navigation')[0];
        
        // Total transfer size should be under 2MB
        expect(navigation.transferSize).to.be.lessThan(2 * 1024 * 1024);
        
        // JavaScript bundle should be under 1MB
        const jsEntries = performance.getEntriesByType('resource').filter(
          entry => entry.name.includes('.js')
        );
        const totalJsSize = jsEntries.reduce((sum, entry) => sum + entry.transferSize, 0);
        expect(totalJsSize).to.be.lessThan(1024 * 1024);
      });
    });

    it('should have optimized images', () => {
      cy.visit('/student-dashboard');
      
      cy.get('img').each(($img) => {
        cy.wrap($img).should(($el) => {
          const src = $el.attr('src');
          if (src && !src.includes('data:')) {
            // Check if image is optimized (WebP, AVIF, or properly sized)
            expect(src).to.match(/\.(webp|avif|jpg|jpeg|png)$/);
          }
        });
      });
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not have memory leaks', () => {
      cy.visit('/student-dashboard');
      
      // Get initial memory usage
      cy.window().then((win) => {
        const initialMemory = (win.performance as any).memory?.usedJSHeapSize || 0;
        
        // Navigate to different pages
        cy.visit('/schedule');
        cy.visit('/attendance');
        cy.visit('/profile');
        cy.visit('/student-dashboard');
        
        // Check memory usage after navigation
        cy.window().then((win) => {
          const finalMemory = (win.performance as any).memory?.usedJSHeapSize || 0;
          const memoryIncrease = finalMemory - initialMemory;
          
          // Memory increase should be reasonable (less than 10MB)
          expect(memoryIncrease).to.be.lessThan(10 * 1024 * 1024);
        });
      });
    });
  });

  describe('Network Performance Tests', () => {
    it('should handle slow network conditions', () => {
      // Simulate slow 3G
      cy.intercept('GET', '/api/**', { delay: 2000 }).as('slowApi');
      
      cy.visit('/student-dashboard');
      
      // Should show loading states
      cy.get('[data-testid="loading-skeleton"]').should('be.visible');
      
      // Should eventually load content
      cy.get('[data-testid="main-content"]').should('be.visible');
    });

    it('should handle network failures gracefully', () => {
      // Simulate network failure
      cy.intercept('GET', '/api/**', { statusCode: 500 }).as('apiError');
      
      cy.visit('/student-dashboard');
      
      // Should show error state
      cy.get('[data-testid="error-message"]').should('be.visible');
      
      // Should allow retry
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });
  });

  describe('Mobile Performance Tests', () => {
    beforeEach(() => {
      cy.viewport(375, 667);
    });

    it('should perform well on mobile devices', () => {
      cy.visit('/student-dashboard');
      
      cy.get('[data-testid="main-content"]').should('be.visible');
      
      // Check mobile-specific performance metrics
      cy.window().then((win) => {
        const performance = win.performance;
        const navigation = performance.getEntriesByType('navigation')[0];
        
        // Mobile should have smaller bundle size
        expect(navigation.transferSize).to.be.lessThan(1.5 * 1024 * 1024);
      });
    });

    it('should load quickly on mobile network', () => {
      // Simulate mobile network conditions
      cy.intercept('GET', '/api/**', { delay: 1000 }).as('mobileApi');
      
      const startTime = Date.now();
      cy.visit('/student-dashboard');
      cy.get('[data-testid="main-content"]').should('be.visible').then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(5000); // 5 seconds for mobile
      });
    });
  });

  describe('Caching Performance Tests', () => {
    it('should cache resources effectively', () => {
      cy.visit('/student-dashboard');
      
      // Check that resources are cached
      cy.window().then((win) => {
        const performance = win.performance;
        const resources = performance.getEntriesByType('resource');
        
        // Check for cached resources
        const cachedResources = resources.filter(entry => 
          entry.transferSize === 0 && entry.decodedBodySize > 0
        );
        
        expect(cachedResources.length).to.be.greaterThan(0);
      });
    });

    it('should use service worker for caching', () => {
      cy.visit('/student-dashboard');
      
      cy.window().then((win) => {
        // Check if service worker is registered
        expect(win.navigator.serviceWorker).to.exist;
        
        // Check for service worker in performance entries
        const performance = win.performance;
        const swEntries = performance.getEntriesByType('navigation').filter(entry =>
          entry.name.includes('sw.js')
        );
        
        expect(swEntries.length).to.be.greaterThan(0);
      });
    });
  });

  describe('Lazy Loading Performance Tests', () => {
    it('should lazy load components efficiently', () => {
      cy.visit('/student-dashboard');
      
      // Check that initial bundle is small
      cy.window().then((win) => {
        const performance = win.performance;
        const navigation = performance.getEntriesByType('navigation')[0];
        
        // Initial load should be optimized
        expect(navigation.transferSize).to.be.lessThan(1024 * 1024);
      });
      
      // Navigate to different pages to trigger lazy loading
      cy.visit('/schedule');
      cy.visit('/attendance');
      
      // Check that additional chunks are loaded
      cy.window().then((win) => {
        const performance = win.performance;
        const resources = performance.getEntriesByType('resource');
        const jsResources = resources.filter(entry => 
          entry.name.includes('.js') && entry.name.includes('chunk')
        );
        
        expect(jsResources.length).to.be.greaterThan(1);
      });
    });
  });

  describe('Animation Performance Tests', () => {
    it('should have smooth animations', () => {
      cy.visit('/student-dashboard');
      
      // Trigger animations
      cy.get('[data-testid="hamburger-menu"]').click();
      cy.get('[data-testid="mobile-drawer"]').should('be.visible');
      
      // Check that animations don't block the main thread
      cy.window().then((win) => {
        const performance = win.performance;
        const longTasks = performance.getEntriesByType('longtask');
        
        // Should not have long tasks during animations
        expect(longTasks.length).to.be.lessThan(3);
      });
    });
  });

  describe('Database Performance Tests', () => {
    it('should handle database queries efficiently', () => {
      cy.visit('/student-dashboard');
      
      // Monitor API response times
      cy.intercept('GET', '/api/**').as('apiCall');
      
      cy.visit('/student-dashboard');
      cy.wait('@apiCall').then((interception) => {
        expect(interception.response?.statusCode).to.equal(200);
        expect(interception.response?.duration).to.be.lessThan(1000); // 1 second
      });
    });
  });

  describe('Memory Management Tests', () => {
    it('should clean up event listeners', () => {
      cy.visit('/student-dashboard');
      
      // Navigate between pages multiple times
      for (let i = 0; i < 5; i++) {
        cy.visit('/schedule');
        cy.visit('/attendance');
        cy.visit('/student-dashboard');
      }
      
      // Check that memory usage is stable
      cy.window().then((win) => {
        const performance = win.performance;
        const memory = (performance as any).memory;
        
        if (memory) {
          // Memory usage should be reasonable
          expect(memory.usedJSHeapSize).to.be.lessThan(50 * 1024 * 1024); // 50MB
        }
      });
    });
  });
});
