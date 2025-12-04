// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR requests from command log
Cypress.on('window:before:load', (win) => {
  // Mock console methods to reduce noise in tests
  win.console.log = () => {};
  win.console.warn = () => {};
  win.console.error = () => {};
});

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Don't fail tests on uncaught exceptions
  // that are not related to the application
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  return true;
});

// Custom viewport sizes
Cypress.Commands.add('setViewport', (size: 'mobile' | 'tablet' | 'desktop') => {
  const sizes = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1280, height: 720 }
  };
  
  cy.viewport(sizes[size].width, sizes[size].height);
});

// Wait for page to be fully loaded
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('body').should('be.visible');
  cy.get('[data-testid="loading"]').should('not.exist');
});

// Login helper
Cypress.Commands.add('login', (email: string, password: string, role: 'student' | 'professor' | 'admin' = 'student') => {
  cy.session([email, password, role], () => {
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type(email);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('not.include', '/login');
    cy.get('[data-testid="user-menu"]').should('be.visible');
  });
});

// Logout helper
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="logout-button"]').click();
  cy.get('[data-testid="confirm-logout"]').click();
  cy.url().should('include', '/login');
});

// Mock API responses
Cypress.Commands.add('mockApiResponse', (method: string, url: string, response: any, statusCode: number = 200) => {
  cy.intercept(method, url, {
    statusCode,
    body: response
  }).as(`${method.toLowerCase()}_${url.replace(/[^a-zA-Z0-9]/g, '_')}`);
});

// Wait for API call
Cypress.Commands.add('waitForApiCall', (alias: string) => {
  cy.wait(`@${alias}`);
});

// Clear all mocks
Cypress.Commands.add('clearAllMocks', () => {
  cy.window().then((win) => {
    if (win.fetch) {
      cy.stub(win, 'fetch').callsFake(() => {
        return Promise.resolve(new Response('{}', { status: 200 }));
      });
    }
  });
});

// Custom assertions
Cypress.Commands.add('shouldHaveText', { prevSubject: true }, (subject, text: string) => {
  cy.wrap(subject).should('contain.text', text);
});

Cypress.Commands.add('shouldBeVisible', { prevSubject: true }, (subject) => {
  cy.wrap(subject).should('be.visible');
});

Cypress.Commands.add('shouldBeHidden', { prevSubject: true }, (subject) => {
  cy.wrap(subject).should('not.be.visible');
});

// Form helpers
Cypress.Commands.add('fillForm', (formData: Record<string, string>) => {
  Object.entries(formData).forEach(([field, value]) => {
    cy.get(`[data-testid="${field}"]`).type(value);
  });
});

Cypress.Commands.add('submitForm', (formSelector: string = '[data-testid="form"]') => {
  cy.get(formSelector).submit();
});

// Navigation helpers
Cypress.Commands.add('navigateTo', (path: string) => {
  cy.visit(path);
  cy.waitForPageLoad();
});

Cypress.Commands.add('goBack', () => {
  cy.go('back');
});

// File upload helpers
Cypress.Commands.add('uploadFile', (selector: string, filePath: string) => {
  cy.get(selector).selectFile(filePath);
});

// Date/Time helpers
Cypress.Commands.add('setDate', (selector: string, date: string) => {
  cy.get(selector).type(date);
});

Cypress.Commands.add('setTime', (selector: string, time: string) => {
  cy.get(selector).type(time);
});

// Accessibility helpers
Cypress.Commands.add('checkA11y', () => {
  cy.injectAxe();
  cy.checkA11y();
});

// Performance helpers
Cypress.Commands.add('measurePerformance', (name: string) => {
  cy.window().then((win) => {
    const start = win.performance.now();
    cy.then(() => {
      const end = win.performance.now();
      const duration = end - start;
      cy.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
    });
  });
});

// Database helpers (for testing with real data)
Cypress.Commands.add('seedDatabase', (fixture: string) => {
  cy.fixture(fixture).then((data) => {
    cy.request('POST', '/api/test/seed', data);
  });
});

Cypress.Commands.add('cleanDatabase', () => {
  cy.request('POST', '/api/test/clean');
});

// Notification helpers
Cypress.Commands.add('shouldShowNotification', (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  cy.get(`[data-testid="notification-${type}"]`).should('contain.text', message);
});

Cypress.Commands.add('dismissNotification', () => {
  cy.get('[data-testid="notification-close"]').click();
});

// Modal helpers
Cypress.Commands.add('openModal', (modalSelector: string) => {
  cy.get(`[data-testid="${modalSelector}"]`).click();
  cy.get('[data-testid="modal"]').should('be.visible');
});

Cypress.Commands.add('closeModal', () => {
  cy.get('[data-testid="modal-close"]').click();
  cy.get('[data-testid="modal"]').should('not.be.visible');
});

