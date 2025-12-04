#!/usr/bin/env node

/**
 * Update Schedule Script
 * Clears old schedules and creates new university schedule
 */

import { PrismaClient } from '../src/generated/prisma/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updateSchedule() {
  try {
    console.log('🗑️ Clearing old schedules...');
    const deletedCount = await prisma.schedule.deleteMany({});
    console.log(`✅ Deleted ${deletedCount.count} old schedules`);

    // Step 1: Get or create professors
    console.log('\n👨‍🏫 Creating/updating professors...');
    
    const professorNames = [
      { firstName: 'Adel', lastName: 'Nassim' },
      { firstName: 'Mohamed', lastName: 'Ahmed Mahfouz' },
      { firstName: 'Ahmed', lastName: 'Amin' },
      { firstName: 'Magdi', lastName: 'Ahmed' },
      { firstName: 'Rizk', lastName: 'Gabriel' }
    ];

    const professors = {};
    const defaultPassword = await bcrypt.hash('professor123', 10);

    for (const prof of professorNames) {
      let professor = await prisma.user.findFirst({
        where: {
          role: 'PROFESSOR',
          firstName: prof.firstName,
          lastName: prof.lastName
        }
      });

      if (!professor) {
        // Generate unique university ID
        const universityId = `PROF${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        // Generate email
        const email = `${prof.firstName.toLowerCase()}.${prof.lastName.toLowerCase().replace(/\s+/g, '.')}@university.edu`;
        
        professor = await prisma.user.create({
          data: {
            name: `Dr. ${prof.firstName} ${prof.lastName}`,
            firstName: prof.firstName,
            lastName: prof.lastName,
            universityId: universityId,
            email: email,
            password: defaultPassword,
            role: 'PROFESSOR'
          }
        });
        console.log(`  ✅ Created professor: Dr. ${prof.firstName} ${prof.lastName} (${universityId})`);
      } else {
        console.log(`  ✅ Found professor: Dr. ${prof.firstName} ${prof.lastName}`);
      }
      
      professors[`${prof.firstName} ${prof.lastName}`] = professor;
    }

    // Step 2: Get or create courses
    console.log('\n📚 Creating/updating courses...');
    
    const courseData = [
      { code: 'CS101', name: 'Applied Statistics', credits: 3 },
      { code: 'CS102', name: 'Graduation research', credits: 3 },
      { code: 'CS103', name: 'Information Systems', credits: 3 },
      { code: 'CS104', name: 'Applications in computer programming', credits: 3 },
      { code: 'CS105', name: 'Strategic Management', credits: 3 },
      { code: 'CS106', name: 'Business analytics and data mining', credits: 3 }
    ];

    const courses = {};
    const defaultProfessor = professors['Adel Nassim'];

    for (const courseInfo of courseData) {
      let course = await prisma.course.findUnique({
        where: { courseCode: courseInfo.code }
      });

      if (!course) {
        course = await prisma.course.create({
          data: {
            courseCode: courseInfo.code,
            courseName: courseInfo.name,
            description: `University course: ${courseInfo.name}`,
            credits: courseInfo.credits,
            professorId: defaultProfessor.id,
            isActive: true
          }
        });
        console.log(`  ✅ Created course: ${courseInfo.code} - ${courseInfo.name}`);
      } else {
        console.log(`  ✅ Found course: ${courseInfo.code} - ${courseInfo.name}`);
      }
      
      courses[courseInfo.code] = course;
    }

    // Step 3: Update course professors if needed
    // CS103 should have Dr. Mohamed Ahmed Mahfouz as professor
    if (courses['CS103'] && courses['CS103'].professorId !== professors['Mohamed Ahmed Mahfouz'].id) {
      await prisma.course.update({
        where: { courseCode: 'CS103' },
        data: { professorId: professors['Mohamed Ahmed Mahfouz'].id }
      });
      console.log(`  ✅ Updated CS103 professor to Dr. Mohamed Ahmed Mahfouz`);
    }

    // Step 4: Create schedules
    console.log('\n📅 Creating new schedules...');
    
    const schedules = [
      {
        courseCode: 'CS101',
        professorName: 'Adel Nassim',
        dayOfWeek: 6, // Saturday
        startTime: '08:30',
        endTime: '11:30',
        room: 'A201',
        semester: 'Fall 2025'
      },
      {
        courseCode: 'CS102',
        professorName: 'Mohamed Ahmed Mahfouz',
        dayOfWeek: 6, // Saturday
        startTime: '11:30',
        endTime: '14:30',
        room: 'A501',
        semester: 'Fall 2025'
      },
      {
        courseCode: 'CS103',
        professorName: 'Mohamed Ahmed Mahfouz',
        dayOfWeek: 0, // Sunday
        startTime: '08:30',
        endTime: '11:30',
        room: 'A302',
        semester: 'Fall 2025'
      },
      {
        courseCode: 'CS102',
        professorName: 'Ahmed Amin',
        dayOfWeek: 1, // Monday
        startTime: '12:30',
        endTime: '15:30',
        room: 'A301',
        semester: 'Fall 2025'
      },
      {
        courseCode: 'CS104',
        professorName: 'Magdi Ahmed',
        dayOfWeek: 2, // Tuesday
        startTime: '08:30',
        endTime: '11:30',
        room: 'A202',
        semester: 'Fall 2025'
      },
      {
        courseCode: 'CS105',
        professorName: 'Rizk Gabriel',
        dayOfWeek: 4, // Thursday
        startTime: '08:30',
        endTime: '11:30',
        room: 'A502',
        semester: 'Fall 2025'
      },
      {
        courseCode: 'CS106',
        professorName: 'Magdi Ahmed',
        dayOfWeek: 4, // Thursday
        startTime: '11:30',
        endTime: '14:30',
        room: 'A201',
        semester: 'Fall 2025'
      }
    ];

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let createdCount = 0;

    for (const scheduleInfo of schedules) {
      const course = courses[scheduleInfo.courseCode];
      const professor = professors[scheduleInfo.professorName];

      if (!course) {
        console.error(`  ❌ Course not found: ${scheduleInfo.courseCode}`);
        continue;
      }

      if (!professor) {
        console.error(`  ❌ Professor not found: ${scheduleInfo.professorName}`);
        continue;
      }

      // Update course professor if different
      if (course.professorId !== professor.id) {
        await prisma.course.update({
          where: { id: course.id },
          data: { professorId: professor.id }
        });
      }

      await prisma.schedule.create({
        data: {
          courseId: course.id,
          professorId: professor.id,
          dayOfWeek: scheduleInfo.dayOfWeek,
          startTime: scheduleInfo.startTime,
          endTime: scheduleInfo.endTime,
          room: scheduleInfo.room,
          semester: scheduleInfo.semester,
          isActive: true
        }
      });
      
      const dayName = dayNames[scheduleInfo.dayOfWeek];
      console.log(`  ✅ Created schedule: ${scheduleInfo.courseCode} - ${dayName} ${scheduleInfo.startTime}-${scheduleInfo.endTime} (Room: ${scheduleInfo.room})`);
      createdCount++;
    }

    console.log('\n✅ Schedule update completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Professors: ${Object.keys(professors).length}`);
    console.log(`   - Courses: ${Object.keys(courses).length}`);
    console.log(`   - Schedules created: ${createdCount}`);

  } catch (error) {
    console.error('\n❌ Error updating schedule:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateSchedule()
  .then(() => {
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

