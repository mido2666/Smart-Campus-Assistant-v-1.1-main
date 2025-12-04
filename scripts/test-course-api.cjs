#!/usr/bin/env node

/**
 * Test Course API
 * Tests creating and fetching courses to debug the disappearing issue
 */

const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3001';
const TEST_PROFESSOR_ID = process.argv[2] || '1'; // Pass professor ID as argument

async function testCourseAPI() {
  console.log('\n🧪 Testing Course API...\n');
  console.log(`API URL: ${API_BASE_URL}`);
  console.log(`Professor ID: ${TEST_PROFESSOR_ID}\n`);

  // You'll need to provide a valid JWT token for authentication
  const token = process.env.TEST_TOKEN || '';
  
  if (!token) {
    console.log('⚠️  No token provided. Please set TEST_TOKEN environment variable.');
    console.log('   Or pass token as argument: TEST_TOKEN=your_token node scripts/test-course-api.cjs\n');
    return;
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    // Step 1: Get existing courses
    console.log('📋 Step 1: Fetching existing courses...');
    const getResponse = await axios.get(`${API_BASE_URL}/api/courses`, {
      params: { professorId: TEST_PROFESSOR_ID },
      headers
    });
    
    console.log(`✅ Found ${getResponse.data.data?.length || 0} existing courses`);
    if (getResponse.data.data?.length > 0) {
      console.log('   Courses:', getResponse.data.data.map(c => `${c.courseCode} - ${c.courseName}`).join(', '));
    }
    console.log('');

    // Step 2: Create a new test course
    console.log('➕ Step 2: Creating new test course...');
    const testCourseCode = `TEST${Date.now()}`;
    const createResponse = await axios.post(`${API_BASE_URL}/api/courses`, {
      courseCode: testCourseCode,
      courseName: 'Test Course',
      description: 'Test course for debugging',
      credits: 3
    }, { headers });

    if (createResponse.data.success) {
      console.log('✅ Course created successfully!');
      console.log('   Course ID:', createResponse.data.data.id);
      console.log('   Course Code:', createResponse.data.data.courseCode);
      console.log('   Is Active:', createResponse.data.data.isActive);
      console.log('');

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: Fetch courses again
      console.log('📋 Step 3: Fetching courses again...');
      const getResponse2 = await axios.get(`${API_BASE_URL}/api/courses`, {
        params: { professorId: TEST_PROFESSOR_ID },
        headers
      });

      const courseCount = getResponse2.data.data?.length || 0;
      const testCourse = getResponse2.data.data?.find(c => c.courseCode === testCourseCode);

      console.log(`✅ Found ${courseCount} courses after creation`);
      
      if (testCourse) {
        console.log('✅ Test course found in API response!');
        console.log('   Course:', `${testCourse.courseCode} - ${testCourse.courseName}`);
        console.log('   Is Active:', testCourse.isActive);
      } else {
        console.log('❌ Test course NOT found in API response!');
        console.log('   This indicates the course is not being returned by getAllCourses');
      }
    } else {
      console.log('❌ Failed to create course:', createResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('\n💡 Tip: Make sure you provide a valid JWT token');
      console.log('   Get token by logging in and check browser localStorage');
    }
  }

  console.log('');
}

testCourseAPI();