// Table helpers
Cypress.Commands.add('sortTable', (column: string, direction: 'asc' | 'desc' = 'asc') => {
  cy.get(`[data-testid="table-header-${column}"]`).click();
  if (direction === 'desc') {
    cy.get(`[data-testid="table-header-${column}"]`).click();
  }
});

Cypress.Commands.add('filterTable', (column: string, value: string) => {
  cy.get(`[data-testid="table-filter-${column}"]`).type(value);
});

Cypress.Commands.add('selectTableRow', (rowIndex: number) => {
  cy.get(`[data-testid="table-row-${rowIndex}"]`).click();
});

// Pagination helpers
Cypress.Commands.add('goToNextPage', () => {
  cy.get('[data-testid="pagination-next"]').click();
});

Cypress.Commands.add('goToPreviousPage', () => {
  cy.get('[data-testid="pagination-previous"]').click();
});

Cypress.Commands.add('goToPage', (pageNumber: number) => {
  cy.get(`[data-testid="pagination-page-${pageNumber}"]`).click();
});

// Search helpers
Cypress.Commands.add('search', (query: string) => {
  cy.get('[data-testid="search-input"]').type(query);
  cy.get('[data-testid="search-button"]').click();
});

Cypress.Commands.add('clearSearch', () => {
  cy.get('[data-testid="search-clear"]').click();
});

// Theme helpers
Cypress.Commands.add('toggleTheme', () => {
  cy.get('[data-testid="theme-toggle"]').click();
});

Cypress.Commands.add('setTheme', (theme: 'light' | 'dark') => {
  cy.window().then((win) => {
    win.localStorage.setItem('theme', theme);
    cy.reload();
  });
});

// Local storage helpers
Cypress.Commands.add('setLocalStorage', (key: string, value: string) => {
  cy.window().then((win) => {
    win.localStorage.setItem(key, value);
  });
});

Cypress.Commands.add('getLocalStorage', (key: string) => {
  cy.window().then((win) => {
    return win.localStorage.getItem(key);
  });
});

Cypress.Commands.overwrite('clearLocalStorage', (originalFn) => {
  cy.window().then((win) => {
    win.localStorage.clear();
  });
  return originalFn();
});

// Session storage helpers
Cypress.Commands.add('setSessionStorage', (key: string, value: string) => {
  cy.window().then((win) => {
    win.sessionStorage.setItem(key, value);
  });
});

Cypress.Commands.add('getSessionStorage', (key: string) => {
  cy.window().then((win) => {
    return win.sessionStorage.getItem(key);
  });
});

Cypress.Commands.add('clearSessionStorage', () => {
  cy.window().then((win) => {
    win.sessionStorage.clear();
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      setViewport(size: 'mobile' | 'tablet' | 'desktop'): Chainable<void>;
      waitForPageLoad(): Chainable<void>;
      login(email: string, password: string, role?: 'student' | 'professor' | 'admin'): Chainable<void>;
      logout(): Chainable<void>;
      mockApiResponse(method: string, url: string, response: any, statusCode?: number): Chainable<void>;
      waitForApiCall(alias: string): Chainable<void>;
      clearAllMocks(): Chainable<void>;
      shouldHaveText(text: string): Chainable<void>;
      shouldBeVisible(): Chainable<void>;
      shouldBeHidden(): Chainable<void>;
      fillForm(formData: Record<string, string>): Chainable<void>;
      submitForm(formSelector?: string): Chainable<void>;
      navigateTo(path: string): Chainable<void>;
      goBack(): Chainable<void>;
      uploadFile(selector: string, filePath: string): Chainable<void>;
      setDate(selector: string, date: string): Chainable<void>;
      setTime(selector: string, time: string): Chainable<void>;
      checkA11y(): Chainable<void>;
      measurePerformance(name: string): Chainable<void>;
      seedDatabase(fixture: string): Chainable<void>;
      cleanDatabase(): Chainable<void>;
      shouldShowNotification(message: string, type?: 'success' | 'error' | 'warning' | 'info'): Chainable<void>;
      dismissNotification(): Chainable<void>;
      openModal(modalSelector: string): Chainable<void>;
      closeModal(): Chainable<void>;
      sortTable(column: string, direction?: 'asc' | 'desc'): Chainable<void>;
      filterTable(column: string, value: string): Chainable<void>;
      selectTableRow(rowIndex: number): Chainable<void>;
      goToNextPage(): Chainable<void>;
      goToPreviousPage(): Chainable<void>;
      goToPage(pageNumber: number): Chainable<void>;
      search(query: string): Chainable<void>;
      clearSearch(): Chainable<void>;
      toggleTheme(): Chainable<void>;
      setTheme(theme: 'light' | 'dark'): Chainable<void>;
      setLocalStorage(key: string, value: string): Chainable<void>;
      getLocalStorage(key: string): Chainable<any>;
      clearLocalStorage(): Chainable<void>;
      setSessionStorage(key: string, value: string): Chainable<void>;
      getSessionStorage(key: string): Chainable<any>;
      clearSessionStorage(): Chainable<void>;
    }
  }
}
