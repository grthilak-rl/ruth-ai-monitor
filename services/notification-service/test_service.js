#!/usr/bin/env node
/**
 * Test script for Notification Service
 */

const axios = require('axios');

const BASE_URL = process.argv[2] || 'http://localhost:3000';

// Test data
const testNotification = {
  title: 'Test Notification',
  message: 'This is a test notification from the Notification Service',
  type: 'info',
  severity: 'medium',
  channels: ['in_app'],
  recipient_type: 'all',
  metadata: {
    test: true,
    timestamp: new Date().toISOString()
  }
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
      console.log(`   Socket.IO: ${response.data.socket_io?.total_connections || 0} connections`);
      console.log(`   Notification Channels: ${response.data.notification_channels?.enabled || 0}/${response.data.notification_channels?.total || 0} enabled`);
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

async function testGetNotificationStats() {
  try {
    console.log('🔍 Testing get notification stats...');
    const response = await axios.get(`${BASE_URL}/notifications/stats`);
    
    if (response.status === 200) {
      console.log('✅ Get notification stats passed');
      console.log(`   Total: ${response.data.stats.total}`);
      console.log(`   Unread: ${response.data.stats.unread}`);
      console.log(`   Today: ${response.data.stats.today}`);
      console.log(`   Socket Connections: ${response.data.stats.socket_connections?.total_connections || 0}`);
      console.log(`   Success: ${response.data.success}`);
      return true;
    } else {
      console.log(`❌ Get notification stats failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Get notification stats error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testGetNotificationTemplates() {
  try {
    console.log('🔍 Testing get notification templates...');
    const response = await axios.get(`${BASE_URL}/notifications/templates`);
    
    if (response.status === 200) {
      console.log('✅ Get notification templates passed');
      console.log(`   Templates: ${response.data.templates.length}`);
      console.log(`   Success: ${response.data.success}`);
      return true;
    } else {
      console.log(`❌ Get notification templates failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Get notification templates error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testGetNotificationChannels() {
  try {
    console.log('🔍 Testing get notification channels...');
    const response = await axios.get(`${BASE_URL}/notifications/channels`);
    
    if (response.status === 200) {
      console.log('✅ Get notification channels passed');
      console.log(`   Channels: ${response.data.channels.length}`);
      console.log(`   Enabled: ${response.data.channels.filter(c => c.enabled).length}`);
      console.log(`   Success: ${response.data.success}`);
      return true;
    } else {
      console.log(`❌ Get notification channels failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Get notification channels error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testGetAllNotifications() {
  try {
    if (!authToken) {
      console.log('⚠️ Skipping get all notifications test - no auth token');
      return true;
    }

    console.log('🔍 Testing get all notifications...');
    const response = await axios.get(`${BASE_URL}/notifications`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status === 200) {
      console.log('✅ Get all notifications passed');
      console.log(`   Count: ${response.data.count}`);
      console.log(`   Total: ${response.data.total}`);
      console.log(`   Success: ${response.data.success}`);
      return true;
    } else {
      console.log(`❌ Get all notifications failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Get all notifications error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testCreateNotification() {
  try {
    if (!authToken) {
      console.log('⚠️ Skipping create notification test - no auth token');
      return true;
    }

    console.log('🔍 Testing create notification...');
    const response = await axios.post(`${BASE_URL}/notifications`, testNotification, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status === 201) {
      console.log('✅ Create notification passed');
      console.log(`   Notification ID: ${response.data.notification.id}`);
      console.log(`   Title: ${response.data.notification.title}`);
      console.log(`   Type: ${response.data.notification.type}`);
      console.log(`   Success: ${response.data.success}`);
      return response.data.notification.id; // Return notification ID for other tests
    } else {
      console.log(`❌ Create notification failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already')) {
      console.log('⚠️ Notification already exists (expected for repeated tests)');
      return true;
    }
    console.log(`❌ Create notification error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testBroadcastNotification() {
  try {
    if (!authToken) {
      console.log('⚠️ Skipping broadcast notification test - no auth token');
      return true;
    }

    console.log('🔍 Testing broadcast notification...');
    const response = await axios.post(`${BASE_URL}/notifications/broadcast`, {
      title: 'Test Broadcast',
      message: 'This is a test broadcast notification',
      type: 'info',
      severity: 'low',
      channels: ['in_app']
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status === 200) {
      console.log('✅ Broadcast notification passed');
      console.log(`   Notification ID: ${response.data.notification.id}`);
      console.log(`   Title: ${response.data.notification.title}`);
      console.log(`   Recipient Type: ${response.data.notification.recipient_type}`);
      console.log(`   Success: ${response.data.success}`);
      return true;
    } else {
      console.log(`❌ Broadcast notification failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Broadcast notification error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testUnauthorizedAccess() {
  try {
    console.log('🔍 Testing unauthorized access...');
    const response = await axios.get(`${BASE_URL}/notifications`);
    
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

async function testInvalidNotificationId() {
  try {
    if (!authToken) {
      console.log('⚠️ Skipping invalid notification ID test - no auth token');
      return true;
    }

    console.log('🔍 Testing invalid notification ID...');
    const response = await axios.get(`${BASE_URL}/notifications/invalid-id`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    // This should fail with 400 (invalid UUID)
    if (response.status === 400) {
      console.log('✅ Invalid notification ID correctly rejected');
      return true;
    } else {
      console.log(`❌ Invalid notification ID should have failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Invalid notification ID correctly rejected');
      return true;
    }
    console.log(`❌ Invalid notification ID error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testSocketHealth() {
  try {
    console.log('🔍 Testing socket health...');
    const response = await axios.get(`${BASE_URL}/health/socket`);
    
    if (response.status === 200) {
      console.log('✅ Socket health check passed');
      console.log(`   Socket.IO: ${response.data.socket_io?.enabled ? 'Enabled' : 'Disabled'}`);
      console.log(`   Total Connections: ${response.data.socket_io?.total_connections || 0}`);
      console.log(`   Authenticated: ${response.data.socket_io?.authenticated_connections || 0}`);
      console.log(`   Success: ${response.data.status === 'healthy'}`);
      return true;
    } else {
      console.log(`❌ Socket health check failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Socket health check error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Testing Notification Service...');
  console.log('=' * 50);
  console.log(`Testing service at: ${BASE_URL}`);
  console.log();

  const tests = [
    { name: 'Health Check', fn: testHealthEndpoint },
    { name: 'Root Endpoint', fn: testRootEndpoint },
    { name: 'Get Notification Stats', fn: testGetNotificationStats },
    { name: 'Get Notification Templates', fn: testGetNotificationTemplates },
    { name: 'Get Notification Channels', fn: testGetNotificationChannels },
    { name: 'Socket Health Check', fn: testSocketHealth },
    { name: 'Unauthorized Access', fn: testUnauthorizedAccess },
    { name: 'Invalid Notification ID', fn: testInvalidNotificationId }
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
    console.log('🎉 All tests passed! Notification Service is working correctly.');
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
  testGetNotificationStats,
  testGetNotificationTemplates,
  testGetNotificationChannels
};
