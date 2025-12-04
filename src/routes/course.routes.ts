import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { CourseController } from '../controllers/course.controller.js';
import { AuthMiddleware } from '../middleware/auth.middleware.js';
import type { AuthenticatedRequest } from '../controllers/auth.controller.js';
import prisma from '../../config/database.js';

const router = Router();

/**
 * Middleware to check if user is a professor or admin
 */
const requireProfessorOrAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'PROFESSOR' && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Professor or Admin role required.'
    });
  }
  next();
};

/**
 * Middleware to check if user is a student
 */
const requireStudent = (req: any, res: any, next: any) => {
  if (req.user.role !== 'STUDENT') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Student role required.'
    });
  }
  next();
};

/**
 * Middleware to check if user can access course (professor owns it or is admin)
 */
const canAccessCourse = async (req: any, res: any, next: any) => {
  try {
    const courseId = parseInt(req.params.id);

    if (req.user.role === 'ADMIN') {
      return next();
    }

    // For professors, check if they own the course
    if (req.user.role === 'PROFESSOR') {
      const { CourseService } = await import('../services/course.service.js');
      const course = await CourseService.getCourseById(courseId);

      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      if (course.professorId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own courses.'
        });
      }
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking course access'
    });
  }
};

// Apply authentication to all routes
router.use(AuthMiddleware.authenticate());

/**
 * @route   GET /api/courses/enrolled
 * @desc    Get enrolled courses (backward compatibility alias)
 * @access  Authenticated users
 * @note    Routes to appropriate endpoint based on user role
 */
router.get('/enrolled', async (req: any, res: any, next: any) => {
  if (req.user.role === 'PROFESSOR') {
    // For professors, get courses they teach
    req.query.professorId = req.user.id;
    return CourseController.getAllCourses(req, res);
  } else if (req.user.role === 'STUDENT') {
    // For students, get courses they're enrolled in
    req.params.studentId = req.user.id;
    return CourseController.getStudentCourses(req, res);
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. This endpoint is for professors and students only.'
    });
  }
});

/**
 * @route   GET /api/courses
 * @desc    Get all courses
 * @access  Public (authenticated users)
 * @query   professorId - Filter by professor ID
 * @query   isActive - Filter by active status
 */
router.get('/', CourseController.getAllCourses);

/**
 * @route   GET /api/courses/student/enrolled
 * @desc    Get enrolled courses for authenticated student
 * @access  Authenticated students
 */
router.get('/student/enrolled',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;

      const enrollments = await prisma.courseEnrollment.findMany({
        where: {
          studentId: userIdNum,
          status: 'ACTIVE'
        },
        include: {
          course: {
            include: {
              professor: {
                select: {
                  firstName: true,
                  lastName: true,
                  universityId: true
                }
              },
              schedules: {
                where: { isActive: true },
                orderBy: [
                  { dayOfWeek: 'asc' },
                  { startTime: 'asc' }
                ]
              }
            }
          }
        },
        orderBy: {
          enrolledAt: 'desc'
        }
      });

      const courses = enrollments.map(enrollment => {
        const schedules = enrollment.course.schedules.map(s => {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          return {
            day: dayNames[s.dayOfWeek],
            dayOfWeek: s.dayOfWeek,
            time: `${s.startTime} - ${s.endTime}`,
            room: s.room || 'TBA',
            semester: s.semester
          };
        });

        return {
          id: String(enrollment.course.id),
          code: enrollment.course.courseCode,
          name: enrollment.course.courseName,
          description: enrollment.course.description || '',
          credits: enrollment.course.credits,
          professor: enrollment.course.professor
            ? `${enrollment.course.professor.firstName} ${enrollment.course.professor.lastName}`
            : 'TBA',
          professorId: enrollment.course.professorId,
          enrolledAt: enrollment.enrolledAt,
          status: enrollment.status,
          schedules
        };
      });

      res.json({
        success: true,
        data: courses
      });
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch enrolled courses',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
);

