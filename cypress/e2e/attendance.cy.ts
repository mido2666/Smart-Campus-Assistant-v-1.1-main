describe('Attendance Functionality', () => {
  beforeEach(() => {
    cy.clearAllMocks();
    cy.clearLocalStorage();
    cy.clearSessionStorage();
  });

  describe('Student Attendance Marking', () => {
    beforeEach(() => {
      cy.login('student@example.com', 'password123', 'student');
    });

    it('should display attendance page correctly', () => {
      // Mock attendance data
      cy.mockApiResponse('GET', '/api/attendance/records', {
        success: true,
        data: {
          records: [
            {
              id: 1,
              courseName: 'Computer Science 101',
              date: '2024-01-15',
              status: 'PRESENT',
              sessionTitle: 'Lecture 1'
            },
            {
              id: 2,
              courseName: 'Computer Science 101',
              date: '2024-01-16',
              status: 'ABSENT',
              sessionTitle: 'Lecture 2'
            }
          ],
          stats: {
            totalSessions: 20,
            present: 18,
            absent: 2,
            percentage: 90
          }
        }
      });

      cy.visit('/attendance');
      cy.waitForPageLoad();
      
      // Check attendance records
      cy.get('[data-testid="attendance-records"]').should('be.visible');
      cy.get('[data-testid="attendance-stats"]').should('be.visible');
      
      // Check stats
      cy.get('[data-testid="attendance-percentage"]').should('contain.text', '90%');
      cy.get('[data-testid="total-sessions"]').should('contain.text', '20');
      cy.get('[data-testid="present-count"]').should('contain.text', '18');
      cy.get('[data-testid="absent-count"]').should('contain.text', '2');
    });

    it('should mark attendance using QR code', () => {
      // Mock QR code validation
      cy.mockApiResponse('POST', '/api/attendance/validate-qr', {
        success: true,
        data: {
          isValid: true,
          sessionId: 'session-123',
          courseName: 'Computer Science 101',
          expiresAt: '2024-01-20T10:30:00Z'
        }
      });

      // Mock attendance marking
      cy.mockApiResponse('POST', '/api/attendance/mark', {
        success: true,
        data: {
          id: 1,
          sessionId: 'session-123',
          status: 'PRESENT',
          markedAt: '2024-01-20T10:00:00Z'
        }
      });

      cy.visit('/attendance');
      cy.waitForPageLoad();
      
      // Click scan QR button
      cy.get('[data-testid="scan-qr-button"]').click();
      
      // Simulate QR code scan
      cy.get('[data-testid="qr-scanner"]').should('be.visible');
      
      // Mock successful QR scan
      cy.get('[data-testid="qr-code-input"]').type('session-123');
      cy.get('[data-testid="validate-qr-button"]').click();
      
      cy.waitForApiCall('post_/api/attendance/validate-qr');
      
      // Confirm attendance
      cy.get('[data-testid="confirm-attendance"]').click();
      cy.waitForApiCall('post_/api/attendance/mark');
      
      cy.shouldShowNotification('Attendance marked successfully', 'success');
    });

    it('should show error for invalid QR code', () => {
      // Mock invalid QR code
      cy.mockApiResponse('POST', '/api/attendance/validate-qr', {
        success: false,
        message: 'Invalid or expired QR code'
      }, 400);

      cy.visit('/attendance');
      cy.waitForPageLoad();
      
      cy.get('[data-testid="scan-qr-button"]').click();
      cy.get('[data-testid="qr-code-input"]').type('invalid-code');
      cy.get('[data-testid="validate-qr-button"]').click();
      
      cy.waitForApiCall('post_/api/attendance/validate-qr');
      
      cy.shouldShowNotification('Invalid or expired QR code', 'error');
    });

    it('should show error for expired QR code', () => {
      // Mock expired QR code
      cy.mockApiResponse('POST', '/api/attendance/validate-qr', {
        success: false,
        message: 'QR code has expired'
      }, 400);

      cy.visit('/attendance');
      cy.waitForPageLoad();
      
      cy.get('[data-testid="scan-qr-button"]').click();
      cy.get('[data-testid="qr-code-input"]').type('expired-session');
      cy.get('[data-testid="validate-qr-button"]').click();
      
      cy.waitForApiCall('post_/api/attendance/validate-qr');
      
      cy.shouldShowNotification('QR code has expired', 'error');
    });

    it('should filter attendance records by course', () => {
      cy.mockApiResponse('GET', '/api/attendance/records', {
        success: true,
        data: {
          records: [
            {
              id: 1,
              courseName: 'Computer Science 101',
              date: '2024-01-15',
              status: 'PRESENT'
            },
            {
              id: 2,
              courseName: 'Mathematics 201',
              date: '2024-01-15',
              status: 'ABSENT'
            }
          ],
          stats: { totalSessions: 2, present: 1, absent: 1, percentage: 50 }
        }
      });

      cy.visit('/attendance');
      cy.waitForPageLoad();
      
      // Filter by course
      cy.get('[data-testid="course-filter"]').select('Computer Science 101');
      
      // Should only show CS101 records
      cy.get('[data-testid="attendance-record-1"]').should('be.visible');
      cy.get('[data-testid="attendance-record-2"]').should('not.exist');
    });

    it('should show attendance trends chart', () => {
      cy.mockApiResponse('GET', '/api/attendance/trends', {
        success: true,
        data: {
          dailyAttendance: [
            { date: '2024-01-15', percentage: 90 },
            { date: '2024-01-16', percentage: 85 },
            { date: '2024-01-17', percentage: 95 }
          ],
          weeklyTrend: 90,
          monthlyTrend: 88
        }
      });

      cy.visit('/attendance');
      cy.waitForPageLoad();
      
      cy.get('[data-testid="attendance-trends"]').should('be.visible');
      cy.get('[data-testid="attendance-chart"]').should('be.visible');
    });
  });

  describe('Professor Attendance Management', () => {
    beforeEach(() => {
      cy.login('professor@example.com', 'password123', 'professor');
    });

    it('should display professor attendance page correctly', () => {
      // Mock professor attendance data
      cy.mockApiResponse('GET', '/api/professors/attendance', {
        success: true,
        data: {
          courses: [
            {
              id: 1,
              courseName: 'Computer Science 101',
              enrolledStudents: 25,
              activeSessions: 1
            }
          ],
          activeSessions: [
            {
              id: 'session-123',
              courseName: 'Computer Science 101',
              title: 'Lecture 1',
              startTime: '2024-01-20T10:00:00Z',
              duration: 60
            }
          ]
        }
      });

      cy.visit('/professor/attendance');
      cy.waitForPageLoad();
      
      // Check course list
      cy.get('[data-testid="course-list"]').should('be.visible');
      cy.get('[data-testid="course-1"]').should('contain.text', 'Computer Science 101');
      cy.get('[data-testid="course-1"]').should('contain.text', '25 students');
      
      // Check active sessions
      cy.get('[data-testid="active-sessions"]').should('be.visible');
      cy.get('[data-testid="session-123"]').should('contain.text', 'Lecture 1');
    });

    it('should start attendance session', () => {
      // Mock start session API
      cy.mockApiResponse('POST', '/api/attendance/start-session', {
        success: true,
        data: {
          sessionId: 'session-123',
          qrCode: 'qr-code-data',
          expiresAt: '2024-01-20T11:00:00Z'
        }
      });

      cy.visit('/professor/attendance');
      cy.waitForPageLoad();
      
      // Click start session button
      cy.get('[data-testid="start-session-1"]').click();
      
      // Fill session details
      cy.get('[data-testid="session-title"]').type('Lecture 1');
      cy.get('[data-testid="session-description"]').type('Introduction to Computer Science');
      cy.get('[data-testid="session-duration"]').type('60');
      
      // Submit form
      cy.get('[data-testid="create-session"]').click();
      
      cy.waitForApiCall('post_/api/attendance/start-session');
      
      cy.shouldShowNotification('Attendance session started successfully', 'success');
      
      // Should show QR code
      cy.get('[data-testid="qr-code-display"]').should('be.visible');
    });

    it('should end attendance session', () => {
      // Mock end session API
      cy.mockApiResponse('POST', '/api/attendance/end-session/session-123', {
        success: true,
        message: 'Attendance session ended successfully'
      });

      cy.visit('/professor/attendance');
      cy.waitForPageLoad();
      
      // Click end session button
      cy.get('[data-testid="end-session-123"]').click();
      
      // Confirm end session
      cy.get('[data-testid="confirm-end-session"]').click();
      
      cy.waitForApiCall('post_/api/attendance/end-session/session-123');
      
      cy.shouldShowNotification('Attendance session ended successfully', 'success');
    });

    it('should view attendance records for a course', () => {
      // Mock course attendance records
      cy.mockApiResponse('GET', '/api/attendance/records?courseId=1', {
        success: true,
        data: {
          records: [
            {
              id: 1,
              studentName: 'John Doe',
              studentId: 'STU001',
              date: '2024-01-15',
              status: 'PRESENT'
            },
            {
              id: 2,
              studentName: 'Jane Smith',
              studentId: 'STU002',
              date: '2024-01-15',
              status: 'ABSENT'
            }
          ],
          stats: {
            totalStudents: 25,
            present: 23,
            absent: 2,
            percentage: 92
          }
        }
      });

      cy.visit('/professor/attendance');
      cy.waitForPageLoad();
      
      // Click view records button
      cy.get('[data-testid="view-records-1"]').click();
      
      cy.url().should('include', '/professor/attendance/courses/1');
      
      // Check attendance records
      cy.get('[data-testid="attendance-records-table"]').should('be.visible');
      cy.get('[data-testid="student-1"]').should('contain.text', 'John Doe');
      cy.get('[data-testid="student-2"]').should('contain.text', 'Jane Smith');
      
      // Check stats
      cy.get('[data-testid="attendance-percentage"]').should('contain.text', '92%');
    });

    it('should export attendance records', () => {
      // Mock export API
      cy.mockApiResponse('GET', '/api/attendance/export?courseId=1&format=csv', {
        success: true,
        data: 'csv-data'
      });

      cy.visit('/professor/attendance/courses/1');
      cy.waitForPageLoad();
      
      // Click export button
      cy.get('[data-testid="export-attendance"]').click();
      
      cy.waitForApiCall('get_/api/attendance/export?courseId=1&format=csv');
      
      cy.shouldShowNotification('Attendance records exported successfully', 'success');
    });

    it('should mark attendance manually for a student', () => {
      // Mock manual attendance marking
      cy.mockApiResponse('POST', '/api/attendance/manual-mark', {
        success: true,
        data: {
          id: 1,
          studentId: 'STU001',
          status: 'PRESENT',
          markedAt: '2024-01-20T10:00:00Z'
        }
      });

      cy.visit('/professor/attendance/courses/1');
      cy.waitForPageLoad();
      
      // Click manual mark button for a student
      cy.get('[data-testid="manual-mark-STU001"]').click();
      
      // Select status
      cy.get('[data-testid="attendance-status"]').select('PRESENT');
      
      // Submit
      cy.get('[data-testid="submit-manual-mark"]').click();
      
      cy.waitForApiCall('post_/api/attendance/manual-mark');
      
      cy.shouldShowNotification('Attendance marked successfully', 'success');
    });
  });

  describe('Attendance Analytics', () => {
    beforeEach(() => {
      cy.login('professor@example.com', 'password123', 'professor');
    });

    it('should display attendance analytics dashboard', () => {
      // Mock analytics data
      cy.mockApiResponse('GET', '/api/attendance/analytics', {
        success: true,
        data: {
          overallStats: {
            totalSessions: 100,
            averageAttendance: 85.5,
            totalStudents: 150
          },
          courseStats: [
            {
              courseId: 1,
              courseName: 'Computer Science 101',
              attendanceRate: 90,
              totalSessions: 20
            }
          ],
          trends: {
            daily: [
              { date: '2024-01-15', attendance: 88 },
              { date: '2024-01-16', attendance: 92 }
            ],
            weekly: [
              { week: 'Week 1', attendance: 85 },
              { week: 'Week 2', attendance: 90 }
            ]
          }
        }
      });

      cy.visit('/professor/attendance/analytics');
      cy.waitForPageLoad();
      
      // Check analytics sections
      cy.get('[data-testid="overall-stats"]').should('be.visible');
      cy.get('[data-testid="course-stats"]').should('be.visible');
      cy.get('[data-testid="attendance-trends"]').should('be.visible');
      
      // Check overall stats
      cy.get('[data-testid="total-sessions"]').should('contain.text', '100');
      cy.get('[data-testid="average-attendance"]').should('contain.text', '85.5%');
      cy.get('[data-testid="total-students"]').should('contain.text', '150');
    });

    it('should filter analytics by date range', () => {
      cy.visit('/professor/attendance/analytics');
      cy.waitForPageLoad();
      
      // Set date range
      cy.get('[data-testid="start-date"]').type('2024-01-01');
      cy.get('[data-testid="end-date"]').type('2024-01-31');
      
      // Apply filter
      cy.get('[data-testid="apply-filter"]').click();
      
      // Should reload analytics with new date range
      cy.waitForApiCall('get_/api/attendance/analytics');
    });

    it('should export analytics report', () => {
      // Mock export API
      cy.mockApiResponse('GET', '/api/attendance/analytics/export', {
        success: true,
        data: 'analytics-report-data'
      });

      cy.visit('/professor/attendance/analytics');
      cy.waitForPageLoad();
      
      // Click export button
      cy.get('[data-testid="export-analytics"]').click();
      
      cy.waitForApiCall('get_/api/attendance/analytics/export');
      
      cy.shouldShowNotification('Analytics report exported successfully', 'success');
    });
  });

  describe('Attendance Notifications', () => {
    beforeEach(() => {
      cy.login('student@example.com', 'password123', 'student');
    });

    it('should send attendance reminder notifications', () => {
      // Mock notification API
      cy.mockApiResponse('POST', '/api/notifications/attendance-reminder', {
        success: true,
        message: 'Attendance reminders sent successfully'
      });

      cy.visit('/professor/attendance');
      cy.waitForPageLoad();
      
      // Click send reminders button
      cy.get('[data-testid="send-reminders"]').click();
      
      cy.waitForApiCall('post_/api/notifications/attendance-reminder');
      
      cy.shouldShowNotification('Attendance reminders sent successfully', 'success');
    });

    it('should show low attendance alerts', () => {
      // Mock low attendance data
      cy.mockApiResponse('GET', '/api/attendance/alerts', {
        success: true,
        data: [
          {
            studentId: 'STU001',
            studentName: 'John Doe',
            courseName: 'Computer Science 101',
            attendanceRate: 65,
            threshold: 75
          }
        ]
      });

      cy.visit('/professor/attendance');
      cy.waitForPageLoad();
      
      // Check for low attendance alerts
      cy.get('[data-testid="low-attendance-alerts"]').should('be.visible');
      cy.get('[data-testid="alert-STU001"]').should('contain.text', 'John Doe');
      cy.get('[data-testid="alert-STU001"]').should('contain.text', '65%');
    });
  });

  describe('Attendance Mobile Experience', () => {
    beforeEach(() => {
      cy.login('student@example.com', 'password123', 'student');
    });

    it('should work correctly on mobile devices', () => {
      cy.setViewport('mobile');
      cy.visit('/attendance');
      cy.waitForPageLoad();
      
      // Check if attendance page is mobile-friendly
      cy.get('[data-testid="attendance-records"]').should('be.visible');
      cy.get('[data-testid="scan-qr-button"]').should('be.visible');
      
      // Test QR scanning on mobile
      cy.get('[data-testid="scan-qr-button"]').click();
      cy.get('[data-testid="qr-scanner"]').should('be.visible');
    });

    it('should handle camera permissions for QR scanning', () => {
      cy.setViewport('mobile');
      cy.visit('/attendance');
      cy.waitForPageLoad();
      
      cy.get('[data-testid="scan-qr-button"]').click();
      
      // Mock camera permission denied
      cy.window().then((win) => {
        cy.stub(win.navigator.mediaDevices, 'getUserMedia').rejects(new Error('Permission denied'));
      });
      
      cy.get('[data-testid="qr-scanner"]').should('be.visible');
      cy.shouldShowNotification('Camera permission is required for QR scanning', 'error');
    });
  });

  describe('Attendance Error Handling', () => {
    beforeEach(() => {
      cy.login('student@example.com', 'password123', 'student');
    });

    it('should handle network errors gracefully', () => {
      // Mock network error
      cy.intercept('GET', '/api/attendance/records', {
        forceNetworkError: true
      }).as('networkError');

      cy.visit('/attendance');
      
      cy.wait('@networkError');
      
      cy.shouldShowNotification('Network error. Please check your connection.', 'error');
      cy.get('[data-testid="retry-attendance"]').should('be.visible');
    });

    it('should handle server errors gracefully', () => {
      // Mock server error
      cy.mockApiResponse('GET', '/api/attendance/records', {
        success: false,
        message: 'Internal server error'
      }, 500);

      cy.visit('/attendance');
      cy.waitForPageLoad();
      
      cy.shouldShowNotification('Internal server error', 'error');
      cy.get('[data-testid="attendance-error"]').should('be.visible');
    });

    it('should retry failed requests', () => {
      // Mock initial failure, then success
      cy.intercept('GET', '/api/attendance/records', (req) => {
        req.reply((res) => {
          if (req.alias === 'firstCall') {
            res.statusCode = 500;
            res.body = { success: false, message: 'Server error' };
          } else {
            res.statusCode = 200;
            res.body = {
              success: true,
              data: {
                records: [],
                stats: { totalSessions: 0, present: 0, absent: 0, percentage: 0 }
              }
            };
          }
        });
      }).as('attendanceRecords');

      cy.visit('/attendance');
      
      cy.wait('@attendanceRecords');
      cy.shouldShowNotification('Server error', 'error');
      
      // Click retry
      cy.get('[data-testid="retry-attendance"]').click();
      
      cy.wait('@attendanceRecords');
      cy.get('[data-testid="attendance-error"]').should('not.exist');
    });
  });
});
