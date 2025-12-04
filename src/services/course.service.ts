import { PrismaClient, Course, CourseEnrollment, User, EnrollmentStatus } from '@prisma/client';
import prisma from '../../config/database.js';

export interface CreateCourseData {
  courseCode: string;
  courseName: string;
  description?: string;
  credits?: number;
  professorId: number;
}

export interface UpdateCourseData {
  courseCode?: string;
  courseName?: string;
  description?: string;
  credits?: number;
  isActive?: boolean;
}

export interface EnrollStudentData {
  studentId: number;
  courseId: number;
}

export class CourseService {
  /**
   * Create a new course
   */
  static async createCourse(data: CreateCourseData): Promise<Course> {
    try {
      // Check if course code already exists
      const existingCourse = await prisma.course.findUnique({
        where: { courseCode: data.courseCode }
      });

      if (existingCourse) {
        throw new Error('Course code already exists');
      }

      // Verify professor exists and has correct role
      const professor = await prisma.user.findUnique({
        where: { id: data.professorId }
      });

      if (!professor) {
        throw new Error('Professor not found');
      }

      if (professor.role !== 'PROFESSOR' && professor.role !== 'ADMIN') {
        throw new Error('User is not authorized to create courses');
      }

      const course = await prisma.course.create({
        data: {
          courseCode: data.courseCode,
          courseName: data.courseName,
          description: data.description,
          credits: data.credits || 3,
          professorId: data.professorId,
          isActive: true, // Explicitly set isActive to true for new courses
        },
        include: {
          professor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              universityId: true
            }
          },
          enrollments: {
            where: { status: 'ACTIVE' },
            include: {
              student: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  universityId: true
                }
              }
            }
          },
          schedules: {
            where: { isActive: true }
          }
        }
      });

      return course;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all courses with optional filtering
   */
  /**
   * Get all courses with optional filtering
   */
  static async getAllCourses(professorId?: number, isActive?: boolean, summary: boolean = false): Promise<any[]> {
    try {
      const where: any = {};

      if (professorId) {
        where.OR = [
          { professorId: professorId },
          { schedules: { some: { professorId: professorId } } }
        ];
      }

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      // If summary is true, fetch minimal data
      if (summary) {
        const courses = await prisma.course.findMany({
          where,
          orderBy: { courseCode: 'asc' }
        });
        return courses;
      }

      const courses = await prisma.course.findMany({
        where,
        include: {
          professor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              universityId: true
            }
          },
          _count: {
            select: {
              enrollments: { where: { status: 'ACTIVE' } }
            }
          },
          schedules: {
            where: { isActive: true }
          }
        },
        orderBy: { courseCode: 'asc' }
      });

      return courses;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get course by ID with full details
   */
  static async getCourseById(courseId: number): Promise<Course | null> {
    try {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          professor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              universityId: true
            }
          },
          enrollments: {
            include: {
              student: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  universityId: true,
                  email: true
                }
              }
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
      });

      return course;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update course information
   */
  static async updateCourse(courseId: number, data: UpdateCourseData): Promise<Course> {
    try {
      // Check if course exists
      const existingCourse = await prisma.course.findUnique({
        where: { id: courseId }
      });

      if (!existingCourse) {
        throw new Error('Course not found');
      }

      // If updating course code, check for duplicates
      if (data.courseCode && data.courseCode !== existingCourse.courseCode) {
        const duplicateCourse = await prisma.course.findUnique({
          where: { courseCode: data.courseCode }
        });

        if (duplicateCourse) {
          throw new Error('Course code already exists');
        }
      }

      const updatedCourse = await prisma.course.update({
        where: { id: courseId },
        data,
        include: {
          professor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              universityId: true
            }
          }
        }
      });

      return updatedCourse;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete course (soft delete by setting isActive to false)
   */
  static async deleteCourse(courseId: number): Promise<Course> {
    try {
      const course = await prisma.course.findUnique({
        where: { id: courseId }
      });

      if (!course) {
        throw new Error('Course not found');
      }

      // Soft delete by setting isActive to false
      const deletedCourse = await prisma.course.update({
        where: { id: courseId },
        data: { isActive: false },
        include: {
          professor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              universityId: true
            }
          }
        }
      });

      return deletedCourse;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Enroll student in a course
   */
  static async enrollStudent(data: EnrollStudentData): Promise<CourseEnrollment> {
    try {
      // Check if course exists and is active
      const course = await prisma.course.findUnique({
        where: { id: data.courseId }
      });

      if (!course) {
        throw new Error('Course not found');
      }

      if (!course.isActive) {
        throw new Error('Course is not active');
      }

      // Check if student exists
      const student = await prisma.user.findUnique({
        where: { id: data.studentId }
      });

      if (!student) {
        throw new Error('Student not found');
      }

      if (student.role !== 'STUDENT') {
        throw new Error('User is not a student');
      }

      // Check if student is already enrolled
      const existingEnrollment = await prisma.courseEnrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: data.studentId,
            courseId: data.courseId
          }
        }
      });

      if (existingEnrollment) {
        if (existingEnrollment.status === 'ACTIVE') {
          throw new Error('Student is already enrolled in this course');
        } else {
          // Reactivate enrollment
          const reactivatedEnrollment = await prisma.courseEnrollment.update({
            where: { id: existingEnrollment.id },
            data: {
              status: 'ACTIVE',
              enrolledAt: new Date()
            },
            include: {
              student: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  universityId: true
                }
              },
              course: {
                select: {
                  id: true,
                  courseCode: true,
                  courseName: true
                }
              }
            }
          });

          return reactivatedEnrollment;
        }
      }

      // Create new enrollment
      const enrollment = await prisma.courseEnrollment.create({
        data: {
          studentId: data.studentId,
          courseId: data.courseId,
          status: 'ACTIVE'
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              universityId: true
            }
          },
          course: {
            select: {
              id: true,
              courseCode: true,
              courseName: true
            }
          }
        }
      });

      return enrollment;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get enrolled students for a course
   */
  static async getEnrolledStudents(courseId: number, status?: EnrollmentStatus): Promise<CourseEnrollment[]> {
    try {
      const where: any = { courseId };

      if (status) {
        where.status = status;
      }

      const enrollments = await prisma.courseEnrollment.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              universityId: true,
              email: true
            }
          }
        },
        orderBy: { enrolledAt: 'desc' }
      });

      return enrollments;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get courses for a student
   */
  static async getStudentCourses(studentId: number): Promise<CourseEnrollment[]> {
    try {
      const enrollments = await prisma.courseEnrollment.findMany({
        where: {
          studentId,
          status: 'ACTIVE'
        },
        include: {
          course: {
            include: {
              professor: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
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
        orderBy: { enrolledAt: 'desc' }
      });

      return enrollments;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Drop student from course
   */
  static async dropStudent(studentId: number, courseId: number): Promise<CourseEnrollment> {
    try {
      const enrollment = await prisma.courseEnrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId,
            courseId
          }
        }
      });

      if (!enrollment) {
        throw new Error('Enrollment not found');
      }

      if (enrollment.status !== 'ACTIVE') {
        throw new Error('Student is not currently enrolled in this course');
      }

      const updatedEnrollment = await prisma.courseEnrollment.update({
        where: { id: enrollment.id },
        data: { status: 'DROPPED' },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              universityId: true
            }
          },
          course: {
            select: {
              id: true,
              courseCode: true,
              courseName: true
            }
          }
        }
      });

      return updatedEnrollment;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get course statistics
   */
  static async getCourseStats(courseId: number): Promise<any> {
    try {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          enrollments: true,
          schedules: {
            where: { isActive: true }
          }
        }
      });

      if (!course) {
        throw new Error('Course not found');
      }

      const stats = {
        totalEnrollments: course.enrollments.length,
        activeEnrollments: course.enrollments.filter(e => e.status === 'ACTIVE').length,
        droppedEnrollments: course.enrollments.filter(e => e.status === 'DROPPED').length,
        completedEnrollments: course.enrollments.filter(e => e.status === 'COMPLETED').length,
        totalSchedules: course.schedules.length,
        course: {
          id: course.id,
          courseCode: course.courseCode,
          courseName: course.courseName,
          credits: course.credits,
          isActive: course.isActive
        }
      };

      return stats;
    } catch (error) {
      throw error;
    }
  }
}
