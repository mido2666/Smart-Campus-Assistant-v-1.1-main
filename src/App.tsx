import React, { useEffect, startTransition, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/common/ToastProvider';
import { QueryProvider } from './providers/QueryProvider';
import ErrorBoundary from './components/ErrorBoundary';
import { LoadingSkeleton } from './components/common/LoadingSkeleton';
import { createLazyRoute } from './utils/lazyLoading.tsx';
import { ProtectedRoute } from './components/ProtectedRoute';
import SkipToContent from './components/SkipToContent';
import NetworkIndicator from './components/common/NetworkIndicator';
import CommandPalette from './components/common/CommandPalette';
import { preloadRoleRoutes, preloadCriticalRoutes } from './utils/routePreloader';

// Lazy load pages for better performance
const Login = createLazyRoute(() => import('./pages/Login'), { skeletonType: 'form' });
const StudentDashboard = createLazyRoute(() => import('./pages/StudentDashboard'), { skeletonType: 'stats' });
const StudentCourses = createLazyRoute(() => import('./pages/StudentCourses'), { skeletonType: 'table' });
const StudentCourseDetails = createLazyRoute(() => import('./pages/StudentCourseDetails'), { skeletonType: 'card' });
const ProfessorDashboard = createLazyRoute(() => import('./pages/ProfessorDashboard'), { skeletonType: 'stats' });
const MyCourses = createLazyRoute(() => import('./pages/MyCourses'), { skeletonType: 'table' });
const ProfessorCourseDetails = createLazyRoute(() => import('./pages/ProfessorCourseDetails'), { skeletonType: 'card' });
const ProfessorAttendance = createLazyRoute(() => import('./pages/ProfessorAttendance'), { skeletonType: 'table' });
const ProfessorAttendanceCreate = createLazyRoute(() => import('./pages/ProfessorAttendanceCreate'), { skeletonType: 'form' });
const ProfessorAttendanceSessions = createLazyRoute(() => import('./pages/ProfessorAttendanceSessions'), { skeletonType: 'table' });
const ProfessorAttendanceReports = createLazyRoute(() => import('./pages/ProfessorAttendanceReports'), { skeletonType: 'card' });
const ProfessorAttendanceSettings = createLazyRoute(() => import('./pages/ProfessorAttendanceSettings'), { skeletonType: 'form' });
const ProfessorChatbot = createLazyRoute(() => import('./pages/ProfessorChatbot'), { skeletonType: 'card' });
const ProfessorNotifications = createLazyRoute(() => import('./pages/ProfessorNotifications'), { skeletonType: 'notification' });
const Schedule = createLazyRoute(() => import('./pages/Schedule'), { skeletonType: 'table' });
const Attendance = createLazyRoute(() => import('./pages/StudentAttendance'), { skeletonType: 'card' });
const StudentAIAssistant = createLazyRoute(() => import('./pages/StudentAIAssistant'), { skeletonType: 'card' });
const StudentNotifications = createLazyRoute(() => import('./pages/StudentNotifications'), { skeletonType: 'notification' });
const Profile = createLazyRoute(() => import('./pages/Profile'), { skeletonType: 'profile' });
const ProfessorProfile = createLazyRoute(() => import('./pages/ProfessorProfile'), { skeletonType: 'profile' });
const ComingSoon = createLazyRoute(() => import('./pages/ComingSoon'), { skeletonType: 'card' });

// Component to handle route preloading based on auth state
function RoutePreloader() {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Preload critical routes immediately
    startTransition(() => {
      preloadCriticalRoutes();
    });

    // Preload role-specific routes after authentication
    if (isAuthenticated && user?.role) {
      startTransition(() => {
        preloadRoleRoutes(user.role as 'student' | 'professor' | 'admin');
      });
    }
  }, [isAuthenticated, user?.role]);

  return null;
}

