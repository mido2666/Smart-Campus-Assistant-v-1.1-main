import { Request, Response } from 'express';
import { CourseController } from '../src/controllers/course.controller';
import { CourseService } from '../src/services/course.service';

// Mock the CourseService
jest.mock('../src/services/course.service');
const MockedCourseService = CourseService as jest.Mocked<typeof CourseService>;

describe('CourseController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('createCourse', () => {
    it('should create a course successfully', async () => {
      const courseData = {
        courseCode: 'CS101',
        courseName: 'Introduction to Computer Science',
        description: 'Basic computer science concepts',
        credits: 3,
        professorId: 1
      };

      const mockCourse = {
        id: 1,
        ...courseData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest.body = courseData;
      MockedCourseService.createCourse.mockResolvedValue(mockCourse);

      await CourseController.createCourse(mockRequest as Request, mockResponse as Response);

      expect(MockedCourseService.createCourse).toHaveBeenCalledWith({
        courseCode: courseData.courseCode,
        courseName: courseData.courseName,
        description: courseData.description,
        credits: courseData.credits,
        professorId: courseData.professorId
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Course created successfully',
        data: mockCourse
      });
    });

    it('should handle missing required fields', async () => {
      const incompleteData = {
        courseCode: 'CS101',
        // Missing courseName and professorId
        description: 'Basic computer science concepts',
        credits: 3
      };

      mockRequest.body = incompleteData;

      await CourseController.createCourse(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Course code, course name, and professor ID are required'
      });
    });

    it('should handle service errors', async () => {
      const courseData = {
        courseCode: 'CS101',
        courseName: 'Introduction to Computer Science',
        description: 'Basic computer science concepts',
        credits: 3,
        professorId: 1
      };

      const error = new Error('Professor not found');
      mockRequest.body = courseData;
      MockedCourseService.createCourse.mockRejectedValue(error);

      await CourseController.createCourse(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Professor not found'
      });
    });
  });

  describe('getAllCourses', () => {
    it('should get all courses successfully', async () => {
      const mockCourses = [
        {
          id: 1,
          courseCode: 'CS101',
          courseName: 'Introduction to Computer Science',
          description: 'Basic computer science concepts',
          credits: 3,
          professorId: 1,
          isActive: true
        },
        {
          id: 2,
          courseCode: 'CS102',
          courseName: 'Data Structures',
          description: 'Advanced data structures',
          credits: 3,
          professorId: 1,
          isActive: true
        }
      ];

      MockedCourseService.getAllCourses.mockResolvedValue(mockCourses);

      await CourseController.getAllCourses(mockRequest as Request, mockResponse as Response);

      expect(MockedCourseService.getAllCourses).toHaveBeenCalledWith(undefined, undefined);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Courses retrieved successfully',
        data: mockCourses
      });
    });

    it('should get courses with filters', async () => {
      const mockCourses = [
        {
          id: 1,
          courseCode: 'CS101',
          courseName: 'Introduction to Computer Science',
          description: 'Basic computer science concepts',
          credits: 3,
          professorId: 1,
          isActive: true
        }
      ];

      mockRequest.query = {
        professorId: '1',
        isActive: 'true'
      };

      MockedCourseService.getAllCourses.mockResolvedValue(mockCourses);

      await CourseController.getAllCourses(mockRequest as Request, mockResponse as Response);

      expect(MockedCourseService.getAllCourses).toHaveBeenCalledWith(1, true);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getCourseById', () => {
    it('should get course by ID successfully', async () => {
      const mockCourse = {
        id: 1,
        courseCode: 'CS101',
        courseName: 'Introduction to Computer Science',
        description: 'Basic computer science concepts',
        credits: 3,
        professorId: 1,
        isActive: true
      };

      mockRequest.params = { id: '1' };
      MockedCourseService.getCourseById.mockResolvedValue(mockCourse);

      await CourseController.getCourseById(mockRequest as Request, mockResponse as Response);

      expect(MockedCourseService.getCourseById).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Course retrieved successfully',
        data: mockCourse
      });
    });

    it('should handle invalid course ID', async () => {
      mockRequest.params = { id: 'invalid' };

      await CourseController.getCourseById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid course ID'
      });
    });

    it('should handle course not found', async () => {
      mockRequest.params = { id: '999' };
      MockedCourseService.getCourseById.mockResolvedValue(null);

      await CourseController.getCourseById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Course not found'
      });
    });
  });

  describe('updateCourse', () => {
    it('should update course successfully', async () => {
      const updateData = {
        courseName: 'Advanced Computer Science',
        description: 'Updated description',
        credits: 4,
        isActive: false
      };

      const updatedCourse = {
        id: 1,
        courseCode: 'CS101',
        ...updateData,
        professorId: 1
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = updateData;
      MockedCourseService.updateCourse.mockResolvedValue(updatedCourse);

      await CourseController.updateCourse(mockRequest as Request, mockResponse as Response);

      expect(MockedCourseService.updateCourse).toHaveBeenCalledWith(1, {
        courseName: updateData.courseName,
        description: updateData.description,
        credits: 4,
        isActive: updateData.isActive
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Course updated successfully',
        data: updatedCourse
      });
    });

    it('should handle invalid course ID', async () => {
      mockRequest.params = { id: 'invalid' };
      mockRequest.body = { courseName: 'Updated Name' };

      await CourseController.updateCourse(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid course ID'
      });
    });
  });

  describe('deleteCourse', () => {
    it('should delete course successfully', async () => {
      const deletedCourse = {
        id: 1,
        courseCode: 'CS101',
        courseName: 'Introduction to Computer Science',
        description: 'Basic computer science concepts',
        credits: 3,
        professorId: 1,
        isActive: false
      };

      mockRequest.params = { id: '1' };
      MockedCourseService.deleteCourse.mockResolvedValue(deletedCourse);

      await CourseController.deleteCourse(mockRequest as Request, mockResponse as Response);

      expect(MockedCourseService.deleteCourse).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Course deleted successfully',
        data: deletedCourse
      });
    });
  });

  describe('enrollStudent', () => {
    it('should enroll student successfully', async () => {
      const enrollmentData = {
        studentId: 1,
        courseId: 1
      };

      const mockEnrollment = {
        id: 1,
        studentId: 1,
        courseId: 1,
        status: 'ENROLLED',
        enrolledAt: new Date()
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { studentId: 1 };
      MockedCourseService.enrollStudent.mockResolvedValue(mockEnrollment);

      await CourseController.enrollStudent(mockRequest as Request, mockResponse as Response);

      expect(MockedCourseService.enrollStudent).toHaveBeenCalledWith(enrollmentData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Student enrolled successfully',
        data: mockEnrollment
      });
    });

    it('should handle missing student ID', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = {};

      await CourseController.enrollStudent(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Student ID is required'
      });
    });

    it('should handle invalid course ID', async () => {
      mockRequest.params = { id: 'invalid' };
      mockRequest.body = { studentId: 1 };

      await CourseController.enrollStudent(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid course ID'
      });
    });
  });

  describe('getEnrolledStudents', () => {
    it('should get enrolled students successfully', async () => {
      const mockEnrollments = [
        {
          id: 1,
          studentId: 1,
          courseId: 1,
          status: 'ENROLLED',
          student: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com'
          }
        }
      ];

      mockRequest.params = { id: '1' };
      mockRequest.query = { status: 'ENROLLED' };
      MockedCourseService.getEnrolledStudents.mockResolvedValue(mockEnrollments);

      await CourseController.getEnrolledStudents(mockRequest as Request, mockResponse as Response);

      expect(MockedCourseService.getEnrolledStudents).toHaveBeenCalledWith(1, 'ENROLLED');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Enrolled students retrieved successfully',
        data: mockEnrollments
      });
    });
  });

  describe('getStudentCourses', () => {
    it('should get student courses successfully', async () => {
      const mockEnrollments = [
        {
          id: 1,
          studentId: 1,
          courseId: 1,
          status: 'ENROLLED',
          course: {
            id: 1,
            courseCode: 'CS101',
            courseName: 'Introduction to Computer Science',
            credits: 3
          }
        }
      ];

      mockRequest.params = { studentId: '1' };
      MockedCourseService.getStudentCourses.mockResolvedValue(mockEnrollments);

      await CourseController.getStudentCourses(mockRequest as Request, mockResponse as Response);

      expect(MockedCourseService.getStudentCourses).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Student courses retrieved successfully',
        data: mockEnrollments
      });
    });

    it('should handle invalid student ID', async () => {
      mockRequest.params = { studentId: 'invalid' };

      await CourseController.getStudentCourses(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid student ID'
      });
    });
  });

  describe('dropStudent', () => {
    it('should drop student successfully', async () => {
      const mockEnrollment = {
        id: 1,
        studentId: 1,
        courseId: 1,
        status: 'DROPPED',
        droppedAt: new Date()
      };

      mockRequest.params = { id: '1', studentId: '1' };
      MockedCourseService.dropStudent.mockResolvedValue(mockEnrollment);

      await CourseController.dropStudent(mockRequest as Request, mockResponse as Response);

      expect(MockedCourseService.dropStudent).toHaveBeenCalledWith(1, 1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Student dropped from course successfully',
        data: mockEnrollment
      });
    });

    it('should handle invalid IDs', async () => {
      mockRequest.params = { id: 'invalid', studentId: '1' };

      await CourseController.dropStudent(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid course ID or student ID'
      });
    });
  });

  describe('getCourseStats', () => {
    it('should get course statistics successfully', async () => {
      const mockStats = {
        totalEnrollments: 50,
        activeEnrollments: 45,
        droppedEnrollments: 5,
        averageGrade: 85.5,
        attendanceRate: 92.3
      };

      mockRequest.params = { id: '1' };
      MockedCourseService.getCourseStats.mockResolvedValue(mockStats);

      await CourseController.getCourseStats(mockRequest as Request, mockResponse as Response);

      expect(MockedCourseService.getCourseStats).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Course statistics retrieved successfully',
        data: mockStats
      });
    });

    it('should handle invalid course ID', async () => {
      mockRequest.params = { id: 'invalid' };

      await CourseController.getCourseStats(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid course ID'
      });
    });
  });
});
