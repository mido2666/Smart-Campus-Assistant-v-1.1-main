describe('Dashboard Functionality', () => {
  beforeEach(() => {
    cy.clearAllMocks();
    cy.clearLocalStorage();
    cy.clearSessionStorage();
  });

  describe('Student Dashboard', () => {
    beforeEach(() => {
      // Mock student login
      cy.login('student@example.com', 'password123', 'student');
      
      // Mock dashboard data
      cy.mockApiResponse('GET', '/api/students/dashboard', {
        success: true,
        data: {
          upcomingClasses: [
            {
              id: 1,
              courseName: 'Computer Science 101',
              professor: 'Dr. Smith',
              time: '10:00 AM',
              room: 'Room 101'
            }
          ],
          recentGrades: [
            {
              id: 1,
              courseName: 'Computer Science 101',
              assignment: 'Midterm Exam',
              grade: 85,
              date: '2024-01-15'
            }
          ],
          attendanceStats: {
            totalClasses: 20,
            attended: 18,
            percentage: 90
          },
          notifications: [
            {
              id: 1,
              title: 'New Assignment Posted',
              message: 'Assignment 3 is now available',
              type: 'assignment',
              read: false
            }
          ]
        }
      });
    });

    it('should display student dashboard correctly', () => {
      cy.visit('/dashboard');
      cy.waitForPageLoad();
      
      // Check dashboard sections
      cy.get('[data-testid="upcoming-classes"]').should('be.visible');
      cy.get('[data-testid="recent-grades"]').should('be.visible');
      cy.get('[data-testid="attendance-stats"]').should('be.visible');
      cy.get('[data-testid="notifications"]').should('be.visible');
      
      // Check upcoming classes
      cy.get('[data-testid="upcoming-classes"]').should('contain.text', 'Computer Science 101');
      cy.get('[data-testid="upcoming-classes"]').should('contain.text', 'Dr. Smith');
      cy.get('[data-testid="upcoming-classes"]').should('contain.text', '10:00 AM');
      
      // Check attendance stats
      cy.get('[data-testid="attendance-percentage"]').should('contain.text', '90%');
      cy.get('[data-testid="attendance-total"]').should('contain.text', '18/20');
    });

    it('should navigate to course details when clicking on upcoming class', () => {
      cy.visit('/dashboard');
      cy.waitForPageLoad();
      
      cy.get('[data-testid="upcoming-class-item-1"]').click();
      cy.url().should('include', '/courses/1');
    });

    it('should show notification count in navbar', () => {
      cy.visit('/dashboard');
      cy.waitForPageLoad();
      
      cy.get('[data-testid="notification-badge"]').should('contain.text', '1');
    });

    it('should mark notification as read when clicked', () => {
      cy.mockApiResponse('PUT', '/api/notifications/1/read', {
        success: true,
        message: 'Notification marked as read'
      });

      cy.visit('/dashboard');
      cy.waitForPageLoad();
      
      cy.get('[data-testid="notification-item-1"]').click();
      cy.waitForApiCall('put_/api/notifications/1/read');
      
      cy.get('[data-testid="notification-item-1"]').should('have.class', 'read');
    });

    it('should refresh dashboard data when refresh button is clicked', () => {
      cy.visit('/dashboard');
      cy.waitForPageLoad();
      
      cy.get('[data-testid="refresh-dashboard"]').click();
      cy.waitForApiCall('get_/api/students/dashboard');
    });
  });

  describe('Professor Dashboard', () => {
    beforeEach(() => {
      // Mock professor login
      cy.login('professor@example.com', 'password123', 'professor');
      
      // Mock professor dashboard data
      cy.mockApiResponse('GET', '/api/professors/dashboard', {
        success: true,
        data: {
          courses: [
            {
              id: 1,
              courseName: 'Computer Science 101',
              enrolledStudents: 25,
              nextClass: '2024-01-20T10:00:00Z'
            }
          ],
          recentAttendance: [
            {
              id: 1,
              courseName: 'Computer Science 101',
              date: '2024-01-15',
              attendanceRate: 92
            }
          ],
          upcomingExams: [
            {
              id: 1,
              courseName: 'Computer Science 101',
              examName: 'Final Exam',
              date: '2024-01-25',
              students: 25
            }
          ],
          notifications: [
            {
              id: 1,
              title: 'Student Question',
              message: 'John Doe asked a question about Assignment 3',
              type: 'question',
              read: false
            }
          ]
        }
      });
    });

    it('should display professor dashboard correctly', () => {
      cy.visit('/professor/dashboard');
      cy.waitForPageLoad();
      
      // Check dashboard sections
      cy.get('[data-testid="courses-section"]').should('be.visible');
      cy.get('[data-testid="attendance-section"]').should('be.visible');
      cy.get('[data-testid="exams-section"]').should('be.visible');
      
      // Check courses
      cy.get('[data-testid="course-1"]').should('contain.text', 'Computer Science 101');
      cy.get('[data-testid="course-1"]').should('contain.text', '25 students');
      
      // Check attendance
      cy.get('[data-testid="attendance-rate-1"]').should('contain.text', '92%');
    });

    it('should navigate to course management when clicking on course', () => {
      cy.visit('/professor/dashboard');
      cy.waitForPageLoad();
      
      cy.get('[data-testid="course-1"]').click();
      cy.url().should('include', '/professor/courses/1');
    });

    it('should start attendance session from dashboard', () => {
      cy.mockApiResponse('POST', '/api/attendance/start-session', {
        success: true,
        data: {
          sessionId: 'session-123',
          qrCode: 'qr-code-data'
        }
      });

      cy.visit('/professor/dashboard');
      cy.waitForPageLoad();
      
      cy.get('[data-testid="start-attendance-1"]').click();
      cy.waitForApiCall('post_/api/attendance/start-session');
      
      cy.shouldShowNotification('Attendance session started successfully', 'success');
    });
  });

  describe('Admin Dashboard', () => {
    beforeEach(() => {
      // Mock admin login
      cy.login('admin@example.com', 'password123', 'admin');
      
      // Mock admin dashboard data
      cy.mockApiResponse('GET', '/api/admin/dashboard', {
        success: true,
        data: {
          userStats: {
            totalUsers: 150,
            students: 120,
            professors: 25,
            admins: 5
          },
          courseStats: {
            totalCourses: 45,
            activeCourses: 42,
            completedCourses: 3
          },
          systemStats: {
            totalLogins: 1250,
            activeUsers: 95,
            systemUptime: '99.9%'
          },
          recentActivity: [
            {
              id: 1,
              type: 'user_registration',
              message: 'New student registered: John Doe',
              timestamp: '2024-01-15T10:30:00Z'
            }
          ]
        }
      });
    });

    it('should display admin dashboard correctly', () => {
      cy.visit('/admin/dashboard');
      cy.waitForPageLoad();
      
      // Check dashboard sections
      cy.get('[data-testid="user-stats"]').should('be.visible');
      cy.get('[data-testid="course-stats"]').should('be.visible');
      cy.get('[data-testid="system-stats"]').should('be.visible');
      cy.get('[data-testid="recent-activity"]').should('be.visible');
      
      // Check user stats
      cy.get('[data-testid="total-users"]').should('contain.text', '150');
      cy.get('[data-testid="total-students"]').should('contain.text', '120');
      cy.get('[data-testid="total-professors"]').should('contain.text', '25');
      
      // Check system stats
      cy.get('[data-testid="system-uptime"]').should('contain.text', '99.9%');
    });

    it('should navigate to user management from dashboard', () => {
      cy.visit('/admin/dashboard');
      cy.waitForPageLoad();
      
      cy.get('[data-testid="manage-users"]').click();
      cy.url().should('include', '/admin/users');
    });

    it('should navigate to course management from dashboard', () => {
      cy.visit('/admin/dashboard');
      cy.waitForPageLoad();
      
      cy.get('[data-testid="manage-courses"]').click();
      cy.url().should('include', '/admin/courses');
    });
  });

  describe('Dashboard Navigation', () => {
    beforeEach(() => {
      cy.login('student@example.com', 'password123', 'student');
    });

    it('should navigate to profile from dashboard', () => {
      cy.visit('/dashboard');
      cy.waitForPageLoad();
      
      cy.get('[data-testid="profile-link"]').click();
      cy.url().should('include', '/profile');
    });

    it('should navigate to courses from dashboard', () => {
      cy.visit('/dashboard');
      cy.waitForPageLoad();
      
      cy.get('[data-testid="courses-link"]').click();
      cy.url().should('include', '/courses');
    });

    it('should navigate to attendance from dashboard', () => {
      cy.visit('/dashboard');
      cy.waitForPageLoad();
      
      cy.get('[data-testid="attendance-link"]').click();
      cy.url().should('include', '/attendance');
    });

    it('should navigate to notifications from dashboard', () => {
      cy.visit('/dashboard');
      cy.waitForPageLoad();
      
      cy.get('[data-testid="notifications-link"]').click();
      cy.url().should('include', '/notifications');
    });
  });

  describe('Dashboard Responsiveness', () => {
    beforeEach(() => {
      cy.login('student@example.com', 'password123', 'student');
    });

    it('should work correctly on mobile devices', () => {
      cy.setViewport('mobile');
      cy.visit('/dashboard');
      cy.waitForPageLoad();
      
      // Check if dashboard sections are visible and properly stacked
      cy.get('[data-testid="upcoming-classes"]').should('be.visible');
      cy.get('[data-testid="recent-grades"]').should('be.visible');
      cy.get('[data-testid="attendance-stats"]').should('be.visible');
    });

    it('should work correctly on tablet devices', () => {
      cy.setViewport('tablet');
      cy.visit('/dashboard');
      cy.waitForPageLoad();
      
      // Check if dashboard sections are visible
      cy.get('[data-testid="upcoming-classes"]').should('be.visible');
      cy.get('[data-testid="recent-grades"]').should('be.visible');
      cy.get('[data-testid="attendance-stats"]').should('be.visible');
    });
  });

  describe('Dashboard Error Handling', () => {
    beforeEach(() => {
      cy.login('student@example.com', 'password123', 'student');
    });

    it('should show error message when dashboard data fails to load', () => {
      cy.mockApiResponse('GET', '/api/students/dashboard', {
        success: false,
        message: 'Failed to load dashboard data'
      }, 500);

      cy.visit('/dashboard');
      cy.waitForPageLoad();
      
      cy.shouldShowNotification('Failed to load dashboard data', 'error');
      cy.get('[data-testid="dashboard-error"]').should('be.visible');
    });

    it('should show retry button when dashboard data fails to load', () => {
      cy.mockApiResponse('GET', '/api/students/dashboard', {
        success: false,
        message: 'Network error'
      }, 500);

      cy.visit('/dashboard');
      cy.waitForPageLoad();
      
      cy.get('[data-testid="retry-dashboard"]').should('be.visible');
      
      // Mock successful retry
      cy.mockApiResponse('GET', '/api/students/dashboard', {
        success: true,
        data: {
          upcomingClasses: [],
          recentGrades: [],
          attendanceStats: { totalClasses: 0, attended: 0, percentage: 0 },
          notifications: []
        }
      });
      
      cy.get('[data-testid="retry-dashboard"]').click();
      cy.waitForApiCall('get_/api/students/dashboard');
      
      cy.get('[data-testid="dashboard-error"]').should('not.exist');
    });
  });

  describe('Dashboard Performance', () => {
    beforeEach(() => {
      cy.login('student@example.com', 'password123', 'student');
    });

    it('should load dashboard within acceptable time', () => {
      cy.visit('/dashboard');
      
      cy.measurePerformance('Dashboard Load');
      cy.waitForPageLoad();
      
      // Dashboard should load within 3 seconds
      cy.get('[data-testid="dashboard-content"]').should('be.visible');
    });

    it('should show loading state while dashboard data is being fetched', () => {
      // Mock delayed API response
      cy.intercept('GET', '/api/students/dashboard', (req) => {
        req.reply((res) => {
          res.delay(1000);
          res.send({
            success: true,
            data: {
              upcomingClasses: [],
              recentGrades: [],
              attendanceStats: { totalClasses: 0, attended: 0, percentage: 0 },
              notifications: []
            }
          });
        });
      }).as('delayedDashboard');

      cy.visit('/dashboard');
      
      // Should show loading state
      cy.get('[data-testid="dashboard-loading"]').should('be.visible');
      
      cy.wait('@delayedDashboard');
      
      // Loading state should be hidden
      cy.get('[data-testid="dashboard-loading"]').should('not.exist');
    });
  });

  describe('Dashboard Accessibility', () => {
    beforeEach(() => {
      cy.login('student@example.com', 'password123', 'student');
    });

    it('should be accessible with keyboard navigation', () => {
      cy.visit('/dashboard');
      cy.waitForPageLoad();
      
      // Tab through dashboard elements
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'search-input');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'notification-bell');
    });

    it('should have proper ARIA labels and roles', () => {
      cy.visit('/dashboard');
      cy.waitForPageLoad();
      
      cy.get('[data-testid="upcoming-classes"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="recent-grades"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="attendance-stats"]').should('have.attr', 'aria-label');
    });

    it('should announce updates to screen readers', () => {
      cy.visit('/dashboard');
      cy.waitForPageLoad();
      
      // When notification count changes
      cy.get('[data-testid="notification-badge"]').should('have.attr', 'aria-live', 'polite');
    });
  });
});
