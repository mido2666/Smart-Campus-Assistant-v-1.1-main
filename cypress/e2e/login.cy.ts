describe('Login Flow', () => {
  beforeEach(() => {
    cy.clearAllMocks();
    cy.clearLocalStorage();
    cy.clearSessionStorage();
  });

  describe('Login Page', () => {
    it('should display login form correctly', () => {
      cy.visit('/login');
      
      // Check if all form elements are present
      cy.get('[data-testid="email-input"]').should('be.visible');
      cy.get('[data-testid="password-input"]').should('be.visible');
      cy.get('[data-testid="login-button"]').should('be.visible');
      cy.get('[data-testid="register-link"]').should('be.visible');
      
      // Check form labels and placeholders
      cy.get('[data-testid="email-input"]').should('have.attr', 'placeholder', 'Enter your email');
      cy.get('[data-testid="password-input"]').should('have.attr', 'placeholder', 'Enter your password');
      cy.get('[data-testid="login-button"]').should('contain.text', 'Sign In');
    });

    it('should show validation errors for empty fields', () => {
      cy.visit('/login');
      
      // Try to submit empty form
      cy.get('[data-testid="login-button"]').click();
      
      // Check for validation errors
      cy.get('[data-testid="email-error"]').should('contain.text', 'Email is required');
      cy.get('[data-testid="password-error"]').should('contain.text', 'Password is required');
    });

    it('should show validation error for invalid email format', () => {
      cy.visit('/login');
      
      cy.get('[data-testid="email-input"]').type('invalid-email');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="login-button"]').click();
      
      cy.get('[data-testid="email-error"]').should('contain.text', 'Please enter a valid email address');
    });

    it('should show validation error for short password', () => {
      cy.visit('/login');
      
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('123');
      cy.get('[data-testid="login-button"]').click();
      
      cy.get('[data-testid="password-error"]').should('contain.text', 'Password must be at least 6 characters');
    });
  });

  describe('Successful Login', () => {
    it('should login successfully with valid credentials', () => {
      // Mock successful login API response
      cy.mockApiResponse('POST', '/api/auth/login', {
        success: true,
        data: {
          user: {
            id: '1',
            email: 'student@example.com',
            role: 'student',
            firstName: 'John',
            lastName: 'Doe'
          },
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: 900
        }
      });

      cy.visit('/login');
      
      cy.get('[data-testid="email-input"]').type('student@example.com');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="login-button"]').click();
      
      // Wait for API call
      cy.waitForApiCall('post_/api/auth/login');
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');
      
      // Should show user info in navbar
      cy.get('[data-testid="user-menu"]').should('be.visible');
      cy.get('[data-testid="user-name"]').should('contain.text', 'John Doe');
    });

    it('should login as professor and redirect to professor dashboard', () => {
      // Mock professor login API response
      cy.mockApiResponse('POST', '/api/auth/login', {
        success: true,
        data: {
          user: {
            id: '2',
            email: 'professor@example.com',
            role: 'professor',
            firstName: 'Jane',
            lastName: 'Smith'
          },
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: 900
        }
      });

      cy.visit('/login');
      
      cy.get('[data-testid="email-input"]').type('professor@example.com');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="login-button"]').click();
      
      cy.waitForApiCall('post_/api/auth/login');
      
      // Should redirect to professor dashboard
      cy.url().should('include', '/professor/dashboard');
    });

    it('should login as admin and redirect to admin dashboard', () => {
      // Mock admin login API response
      cy.mockApiResponse('POST', '/api/auth/login', {
        success: true,
        data: {
          user: {
            id: '3',
            email: 'admin@example.com',
            role: 'admin',
            firstName: 'Admin',
            lastName: 'User'
          },
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: 900
        }
      });

      cy.visit('/login');
      
      cy.get('[data-testid="email-input"]').type('admin@example.com');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="login-button"]').click();
      
      cy.waitForApiCall('post_/api/auth/login');
      
      // Should redirect to admin dashboard
      cy.url().should('include', '/admin/dashboard');
    });
  });

  describe('Failed Login', () => {
    it('should show error message for invalid credentials', () => {
      // Mock failed login API response
      cy.mockApiResponse('POST', '/api/auth/login', {
        success: false,
        message: 'Invalid email or password'
      }, 401);

      cy.visit('/login');
      
      cy.get('[data-testid="email-input"]').type('wrong@example.com');
      cy.get('[data-testid="password-input"]').type('wrongpassword');
      cy.get('[data-testid="login-button"]').click();
      
      cy.waitForApiCall('post_/api/auth/login');
      
      // Should show error message
      cy.shouldShowNotification('Invalid email or password', 'error');
      
      // Should stay on login page
      cy.url().should('include', '/login');
    });

    it('should show error message for network error', () => {
      // Mock network error
      cy.intercept('POST', '/api/auth/login', {
        forceNetworkError: true
      }).as('loginError');

      cy.visit('/login');
      
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="login-button"]').click();
      
      cy.wait('@loginError');
      
      // Should show network error message
      cy.shouldShowNotification('Network error. Please try again.', 'error');
    });

    it('should show error message for server error', () => {
      // Mock server error
      cy.mockApiResponse('POST', '/api/auth/login', {
        success: false,
        message: 'Internal server error'
      }, 500);

      cy.visit('/login');
      
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="login-button"]').click();
      
      cy.waitForApiCall('post_/api/auth/login');
      
      // Should show server error message
      cy.shouldShowNotification('Internal server error', 'error');
    });
  });

  describe('Login Form Interactions', () => {
    it('should clear validation errors when user starts typing', () => {
      cy.visit('/login');
      
      // Trigger validation errors
      cy.get('[data-testid="login-button"]').click();
      cy.get('[data-testid="email-error"]').should('be.visible');
      
      // Start typing in email field
      cy.get('[data-testid="email-input"]').type('test@example.com');
      
      // Error should be cleared
      cy.get('[data-testid="email-error"]').should('not.exist');
    });

    it('should toggle password visibility', () => {
      cy.visit('/login');
      
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="password-input"]').should('have.attr', 'type', 'password');
      
      // Click toggle button
      cy.get('[data-testid="password-toggle"]').click();
      cy.get('[data-testid="password-input"]').should('have.attr', 'type', 'text');
      
      // Click again to hide
      cy.get('[data-testid="password-toggle"]').click();
      cy.get('[data-testid="password-input"]').should('have.attr', 'type', 'password');
    });

    it('should show loading state during login', () => {
      // Mock delayed API response
      cy.intercept('POST', '/api/auth/login', (req) => {
        req.reply((res) => {
          res.delay(1000);
          res.send({
            success: true,
            data: {
              user: { id: '1', email: 'test@example.com', role: 'student' },
              accessToken: 'token',
              refreshToken: 'refresh',
              expiresIn: 900
            }
          });
        });
      }).as('delayedLogin');

      cy.visit('/login');
      
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="login-button"]').click();
      
      // Should show loading state
      cy.get('[data-testid="login-button"]').should('contain.text', 'Signing In...');
      cy.get('[data-testid="login-button"]').should('be.disabled');
      
      cy.wait('@delayedLogin');
    });

    it('should navigate to register page when clicking register link', () => {
      cy.visit('/login');
      
      cy.get('[data-testid="register-link"]').click();
      cy.url().should('include', '/register');
    });

    it('should navigate to forgot password page when clicking forgot password link', () => {
      cy.visit('/login');
      
      cy.get('[data-testid="forgot-password-link"]').click();
      cy.url().should('include', '/forgot-password');
    });
  });

  describe('Remember Me Functionality', () => {
    it('should remember user credentials when checkbox is checked', () => {
      cy.visit('/login');
      
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('password123');
      cy.get('[data-testid="remember-me"]').check();
      
      // Mock successful login
      cy.mockApiResponse('POST', '/api/auth/login', {
        success: true,
        data: {
          user: { id: '1', email: 'test@example.com', role: 'student' },
          accessToken: 'token',
          refreshToken: 'refresh',
          expiresIn: 900
        }
      });
      
      cy.get('[data-testid="login-button"]').click();
      cy.waitForApiCall('post_/api/auth/login');
      
      // Logout and check if credentials are remembered
      cy.logout();
      cy.visit('/login');
      
      cy.get('[data-testid="email-input"]').should('have.value', 'test@example.com');
      cy.get('[data-testid="remember-me"]').should('be.checked');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible with keyboard navigation', () => {
      cy.visit('/login');
      
      // Tab through form elements
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'email-input');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'password-input');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'login-button');
    });

    it('should have proper ARIA labels and roles', () => {
      cy.visit('/login');
      
      cy.get('[data-testid="email-input"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="password-input"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="login-button"]').should('have.attr', 'type', 'submit');
    });

    it('should announce validation errors to screen readers', () => {
      cy.visit('/login');
      
      cy.get('[data-testid="login-button"]').click();
      
      cy.get('[data-testid="email-error"]').should('have.attr', 'role', 'alert');
      cy.get('[data-testid="password-error"]').should('have.attr', 'role', 'alert');
    });
  });

  describe('Responsive Design', () => {
    it('should work correctly on mobile devices', () => {
      cy.setViewport('mobile');
      cy.visit('/login');
      
      cy.get('[data-testid="email-input"]').should('be.visible');
      cy.get('[data-testid="password-input"]').should('be.visible');
      cy.get('[data-testid="login-button"]').should('be.visible');
    });

    it('should work correctly on tablet devices', () => {
      cy.setViewport('tablet');
      cy.visit('/login');
      
      cy.get('[data-testid="email-input"]').should('be.visible');
      cy.get('[data-testid="password-input"]').should('be.visible');
      cy.get('[data-testid="login-button"]').should('be.visible');
    });
  });

  describe('Security', () => {
    it('should not expose sensitive information in URL', () => {
      cy.visit('/login');
      
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="password-input"]').type('password123');
      
      // URL should not contain credentials
      cy.url().should('not.include', 'test@example.com');
      cy.url().should('not.include', 'password123');
    });

    it('should clear form data after failed login', () => {
      cy.mockApiResponse('POST', '/api/auth/login', {
        success: false,
        message: 'Invalid credentials'
      }, 401);

      cy.visit('/login');
      
      cy.get('[data-testid="email-input"]').type('wrong@example.com');
      cy.get('[data-testid="password-input"]').type('wrongpassword');
      cy.get('[data-testid="login-button"]').click();
      
      cy.waitForApiCall('post_/api/auth/login');
      
      // Password should be cleared after failed login
      cy.get('[data-testid="password-input"]').should('have.value', '');
      cy.get('[data-testid="email-input"]').should('have.value', 'wrong@example.com');
    });
  });
});
