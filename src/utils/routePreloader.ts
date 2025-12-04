/**
 * Route preloader utilities
 * Preloads critical and role-specific routes for better performance
 */

/**
 * Map of route paths to their corresponding page imports
 */
const routeMap: Record<string, () => Promise<any>> = {
  '/student-dashboard': () => import('../pages/StudentDashboard'),
  '/professor-dashboard': () => import('../pages/ProfessorDashboard'),
  '/schedule': () => import('../pages/Schedule'),
  '/attendance': () => import('../pages/Attendance'),
  '/student-ai-assistant': () => import('../pages/StudentAIAssistant'),
  '/student-notifications': () => import('../pages/StudentNotifications'),
  '/profile': () => import('../pages/Profile'),
  '/professor-profile': () => import('../pages/ProfessorProfile'),
  '/professor-courses': () => import('../pages/MyCourses'),
  '/professor-attendance': () => import('../pages/ProfessorAttendance'),
  '/professor-attendance-create': () => import('../pages/ProfessorAttendanceCreate'),
  '/professor-attendance-sessions': () => import('../pages/ProfessorAttendanceSessions'),
  '/professor-attendance-reports': () => import('../pages/ProfessorAttendanceReports'),
  '/professor-attendance-settings': () => import('../pages/ProfessorAttendanceSettings'),
  '/professor-chatbot': () => import('../pages/ProfessorChatbot'),
  '/professor-notifications': () => import('../pages/ProfessorNotifications'),
};

/**
 * Preload a specific route by path
 * @param routePath - The route path to preload
 */
export function preloadRoute(routePath: string): void {
  const loader = routeMap[routePath];
  if (loader) {
    try {
      loader();
    } catch (error) {
      console.warn(`Failed to preload route ${routePath}:`, error);
    }
  }
}

/**
 * Create a preload handler for use with onMouseEnter
 * @param routePath - The route path to preload
 * @returns Event handler function
 */
export function createPreloadHandler(routePath: string) {
  return () => {
    preloadRoute(routePath);
  };
}

/**
 * Preload critical routes that are commonly accessed
 */
export function preloadCriticalRoutes(): void {
  // Preload critical routes that all users might access
  const criticalRoutes = [
    () => import('../pages/Login'),
  ];

  criticalRoutes.forEach((loader) => {
    try {
      loader();
    } catch (error) {
      console.warn('Failed to preload critical route:', error);
    }
  });
}

/**
 * Preload role-specific routes based on user role
 * @param role - User role ('student' | 'professor' | 'admin')
 */
export function preloadRoleRoutes(role: 'student' | 'professor' | 'admin'): void {
  const roleRoutes: Record<string, Array<() => Promise<any>>> = {
    student: [
      () => import('../pages/StudentDashboard'),
      () => import('../pages/Schedule'),
      () => import('../pages/Attendance'),
      () => import('../pages/StudentAIAssistant'),
      () => import('../pages/StudentNotifications'),
      () => import('../pages/Profile'),
    ],
    professor: [
      () => import('../pages/ProfessorDashboard'),
      () => import('../pages/MyCourses'),
      () => import('../pages/ProfessorAttendance'),
      () => import('../pages/ProfessorAttendanceCreate'),
      () => import('../pages/ProfessorAttendanceSessions'),
      () => import('../pages/ProfessorAttendanceReports'),
      () => import('../pages/ProfessorAttendanceSettings'),
      () => import('../pages/ProfessorChatbot'),
      () => import('../pages/ProfessorNotifications'),
      () => import('../pages/ProfessorProfile'),
    ],
    admin: [
      // Admin routes would go here if needed
      () => import('../pages/ProfessorDashboard'), // Admins can access professor routes
    ],
  };

  const routes = roleRoutes[role.toLowerCase()] || [];

  routes.forEach((loader) => {
    try {
      loader();
    } catch (error) {
      console.warn(`Failed to preload route for role ${role}:`, error);
    }
  });
}