function App() {
  // Preload critical routes on app mount
  useEffect(() => {
    startTransition(() => {
      preloadCriticalRoutes();
    });
  }, []);

  return (
    <ErrorBoundary>
      <QueryProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              {/* Route Preloader - handles role-based preloading */}
              <RoutePreloader />
              {/* Global Skip to Content Link */}
              <SkipToContent targetId="main-content" />
              {/* Network Status Indicator */}
              <NetworkIndicator />
              {/* Command Palette */}
              <CommandPalette />
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Login />} />

                {/* Student Protected Routes */}
                <Route path="/student-dashboard" element={
                  <ProtectedRoute allowedRoles={['student', 'STUDENT']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/student-courses" element={
                  <ProtectedRoute allowedRoles={['student', 'STUDENT']}>
                    <StudentCourses />
                  </ProtectedRoute>
                } />
                <Route path="/student-courses/:id" element={
                  <ProtectedRoute allowedRoles={['student', 'STUDENT']}>
                    <StudentCourseDetails />
                  </ProtectedRoute>
                } />
                <Route path="/schedule" element={
                  <ProtectedRoute allowedRoles={['student', 'STUDENT']}>
                    <Schedule />
                  </ProtectedRoute>
                } />
                <Route path="/attendance" element={
                  <ProtectedRoute allowedRoles={['student', 'STUDENT']}>
                    <Attendance />
                  </ProtectedRoute>
                } />
                <Route path="/student-chatbot" element={<Navigate to="/student-ai-assistant" replace />} />
                <Route path="/student-ai-assistant" element={
                  <ProtectedRoute allowedRoles={['student', 'STUDENT']}>
                    <StudentAIAssistant />
                  </ProtectedRoute>
                } />
                <Route path="/notifications" element={<Navigate to="/student-notifications" replace />} />
                <Route path="/student-notifications" element={
                  <ProtectedRoute allowedRoles={['student', 'STUDENT']}>
                    <StudentNotifications />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute allowedRoles={['student', 'STUDENT']}>
                    <Profile />
                  </ProtectedRoute>
                } />

                {/* Professor Protected Routes */}
                <Route path="/professor-dashboard" element={
                  <ProtectedRoute allowedRoles={['professor', 'PROFESSOR', 'admin', 'ADMIN']}>
                    <ProfessorDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/professor-courses" element={
                  <ProtectedRoute allowedRoles={['professor', 'PROFESSOR', 'admin', 'ADMIN']}>
                    <MyCourses />
                  </ProtectedRoute>
                } />
                <Route path="/professor-courses/:id" element={
                  <ProtectedRoute allowedRoles={['professor', 'PROFESSOR', 'admin', 'ADMIN']}>
                    <ProfessorCourseDetails />
                  </ProtectedRoute>
                } />
                <Route path="/professor-attendance" element={
                  <ProtectedRoute allowedRoles={['professor', 'PROFESSOR', 'admin', 'ADMIN']}>
                    <ProfessorAttendance />
                  </ProtectedRoute>
                } />
                <Route path="/professor-attendance/create" element={
                  <ProtectedRoute allowedRoles={['professor', 'PROFESSOR', 'admin', 'ADMIN']}>
                    <ProfessorAttendanceCreate />
                  </ProtectedRoute>
                } />
                <Route path="/professor-attendance/sessions" element={
                  <ProtectedRoute allowedRoles={['professor', 'PROFESSOR', 'admin', 'ADMIN']}>
                    <ProfessorAttendanceSessions />
                  </ProtectedRoute>
                } />
                <Route path="/professor-attendance/sessions/:id" element={
                  <ProtectedRoute allowedRoles={['professor', 'PROFESSOR', 'admin', 'ADMIN']}>
                    <ProfessorAttendanceSessions />
                  </ProtectedRoute>
                } />
                <Route path="/professor-attendance/reports" element={
                  <ProtectedRoute allowedRoles={['professor', 'PROFESSOR', 'admin', 'ADMIN']}>
                    <ProfessorAttendanceReports />
                  </ProtectedRoute>
                } />
                <Route path="/professor-attendance/settings" element={
                  <ProtectedRoute allowedRoles={['professor', 'PROFESSOR', 'admin', 'ADMIN']}>
                    <ProfessorAttendanceSettings />
                  </ProtectedRoute>
                } />
                <Route path="/professor-chatbot" element={
                  <ProtectedRoute allowedRoles={['professor', 'PROFESSOR', 'admin', 'ADMIN']}>
                    <ProfessorChatbot />
                  </ProtectedRoute>
                } />
                <Route path="/professor-notifications" element={
                  <ProtectedRoute allowedRoles={['professor', 'PROFESSOR', 'admin', 'ADMIN']}>
                    <ProfessorNotifications />
                  </ProtectedRoute>
                } />
                <Route path="/professor-profile" element={
                  <ProtectedRoute allowedRoles={['professor', 'PROFESSOR', 'admin', 'ADMIN']}>
                    <ProfessorProfile />
                  </ProtectedRoute>
                } />

                {/* Public Routes */}
                <Route path="/reshbr" element={<ComingSoon title="Reshbr." />} />
                <Route path="/ovvp" element={<ComingSoon title="OVVP" />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}

export default App;
