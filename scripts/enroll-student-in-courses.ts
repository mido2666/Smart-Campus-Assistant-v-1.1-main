import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

// Real schedule courses
const realCourses = [
  'Applied Statistics',
  'Graduation Project Research',
  'Enterprise Information Systems',
  'Applications in computer programming',
  'Strategic Management',
  'Business analytics and data mining'
];

async function main() {
  console.log('🚀 Enrolling student in real schedule courses...\n');
  
  try {
    // Find student (you can modify this to find specific student)
    // For now, we'll find the first student or use a specific university ID
    const studentUniversityId = process.env.STUDENT_ID || '20221245'; // Default student ID
    
    const student = await prisma.user.findUnique({
      where: { universityId: studentUniversityId },
      select: { id: true, universityId: true, firstName: true, lastName: true }
    });
    
    if (!student) {
      console.error(`❌ Student with university ID ${studentUniversityId} not found!`);
      console.log('Available students:');
      const allStudents = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { id: true, universityId: true, firstName: true, lastName: true },
        take: 10
      });
      allStudents.forEach(s => {
        console.log(`  - ${s.universityId}: ${s.firstName} ${s.lastName}`);
      });
      process.exit(1);
    }
    
    console.log(`✅ Found student: ${student.firstName} ${student.lastName} (${student.universityId})\n`);
    
    // Find all courses
    const courses = await prisma.course.findMany({
      where: {
        courseName: { in: realCourses }
      },
      select: { id: true, courseCode: true, courseName: true }
    });
    
    console.log(`📚 Found ${courses.length} courses:\n`);
    courses.forEach(c => {
      console.log(`  - ${c.courseCode}: ${c.courseName}`);
    });
    console.log();
    
    let enrolledCount = 0;
    let alreadyEnrolledCount = 0;
    
    // Enroll student in each course
    for (const course of courses) {
      // Check if already enrolled
      const existingEnrollment = await prisma.courseEnrollment.findFirst({
        where: {
          studentId: student.id,
          courseId: course.id
        }
      });
      
      if (existingEnrollment) {
        console.log(`  ⚠️  Already enrolled in: ${course.courseName}`);
        alreadyEnrolledCount++;
        continue;
      }
      
      // Create enrollment
      await prisma.courseEnrollment.create({
        data: {
          studentId: student.id,
          courseId: course.id,
          status: 'ACTIVE'
        }
      });
      
      console.log(`  ✅ Enrolled in: ${course.courseName} (${course.courseCode})`);
      enrolledCount++;
    }
    
    console.log(`\n✨ Enrollment complete!`);
    console.log(`   - New enrollments: ${enrolledCount}`);
    console.log(`   - Already enrolled: ${alreadyEnrolledCount}`);
    console.log(`   - Total courses: ${courses.length}`);
    
  } catch (error) {
    console.error('❌ Error enrolling student:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

