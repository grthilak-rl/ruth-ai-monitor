#!/usr/bin/env node
/**
 * Test script for Auth Service
 */

const axios = require('axios');

const BASE_URL = process.argv[2] || 'http://localhost:3000';

// Test data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'TestPass123',
  first_name: 'Test',
  last_name: 'User',
  role: 'viewer'
};

let authToken = null;

async function testHealthEndpoint() {
  try {
    console.log('🔍 Testing health endpoint...');
    const response = await axios.get(`${BASE_URL}/health`);
    
    if (response.status === 200) {
      console.log('✅ Health check passed');
      console.log(`   Service: ${response.data.service}`);
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Database: ${response.data.database}`);
      console.log(`   Uptime: ${Math.round(response.data.uptime)}s`);
      return true;
    } else {
      console.log(`❌ Health check failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Health check error: ${error.message}`);
    return false;
  }
}

async function testRootEndpoint() {
  try {
    console.log('🔍 Testing root endpoint...');
    const response = await axios.get(`${BASE_URL}/`);
    
    if (response.status === 200) {
      console.log('✅ Root endpoint passed');
      console.log(`   Service: ${response.data.service}`);
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Endpoints: ${Object.keys(response.data.endpoints).length} available`);
      return true;
    } else {
      console.log(`❌ Root endpoint failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Root endpoint error: ${error.message}`);
    return false;
  }
}

async function testUserRegistration() {
  try {
    console.log('🔍 Testing user registration...');
    const response = await axios.post(`${BASE_URL}/auth/register`, testUser);
    
    if (response.status === 201) {
      console.log('✅ User registration passed');
      console.log(`   User ID: ${response.data.user.id}`);
      console.log(`   Username: ${response.data.user.username}`);
      console.log(`   Role: ${response.data.user.role}`);
      console.log(`   Token: ${response.data.token ? 'Generated' : 'Missing'}`);
      
      // Store token for other tests
      authToken = response.data.token;
      return true;
    } else {
      console.log(`❌ User registration failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already')) {
      console.log('⚠️ User already exists (expected for repeated tests)');
      return true;
    }
    console.log(`❌ User registration error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testUserLogin() {
  try {
    console.log('🔍 Testing user login...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: testUser.username,
      password: testUser.password
    });
    
    if (response.status === 200) {
      console.log('✅ User login passed');
      console.log(`   Success: ${response.data.success}`);
      console.log(`   User: ${response.data.user.username}`);
      console.log(`   Token: ${response.data.token ? 'Generated' : 'Missing'}`);
      
      // Store token for other tests
      authToken = response.data.token;
      return true;
    } else {
      console.log(`❌ User login failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ User login error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testGetCurrentUser() {
  try {
    if (!authToken) {
      console.log('⚠️ Skipping get current user test - no auth token');
      return true;
    }

    console.log('🔍 Testing get current user...');
    const response = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status === 200) {
      console.log('✅ Get current user passed');
      console.log(`   User: ${response.data.user.username}`);
      console.log(`   Email: ${response.data.user.email}`);
      console.log(`   Role: ${response.data.user.role}`);
      return true;
    } else {
      console.log(`❌ Get current user failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Get current user error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testUnauthorizedAccess() {
  try {
    console.log('🔍 Testing unauthorized access...');
    const response = await axios.get(`${BASE_URL}/auth/me`);
    
    // This should fail with 401
    if (response.status === 401) {
      console.log('✅ Unauthorized access correctly rejected');
      return true;
    } else {
      console.log(`❌ Unauthorized access should have failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Unauthorized access correctly rejected');
      return true;
    }
    console.log(`❌ Unauthorized access error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testInvalidCredentials() {
  try {
    console.log('🔍 Testing invalid credentials...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'nonexistent',
      password: 'wrongpassword'
    });
    
    // This should fail with 401
    if (response.status === 401) {
      console.log('✅ Invalid credentials correctly rejected');
      return true;
    } else {
      console.log(`❌ Invalid credentials should have failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Invalid credentials correctly rejected');
      return true;
    }
    console.log(`❌ Invalid credentials error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Testing Auth Service...');
  console.log('=' * 50);
  console.log(`Testing service at: ${BASE_URL}`);
  console.log();

  const tests = [
    { name: 'Health Check', fn: testHealthEndpoint },
    { name: 'Root Endpoint', fn: testRootEndpoint },
    { name: 'User Registration', fn: testUserRegistration },
    { name: 'User Login', fn: testUserLogin },
    { name: 'Get Current User', fn: testGetCurrentUser },
    { name: 'Unauthorized Access', fn: testUnauthorizedAccess },
    { name: 'Invalid Credentials', fn: testInvalidCredentials }
  ];

  let passed = 0;
  const total = tests.length;

  for (const test of tests) {
    if (await test.fn()) {
      passed++;
    }
    console.log();
  }

  console.log('=' * 50);
  console.log(`📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Auth Service is working correctly.');
    return 0;
  } else {
    console.log('❌ Some tests failed. Check the service logs.');
    return 1;
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests()
    .then(exitCode => process.exit(exitCode))
    .catch(error => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  testHealthEndpoint,
  testUserRegistration,
  testUserLogin,
  testGetCurrentUser
};
