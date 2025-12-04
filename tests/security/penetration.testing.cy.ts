import { describe, it, beforeEach, afterEach } from 'cypress';

describe('Security Penetration Testing', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'password123'
  };

  beforeEach(() => {
    // Clear database and seed test data
    cy.task('db:seed');
    
    // Clear localStorage and sessionStorage
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  afterEach(() => {
    // Clean up test data
    cy.task('db:cleanup');
  });

  describe('Authentication Security', () => {
    it('should prevent SQL injection in login', () => {
      const sqlInjectionPayloads = [
        "admin' OR '1'='1",
        "admin' OR '1'='1' --",
        "admin' OR '1'='1' #",
        "admin' OR '1'='1' /*",
        "admin'; DROP TABLE users; --",
        "admin' UNION SELECT * FROM users --"
      ];

      sqlInjectionPayloads.forEach(payload => {
        cy.visit('/login');
        cy.get('[data-cy=email-input]').type(payload);
        cy.get('[data-cy=password-input]').type('password');
        cy.get('[data-cy=login-button]').click();
        
        // Should not succeed
        cy.url().should('include', '/login');
        cy.get('[data-cy=error-message]').should('be.visible');
      });
    });

    it('should prevent XSS attacks in login form', () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        'javascript:alert("XSS")',
        '<svg onload=alert("XSS")>',
        '<iframe src="javascript:alert(\'XSS\')"></iframe>'
      ];

      xssPayloads.forEach(payload => {
        cy.visit('/login');
        cy.get('[data-cy=email-input]').type(payload);
        cy.get('[data-cy=password-input]').type('password');
        cy.get('[data-cy=login-button]').click();
        
        // Should not execute script
        cy.window().then((win) => {
          expect(win.alert).to.not.be.called;
        });
      });
    });

    it('should prevent brute force attacks', () => {
      // Attempt multiple failed logins
      for (let i = 0; i < 10; i++) {
        cy.visit('/login');
        cy.get('[data-cy=email-input]').type('test@example.com');
        cy.get('[data-cy=password-input]').type('wrongpassword');
        cy.get('[data-cy=login-button]').click();
        
        if (i < 5) {
          cy.get('[data-cy=error-message]').should('be.visible');
        } else {
          // Should be rate limited
          cy.get('[data-cy=rate-limit-message]').should('be.visible');
          cy.get('[data-cy=login-button]').should('be.disabled');
        }
      }
    });

    it('should prevent session hijacking', () => {
      // Login normally
      cy.visit('/login');
      cy.get('[data-cy=email-input]').type(testUser.email);
      cy.get('[data-cy=password-input]').type(testUser.password);
      cy.get('[data-cy=login-button]').click();
      
      // Get session token
      cy.window().then((win) => {
        const token = win.localStorage.getItem('token');
        
        // Clear session
        cy.clearLocalStorage();
        
        // Try to use token in different context
        cy.visit('/dashboard', {
          onBeforeLoad: (win) => {
            win.localStorage.setItem('token', token);
          }
        });
        
        // Should redirect to login
        cy.url().should('include', '/login');
      });
    });
  });

  describe('Location Security', () => {
    it('should prevent location spoofing', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Attempt location spoofing
      cy.window().then((win) => {
        // Mock geolocation API
        cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake((success) => {
          success({
            coords: {
              latitude: 51.5074, // London (impossible from NYC)
              longitude: -0.1278,
              accuracy: 0.001 // Suspiciously high accuracy
            }
          });
        });
      });
      
      // Try to mark attendance
      cy.get('[data-cy=qr-code-input]').type('qr-code-123');
      cy.get('[data-cy=verify-qr-button]').click();
      
      // Should detect spoofing
      cy.get('[data-cy=location-spoofing-detected]').should('be.visible');
      cy.get('[data-cy=fraud-score]').should('contain', '95');
      cy.get('[data-cy=attendance-blocked]').should('be.visible');
    });

    it('should prevent GPS manipulation', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Attempt GPS manipulation
      cy.window().then((win) => {
        // Mock manipulated GPS data
        cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake((success) => {
          success({
            coords: {
              latitude: 40.7128,
              longitude: -74.0060,
              accuracy: 0.0001, // Impossible accuracy
              altitude: 1000000, // Impossible altitude
              speed: 1000, // Impossible speed
              heading: 999 // Invalid heading
            }
          });
        });
      });
      
      // Try to mark attendance
      cy.get('[data-cy=qr-code-input]').type('qr-code-123');
      cy.get('[data-cy=verify-qr-button]').click();
      
      // Should detect manipulation
      cy.get('[data-cy=gps-manipulation-detected]').should('be.visible');
      cy.get('[data-cy=fraud-score]').should('contain', '90');
    });

    it('should prevent location replay attacks', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Attempt location replay
      cy.window().then((win) => {
        // Mock replayed location data
        cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake((success) => {
          success({
            coords: {
              latitude: 40.7128,
              longitude: -74.0060,
              accuracy: 5,
              timestamp: Date.now() - 3600000 // 1 hour old
            }
          });
        });
      });
      
      // Try to mark attendance
      cy.get('[data-cy=qr-code-input]').type('qr-code-123');
      cy.get('[data-cy=verify-qr-button]').click();
      
      // Should detect replay
      cy.get('[data-cy=location-replay-detected]').should('be.visible');
      cy.get('[data-cy=fraud-score]').should('contain', '80');
    });
  });

  describe('Device Security', () => {
    it('should prevent device fingerprint spoofing', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Attempt device fingerprint spoofing
      cy.window().then((win) => {
        // Mock spoofed device data
        Object.defineProperty(win.navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          writable: false
        });
        
        Object.defineProperty(win.screen, 'width', {
          value: 1920,
          writable: false
        });
        
        Object.defineProperty(win.screen, 'height', {
          value: 1080,
          writable: false
        });
        
        // Mock canvas fingerprinting
        cy.stub(win.HTMLCanvasElement.prototype, 'toDataURL').returns('spoofed-canvas-data');
      });
      
      // Try to mark attendance
      cy.get('[data-cy=qr-code-input]').type('qr-code-123');
      cy.get('[data-cy=verify-qr-button]').click();
      
      // Should detect spoofing
      cy.get('[data-cy=device-spoofing-detected]').should('be.visible');
      cy.get('[data-cy=fraud-score]').should('contain', '85');
    });

    it('should prevent device sharing', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Simulate device sharing
      cy.window().then((win) => {
        // Mock shared device fingerprint
        cy.stub(win.localStorage, 'getItem').callsFake((key) => {
          if (key === 'deviceFingerprint') {
            return 'shared-device-fingerprint-123';
          }
          return null;
        });
      });
      
      // Try to mark attendance
      cy.get('[data-cy=qr-code-input]').type('qr-code-123');
      cy.get('[data-cy=verify-qr-button]').click();
      
      // Should detect sharing
      cy.get('[data-cy=device-sharing-detected]').should('be.visible');
      cy.get('[data-cy=fraud-score]').should('contain', '75');
    });

    it('should prevent device cloning', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Simulate device cloning
      cy.window().then((win) => {
        // Mock cloned device data
        cy.stub(win.navigator, 'hardwareConcurrency').value(8);
        cy.stub(win.navigator, 'maxTouchPoints').value(0);
        cy.stub(win.navigator, 'vendor').value('Google Inc.');
        cy.stub(win.navigator, 'renderer').value('ANGLE (Intel, Intel(R) HD Graphics 620 Direct3D11 vs_5_0 ps_5_0)');
      });
      
      // Try to mark attendance
      cy.get('[data-cy=qr-code-input]').type('qr-code-123');
      cy.get('[data-cy=verify-qr-button]').click();
      
      // Should detect cloning
      cy.get('[data-cy=device-cloning-detected]').should('be.visible');
      cy.get('[data-cy=fraud-score]').should('contain', '80');
    });
  });

  describe('Time Security', () => {
    it('should prevent time manipulation', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Attempt time manipulation
      cy.window().then((win) => {
        // Mock manipulated time
        cy.stub(win.Date, 'now').returns(Date.now() - 3600000); // 1 hour ago
        cy.stub(win.Date.prototype, 'getTime').returns(Date.now() - 3600000);
      });
      
      // Try to mark attendance
      cy.get('[data-cy=qr-code-input]').type('qr-code-123');
      cy.get('[data-cy=verify-qr-button]').click();
      
      // Should detect time manipulation
      cy.get('[data-cy=time-manipulation-detected]').should('be.visible');
      cy.get('[data-cy=fraud-score]').should('contain', '90');
    });

    it('should prevent timezone manipulation', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Attempt timezone manipulation
      cy.window().then((win) => {
        // Mock manipulated timezone
        cy.stub(win.Intl.DateTimeFormat.prototype, 'resolvedOptions').returns({
          timeZone: 'Asia/Tokyo' // Different timezone
        });
      });
      
      // Try to mark attendance
      cy.get('[data-cy=qr-code-input]').type('qr-code-123');
      cy.get('[data-cy=verify-qr-button]').click();
      
      // Should detect timezone manipulation
      cy.get('[data-cy=timezone-manipulation-detected]').should('be.visible');
      cy.get('[data-cy=fraud-score]').should('contain', '70');
    });
  });

  describe('QR Code Security', () => {
    it('should prevent QR code sharing', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Attempt QR code sharing
      cy.get('[data-cy=qr-code-input]').type('shared-qr-code-123');
      cy.get('[data-cy=verify-qr-button]').click();
      
      // Should detect sharing
      cy.get('[data-cy=qr-code-sharing-detected]').should('be.visible');
      cy.get('[data-cy=fraud-score]').should('contain', '85');
    });

    it('should prevent QR code replay attacks', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Attempt QR code replay
      cy.get('[data-cy=qr-code-input]').type('replayed-qr-code-123');
      cy.get('[data-cy=verify-qr-button]').click();
      
      // Should detect replay
      cy.get('[data-cy=qr-code-replay-detected]').should('be.visible');
      cy.get('[data-cy=fraud-score]').should('contain', '80');
    });

    it('should prevent QR code manipulation', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Attempt QR code manipulation
      cy.get('[data-cy=qr-code-input]').type('manipulated-qr-code-123');
      cy.get('[data-cy=verify-qr-button]').click();
      
      // Should detect manipulation
      cy.get('[data-cy=qr-code-manipulation-detected]').should('be.visible');
      cy.get('[data-cy=fraud-score]').should('contain', '90');
    });
  });

  describe('Photo Security', () => {
    it('should prevent photo manipulation', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Attempt photo manipulation
      cy.get('[data-cy=camera-access-button]').click();
      cy.get('[data-cy=camera-feed]').should('be.visible');
      
      // Mock manipulated photo
      cy.window().then((win) => {
        cy.stub(win.HTMLCanvasElement.prototype, 'toBlob').callsFake((callback) => {
          // Create manipulated image data
          const canvas = win.document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = 'red';
          ctx.fillRect(0, 0, 100, 100);
          canvas.toBlob(callback);
        });
      });
      
      cy.get('[data-cy=capture-photo-button]').click();
      
      // Should detect manipulation
      cy.get('[data-cy=photo-manipulation-detected]').should('be.visible');
      cy.get('[data-cy=fraud-score]').should('contain', '85');
    });

    it('should prevent photo replay attacks', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Attempt photo replay
      cy.get('[data-cy=camera-access-button]').click();
      cy.get('[data-cy=camera-feed]').should('be.visible');
      
      // Mock replayed photo
      cy.window().then((win) => {
        cy.stub(win.HTMLCanvasElement.prototype, 'toBlob').callsFake((callback) => {
          // Create replayed image data
          const canvas = win.document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = 'blue';
          ctx.fillRect(0, 0, 100, 100);
          canvas.toBlob(callback);
        });
      });
      
      cy.get('[data-cy=capture-photo-button]').click();
      
      // Should detect replay
      cy.get('[data-cy=photo-replay-detected]').should('be.visible');
      cy.get('[data-cy=fraud-score]').should('contain', '80');
    });
  });

  describe('Network Security', () => {
    it('should prevent proxy/VPN usage', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Mock proxy/VPN detection
      cy.window().then((win) => {
        cy.stub(win.navigator, 'connection').value({
          effectiveType: '4g',
          downlink: 10,
          rtt: 50
        });
      });
      
      // Try to mark attendance
      cy.get('[data-cy=qr-code-input]').type('qr-code-123');
      cy.get('[data-cy=verify-qr-button]').click();
      
      // Should detect proxy/VPN
      cy.get('[data-cy=proxy-vpn-detected]').should('be.visible');
      cy.get('[data-cy=fraud-score]').should('contain', '70');
    });

    it('should prevent IP spoofing', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Mock IP spoofing
      cy.window().then((win) => {
        cy.stub(win.fetch).callsFake((url, options) => {
          if (url.includes('/api/attendance/scan')) {
            return Promise.resolve({
              ok: false,
              status: 403,
              json: () => Promise.resolve({
                error: 'IP spoofing detected',
                fraudScore: 90
              })
            });
          }
          return win.fetch(url, options);
        });
      });
      
      // Try to mark attendance
      cy.get('[data-cy=qr-code-input]').type('qr-code-123');
      cy.get('[data-cy=verify-qr-button]').click();
      
      // Should detect IP spoofing
      cy.get('[data-cy=ip-spoofing-detected]').should('be.visible');
      cy.get('[data-cy=fraud-score]').should('contain', '90');
    });
  });

  describe('API Security', () => {
    it('should prevent API endpoint enumeration', () => {
      const endpoints = [
        '/api/attendance/sessions',
        '/api/attendance/records',
        '/api/attendance/fraud-alerts',
        '/api/attendance/analytics',
        '/api/attendance/security-metrics'
      ];

      endpoints.forEach(endpoint => {
        cy.request({
          method: 'GET',
          url: endpoint,
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.be.oneOf([401, 403, 404]);
        });
      });
    });

    it('should prevent API parameter pollution', () => {
      cy.request({
        method: 'GET',
        url: '/api/attendance/sessions?page=1&page=2&limit=10&limit=20',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([400, 401, 403]);
      });
    });

    it('should prevent API method override', () => {
      cy.request({
        method: 'POST',
        url: '/api/attendance/sessions',
        headers: {
          'X-HTTP-Method-Override': 'DELETE'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([400, 401, 403]);
      });
    });
  });

  describe('Data Security', () => {
    it('should prevent data exfiltration', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Attempt data exfiltration
      cy.window().then((win) => {
        cy.stub(win.fetch).callsFake((url, options) => {
          if (url.includes('attendance')) {
            // Should not send sensitive data
            expect(options.body).to.not.include('password');
            expect(options.body).to.not.include('token');
            expect(options.body).to.not.include('fingerprint');
          }
          return win.fetch(url, options);
        });
      });
      
      // Try to mark attendance
      cy.get('[data-cy=qr-code-input]').type('qr-code-123');
      cy.get('[data-cy=verify-qr-button]').click();
    });

    it('should prevent data tampering', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Attempt data tampering
      cy.window().then((win) => {
        cy.stub(win.fetch).callsFake((url, options) => {
          if (url.includes('attendance')) {
            // Should validate data integrity
            const body = JSON.parse(options.body);
            expect(body).to.have.property('timestamp');
            expect(body).to.have.property('location');
            expect(body).to.have.property('deviceFingerprint');
          }
          return win.fetch(url, options);
        });
      });
      
      // Try to mark attendance
      cy.get('[data-cy=qr-code-input]').type('qr-code-123');
      cy.get('[data-cy=verify-qr-button]').click();
    });
  });
});
