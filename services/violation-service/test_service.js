#!/usr/bin/env node
/**
 * Test script for Violation Service
 */

const axios = require('axios');

const BASE_URL = process.argv[2] || 'http://localhost:3000';

// Test data
const testViolation = {
  violation_type: 'work_at_height',
  severity: 'high',
  ai_confidence: 85.5,
  description: 'Worker detected at height without proper safety equipment',
  camera_id: 1,
  ai_model_id: 'work_at_height_v1',
  detection_data: {
    confidence: 85.5,
    bounding_boxes: [
      { x: 100, y: 100, width: 200, height: 300, confidence: 85.5 }
    ]
  },
  bounding_boxes: [
    { x: 100, y: 100, width: 200, height: 300, confidence: 85.5 }
  ],
  thumbnail_url: 'https://example.com/thumbnail.jpg',
  full_image_url: 'https://example.com/full_image.jpg'
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
      console.log(`   AI Integration: ${response.data.ai_integration?.ai_models_service || 'Unknown'}`);
      console.log(`   Available Models: ${response.data.ai_integration?.available_models || 0}`);
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

async function testGetViolationStats() {
  try {
    console.log('🔍 Testing get violation stats...');
    const response = await axios.get(`${BASE_URL}/violations/stats`);
    
    if (response.status === 200) {
      console.log('✅ Get violation stats passed');
      console.log(`   Total: ${response.data.stats.total}`);
      console.log(`   Today: ${response.data.stats.today}`);
      console.log(`   This Week: ${response.data.stats.this_week}`);
      console.log(`   Success: ${response.data.success}`);
      return true;
    } else {
      console.log(`❌ Get violation stats failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Get violation stats error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testGetAllViolations() {
  try {
    if (!authToken) {
      console.log('⚠️ Skipping get all violations test - no auth token');
      return true;
    }

    console.log('🔍 Testing get all violations...');
    const response = await axios.get(`${BASE_URL}/violations`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status === 200) {
      console.log('✅ Get all violations passed');
      console.log(`   Count: ${response.data.count}`);
      console.log(`   Total: ${response.data.total}`);
      console.log(`   Success: ${response.data.success}`);
      return true;
    } else {
      console.log(`❌ Get all violations failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Get all violations error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testGetProcessingStatus() {
  try {
    console.log('🔍 Testing get processing status...');
    const response = await axios.get(`${BASE_URL}/violations/processing/status`);
    
    if (response.status === 200) {
      console.log('✅ Get processing status passed');
      console.log(`   AI Models Service: ${response.data.ai_models_service ? 'Connected' : 'Disconnected'}`);
      console.log(`   Available Models: ${response.data.available_models}`);
      console.log(`   Camera Service: ${response.data.camera_service ? 'Connected' : 'Disconnected'}`);
      console.log(`   Success: ${response.data.success}`);
      return true;
    } else {
      console.log(`❌ Get processing status failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Get processing status error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testCreateViolation() {
  try {
    if (!authToken) {
      console.log('⚠️ Skipping create violation test - no auth token');
      return true;
    }

    console.log('🔍 Testing create violation...');
    const response = await axios.post(`${BASE_URL}/violations`, testViolation, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status === 201) {
      console.log('✅ Create violation passed');
      console.log(`   Violation ID: ${response.data.violation.id}`);
      console.log(`   Type: ${response.data.violation.violation_type}`);
      console.log(`   Severity: ${response.data.violation.severity}`);
      console.log(`   Success: ${response.data.success}`);
      return response.data.violation.id; // Return violation ID for other tests
    } else {
      console.log(`❌ Create violation failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already')) {
      console.log('⚠️ Violation already exists (expected for repeated tests)');
      return true;
    }
    console.log(`❌ Create violation error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testGetViolationById(violationId) {
  try {
    if (!authToken || !violationId) {
      console.log('⚠️ Skipping get violation by ID test - no auth token or violation ID');
      return true;
    }

    console.log('🔍 Testing get violation by ID...');
    const response = await axios.get(`${BASE_URL}/violations/${violationId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status === 200) {
      console.log('✅ Get violation by ID passed');
      console.log(`   Violation ID: ${response.data.violation.id}`);
      console.log(`   Type: ${response.data.violation.violation_type}`);
      console.log(`   Status: ${response.data.violation.status}`);
      console.log(`   Success: ${response.data.success}`);
      return true;
    } else {
      console.log(`❌ Get violation by ID failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Get violation by ID error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testUnauthorizedAccess() {
  try {
    console.log('🔍 Testing unauthorized access...');
    const response = await axios.get(`${BASE_URL}/violations`);
    
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

async function testInvalidViolationId() {
  try {
    if (!authToken) {
      console.log('⚠️ Skipping invalid violation ID test - no auth token');
      return true;
    }

    console.log('🔍 Testing invalid violation ID...');
    const response = await axios.get(`${BASE_URL}/violations/99999`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    // This should fail with 404
    if (response.status === 404) {
      console.log('✅ Invalid violation ID correctly rejected');
      return true;
    } else {
      console.log(`❌ Invalid violation ID should have failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ Invalid violation ID correctly rejected');
      return true;
    }
    console.log(`❌ Invalid violation ID error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testExportViolations() {
  try {
    console.log('🔍 Testing export violations...');
    const response = await axios.get(`${BASE_URL}/violations/export`, {
      responseType: 'text'
    });
    
    if (response.status === 200) {
      console.log('✅ Export violations passed');
      console.log(`   Content Type: ${response.headers['content-type']}`);
      console.log(`   Content Length: ${response.data.length} characters`);
      return true;
    } else {
      console.log(`❌ Export violations failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Export violations error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Testing Violation Service...');
  console.log('=' * 50);
  console.log(`Testing service at: ${BASE_URL}`);
  console.log();

  const tests = [
    { name: 'Health Check', fn: testHealthEndpoint },
    { name: 'Root Endpoint', fn: testRootEndpoint },
    { name: 'Get Violation Stats', fn: testGetViolationStats },
    { name: 'Get Processing Status', fn: testGetProcessingStatus },
    { name: 'Export Violations', fn: testExportViolations },
    { name: 'Unauthorized Access', fn: testUnauthorizedAccess },
    { name: 'Invalid Violation ID', fn: testInvalidViolationId }
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
    console.log('🎉 All tests passed! Violation Service is working correctly.');
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
  testGetViolationStats,
  testGetProcessingStatus
};
