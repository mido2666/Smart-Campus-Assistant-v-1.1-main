import { Request, Response } from 'express';
import { CourseService } from '../services/course.service.js';

export class CourseController {
  /**
   * Create a new course
   * POST /api/courses
   */
  static async createCourse(req: any, res: Response): Promise<void> {
    try {
      const { courseCode, courseName, description, credits } = req.body;

      // Get professorId from authenticated user (req.user is set by auth middleware)
      const professorId = req.user?.id;

      // Validation
      if (!courseCode || !courseName) {
        res.status(400).json({
          success: false,
          message: 'Course code and course name are required'
        });
        return;
      }

      if (!professorId) {
        res.status(401).json({
          success: false,
          message: 'You must be authenticated to create a course'
        });
        return;
      }

      const courseData = {
        courseCode,
        courseName,
        description: description || '',
        credits: credits || 3,
        professorId: typeof professorId === 'string' ? parseInt(professorId) : professorId
      };

      const course = await CourseService.createCourse(courseData);

      res.status(201).json({
        success: true,
        message: 'Course created successfully',
        data: course
      });
    } catch (error: any) {
      console.error('Error creating course:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create course'
      });
    }
  }

  /**
   * Get all courses
   * GET /api/courses
   */
  static async getAllCourses(req: Request, res: Response): Promise<void> {
    try {
      const { professorId, isActive, summary } = req.query;

      const courses = await CourseService.getAllCourses(
        professorId ? parseInt(professorId as string) : undefined,
        isActive !== undefined ? isActive === 'true' : undefined,
        summary === 'true'
      );

      res.status(200).json({
        success: true,
        message: 'Courses retrieved successfully',
        data: courses
      });
    } catch (error: any) {
      console.error('Error getting courses:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve courses',
        error: error.toString(),
        stack: error.stack
      });
    }
  }

  /**
   * Get course by ID
   * GET /api/courses/:id
   */
  static async getCourseById(req: Request, res: Response): Promise<void> {
    try {
      const courseId = parseInt(req.params.id);

      if (isNaN(courseId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid course ID'
        });
        return;
      }

      const course = await CourseService.getCourseById(courseId);

      if (!course) {
        res.status(404).json({
          success: false,
          message: 'Course not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Course retrieved successfully',
        data: course
      });
    } catch (error: any) {
      console.error('Error getting course:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve course'
      });
    }
  }

  /**
   * Update course
   * PUT /api/courses/:id
   */
  static async updateCourse(req: Request, res: Response): Promise<void> {
    try {
      const courseId = parseInt(req.params.id);

      if (isNaN(courseId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid course ID'
        });
        return;
      }

      const { courseCode, courseName, description, credits, isActive } = req.body;

      const updateData = {
        courseCode,
        courseName,
        description,
        credits: credits ? parseInt(credits) : undefined,
        isActive
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });

      const course = await CourseService.updateCourse(courseId, updateData);

      res.status(200).json({
        success: true,
        message: 'Course updated successfully',
        data: course
      });
    } catch (error: any) {
      console.error('Error updating course:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update course'
      });
    }
  }

  /**
   * Delete course
   * DELETE /api/courses/:id
   */
  static async deleteCourse(req: Request, res: Response): Promise<void> {
    try {
      const courseId = parseInt(req.params.id);

      if (isNaN(courseId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid course ID'
        });
        return;
      }

      const course = await CourseService.deleteCourse(courseId);

      res.status(200).json({
        success: true,
        message: 'Course deleted successfully',
        data: course
      });
    } catch (error: any) {
      console.error('Error deleting course:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete course'
      });
    }
  }

  /**
   * Enroll student in course
   * POST /api/courses/:id/enroll
   */
  static async enrollStudent(req: Request, res: Response): Promise<void> {
    try {
      const courseId = parseInt(req.params.id);
      const { studentId } = req.body;

      if (isNaN(courseId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid course ID'
        });
        return;
      }

      if (!studentId) {
        res.status(400).json({
          success: false,
          message: 'Student ID is required'
        });
        return;
      }

      const enrollmentData = {
        studentId: parseInt(studentId),
        courseId
      };

      const enrollment = await CourseService.enrollStudent(enrollmentData);

      res.status(201).json({
        success: true,
        message: 'Student enrolled successfully',
        data: enrollment
      });
    } catch (error: any) {
      console.error('Error enrolling student:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to enroll student'
      });
    }
  }

  /**
   * Get enrolled students for a course
   * GET /api/courses/:id/students
   */
  static async getEnrolledStudents(req: Request, res: Response): Promise<void> {
    try {
      const courseId = parseInt(req.params.id);
      const { status } = req.query;

      if (isNaN(courseId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid course ID'
        });
        return;
      }

      const enrollments = await CourseService.getEnrolledStudents(
        courseId,
        status as any
      );

      res.status(200).json({
        success: true,
        message: 'Enrolled students retrieved successfully',
        data: enrollments
      });
    } catch (error: any) {
      console.error('Error getting enrolled students:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve enrolled students'
      });
    }
  }

  /**
   * Get student's courses
   * GET /api/courses/student/:studentId
   */
  static async getStudentCourses(req: Request, res: Response): Promise<void> {
    try {
      const studentId = parseInt(req.params.studentId);

      if (isNaN(studentId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid student ID'
        });
        return;
      }

      const enrollments = await CourseService.getStudentCourses(studentId);

      res.status(200).json({
        success: true,
        message: 'Student courses retrieved successfully',
        data: enrollments
      });
    } catch (error: any) {
      console.error('Error getting student courses:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve student courses'
      });
    }
  }

  /**
   * Drop student from course
   * DELETE /api/courses/:id/students/:studentId
   */
  static async dropStudent(req: Request, res: Response): Promise<void> {
    try {
      const courseId = parseInt(req.params.id);
      const studentId = parseInt(req.params.studentId);

      if (isNaN(courseId) || isNaN(studentId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid course ID or student ID'
        });
        return;
      }

      const enrollment = await CourseService.dropStudent(studentId, courseId);

      res.status(200).json({
        success: true,
        message: 'Student dropped from course successfully',
        data: enrollment
      });
    } catch (error: any) {
      console.error('Error dropping student:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to drop student from course'
      });
    }
  }

  /**
   * Get course statistics
   * GET /api/courses/:id/stats
   */
  static async getCourseStats(req: Request, res: Response): Promise<void> {
    try {
      const courseId = parseInt(req.params.id);

      if (isNaN(courseId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid course ID'
        });
        return;
      }

      const stats = await CourseService.getCourseStats(courseId);

      res.status(200).json({
        success: true,
        message: 'Course statistics retrieved successfully',
        data: stats
      });
    } catch (error: any) {
      console.error('Error getting course stats:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve course statistics'
      });
    }
  }
}
