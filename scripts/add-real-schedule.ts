import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

// Day mapping: Sunday = 0, Monday = 1, ..., Saturday = 6
const DAY_MAP: { [key: string]: number } = {
  'Sunday': 0,
  'Monday': 1,
  'Tuesday': 2,
  'Wednesday': 3,
  'Thursday': 4,
  'Friday': 5,
  'Saturday': 6
};

interface ScheduleData {
  day: string;
  courseName: string;
  startTime: string;
  endTime: string;
  professorName: string;
  room: string;
}

// Real schedule data
const realSchedules: ScheduleData[] = [
  {
    day: 'Saturday',
    courseName: 'Applied Statistics',
    startTime: '08:30',
    endTime: '11:30',
    professorName: 'Dr. Adel Nassim',
    room: 'A201'
  },
  {
    day: 'Saturday',
    courseName: 'Graduation Project Research',
    startTime: '11:30',
    endTime: '14:30',
    professorName: 'Mohamed Ahmed Mahfouz',
    room: 'A501'
  },
  {
    day: 'Sunday',
    courseName: 'Enterprise Information Systems',
    startTime: '08:30',
    endTime: '11:30',
    professorName: 'Mohamed Ahmed Mahfouz',
    room: 'A302'
  },
  {
    day: 'Monday',
    courseName: 'Graduation Project Research',
    startTime: '12:30',
    endTime: '15:30',
    professorName: 'Ahmed Amin',
    room: 'A301'
  },
  {
    day: 'Tuesday',
    courseName: 'Applications in computer programming',
    startTime: '08:30',
    endTime: '11:30',
    professorName: 'Magdi Ahmed',
    room: 'A202'
  },
  {
    day: 'Thursday',
    courseName: 'Strategic Management',
    startTime: '08:30',
    endTime: '11:30',
    professorName: 'Rizk Gabrie',
    room: 'A502'
  },
  {
    day: 'Thursday',
    courseName: 'Business analytics and data mining',
    startTime: '11:30',
    endTime: '14:30',
    professorName: 'Magdi Ahmed',
    room: 'A201'
  }
];

async function findOrCreateProfessor(name: string): Promise<number> {
  // Parse professor name
  const nameParts = name.replace('Dr. ', '').trim().split(' ');
  const firstName = nameParts[0] || name;
  const lastName = nameParts.slice(1).join(' ') || name;
  const fullName = `${firstName} ${lastName}`;
  
  // Generate email from name
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, '.').replace(/\.+/g, '.')}@university.edu`;
  const universityId = `PROF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  // Check if professor exists
  let professor = await prisma.user.findFirst({
    where: {
      OR: [
        { firstName: firstName, lastName: lastName },
        { email: email },
        { 
          AND: [
            { firstName: { contains: firstName.split(' ')[0] } },
            { lastName: { contains: lastName.split(' ')[0] || firstName.split(' ')[1] || '' } }
          ]
        }
      ],
      role: 'PROFESSOR'
    }
  });
  
  if (!professor) {
    // Create professor
    professor = await prisma.user.create({
      data: {
        name: fullName,
        firstName,
        lastName,
        universityId,
        email,
        password: '$2a$10$placeholder', // Placeholder password
        role: 'PROFESSOR'
      }
    });
    console.log(`✅ Created professor: ${fullName} (${email})`);
  } else {
    console.log(`✓ Found professor: ${fullName}`);
  }
  
  return professor.id;
}

async function findOrCreateCourse(courseName: string, professorId: number): Promise<number> {
  // Generate course code from name (first letters of each word)
  const words = courseName.split(' ').filter(w => w.length > 0);
  let courseCode = words
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 6);
  
  // Add numbers if code is too short
  if (courseCode.length < 3) {
    courseCode += '101';
  }
  
  // Check if course exists by name
  let course = await prisma.course.findFirst({
    where: {
      courseName: courseName
    }
  });
  
  if (!course) {
    // Check if course code exists, if so add random number
    const existingCode = await prisma.course.findFirst({
      where: { courseCode }
    });
    
    if (existingCode) {
      courseCode = courseCode.substring(0, 4) + Math.floor(Math.random() * 100);
    }
    
    // Create course
    course = await prisma.course.create({
      data: {
        courseCode,
        courseName,
        description: `Course: ${courseName}`,
        credits: 3,
        professorId,
        isActive: true
      }
    });
    console.log(`✅ Created course: ${courseName} (${courseCode})`);
  } else {
    console.log(`✓ Found course: ${courseName} (${course.courseCode})`);
  }
  
  return course.id;
}

async function main() {
  console.log('🚀 Starting to add real schedule data...\n');
  
  try {
    for (const scheduleData of realSchedules) {
      console.log(`\n📅 Processing: ${scheduleData.courseName} - ${scheduleData.day}`);
      
      // Find or create professor
      const professorId = await findOrCreateProfessor(scheduleData.professorName);
      
      // Find or create course
      const courseId = await findOrCreateCourse(scheduleData.courseName, professorId);
      
      // Get day of week
      const dayOfWeek = DAY_MAP[scheduleData.day];
      
      // Check if schedule already exists
      const existingSchedule = await prisma.schedule.findFirst({
        where: {
          courseId,
          professorId,
          dayOfWeek,
          startTime: scheduleData.startTime,
          endTime: scheduleData.endTime,
          room: scheduleData.room
        }
      });
      
      if (existingSchedule) {
        console.log(`  ⚠️  Schedule already exists, skipping...`);
        continue;
      }
      
      // Create schedule
      await prisma.schedule.create({
        data: {
          courseId,
          professorId,
          dayOfWeek,
          startTime: scheduleData.startTime,
          endTime: scheduleData.endTime,
          room: scheduleData.room,
          isActive: true,
          semester: 'Fall 2024'
        }
      });
      
      console.log(`  ✅ Created schedule: ${scheduleData.day} ${scheduleData.startTime}-${scheduleData.endTime} in ${scheduleData.room}`);
    }
    
    console.log('\n✨ Successfully added all schedule data!');
  } catch (error) {
    console.error('❌ Error adding schedule data:', error);
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

