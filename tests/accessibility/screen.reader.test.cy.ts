import { describe, it, beforeEach, afterEach } from 'cypress';

describe('Accessibility Screen Reader Tests', () => {
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

  describe('Screen Reader Compatibility', () => {
    it('should provide proper ARIA labels for attendance form', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Verify ARIA labels
      cy.get('[data-cy=qr-scanner]').should('have.attr', 'aria-label', 'QR Code Scanner');
      cy.get('[data-cy=qr-code-input]').should('have.attr', 'aria-label', 'QR Code Input');
      cy.get('[data-cy=verify-qr-button]').should('have.attr', 'aria-label', 'Verify QR Code');
      
      cy.get('[data-cy=location-verification]').should('have.attr', 'aria-label', 'Location Verification');
      cy.get('[data-cy=request-location-button]').should('have.attr', 'aria-label', 'Request Location Permission');
      cy.get('[data-cy=location-accuracy]').should('have.attr', 'aria-label', 'Location Accuracy');
      
      cy.get('[data-cy=device-verification]').should('have.attr', 'aria-label', 'Device Verification');
      cy.get('[data-cy=device-fingerprint]').should('have.attr', 'aria-label', 'Device Fingerprint');
      
      cy.get('[data-cy=photo-capture]').should('have.attr', 'aria-label', 'Photo Capture');
      cy.get('[data-cy=camera-access-button]').should('have.attr', 'aria-label', 'Access Camera');
      cy.get('[data-cy=capture-photo-button]').should('have.attr', 'aria-label', 'Capture Photo');
      
      cy.get('[data-cy=submit-attendance-button]').should('have.attr', 'aria-label', 'Submit Attendance');
    });

    it('should provide proper ARIA descriptions for complex elements', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Verify ARIA descriptions
      cy.get('[data-cy=qr-scanner]').should('have.attr', 'aria-describedby', 'qr-scanner-description');
      cy.get('[data-cy=qr-scanner-description]').should('contain', 'Scan the QR code displayed by your professor');
      
      cy.get('[data-cy=location-verification]').should('have.attr', 'aria-describedby', 'location-verification-description');
      cy.get('[data-cy=location-verification-description]').should('contain', 'Your location will be verified to ensure you are in the correct area');
      
      cy.get('[data-cy=device-verification]').should('have.attr', 'aria-describedby', 'device-verification-description');
      cy.get('[data-cy=device-verification-description]').should('contain', 'Your device will be verified to ensure security');
      
      cy.get('[data-cy=photo-capture]').should('have.attr', 'aria-describedby', 'photo-capture-description');
      cy.get('[data-cy=photo-capture-description]').should('contain', 'Take a photo to verify your identity');
    });

    it('should announce status changes to screen readers', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Verify status announcements
      cy.get('[data-cy=qr-scanner]').click();
      cy.get('[data-cy=qr-verification-success]').should('have.attr', 'aria-live', 'polite');
      cy.get('[data-cy=qr-verification-success]').should('contain', 'QR code verified successfully');
      
      cy.get('[data-cy=request-location-button]').click();
      cy.get('[data-cy=location-permission-granted]').should('have.attr', 'aria-live', 'polite');
      cy.get('[data-cy=location-permission-granted]').should('contain', 'Location permission granted');
      
      cy.get('[data-cy=device-verified]').should('have.attr', 'aria-live', 'polite');
      cy.get('[data-cy=device-verified]').should('contain', 'Device verified successfully');
      
      cy.get('[data-cy=capture-photo-button]').click();
      cy.get('[data-cy=photo-verified]').should('have.attr', 'aria-live', 'polite');
      cy.get('[data-cy=photo-verified]').should('contain', 'Photo captured successfully');
    });

    it('should provide proper role attributes for interactive elements', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Verify role attributes
      cy.get('[data-cy=qr-scanner]').should('have.attr', 'role', 'button');
      cy.get('[data-cy=location-verification]').should('have.attr', 'role', 'region');
      cy.get('[data-cy=device-verification]').should('have.attr', 'role', 'region');
      cy.get('[data-cy=photo-capture]').should('have.attr', 'role', 'region');
      cy.get('[data-cy=attendance-confirmation]').should('have.attr', 'role', 'dialog');
      
      // Verify form elements
      cy.get('[data-cy=qr-code-input]').should('have.attr', 'role', 'textbox');
      cy.get('[data-cy=location-accuracy]').should('have.attr', 'role', 'progressbar');
      cy.get('[data-cy=device-fingerprint]').should('have.attr', 'role', 'textbox');
      cy.get('[data-cy=photo-preview]').should('have.attr', 'role', 'img');
    });

    it('should provide proper focus management', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Verify focus management
      cy.get('[data-cy=qr-scanner]').focus();
      cy.get('[data-cy=qr-scanner]').should('have.focus');
      
      cy.get('[data-cy=qr-scanner]').tab();
      cy.get('[data-cy=location-verification]').should('have.focus');
      
      cy.get('[data-cy=location-verification]').tab();
      cy.get('[data-cy=device-verification]').should('have.focus');
      
      cy.get('[data-cy=device-verification]').tab();
      cy.get('[data-cy=photo-capture]').should('have.focus');
      
      cy.get('[data-cy=photo-capture]').tab();
      cy.get('[data-cy=submit-attendance-button]').should('have.focus');
    });

    it('should provide proper error announcements', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Trigger errors
      cy.get('[data-cy=qr-code-input]').type('invalid-qr-code');
      cy.get('[data-cy=verify-qr-button]').click();
      
      // Verify error announcements
      cy.get('[data-cy=qr-verification-error]').should('have.attr', 'aria-live', 'assertive');
      cy.get('[data-cy=qr-verification-error]').should('contain', 'Invalid QR code');
      
      cy.get('[data-cy=location-input]').type('51.5074,-0.1278');
      cy.get('[data-cy=verify-location-button]').click();
      
      cy.get('[data-cy=location-error]').should('have.attr', 'aria-live', 'assertive');
      cy.get('[data-cy=location-error]').should('contain', 'Location outside allowed area');
      
      cy.get('[data-cy=device-fingerprint]').should('contain', 'unknown-device');
      cy.get('[data-cy=device-error]').should('have.attr', 'aria-live', 'assertive');
      cy.get('[data-cy=device-error]').should('contain', 'Device not registered');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support full keyboard navigation', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Test keyboard navigation
      cy.get('body').tab();
      cy.get('[data-cy=qr-scanner]').should('have.focus');
      
      cy.get('[data-cy=qr-scanner]').tab();
      cy.get('[data-cy=qr-code-input]').should('have.focus');
      
      cy.get('[data-cy=qr-code-input]').tab();
      cy.get('[data-cy=verify-qr-button]').should('have.focus');
      
      cy.get('[data-cy=verify-qr-button]').tab();
      cy.get('[data-cy=location-verification]').should('have.focus');
      
      cy.get('[data-cy=location-verification]').tab();
      cy.get('[data-cy=device-verification]').should('have.focus');
      
      cy.get('[data-cy=device-verification]').tab();
      cy.get('[data-cy=photo-capture]').should('have.focus');
      
      cy.get('[data-cy=photo-capture]').tab();
      cy.get('[data-cy=submit-attendance-button]').should('have.focus');
    });

    it('should support keyboard shortcuts', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Test keyboard shortcuts
      cy.get('body').type('{ctrl+alt+q}'); // QR scanner shortcut
      cy.get('[data-cy=qr-scanner]').should('have.focus');
      
      cy.get('body').type('{ctrl+alt+l}'); // Location verification shortcut
      cy.get('[data-cy=location-verification]').should('have.focus');
      
      cy.get('body').type('{ctrl+alt+d}'); // Device verification shortcut
      cy.get('[data-cy=device-verification]').should('have.focus');
      
      cy.get('body').type('{ctrl+alt+p}'); // Photo capture shortcut
      cy.get('[data-cy=photo-capture]').should('have.focus');
      
      cy.get('body').type('{ctrl+enter}'); // Submit attendance shortcut
      cy.get('[data-cy=submit-attendance-button]').should('have.focus');
    });

    it('should support arrow key navigation', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Test arrow key navigation
      cy.get('[data-cy=qr-scanner]').focus();
      cy.get('[data-cy=qr-scanner]').type('{rightArrow}');
      cy.get('[data-cy=location-verification]').should('have.focus');
      
      cy.get('[data-cy=location-verification]').type('{rightArrow}');
      cy.get('[data-cy=device-verification]').should('have.focus');
      
      cy.get('[data-cy=device-verification]').type('{rightArrow}');
      cy.get('[data-cy=photo-capture]').should('have.focus');
      
      cy.get('[data-cy=photo-capture]').type('{leftArrow}');
      cy.get('[data-cy=device-verification]').should('have.focus');
      
      cy.get('[data-cy=device-verification]').type('{leftArrow}');
      cy.get('[data-cy=location-verification]').should('have.focus');
    });

    it('should support escape key to close modals', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Open modal
      cy.get('[data-cy=help-button]').click();
      cy.get('[data-cy=help-modal]').should('be.visible');
      
      // Close modal with escape key
      cy.get('[data-cy=help-modal]').type('{esc}');
      cy.get('[data-cy=help-modal]').should('not.be.visible');
      
      // Open settings modal
      cy.get('[data-cy=settings-button]').click();
      cy.get('[data-cy=settings-modal]').should('be.visible');
      
      // Close modal with escape key
      cy.get('[data-cy=settings-modal]').type('{esc}');
      cy.get('[data-cy=settings-modal]').should('not.be.visible');
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    it('should meet WCAG AA color contrast requirements', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Verify color contrast
      cy.get('[data-cy=qr-scanner]').should('have.css', 'color').and('match', /rgb\(255, 255, 255\)|rgb\(0, 0, 0\)/);
      cy.get('[data-cy=qr-scanner]').should('have.css', 'background-color').and('match', /rgb\(0, 0, 0\)|rgb\(255, 255, 255\)/);
      
      cy.get('[data-cy=location-verification]').should('have.css', 'color').and('match', /rgb\(255, 255, 255\)|rgb\(0, 0, 0\)/);
      cy.get('[data-cy=location-verification]').should('have.css', 'background-color').and('match', /rgb\(0, 0, 0\)|rgb\(255, 255, 255\)/);
      
      cy.get('[data-cy=device-verification]').should('have.css', 'color').and('match', /rgb\(255, 255, 255\)|rgb\(0, 0, 0\)/);
      cy.get('[data-cy=device-verification]').should('have.css', 'background-color').and('match', /rgb\(0, 0, 0\)|rgb\(255, 255, 255\)/);
      
      cy.get('[data-cy=photo-capture]').should('have.css', 'color').and('match', /rgb\(255, 255, 255\)|rgb\(0, 0, 0\)/);
      cy.get('[data-cy=photo-capture]').should('have.css', 'background-color').and('match', /rgb\(0, 0, 0\)|rgb\(255, 255, 255\)/);
    });

    it('should provide high contrast mode support', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Enable high contrast mode
      cy.get('[data-cy=high-contrast-toggle]').click();
      
      // Verify high contrast mode
      cy.get('[data-cy=qr-scanner]').should('have.class', 'high-contrast');
      cy.get('[data-cy=location-verification]').should('have.class', 'high-contrast');
      cy.get('[data-cy=device-verification]').should('have.class', 'high-contrast');
      cy.get('[data-cy=photo-capture]').should('have.class', 'high-contrast');
      
      // Verify increased contrast
      cy.get('[data-cy=qr-scanner]').should('have.css', 'color').and('match', /rgb\(255, 255, 255\)/);
      cy.get('[data-cy=qr-scanner]').should('have.css', 'background-color').and('match', /rgb\(0, 0, 0\)/);
    });

    it('should support colorblind users', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Verify colorblind support
      cy.get('[data-cy=status-indicators]').should('have.attr', 'aria-label');
      cy.get('[data-cy=status-indicators]').should('contain', 'Success');
      cy.get('[data-cy=status-indicators]').should('contain', 'Error');
      cy.get('[data-cy=status-indicators]').should('contain', 'Warning');
      
      // Verify icons are used alongside colors
      cy.get('[data-cy=success-icon]').should('be.visible');
      cy.get('[data-cy=error-icon]').should('be.visible');
      cy.get('[data-cy=warning-icon]').should('be.visible');
    });
  });

  describe('Mobile Accessibility', () => {
    it('should support touch navigation', () => {
      // Set mobile viewport
      cy.viewport(375, 667);
      
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Verify touch targets are large enough
      cy.get('[data-cy=qr-scanner]').should('have.css', 'min-height', '44px');
      cy.get('[data-cy=qr-scanner]').should('have.css', 'min-width', '44px');
      
      cy.get('[data-cy=location-verification]').should('have.css', 'min-height', '44px');
      cy.get('[data-cy=location-verification]').should('have.css', 'min-width', '44px');
      
      cy.get('[data-cy=device-verification]').should('have.css', 'min-height', '44px');
      cy.get('[data-cy=device-verification]').should('have.css', 'min-width', '44px');
      
      cy.get('[data-cy=photo-capture]').should('have.css', 'min-height', '44px');
      cy.get('[data-cy=photo-capture]').should('have.css', 'min-width', '44px');
    });

    it('should support swipe navigation', () => {
      // Set mobile viewport
      cy.viewport(375, 667);
      
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Test swipe navigation
      cy.get('[data-cy=attendance-steps]').swipe('left');
      cy.get('[data-cy=location-verification]').should('be.visible');
      
      cy.get('[data-cy=attendance-steps]').swipe('left');
      cy.get('[data-cy=device-verification]').should('be.visible');
      
      cy.get('[data-cy=attendance-steps]').swipe('left');
      cy.get('[data-cy=photo-capture]').should('be.visible');
      
      cy.get('[data-cy=attendance-steps]').swipe('right');
      cy.get('[data-cy=device-verification]').should('be.visible');
    });

    it('should support voice navigation', () => {
      // Set mobile viewport
      cy.viewport(375, 667);
      
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Verify voice navigation support
      cy.get('[data-cy=qr-scanner]').should('have.attr', 'aria-label');
      cy.get('[data-cy=location-verification]').should('have.attr', 'aria-label');
      cy.get('[data-cy=device-verification]').should('have.attr', 'aria-label');
      cy.get('[data-cy=photo-capture]').should('have.attr', 'aria-label');
      
      // Verify voice commands
      cy.get('[data-cy=voice-commands]').should('be.visible');
      cy.get('[data-cy=voice-commands]').should('contain', 'Say "Scan QR" to scan QR code');
      cy.get('[data-cy=voice-commands]').should('contain', 'Say "Location" to verify location');
      cy.get('[data-cy=voice-commands]').should('contain', 'Say "Device" to verify device');
      cy.get('[data-cy=voice-commands]').should('contain', 'Say "Photo" to capture photo');
    });
  });

  describe('Assistive Technology Support', () => {
    it('should work with screen readers', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Verify screen reader support
      cy.get('[data-cy=qr-scanner]').should('have.attr', 'aria-label');
      cy.get('[data-cy=qr-scanner]').should('have.attr', 'aria-describedby');
      cy.get('[data-cy=qr-scanner]').should('have.attr', 'role');
      
      cy.get('[data-cy=location-verification]').should('have.attr', 'aria-label');
      cy.get('[data-cy=location-verification]').should('have.attr', 'aria-describedby');
      cy.get('[data-cy=location-verification]').should('have.attr', 'role');
      
      cy.get('[data-cy=device-verification]').should('have.attr', 'aria-label');
      cy.get('[data-cy=device-verification]').should('have.attr', 'aria-describedby');
      cy.get('[data-cy=device-verification]').should('have.attr', 'role');
      
      cy.get('[data-cy=photo-capture]').should('have.attr', 'aria-label');
      cy.get('[data-cy=photo-capture]').should('have.attr', 'aria-describedby');
      cy.get('[data-cy=photo-capture]').should('have.attr', 'role');
    });

    it('should work with voice recognition software', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Verify voice recognition support
      cy.get('[data-cy=qr-scanner]').should('have.attr', 'aria-label');
      cy.get('[data-cy=location-verification]').should('have.attr', 'aria-label');
      cy.get('[data-cy=device-verification]').should('have.attr', 'aria-label');
      cy.get('[data-cy=photo-capture]').should('have.attr', 'aria-label');
      
      // Verify voice commands are available
      cy.get('[data-cy=voice-commands]').should('be.visible');
      cy.get('[data-cy=voice-commands]').should('contain', 'Voice commands available');
    });

    it('should work with switch navigation', () => {
      // Login as student
      cy.loginAsStudent();
      
      // Navigate to attendance page
      cy.get('[data-cy=attendance-menu]').click();
      cy.get('[data-cy=mark-attendance-button]').click();
      
      // Verify switch navigation support
      cy.get('[data-cy=qr-scanner]').should('have.attr', 'tabindex', '0');
      cy.get('[data-cy=location-verification]').should('have.attr', 'tabindex', '0');
      cy.get('[data-cy=device-verification]').should('have.attr', 'tabindex', '0');
      cy.get('[data-cy=photo-capture]').should('have.attr', 'tabindex', '0');
      
      // Test switch navigation
      cy.get('[data-cy=qr-scanner]').focus();
      cy.get('[data-cy=qr-scanner]').type('{space}');
      cy.get('[data-cy=qr-scanner]').should('have.class', 'active');
      
      cy.get('[data-cy=location-verification]').focus();
      cy.get('[data-cy=location-verification]').type('{space}');
      cy.get('[data-cy=location-verification]').should('have.class', 'active');
    });
  });
});
