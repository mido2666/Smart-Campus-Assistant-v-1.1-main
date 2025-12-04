/**
 * Accessibility tests using axe-core
 * Tests WCAG compliance and accessibility best practices
 */

describe('Accessibility Tests', () => {
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

  describe('WCAG Compliance Tests', () => {
    const pages = [
      { name: 'Student Dashboard', url: '/student-dashboard' },
      { name: 'Professor Dashboard', url: '/professor-dashboard' },
      { name: 'Schedule', url: '/schedule' },
      { name: 'Attendance', url: '/attendance' },
      { name: 'Profile', url: '/profile' },
      { name: 'Login', url: '/login' },
    ];

    pages.forEach(({ name, url }) => {
      it(`should pass WCAG AA compliance on ${name}`, () => {
        cy.visit(url);
        cy.injectAxe();
        cy.checkA11y(null, {
          rules: {
            // WCAG AA rules
            'color-contrast': { enabled: true },
            'keyboard-navigation': { enabled: true },
            'focus-order-semantics': { enabled: true },
            'aria-allowed-attr': { enabled: true },
            'aria-required-attr': { enabled: true },
            'aria-valid-attr-value': { enabled: true },
            'aria-valid-attr': { enabled: true },
            'aria-required-children': { enabled: true },
            'aria-required-parent': { enabled: true },
            'aria-roles': { enabled: true },
            'aria-valid-role': { enabled: true },
            'button-name': { enabled: true },
            'form-field-multiple-labels': { enabled: true },
            'label': { enabled: true },
            'link-name': { enabled: true },
            'page-has-heading-one': { enabled: true },
            'page-has-main': { enabled: true },
            'region': { enabled: true },
            'tabindex': { enabled: true },
            'valid-lang': { enabled: true },
            'video-caption': { enabled: true },
            'video-description': { enabled: true },
            'bypass': { enabled: true },
            'heading-order': { enabled: true },
            'html-has-lang': { enabled: true },
            'html-lang-valid': { enabled: true },
            'image-alt': { enabled: true },
            'input-image-alt': { enabled: true },
            'object-alt': { enabled: true },
            'svg-img-alt': { enabled: true },
            'duplicate-id': { enabled: true },
            'duplicate-id-active': { enabled: true },
            'duplicate-id-aria': { enabled: true },
            'focus-visible': { enabled: true },
            'interactive-controls': { enabled: true },
            'landmark-one-main': { enabled: true },
            'landmark-unique': { enabled: true },
            'list': { enabled: true },
            'listitem': { enabled: true },
            'marquee': { enabled: true },
            'meta-refresh': { enabled: true },
            'meta-viewport': { enabled: true },
            'object-alt': { enabled: true },
            'presentation-role-conflicts': { enabled: true },
            'role-img-alt': { enabled: true },
            'scope-attr-valid': { enabled: true },
            'server-side-image-map': { enabled: true },
            'td-headers-attr': { enabled: true },
            'th-has-data-cells': { enabled: true },
            'valid-scope': { enabled: true },
          },
        });
      });
    });
  });

  describe('Keyboard Navigation Tests', () => {
    beforeEach(() => {
      cy.visit('/student-dashboard');
    });

    it('should be navigable with keyboard only', () => {
      // Test tab navigation
      cy.get('body').tab();
      cy.focused().should('be.visible');
      
      // Test tab through all interactive elements
      cy.get('button, a, input, select, textarea, [tabindex]').each(($el) => {
        cy.wrap($el).should('be.visible');
        cy.wrap($el).tab();
      });
    });

    it('should have visible focus indicators', () => {
      cy.get('button').first().focus();
      cy.focused().should('have.css', 'outline').and('not.equal', 'none');
    });

    it('should support escape key for modals', () => {
      cy.get('[data-testid="sync-button"]').click();
      cy.get('[data-testid="modal"]').should('be.visible');
      cy.get('body').type('{esc}');
      cy.get('[data-testid="modal"]').should('not.be.visible');
    });

    it('should support enter key for buttons', () => {
      cy.get('button').first().focus();
      cy.get('button').first().type('{enter}');
      // Add assertions based on what the button does
    });
  });

  describe('Screen Reader Tests', () => {
    beforeEach(() => {
      cy.visit('/student-dashboard');
    });

    it('should have proper heading structure', () => {
      cy.get('h1').should('exist');
      cy.get('h1').should('have.length.at.least', 1);
      
      // Check that headings are in proper order
      cy.get('h1, h2, h3, h4, h5, h6').each(($heading, index) => {
        if (index > 0) {
          const currentLevel = parseInt($heading.prop('tagName').substring(1));
          const previousLevel = parseInt($heading.prevAll('h1, h2, h3, h4, h5, h6').first().prop('tagName').substring(1));
          expect(currentLevel).to.be.at.most(previousLevel + 1);
        }
      });
    });

    it('should have proper form labels', () => {
      cy.get('input, select, textarea').each(($input) => {
        const id = $input.attr('id');
        const ariaLabel = $input.attr('aria-label');
        const ariaLabelledBy = $input.attr('aria-labelledby');
        const label = cy.get(`label[for="${id}"]`);
        
        expect(id || ariaLabel || ariaLabelledBy).to.exist;
      });
    });

    it('should have proper button labels', () => {
      cy.get('button').each(($button) => {
        const text = $button.text().trim();
        const ariaLabel = $button.attr('aria-label');
        const title = $button.attr('title');
        
        expect(text || ariaLabel || title).to.exist;
      });
    });

    it('should have proper link text', () => {
      cy.get('a').each(($link) => {
        const text = $link.text().trim();
        const ariaLabel = $link.attr('aria-label');
        const title = $link.attr('title');
        
        expect(text || ariaLabel || title).to.exist;
      });
    });
  });

  describe('Color and Contrast Tests', () => {
    beforeEach(() => {
      cy.visit('/student-dashboard');
    });

    it('should have sufficient color contrast', () => {
      cy.injectAxe();
      cy.checkA11y(null, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
    });

    it('should not rely solely on color to convey information', () => {
      // Check that important information is not conveyed only through color
      cy.get('[class*="text-red"], [class*="text-green"], [class*="text-yellow"]').each(($el) => {
        const text = $el.text().trim();
        const hasIcon = $el.find('svg, [class*="icon"]').length > 0;
        const hasAriaLabel = $el.attr('aria-label');
        
        // Information should be conveyed through text, icons, or aria labels, not just color
        expect(text || hasIcon || hasAriaLabel).to.be.true;
      });
    });
  });

  describe('Accessibility Feature Tests', () => {
    beforeEach(() => {
      cy.visit('/student-dashboard');
    });

    it('should maintain functionality with accessibility features', () => {
      // Test that interactive elements still work
      cy.get('button').first().should('be.visible').click();
      cy.get('a').first().should('be.visible').click();
    });
  });

  describe('Mobile Accessibility Tests', () => {
    beforeEach(() => {
      cy.viewport(375, 667);
      cy.visit('/student-dashboard');
    });

    it('should have proper touch targets on mobile', () => {
      cy.get('button, a, input, select, textarea').each(($el) => {
        cy.wrap($el).should(($element) => {
          const rect = $element[0].getBoundingClientRect();
          expect(rect.height).to.be.at.least(44);
          expect(rect.width).to.be.at.least(44);
        });
      });
    });

    it('should be accessible on mobile screen readers', () => {
      cy.injectAxe();
      cy.checkA11y(null, {
        rules: {
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'focus-order-semantics': { enabled: true },
        },
      });
    });
  });

  describe('Error Handling Accessibility', () => {
    beforeEach(() => {
      cy.visit('/student-dashboard');
    });

    it('should announce errors to screen readers', () => {
      // Trigger an error (this would need to be implemented in the app)
      cy.get('[data-testid="error-trigger"]').click();
      
      // Check that error is announced
      cy.get('[role="alert"]').should('be.visible');
      cy.get('[aria-live="polite"], [aria-live="assertive"]').should('exist');
    });

    it('should have proper error messages', () => {
      cy.get('[data-testid="form-submit"]').click();
      
      // Check that validation errors are properly associated with form fields
      cy.get('input[aria-invalid="true"]').should('exist');
      cy.get('[aria-describedby]').should('exist');
    });
  });

  describe('Dynamic Content Accessibility', () => {
    beforeEach(() => {
      cy.visit('/student-dashboard');
    });

    it('should announce dynamic content changes', () => {
      // Test loading states
      cy.get('[data-testid="refresh-button"]').click();
      cy.get('[aria-live="polite"]').should('contain', 'Loading');
      
      // Test success messages
      cy.get('[aria-live="polite"]').should('contain', 'Success');
    });

    it('should maintain focus during dynamic updates', () => {
      const focusedElement = cy.get('button').first().focus();
      
      // Trigger a dynamic update
      cy.get('[data-testid="refresh-button"]').click();
      
      // Focus should be maintained or properly managed
      cy.focused().should('exist');
    });
  });

  describe('Table Accessibility', () => {
    beforeEach(() => {
      cy.visit('/attendance');
    });

    it('should have proper table structure', () => {
      cy.get('table').should('exist');
      cy.get('table thead').should('exist');
      cy.get('table tbody').should('exist');
      cy.get('table th').should('exist');
      cy.get('table td').should('exist');
    });

    it('should have proper table headers', () => {
      cy.get('table th').each(($th) => {
        const scope = $th.attr('scope');
        const id = $th.attr('id');
        
        expect(scope || id).to.exist;
      });
    });

    it('should have proper table cell associations', () => {
      cy.get('table td').each(($td) => {
        const headers = $td.attr('headers');
        const scope = $td.attr('scope');
        
        // At least one association method should exist
        expect(headers || scope).to.exist;
      });
    });
  });
});
