import prisma from '../../config/database.js';

export interface AttendanceStats {
  totalClasses: number;
  attendedClasses: number;
  missedClasses: number;
  lateArrivals: number;
  excusedAbsences: number;
  attendancePercentage: number;
  recentAttendance: AttendanceRecord[];
}

export interface AttendanceRecord {
  id: number;
  status: string;
  markedAt: Date;
  qrCode: {
    title: string;
    createdAt: Date;
  };
}

export interface CourseAttendanceStats {
  courseId: number;
  courseName: string;
  courseCode: string;
  totalSessions: number;
  attendancePercentage: number;
  lastAttendanceDate?: Date;
  attendanceHistory: AttendanceRecord[];
}

export interface StudentAttendanceOverview {
  studentId: number;
  studentName: string;
  totalCourses: number;
  overallAttendancePercentage: number;
  courseStats: CourseAttendanceStats[];
}

export class AttendanceStatsService {
  /**
   * Get attendance statistics for a student in a specific course
   */
  static async getStudentCourseAttendanceStats(
    studentId: number,
    courseId: number
  ): Promise<AttendanceStats> {
    try {
      // Get all attendance records for the student in this course
      const attendanceRecords = await prisma.attendanceRecord.findMany({
        where: {
          studentId,
          courseId,
        },
        include: {
          qrCode: true,
        },
        orderBy: {
          markedAt: 'desc',
        },
      });

      // Get total QR code sessions for this course
      const totalSessions = await prisma.qRCode.count({
        where: {
          courseId,
        },
      });

      // Calculate statistics
      const attendedClasses = attendanceRecords.filter(
        (record) => record.status === 'PRESENT'
      ).length;
      const lateArrivals = attendanceRecords.filter(
        (record) => record.status === 'LATE'
      ).length;
      const excusedAbsences = attendanceRecords.filter(
        (record) => record.status === 'EXCUSED'
      ).length;
      const missedClasses = totalSessions - attendedClasses - lateArrivals - excusedAbsences;

      const attendancePercentage = totalSessions > 0 
        ? Math.round(((attendedClasses + lateArrivals) / totalSessions) * 100)
        : 0;

      return {
        totalClasses: totalSessions,
        attendedClasses,
        missedClasses,
        lateArrivals,
        excusedAbsences,
        attendancePercentage,
        recentAttendance: attendanceRecords.slice(0, 10).map(record => ({
          id: record.id,
          status: record.status,
          markedAt: record.markedAt,
          qrCode: {
            title: record.qrCode.title,
            createdAt: record.qrCode.createdAt,
          },
        })),
      };
    } catch (error) {
      console.error('Error getting student course attendance stats:', error);
      throw new Error('Failed to get attendance statistics');
    }
  }

  /**
   * Get attendance statistics for all courses of a student
   */
  static async getStudentAttendanceOverview(
    studentId: number
  ): Promise<StudentAttendanceOverview> {
    try {
      // Get student info
      const student = await prisma.user.findUnique({
        where: { id: studentId },
      });

      if (!student) {
        throw new Error('Student not found');
      }

      // Get all enrolled courses
      const enrollments = await prisma.courseEnrollment.findMany({
        where: {
          studentId,
          status: 'ACTIVE',
        },
        include: {
          course: true,
        },
      });

      const courseStats: CourseAttendanceStats[] = [];

      for (const enrollment of enrollments) {
        const courseStats = await this.getStudentCourseAttendanceStats(
          studentId,
          enrollment.courseId
        );

        courseStats.push({
          courseId: enrollment.course.id,
          courseName: enrollment.course.courseName,
          courseCode: enrollment.course.courseCode,
          totalSessions: courseStats.totalClasses,
          attendancePercentage: courseStats.attendancePercentage,
          lastAttendanceDate: courseStats.recentAttendance[0]?.markedAt,
          attendanceHistory: courseStats.recentAttendance,
        });
      }

      // Calculate overall attendance percentage
      const totalSessions = courseStats.reduce((sum, course) => sum + course.totalSessions, 0);
      const totalAttended = courseStats.reduce((sum, course) => {
        const attended = Math.round((course.attendancePercentage / 100) * course.totalSessions);
        return sum + attended;
      }, 0);

      const overallAttendancePercentage = totalSessions > 0 
        ? Math.round((totalAttended / totalSessions) * 100)
        : 0;

      return {
        studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        totalCourses: enrollments.length,
        overallAttendancePercentage,
        courseStats,
      };
    } catch (error) {
      console.error('Error getting student attendance overview:', error);
      throw new Error('Failed to get student attendance overview');
    }
  }

