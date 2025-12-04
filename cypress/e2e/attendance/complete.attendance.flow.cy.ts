import { describe, it, beforeEach, afterEach } from 'cypress';

describe('Complete Attendance Flow E2E Tests', () => {
  const professorEmail = 'professor@example.com';
  const professorPassword = 'password123';
  const studentEmail = 'student@example.com';
  const studentPassword = 'password123';
  const courseName = 'Test Course';
  const sessionTitle = 'Test Attendance Session';

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

  describe('Professor Session Management Flow', () => {
    it('should create, start, monitor, and stop attendance session', () => {
      // Login as professor
      cy.visit('/login');
      cy.get('[data-cy=email-input]').type(professorEmail);
      cy.get('[data-cy=password-input]').type(professorPassword);
      cy.get('[data-cy=login-button]').click();
      cy.url().should('include', '/dashboard');

      // Navigate to attendance management
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=create-session-button]').click();

      // Create new session
      cy.get('[data-cy=session-title-input]').type(sessionTitle);
      cy.get('[data-cy=session-description-input]').type('Test session description');
      cy.get('[data-cy=course-select]').select(courseName);
      
      // Set session time
      cy.get('[data-cy=start-time-input]').type('2024-01-15T09:00');
      cy.get('[data-cy=end-time-input]').type('2024-01-15T11:00');
      
      // Configure location
      cy.get('[data-cy=location-toggle]').click();
      cy.get('[data-cy=location-latitude-input]').type('40.7128');
      cy.get('[data-cy=location-longitude-input]').type('-74.0060');
      cy.get('[data-cy=location-radius-input]').type('100');
      cy.get('[data-cy=location-name-input]').type('Test Location');
      
      // Configure security settings
      cy.get('[data-cy=require-location-toggle]').click();
      cy.get('[data-cy=require-photo-toggle]').click();
      cy.get('[data-cy=require-device-check-toggle]').click();
      cy.get('[data-cy=enable-fraud-detection-toggle]').click();
      cy.get('[data-cy=max-attempts-input]').type('3');
      cy.get('[data-cy=grace-period-input]').type('300');
      
      // Save session
      cy.get('[data-cy=save-session-button]').click();
      cy.get('[data-cy=success-message]').should('contain', 'Session created successfully');
      
      // Verify session appears in list
      cy.get('[data-cy=sessions-list]').should('contain', sessionTitle);
      cy.get('[data-cy=session-status]').should('contain', 'SCHEDULED');

      // Start session
      cy.get('[data-cy=start-session-button]').click();
      cy.get('[data-cy=confirm-start-button]').click();
      cy.get('[data-cy=session-status]').should('contain', 'ACTIVE');
      cy.get('[data-cy=qr-code-display]').should('be.visible');

      // Monitor session
      cy.get('[data-cy=live-attendance-tracking]').should('be.visible');
      cy.get('[data-cy=attendance-stats]').should('contain', 'Total: 0');
      cy.get('[data-cy=present-count]').should('contain', '0');
      cy.get('[data-cy=absent-count]').should('contain', '0');

      // Wait for student attendance (simulated)
      cy.wait(2000);
      
      // Stop session
      cy.get('[data-cy=stop-session-button]').click();
      cy.get('[data-cy=confirm-stop-button]').click();
      cy.get('[data-cy=session-status]').should('contain', 'COMPLETED');
    });

    it('should handle emergency session stop', () => {
      // Login as professor and create active session
      cy.loginAsProfessor();
      cy.createActiveSession(sessionTitle);
      
      // Trigger emergency stop
      cy.get('[data-cy=emergency-stop-button]').click();
      cy.get('[data-cy=emergency-reason-input]').type('Technical issues');
      cy.get('[data-cy=confirm-emergency-stop-button]').click();
      
      // Verify emergency stop
      cy.get('[data-cy=session-status]').should('contain', 'CANCELLED');
      cy.get('[data-cy=emergency-notification]').should('be.visible');
      cy.get('[data-cy=emergency-reason]').should('contain', 'Technical issues');
    });

    it('should display real-time attendance updates', () => {
      // Login as professor and start session
      cy.loginAsProfessor();
      cy.createActiveSession(sessionTitle);
      
      // Verify real-time components are visible
      cy.get('[data-cy=live-attendance-tracking]').should('be.visible');
      cy.get('[data-cy=real-time-fraud-alerts]').should('be.visible');
      cy.get('[data-cy=security-status-updates]').should('be.visible');
      cy.get('[data-cy=connection-status-indicator]').should('be.visible');
      
      // Verify WebSocket connection
      cy.get('[data-cy=connection-status]').should('contain', 'connected');
      cy.get('[data-cy=connection-quality]').should('be.visible');
    });
  });

  describe('Student Attendance Flow', () => {
    it('should complete secure attendance process', () => {
      // Login as student
      cy.visit('/login');
      cy.get('[data-cy=email-input]').type(studentEmail);
      cy.get('[data-cy=password-input]').type(studentPassword);
      cy.get('[data-cy=login-button]').click();
      cy.url().should('include', '/dashboard');

      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();

      // Step 1: QR Code Scanning
      cy.get('[data-cy=qr-scanner]').should('be.visible');
      cy.get('[data-cy=scan-qr-button]').click();
      
      // Simulate QR code scan
      cy.get('[data-cy=qr-code-input]').type('qr-code-123');
      cy.get('[data-cy=verify-qr-button]').click();
      cy.get('[data-cy=qr-verification-success]').should('be.visible');

      // Step 2: Location Verification
      cy.get('[data-cy=location-verification]').should('be.visible');
      cy.get('[data-cy=request-location-button]').click();
      
      // Grant location permission (simulated)
      cy.get('[data-cy=location-permission-granted]').should('be.visible');
      cy.get('[data-cy=location-accuracy]').should('contain', '5m');
      cy.get('[data-cy=location-distance]').should('contain', '0m');
      cy.get('[data-cy=location-verified]').should('be.visible');

      // Step 3: Device Verification
      cy.get('[data-cy=device-verification]').should('be.visible');
      cy.get('[data-cy=device-fingerprint]').should('be.visible');
      cy.get('[data-cy=device-verified]').should('be.visible');

      // Step 4: Photo Capture (if required)
      cy.get('[data-cy=photo-capture]').should('be.visible');
      cy.get('[data-cy=camera-access-button]').click();
      cy.get('[data-cy=camera-feed]').should('be.visible');
      cy.get('[data-cy=capture-photo-button]').click();
      cy.get('[data-cy=photo-preview]').should('be.visible');
      cy.get('[data-cy=photo-quality-score]').should('contain', '85%');
      cy.get('[data-cy=photo-verified]').should('be.visible');

      // Step 5: Final Confirmation
      cy.get('[data-cy=attendance-confirmation]').should('be.visible');
      cy.get('[data-cy=security-summary]').should('be.visible');
      cy.get('[data-cy=submit-attendance-button]').click();
      
      // Verify success
      cy.get('[data-cy=attendance-success]').should('be.visible');
      cy.get('[data-cy=attendance-status]').should('contain', 'PRESENT');
      cy.get('[data-cy=fraud-score]').should('contain', '15');
    });

    it('should handle attendance failure scenarios', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();

      // Test invalid QR code
      cy.get('[data-cy=qr-code-input]').type('invalid-qr-code');
      cy.get('[data-cy=verify-qr-button]').click();
      cy.get('[data-cy=qr-verification-error]').should('contain', 'Invalid QR code');

      // Test location outside radius
      cy.get('[data-cy=location-input]').type('51.5074,-0.1278'); // London coordinates
      cy.get('[data-cy=verify-location-button]').click();
      cy.get('[data-cy=location-error]').should('contain', 'outside allowed area');

      // Test device verification failure
      cy.get('[data-cy=device-fingerprint]').should('contain', 'unknown-device');
      cy.get('[data-cy=device-error]').should('contain', 'Device not registered');

      // Test photo quality failure
      cy.get('[data-cy=capture-photo-button]').click();
      cy.get('[data-cy=photo-quality-error]').should('contain', 'Quality too low');
    });

    it('should handle fraud detection alerts', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();

      // Simulate suspicious behavior
      cy.get('[data-cy=qr-code-input]').type('qr-code-123');
      cy.get('[data-cy=verify-qr-button]').click();
      
      // Trigger fraud detection
      cy.get('[data-cy=fraud-warning]').should('be.visible');
      cy.get('[data-cy=fraud-score]').should('contain', '85');
      cy.get('[data-cy=fraud-reasons]').should('contain', 'Location fraud detected');
      
      // Verify fraud alert is sent to professor
      cy.get('[data-cy=fraud-alert-sent]').should('be.visible');
    });
  });

  describe('Multi-User Interaction Flow', () => {
    it('should handle multiple students marking attendance simultaneously', () => {
      // Create active session as professor
      cy.loginAsProfessor();
      cy.createActiveSession(sessionTitle);
      
      // Open multiple browser windows for students
      cy.window().then((win) => {
        // Student 1
        cy.visit('/login', { onBeforeLoad: (win) => {
          win.localStorage.setItem('test-user', 'student1');
        }});
        cy.get('[data-cy=email-input]').type('student1@example.com');
        cy.get('[data-cy=password-input]').type(studentPassword);
        cy.get('[data-cy=login-button]').click();
        
        // Student 2
        cy.visit('/login', { onBeforeLoad: (win) => {
          win.localStorage.setItem('test-user', 'student2');
        }});
        cy.get('[data-cy=email-input]').type('student2@example.com');
        cy.get('[data-cy=password-input]').type(studentPassword);
        cy.get('[data-cy=login-button]').click();
      });

      // Both students mark attendance
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      cy.get('[data-cy=qr-code-input]').type('qr-code-123');
      cy.get('[data-cy=verify-qr-button]').click();
      cy.get('[data-cy=submit-attendance-button]').click();
      
      // Verify professor sees real-time updates
      cy.visit('/professor-dashboard');
      cy.get('[data-cy=live-attendance-tracking]').should('contain', 'Total: 2');
      cy.get('[data-cy=present-count]').should('contain', '2');
    });

    it('should handle concurrent fraud attempts', () => {
      // Create active session as professor
      cy.loginAsProfessor();
      cy.createActiveSession(sessionTitle);
      
      // Multiple students attempt fraud simultaneously
      cy.window().then((win) => {
        // Student 1 - Location fraud
        cy.visit('/login', { onBeforeLoad: (win) => {
          win.localStorage.setItem('test-user', 'student1');
        }});
        cy.get('[data-cy=email-input]').type('student1@example.com');
        cy.get('[data-cy=password-input]').type(studentPassword);
        cy.get('[data-cy=login-button]').click();
        
        // Student 2 - Device fraud
        cy.visit('/login', { onBeforeLoad: (win) => {
          win.localStorage.setItem('test-user', 'student2');
        }});
        cy.get('[data-cy=email-input]').type('student2@example.com');
        cy.get('[data-cy=password-input]').type(studentPassword);
        cy.get('[data-cy=login-button]').click();
      });

      // Trigger fraud attempts
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      cy.get('[data-cy=qr-code-input]').type('qr-code-123');
      cy.get('[data-cy=verify-qr-button]').click();
      
      // Simulate location fraud
      cy.get('[data-cy=location-input]').type('51.5074,-0.1278');
      cy.get('[data-cy=verify-location-button]').click();
      
      // Verify fraud alerts
      cy.get('[data-cy=fraud-warning]').should('be.visible');
      cy.get('[data-cy=fraud-score]').should('contain', '85');
      
      // Verify professor receives alerts
      cy.visit('/professor-dashboard');
      cy.get('[data-cy=real-time-fraud-alerts]').should('contain', '2');
      cy.get('[data-cy=fraud-alert-list]').should('contain', 'Location fraud');
      cy.get('[data-cy=fraud-alert-list]').should('contain', 'Device fraud');
    });
  });

  describe('Error Handling Flow', () => {
    it('should handle network connectivity issues', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Simulate network disconnection
      cy.intercept('POST', '/api/attendance/scan', { forceNetworkError: true });
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Attempt attendance
      cy.get('[data-cy=qr-code-input]').type('qr-code-123');
      cy.get('[data-cy=verify-qr-button]').click();
      
      // Verify error handling
      cy.get('[data-cy=connection-error]').should('be.visible');
      cy.get('[data-cy=retry-button]').should('be.visible');
      cy.get('[data-cy=offline-message]').should('contain', 'Connection lost');
      
      // Restore network
      cy.intercept('POST', '/api/attendance/scan', { fixture: 'attendance-success.json' });
      cy.get('[data-cy=retry-button]').click();
      
      // Verify recovery
      cy.get('[data-cy=attendance-success]').should('be.visible');
    });

    it('should handle server errors gracefully', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Simulate server error
      cy.intercept('POST', '/api/attendance/scan', { statusCode: 500, body: { error: 'Internal server error' } });
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Attempt attendance
      cy.get('[data-cy=qr-code-input]').type('qr-code-123');
      cy.get('[data-cy=verify-qr-button]').click();
      
      // Verify error handling
      cy.get('[data-cy=server-error]').should('be.visible');
      cy.get('[data-cy=error-message]').should('contain', 'Internal server error');
      cy.get('[data-cy=contact-support-button]').should('be.visible');
    });

    it('should handle session timeout', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Wait for session to timeout
      cy.wait(10000);
      
      // Attempt attendance after timeout
      cy.get('[data-cy=qr-code-input]').type('qr-code-123');
      cy.get('[data-cy=verify-qr-button]').click();
      
      // Verify timeout handling
      cy.get('[data-cy=session-timeout]').should('be.visible');
      cy.get('[data-cy=session-expired]').should('contain', 'Session has ended');
      cy.get('[data-cy=refresh-button]').should('be.visible');
    });
  });

  describe('Security Verification Flow', () => {
    it('should verify all security measures are enforced', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Verify security components are present
      cy.get('[data-cy=security-status]').should('be.visible');
      cy.get('[data-cy=location-security]').should('contain', 'GPS Required');
      cy.get('[data-cy=device-security]').should('contain', 'Device Verified');
      cy.get('[data-cy=photo-security]').should('contain', 'Photo Required');
      cy.get('[data-cy=fraud-detection]').should('contain', 'Enabled');
      
      // Verify security indicators
      cy.get('[data-cy=security-score]').should('contain', '95');
      cy.get('[data-cy=risk-level]').should('contain', 'LOW');
      cy.get('[data-cy=security-warnings]').should('not.exist');
    });

    it('should detect and prevent location spoofing', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Attempt location spoofing
      cy.get('[data-cy=location-input]').type('40.7128,-74.0060');
      cy.get('[data-cy=location-accuracy]').type('0.001'); // Suspiciously high accuracy
      cy.get('[data-cy=verify-location-button]').click();
      
      // Verify spoofing detection
      cy.get('[data-cy=location-spoofing-warning]').should('be.visible');
      cy.get('[data-cy=fraud-score]').should('contain', '90');
      cy.get('[data-cy=fraud-reasons]').should('contain', 'Location spoofing detected');
    });

    it('should detect and prevent device sharing', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Attempt device sharing
      cy.get('[data-cy=device-fingerprint]').should('contain', 'shared-device-fingerprint');
      cy.get('[data-cy=device-sharing-warning]').should('be.visible');
      cy.get('[data-cy=fraud-score]').should('contain', '75');
      cy.get('[data-cy=fraud-reasons]').should('contain', 'Device sharing detected');
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle high volume of attendance requests', () => {
      // Create active session as professor
      cy.loginAsProfessor();
      cy.createActiveSession(sessionTitle);
      
      // Simulate multiple students marking attendance
      for (let i = 0; i < 10; i++) {
        cy.window().then((win) => {
          cy.visit('/login', { onBeforeLoad: (win) => {
            win.localStorage.setItem('test-user', `student${i}`);
          }});
          cy.get('[data-cy=email-input]').type(`student${i}@example.com`);
          cy.get('[data-cy=password-input]').type(studentPassword);
          cy.get('[data-cy=login-button]').click();
          
          // Mark attendance
          cy.get('[data-cy=attendance-menu]').click();
          cy.get('[data-cy=mark-attendance-button]').click();
          cy.get('[data-cy=qr-code-input]').type('qr-code-123');
          cy.get('[data-cy=verify-qr-button]').click();
          cy.get('[data-cy=submit-attendance-button]').click();
        });
      }
      
      // Verify professor dashboard handles load
      cy.visit('/professor-dashboard');
      cy.get('[data-cy=live-attendance-tracking]').should('contain', 'Total: 10');
      cy.get('[data-cy=attendance-stats]').should('be.visible');
      cy.get('[data-cy=real-time-updates]').should('be.visible');
    });

    it('should maintain performance under stress', () => {
      // Create active session as professor
      cy.loginAsProfessor();
      cy.createActiveSession(sessionTitle);
      
      // Monitor performance metrics
      cy.get('[data-cy=performance-metrics]').should('be.visible');
      cy.get('[data-cy=response-time]').should('contain', '< 100ms');
      cy.get('[data-cy=memory-usage]').should('contain', '< 50MB');
      cy.get('[data-cy=cpu-usage]').should('contain', '< 30%');
      
      // Verify WebSocket performance
      cy.get('[data-cy=websocket-metrics]').should('be.visible');
      cy.get('[data-cy=connection-latency]').should('contain', '< 50ms');
      cy.get('[data-cy=message-throughput]').should('contain', '> 100 msg/s');
    });
  });
});
