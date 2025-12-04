#!/usr/bin/env node

/**
 * Authentication Test Script
 * Tests all authentication endpoints and scenarios
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api/auth`;

// Test data
const testUser = {
  universityId: '20221245',
  email: 'mohamed.hassan@university.edu',
  password: '123456',
  role: 'student',
  firstName: 'Mohamed',
  lastName: 'Hassan'
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  log(`\n${colors.bold}🧪 Testing: ${testName}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    
    return {
      status: response.status,
      success: response.ok,
      data
    };
  } catch (error) {
    return {
      status: 0,
      success: false,
      error: error.message
    };
  }
}

async function testHealthCheck() {
  logTest('Health Check');
  
  const result = await makeRequest(`${API_BASE}/health`);
  
  if (result.success && result.data.success) {
    logSuccess('Health check passed');
    logInfo(`Server is running on ${BASE_URL}`);
    return true;
  } else {
    logError('Health check failed');
    logError(`Status: ${result.status}, Error: ${result.error || result.data?.message}`);
    return false;
  }
}

async function testRegistration() {
  logTest('User Registration');
  
  const result = await makeRequest(`${API_BASE}/register`, {
    method: 'POST',
    body: JSON.stringify(testUser)
  });
  
  if (result.success && result.data.success) {
    logSuccess('User registration successful');
    logInfo(`User ID: ${result.data.data.user.id}`);
    logInfo(`University ID: ${result.data.data.user.universityId}`);
    return true;
  } else {
    logError('User registration failed');
    logError(`Status: ${result.status}, Error: ${result.data?.message}`);
    return false;
  }
}

async function testLogin() {
  logTest('User Login');
  
  const loginData = {
    universityId: testUser.universityId,
    password: testUser.password
  };
  
  const result = await makeRequest(`${API_BASE}/login`, {
    method: 'POST',
    body: JSON.stringify(loginData)
  });
  
  if (result.success && result.data.success) {
    logSuccess('User login successful');
    logInfo(`Access Token: ${result.data.data.accessToken}`);
    logInfo(`User Role: ${result.data.data.user.role}`);
    return result.data.data.accessToken;
  } else {
    logError('User login failed');
    logError(`Status: ${result.status}, Error: ${result.data?.message}`);
    return null;
  }
}

async function testGetCurrentUser(accessToken) {
  logTest('Get Current User');
  
  const result = await makeRequest(`${API_BASE}/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  if (result.success && result.data.success) {
    logSuccess('Get current user successful');
    logInfo(`User: ${result.data.data.user.firstName} ${result.data.data.user.lastName}`);
    logInfo(`Email: ${result.data.data.user.email}`);
    return true;
  } else {
    logError('Get current user failed');
    logError(`Status: ${result.status}, Error: ${result.data?.message}`);
    return false;
  }
}

async function testInvalidCredentials() {
  logTest('Invalid Credentials');
  
  const invalidData = {
    universityId: testUser.universityId,
    password: 'wrongpassword'
  };
  
  const result = await makeRequest(`${API_BASE}/login`, {
    method: 'POST',
    body: JSON.stringify(invalidData)
  });
  
  if (!result.success && result.data.message.includes('Password must be 1-9 digits')) {
    logSuccess('Invalid password validation working correctly');
    return true;
  } else {
    logError('Invalid password validation failed');
    logError(`Status: ${result.status}, Error: ${result.data?.message}`);
    return false;
  }
}

async function testInvalidUniversityId() {
  logTest('Invalid University ID');
  
  const invalidData = {
    universityId: '123',
    password: testUser.password
  };
  
  const result = await makeRequest(`${API_BASE}/login`, {
    method: 'POST',
    body: JSON.stringify(invalidData)
  });
  
  if (!result.success && result.data.message.includes('University ID must be 8 digits')) {
    logSuccess('Invalid university ID validation working correctly');
    return true;
  } else {
    logError('Invalid university ID validation failed');
    logError(`Status: ${result.status}, Error: ${result.data?.message}`);
    return false;
  }
}

async function testMissingFields() {
  logTest('Missing Required Fields');
  
  const incompleteData = {
    universityId: testUser.universityId
    // Missing password
  };
  
  const result = await makeRequest(`${API_BASE}/login`, {
    method: 'POST',
    body: JSON.stringify(incompleteData)
  });
  
  if (!result.success && result.data.message.includes('University ID and password are required')) {
    logSuccess('Missing fields validation working correctly');
    return true;
  } else {
    logError('Missing fields validation failed');
    logError(`Status: ${result.status}, Error: ${result.data?.message}`);
    return false;
  }
}

async function runAllTests() {
  log(`${colors.bold}🚀 Starting Authentication System Tests${colors.reset}`);
  log(`${colors.bold}==========================================${colors.reset}`);
  
  const results = {
    healthCheck: false,
    registration: false,
    login: false,
    getCurrentUser: false,
    invalidCredentials: false,
    invalidUniversityId: false,
    missingFields: false
  };
  
  // Test 1: Health Check
  results.healthCheck = await testHealthCheck();
  if (!results.healthCheck) {
    logError('Server is not running. Please start the server first.');
    return;
  }
  
  // Test 2: Registration
  results.registration = await testRegistration();
  
  // Test 3: Login
  const accessToken = await testLogin();
  results.login = accessToken !== null;
  
  // Test 4: Get Current User (only if login succeeded)
  if (accessToken) {
    results.getCurrentUser = await testGetCurrentUser(accessToken);
  }
  
  // Test 5: Invalid Credentials
  results.invalidCredentials = await testInvalidCredentials();
  
  // Test 6: Invalid University ID
  results.invalidUniversityId = await testInvalidUniversityId();
  
  // Test 7: Missing Fields
  results.missingFields = await testMissingFields();
  
  // Summary
  log(`\n${colors.bold}📊 Test Results Summary${colors.reset}`);
  log(`${colors.bold}========================${colors.reset}`);
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? 'green' : 'red';
    log(`${status} ${test}`, color);
  });
  
  log(`\n${colors.bold}Overall: ${passedTests}/${totalTests} tests passed${colors.reset}`);
  
  if (passedTests === totalTests) {
    logSuccess('🎉 All tests passed! Authentication system is working correctly.');
  } else {
    logError('⚠️  Some tests failed. Please check the issues above.');
  }
  
  return results;
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests, testHealthCheck, testRegistration, testLogin };