  /**
   * Get attendance statistics for a course (Professor view)
   */
  static async getCourseAttendanceStats(courseId: number): Promise<{
    courseId: number;
    courseName: string;
    courseCode: string;
    totalSessions: number;
    totalStudents: number;
    averageAttendancePercentage: number;
    attendanceBySession: Array<{
      sessionId: string;
      title: string;
      date: Date;
      totalStudents: number;
      attendedStudents: number;
      attendancePercentage: number;
    }>;
    studentStats: Array<{
      studentId: number;
      studentName: string;
      attendancePercentage: number;
      totalSessions: number;
      attendedSessions: number;
    }>;
  }> {
    try {
      // Get course info
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          enrollments: {
            where: { status: 'ACTIVE' },
            include: {
              student: true,
            },
          },
        },
      });

      if (!course) {
        throw new Error('Course not found');
      }

      // Get all QR code sessions for this course
      const qrSessions = await prisma.qRCode.findMany({
        where: { courseId },
        include: {
          attendanceRecords: {
            include: {
              student: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Calculate attendance by session
      const attendanceBySession = qrSessions.map(session => {
        const totalStudents = course.enrollments.length;
        const attendedStudents = session.attendanceRecords.filter(
          record => record.status === 'PRESENT' || record.status === 'LATE'
        ).length;
        const attendancePercentage = totalStudents > 0 
          ? Math.round((attendedStudents / totalStudents) * 100)
          : 0;

        return {
          sessionId: session.sessionId,
          title: session.title,
          date: session.createdAt,
          totalStudents,
          attendedStudents,
          attendancePercentage,
        };
      });

      // Calculate student statistics
      const studentStats = await Promise.all(
        course.enrollments.map(async (enrollment) => {
          const studentStats = await this.getStudentCourseAttendanceStats(
            enrollment.studentId,
            courseId
          );

          return {
            studentId: enrollment.studentId,
            studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
            attendancePercentage: studentStats.attendancePercentage,
            totalSessions: studentStats.totalClasses,
            attendedSessions: studentStats.attendedClasses + studentStats.lateArrivals,
          };
        })
      );

      // Calculate average attendance percentage
      const averageAttendancePercentage = studentStats.length > 0
        ? Math.round(
            studentStats.reduce((sum, student) => sum + student.attendancePercentage, 0) /
            studentStats.length
          )
        : 0;

      return {
        courseId: course.id,
        courseName: course.courseName,
        courseCode: course.courseCode,
        totalSessions: qrSessions.length,
        totalStudents: course.enrollments.length,
        averageAttendancePercentage,
        attendanceBySession,
        studentStats,
      };
    } catch (error) {
      console.error('Error getting course attendance stats:', error);
      throw new Error('Failed to get course attendance statistics');
    }
  }

  /**
   * Get attendance trends for a student over time
   */
  static async getAttendanceTrends(
    studentId: number,
    courseId: number,
    days: number = 30
  ): Promise<Array<{
    date: string;
    attendancePercentage: number;
    totalSessions: number;
    attendedSessions: number;
  }>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get attendance records within the date range
      const attendanceRecords = await prisma.attendanceRecord.findMany({
        where: {
          studentId,
          courseId,
          markedAt: {
            gte: startDate,
          },
        },
        include: {
          qrCode: true,
        },
        orderBy: {
          markedAt: 'asc',
        },
      });

      // Group by date and calculate daily statistics
      const dailyStats = new Map<string, {
        totalSessions: number;
        attendedSessions: number;
      }>();

      attendanceRecords.forEach(record => {
        const date = record.markedAt.toISOString().split('T')[0];
        if (!dailyStats.has(date)) {
          dailyStats.set(date, { totalSessions: 0, attendedSessions: 0 });
        }
        
        const stats = dailyStats.get(date)!;
        stats.totalSessions++;
        if (record.status === 'PRESENT' || record.status === 'LATE') {
          stats.attendedSessions++;
        }
      });

      // Convert to array format
      return Array.from(dailyStats.entries()).map(([date, stats]) => ({
        date,
        attendancePercentage: stats.totalSessions > 0 
          ? Math.round((stats.attendedSessions / stats.totalSessions) * 100)
          : 0,
        totalSessions: stats.totalSessions,
        attendedSessions: stats.attendedSessions,
      }));
    } catch (error) {
      console.error('Error getting attendance trends:', error);
      throw new Error('Failed to get attendance trends');
    }
  }
}