/**
 * @route   GET /api/courses/student/:studentId
 * @desc    Get courses for a specific student
 * @access  Student (own courses) or Admin
 */
router.get('/student/:studentId', async (req: any, res: any, next: any) => {
  const studentId = parseInt(req.params.studentId);

  // Students can only view their own courses
  if (req.user.role === 'STUDENT' && req.user.id !== studentId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only view your own courses.'
    });
  }

  // Admins and professors can view any student's courses
  if (req.user.role !== 'ADMIN' && req.user.role !== 'PROFESSOR' && req.user.role !== 'STUDENT') {
    return res.status(403).json({
      success: false,
      message: 'Access denied.'
    });
  }

  next();
}, CourseController.getStudentCourses);

/**
 * @route   GET /api/courses/:id
 * @desc    Get course by ID
 * @access  Public (authenticated users)
 */
router.get('/:id', CourseController.getCourseById);

/**
 * @route   GET /api/courses/:id/stats
 * @desc    Get course statistics
 * @access  Professor (own courses) or Admin
 */
router.get('/:id/stats', canAccessCourse, CourseController.getCourseStats);

/**
 * @route   GET /api/courses/:id/students
 * @desc    Get enrolled students for a course
 * @access  Professor (own courses) or Admin
 * @query   status - Filter by enrollment status
 */
router.get('/:id/students', canAccessCourse, CourseController.getEnrolledStudents);

/**
 * @route   POST /api/courses
 * @desc    Create a new course
 * @access  Professor or Admin
 */
router.post('/', requireProfessorOrAdmin, CourseController.createCourse);

/**
 * @route   POST /api/courses/:id/enroll
 * @desc    Enroll student in course
 * @access  Student (self-enrollment) or Admin
 */
router.post('/:id/enroll', async (req: any, res: any, next: any) => {
  const { studentId } = req.body;

  // Students can only enroll themselves
  if (req.user.role === 'STUDENT' && req.user.id !== parseInt(studentId)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only enroll yourself.'
    });
  }

  // Admins and professors can enroll any student
  if (req.user.role !== 'ADMIN' && req.user.role !== 'PROFESSOR' && req.user.role !== 'STUDENT') {
    return res.status(403).json({
      success: false,
      message: 'Access denied.'
    });
  }

  next();
}, CourseController.enrollStudent);

/**
 * @route   PUT /api/courses/:id
 * @desc    Update course
 * @access  Professor (own courses) or Admin
 */
router.put('/:id', canAccessCourse, CourseController.updateCourse);

/**
 * @route   DELETE /api/courses/:id
 * @desc    Delete course (soft delete)
 * @access  Professor (own courses) or Admin
 */
router.delete('/:id', canAccessCourse, CourseController.deleteCourse);

/**
 * @route   DELETE /api/courses/:id/students/:studentId
 * @desc    Drop student from course
 * @access  Student (self-drop) or Professor (own courses) or Admin
 */
router.delete('/:id/students/:studentId', async (req: any, res: any, next: any) => {
  const studentId = parseInt(req.params.studentId);

  // Students can only drop themselves
  if (req.user.role === 'STUDENT' && req.user.id !== studentId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only drop yourself from courses.'
    });
  }

  // For professors, check if they own the course
  if (req.user.role === 'PROFESSOR') {
    const courseId = parseInt(req.params.id);
    const { CourseService } = await import('../services/course.service.js');
    const course = await CourseService.getCourseById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (course.professorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only manage students in your own courses.'
      });
    }
  }

  // Admins can drop any student from any course
  if (req.user.role !== 'ADMIN' && req.user.role !== 'PROFESSOR' && req.user.role !== 'STUDENT') {
    return res.status(403).json({
      success: false,
      message: 'Access denied.'
    });
  }

  next();
}, CourseController.dropStudent);

export default router;
