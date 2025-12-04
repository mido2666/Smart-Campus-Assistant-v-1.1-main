import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { useErrorHandler } from './useErrorHandler';
import { apiClient } from '../services/api';
import { AppError, createAPIError } from '../utils/errorHandler';

// Generic API query hook
export function useApiQuery<TData = unknown, TError = AppError>(
  queryKey: (string | number)[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
) {
  const { handleError } = useErrorHandler();

  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        return await queryFn();
      } catch (error) {
        const appError = error instanceof AppError ? error : createAPIError(
          error.message || 'API request failed',
          500,
          { originalError: error }
        );
        handleError(appError);
        throw appError;
      }
    },
    ...options,
  });
}

// Generic API mutation hook
export function useApiMutation<TData = unknown, TVariables = unknown, TError = AppError>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, TError, TVariables>
) {
  const { handleError } = useErrorHandler();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      try {
        return await mutationFn(variables);
      } catch (error) {
        const appError = error instanceof AppError ? error : createAPIError(
          error.message || 'API request failed',
          500,
          { originalError: error }
        );
        handleError(appError);
        throw appError;
      }
    },
    onSuccess: (data, variables, context) => {
      // Invalidate related queries
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      if (options?.onError) {
        options.onError(error, variables, context);
      }
    },
    ...options,
  });
}

// Specific API hooks for common operations

// User data queries
export function useUserProfile(userId?: string) {
  return useApiQuery(
    ['user', 'profile', userId],
    () => apiClient.get(`/api/users/${userId}/profile`),
    {
      enabled: !!userId,
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );
}

export function useStudentStats() {
  return useApiQuery(
    ['student', 'stats'],
    () => apiClient.get('/api/users/student/stats'),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

export function useProfessorStats() {
  return useApiQuery(
    ['professor', 'stats'],
    () => apiClient.get('/api/users/professor/stats'),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

// Schedule queries
export function useTodaySchedule() {
  return useApiQuery(
    ['schedule', 'today'],
    () => apiClient.get('/api/schedule/today'),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
}

export function useWeeklySchedule(weekStart?: string) {
  return useApiQuery(
    ['schedule', 'weekly', weekStart],
    () => apiClient.get(`/api/schedule/weekly?start=${weekStart}`),
    {
      enabled: !!weekStart,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

// Attendance queries
export function useAttendanceStats() {
  return useApiQuery(
    ['attendance', 'stats'],
    () => apiClient.get('/api/attendance/stats'),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

export function useCourseAttendance(courseId?: string) {
  return useApiQuery(
    ['attendance', 'course', courseId],
    () => apiClient.get(`/api/attendance/course/${courseId}`),
    {
      enabled: !!courseId,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
}

// Notifications queries
export function useNotifications(userType: 'student' | 'professor' = 'student') {
  return useApiQuery(
    ['notifications', userType],
    () => apiClient.get(`/api/notifications/${userType}`),
    {
      staleTime: 1 * 60 * 1000, // 1 minute
      refetchInterval: 30 * 1000, // Refetch every 30 seconds
    }
  );
}

export function useUnreadNotificationCount(userType: 'student' | 'professor' = 'student') {
  return useApiQuery(
    ['notifications', 'unread-count', userType],
    () => apiClient.get(`/api/notifications/${userType}/unread-count`),
    {
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 10 * 1000, // Refetch every 10 seconds
    }
  );
}

// Course queries
export function useCourses(userType: 'student' | 'professor' = 'student') {
  return useApiQuery(
    ['courses', userType],
    () => apiClient.get(`/api/courses/${userType}`),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );
}

export function useCourseDetails(courseId?: string) {
  return useApiQuery(
    ['courses', 'details', courseId],
    () => apiClient.get(`/api/courses/${courseId}`),
    {
      enabled: !!courseId,
      staleTime: 15 * 60 * 1000, // 15 minutes
    }
  );
}

// Chatbot queries
export function useChatbotHistory(userType: 'student' | 'professor' = 'student') {
  return useApiQuery(
    ['chatbot', 'history', userType],
    () => apiClient.get(`/api/chatbot/${userType}/history`),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
}

// Mutations

// Mark notification as read
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    (notificationId: string) => apiClient.post(`/api/notifications/${notificationId}/read`),
    {
      onSuccess: () => {
        // Invalidate notification queries
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      },
    }
  );
}

// Mark all notifications as read
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    (userType: 'student' | 'professor') => apiClient.post(`/api/notifications/${userType}/mark-all-read`),
    {
      onSuccess: () => {
        // Invalidate notification queries
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      },
    }
  );
}

// Update user profile
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    (data: { firstName?: string; lastName?: string; email?: string; avatar?: string }) => 
      apiClient.put('/api/users/profile', data),
    {
      onSuccess: () => {
        // Invalidate user profile queries
        queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      },
    }
  );
}

// Send chatbot message
export function useSendChatbotMessage() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    (data: { message: string; userType: 'student' | 'professor' }) => 
      apiClient.post('/api/chatbot/message', data),
    {
      onSuccess: () => {
        // Invalidate chatbot history
        queryClient.invalidateQueries({ queryKey: ['chatbot', 'history'] });
      },
    }
  );
}

// Update attendance
export function useUpdateAttendance() {
  const queryClient = useQueryClient();
  
  return useApiMutation(
    (data: { courseId: string; studentId: string; status: 'present' | 'absent' | 'late' }) => 
      apiClient.post('/api/attendance/update', data),
    {
      onSuccess: () => {
        // Invalidate attendance queries
        queryClient.invalidateQueries({ queryKey: ['attendance'] });
        queryClient.invalidateQueries({ queryKey: ['attendance', 'stats'] });
      },
    }
  );
}

// Utility hooks

// Prefetch data
export function usePrefetch() {
  const queryClient = useQueryClient();

  const prefetchUserProfile = (userId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['user', 'profile', userId],
      queryFn: () => apiClient.get(`/api/users/${userId}/profile`),
      staleTime: 10 * 60 * 1000,
    });
  };

  const prefetchCourseDetails = (courseId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['courses', 'details', courseId],
      queryFn: () => apiClient.get(`/api/courses/${courseId}`),
      staleTime: 15 * 60 * 1000,
    });
  };

  const prefetchSchedule = (weekStart: string) => {
    queryClient.prefetchQuery({
      queryKey: ['schedule', 'weekly', weekStart],
      queryFn: () => apiClient.get(`/api/schedule/weekly?start=${weekStart}`),
      staleTime: 5 * 60 * 1000,
    });
  };

  return {
    prefetchUserProfile,
    prefetchCourseDetails,
    prefetchSchedule,
  };
}

// Invalidate queries
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries();
  };

  const invalidateUserData = () => {
    queryClient.invalidateQueries({ queryKey: ['user'] });
    queryClient.invalidateQueries({ queryKey: ['student'] });
    queryClient.invalidateQueries({ queryKey: ['professor'] });
  };

  const invalidateSchedule = () => {
    queryClient.invalidateQueries({ queryKey: ['schedule'] });
  };

  const invalidateAttendance = () => {
    queryClient.invalidateQueries({ queryKey: ['attendance'] });
  };

  const invalidateNotifications = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  return {
    invalidateAll,
    invalidateUserData,
    invalidateSchedule,
    invalidateAttendance,
    invalidateNotifications,
  };
}

export default useApiQuery;
