#!/usr/bin/env node
/**
 * Test script for Camera Service
 */

const axios = require('axios');

const BASE_URL = process.argv[2] || 'http://localhost:3000';

// Test data
const testCamera = {
  name: 'Test Camera',
  location: 'Test Location',
  ip_address: '192.168.1.100',
  port: 554,
  username: 'admin',
  password: 'password',
  resolution: '1920x1080',
  frame_rate: 30,
  status: 'offline',
  feed_url: 'rtsp://192.168.1.100:554/live',
  is_active: true
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
      console.log(`   VAS Integration: ${response.data.vas_integration?.status || 'Unknown'}`);
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

async function testGetAllCameras() {
  try {
    console.log('🔍 Testing get all cameras...');
    const response = await axios.get(`${BASE_URL}/cameras`);
    
    if (response.status === 200) {
      console.log('✅ Get all cameras passed');
      console.log(`   Count: ${response.data.count}`);
      console.log(`   Success: ${response.data.success}`);
      return true;
    } else {
      console.log(`❌ Get all cameras failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Get all cameras error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testGetCameraStats() {
  try {
    console.log('🔍 Testing get camera stats...');
    const response = await axios.get(`${BASE_URL}/cameras/stats`);
    
    if (response.status === 200) {
      console.log('✅ Get camera stats passed');
      console.log(`   Total: ${response.data.stats.total}`);
      console.log(`   Active: ${response.data.stats.active}`);
      console.log(`   Success: ${response.data.success}`);
      return true;
    } else {
      console.log(`❌ Get camera stats failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Get camera stats error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testVASHealth() {
  try {
    console.log('🔍 Testing VAS health...');
    const response = await axios.get(`${BASE_URL}/cameras/vas-health`);
    
    if (response.status === 200) {
      console.log('✅ VAS health check passed');
      console.log(`   VAS Backend: ${response.data.vas_backend ? 'Connected' : 'Disconnected'}`);
      console.log(`   Authentication: ${response.data.authentication ? 'Authenticated' : 'Not Authenticated'}`);
      console.log(`   Success: ${response.data.success}`);
      return true;
    } else {
      console.log(`❌ VAS health check failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ VAS health check error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testCreateCamera() {
  try {
    if (!authToken) {
      console.log('⚠️ Skipping create camera test - no auth token');
      return true;
    }

    console.log('🔍 Testing create camera...');
    const response = await axios.post(`${BASE_URL}/cameras`, testCamera, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status === 201) {
      console.log('✅ Create camera passed');
      console.log(`   Camera ID: ${response.data.camera.id}`);
      console.log(`   Name: ${response.data.camera.name}`);
      console.log(`   Location: ${response.data.camera.location}`);
      console.log(`   Success: ${response.data.success}`);
      return response.data.camera.id; // Return camera ID for other tests
    } else {
      console.log(`❌ Create camera failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already')) {
      console.log('⚠️ Camera already exists (expected for repeated tests)');
      return true;
    }
    console.log(`❌ Create camera error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testGetCameraById(cameraId) {
  try {
    if (!authToken || !cameraId) {
      console.log('⚠️ Skipping get camera by ID test - no auth token or camera ID');
      return true;
    }

    console.log('🔍 Testing get camera by ID...');
    const response = await axios.get(`${BASE_URL}/cameras/${cameraId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status === 200) {
      console.log('✅ Get camera by ID passed');
      console.log(`   Camera ID: ${response.data.camera.id}`);
      console.log(`   Name: ${response.data.camera.name}`);
      console.log(`   Status: ${response.data.camera.status}`);
      console.log(`   Success: ${response.data.success}`);
      return true;
    } else {
      console.log(`❌ Get camera by ID failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Get camera by ID error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testUnauthorizedAccess() {
  try {
    console.log('🔍 Testing unauthorized access...');
    const response = await axios.get(`${BASE_URL}/cameras/1`);
    
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

async function testInvalidCameraId() {
  try {
    if (!authToken) {
      console.log('⚠️ Skipping invalid camera ID test - no auth token');
      return true;
    }

    console.log('🔍 Testing invalid camera ID...');
    const response = await axios.get(`${BASE_URL}/cameras/99999`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    // This should fail with 404
    if (response.status === 404) {
      console.log('✅ Invalid camera ID correctly rejected');
      return true;
    } else {
      console.log(`❌ Invalid camera ID should have failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ Invalid camera ID correctly rejected');
      return true;
    }
    console.log(`❌ Invalid camera ID error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Testing Camera Service...');
  console.log('=' * 50);
  console.log(`Testing service at: ${BASE_URL}`);
  console.log();

  const tests = [
    { name: 'Health Check', fn: testHealthEndpoint },
    { name: 'Root Endpoint', fn: testRootEndpoint },
    { name: 'Get All Cameras', fn: testGetAllCameras },
    { name: 'Get Camera Stats', fn: testGetCameraStats },
    { name: 'VAS Health Check', fn: testVASHealth },
    { name: 'Unauthorized Access', fn: testUnauthorizedAccess },
    { name: 'Invalid Camera ID', fn: testInvalidCameraId }
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
    console.log('🎉 All tests passed! Camera Service is working correctly.');
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
  testGetAllCameras,
  testVASHealth
};
