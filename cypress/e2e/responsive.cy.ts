/**
 * Responsive design tests for different viewport sizes
 * Tests mobile, tablet, and desktop layouts
 */

describe('Responsive Design Tests', () => {
  const viewports = [
    { name: 'Mobile Small', width: 320, height: 568 },
    { name: 'Mobile Medium', width: 375, height: 667 },
    { name: 'Mobile Large', width: 414, height: 896 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop Small', width: 1024, height: 768 },
    { name: 'Desktop Large', width: 1440, height: 900 },
  ];

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

  viewports.forEach(({ name, width, height }) => {
    describe(`${name} (${width}x${height})`, () => {
      beforeEach(() => {
        cy.viewport(width, height);
        cy.visit('/student-dashboard');
      });

      it('should display the page without horizontal scroll', () => {
        cy.get('body').should('not.have.css', 'overflow-x', 'scroll');
        cy.get('html').should('not.have.css', 'overflow-x', 'scroll');
      });

      it('should have proper navigation layout', () => {
        if (width < 768) {
          // Mobile: should have hamburger menu
          cy.get('[data-testid="hamburger-menu"]').should('be.visible');
          cy.get('[data-testid="desktop-nav"]').should('not.be.visible');
        } else {
          // Desktop: should have desktop navigation
          cy.get('[data-testid="desktop-nav"]').should('be.visible');
          cy.get('[data-testid="hamburger-menu"]').should('not.be.visible');
        }
      });

      it('should have proper search bar layout', () => {
        if (width < 768) {
          // Mobile: search should be hidden or in different location
          cy.get('[data-testid="search-bar"]').should('not.be.visible');
          cy.get('[data-testid="search-icon"]').should('be.visible');
        } else {
          // Desktop: search bar should be visible
          cy.get('[data-testid="search-bar"]').should('be.visible');
        }
      });

      it('should have proper button sizes (minimum 44px)', () => {
        cy.get('button').each(($button) => {
          cy.wrap($button).should(($el) => {
            const rect = $el[0].getBoundingClientRect();
            expect(rect.height).to.be.at.least(44);
            expect(rect.width).to.be.at.least(44);
          });
        });
      });

      it('should have proper text sizes', () => {
        cy.get('h1').should('have.css', 'font-size').and('match', /(1[6-9]|[2-9][0-9])px/);
        cy.get('p').should('have.css', 'font-size').and('match', /(1[4-9]|[2-9][0-9])px/);
      });

      it('should have proper spacing', () => {
        cy.get('[data-testid="main-content"]').should('have.css', 'padding');
        cy.get('[data-testid="main-content"]').should('have.css', 'margin');
      });
    });
  });

  describe('Mobile Navigation Tests', () => {
    beforeEach(() => {
      cy.viewport(375, 667);
      cy.visit('/student-dashboard');
    });

    it('should open mobile drawer when hamburger menu is clicked', () => {
      cy.get('[data-testid="hamburger-menu"]').click();
      cy.get('[data-testid="mobile-drawer"]').should('be.visible');
      cy.get('[data-testid="mobile-drawer"]').should('have.class', 'translate-x-0');
    });

    it('should close mobile drawer when backdrop is clicked', () => {
      cy.get('[data-testid="hamburger-menu"]').click();
      cy.get('[data-testid="mobile-drawer"]').should('be.visible');
      cy.get('[data-testid="drawer-backdrop"]').click({ force: true });
      cy.get('[data-testid="mobile-drawer"]').should('not.be.visible');
    });

    it('should close mobile drawer when escape key is pressed', () => {
      cy.get('[data-testid="hamburger-menu"]').click();
      cy.get('[data-testid="mobile-drawer"]').should('be.visible');
      cy.get('body').type('{esc}');
      cy.get('[data-testid="mobile-drawer"]').should('not.be.visible');
    });

    it('should navigate to correct page when menu item is clicked', () => {
      cy.get('[data-testid="hamburger-menu"]').click();
      cy.get('[data-testid="mobile-drawer"]').should('be.visible');
      cy.get('[data-testid="nav-schedule"]').click();
      cy.url().should('include', '/schedule');
      cy.get('[data-testid="mobile-drawer"]').should('not.be.visible');
    });
  });

  describe('Table Responsive Tests', () => {
    beforeEach(() => {
      cy.visit('/attendance');
    });

    it('should display table as cards on mobile', () => {
      cy.viewport(375, 667);
      cy.get('[data-testid="responsive-table"]').should('have.class', 'block');
      cy.get('[data-testid="table-cards"]').should('be.visible');
    });

    it('should display table normally on desktop', () => {
      cy.viewport(1024, 768);
      cy.get('[data-testid="responsive-table"]').should('not.have.class', 'block');
      cy.get('[data-testid="table-cards"]').should('not.be.visible');
      cy.get('table').should('be.visible');
    });

    it('should be horizontally scrollable on tablet', () => {
      cy.viewport(768, 1024);
      cy.get('[data-testid="table-container"]').should('have.css', 'overflow-x', 'auto');
    });
  });

  describe('Modal Responsive Tests', () => {
    beforeEach(() => {
      cy.visit('/student-dashboard');
    });

    it('should display modal full-screen on mobile', () => {
      cy.viewport(375, 667);
      cy.get('[data-testid="sync-button"]').click();
      cy.get('[data-testid="modal"]').should('have.class', 'w-full');
      cy.get('[data-testid="modal"]').should('have.class', 'h-full');
      cy.get('[data-testid="modal"]').should('have.class', 'rounded-none');
    });

    it('should display modal normally on desktop', () => {
      cy.viewport(1024, 768);
      cy.get('[data-testid="sync-button"]').click();
      cy.get('[data-testid="modal"]').should('not.have.class', 'w-full');
      cy.get('[data-testid="modal"]').should('not.have.class', 'h-full');
      cy.get('[data-testid="modal"]').should('not.have.class', 'rounded-none');
    });
  });

  describe('Form Responsive Tests', () => {
    beforeEach(() => {
      cy.visit('/profile');
    });

    it('should have proper form layout on mobile', () => {
      cy.viewport(375, 667);
      cy.get('form').should('have.css', 'padding');
      cy.get('input').each(($input) => {
        cy.wrap($input).should(($el) => {
          const rect = $el[0].getBoundingClientRect();
          expect(rect.height).to.be.at.least(44);
        });
      });
    });

    it('should have proper form layout on desktop', () => {
      cy.viewport(1024, 768);
      cy.get('form').should('have.css', 'max-width');
      cy.get('form').should('have.css', 'margin', '0px auto');
    });
  });

  describe('Touch Interaction Tests', () => {
    beforeEach(() => {
      cy.viewport(375, 667);
      cy.visit('/student-dashboard');
    });

    it('should handle touch events properly', () => {
      cy.get('[data-testid="hamburger-menu"]').trigger('touchstart');
      cy.get('[data-testid="hamburger-menu"]').trigger('touchend');
      cy.get('[data-testid="mobile-drawer"]').should('be.visible');
    });

    it('should have proper touch targets', () => {
      cy.get('button, a, input, select, textarea').each(($element) => {
        cy.wrap($element).should(($el) => {
          const rect = $el[0].getBoundingClientRect();
          expect(rect.height).to.be.at.least(44);
          expect(rect.width).to.be.at.least(44);
        });
      });
    });
  });

  describe('Orientation Tests', () => {
    it('should adapt to landscape orientation', () => {
      cy.viewport(667, 375); // Landscape mobile
      cy.visit('/student-dashboard');
      cy.get('body').should('not.have.css', 'overflow-x', 'scroll');
    });

    it('should adapt to portrait orientation', () => {
      cy.viewport(375, 667); // Portrait mobile
      cy.visit('/student-dashboard');
      cy.get('body').should('not.have.css', 'overflow-x', 'scroll');
    });
  });

  describe('Performance Tests', () => {
    it('should load within acceptable time on mobile', () => {
      cy.viewport(375, 667);
      const startTime = Date.now();
      cy.visit('/student-dashboard');
      cy.get('[data-testid="main-content"]').should('be.visible').then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(3000); // 3 seconds
      });
    });

    it('should have acceptable bundle size', () => {
      cy.window().then((win) => {
        const performance = win.performance;
        const navigation = performance.getEntriesByType('navigation')[0];
        expect(navigation.transferSize).to.be.lessThan(2 * 1024 * 1024); // 2MB
      });
    });
  });
});
