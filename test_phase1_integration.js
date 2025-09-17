#!/usr/bin/env node

/**
 * Phase 1 Integration Test Script
 * Tests the new WebRTC API endpoints in Ruth-AI Monitor
 */

const axios = require('axios');

// Configuration
const RUTH_AI_API_URL = 'http://localhost:3005/api';
const VAS_API_URL = 'http://10.30.250.245:8000/api';

// Test credentials
const credentials = {
  username: 'admin',
  password: 'password'
};

let authToken = null;

/**
 * Authenticate with Ruth-AI Monitor
 */
async function authenticate() {
  try {
    console.log('Authenticating with Ruth-AI Monitor...');
    const response = await axios.post(`${RUTH_AI_API_URL}/auth/login`, credentials);
    authToken = response.data.token;
    console.log('✓ Authentication successful');
    return true;
  } catch (error) {
    console.error('✗ Authentication failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test WebRTC streams endpoint
 */
async function testWebRTCStreams() {
  try {
    console.log('\nTesting WebRTC streams endpoint...');
    const response = await axios.get(`${RUTH_AI_API_URL}/cameras/webrtc/streams`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    console.log('✓ WebRTC streams endpoint working');
    console.log(`  Found ${response.data.streams?.length || 0} streams`);
    
    if (response.data.streams && response.data.streams.length > 0) {
      const firstStream = response.data.streams[0];
      console.log(`  First stream: ${firstStream.name} (ID: ${firstStream.stream_id})`);
      return firstStream.stream_id;
    }
    
    return null;
  } catch (error) {
    console.error('✗ WebRTC streams endpoint failed:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test WebRTC stream config endpoint
 */
async function testWebRTCStreamConfig(streamId) {
  if (!streamId) {
    console.log('\nSkipping stream config test - no stream ID available');
    return false;
  }
  
  try {
    console.log(`\nTesting WebRTC stream config endpoint for stream ${streamId}...`);
    const response = await axios.get(`${RUTH_AI_API_URL}/cameras/webrtc/streams/${streamId}/config`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    console.log('✓ WebRTC stream config endpoint working');
    console.log(`  Stream ID: ${response.data.stream_id}`);
    console.log(`  Janus WS URL: ${response.data.janus_ws_url}`);
    console.log(`  Plugin: ${response.data.plugin_name}`);
    
    return true;
  } catch (error) {
    console.error('✗ WebRTC stream config endpoint failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test WebRTC stream status endpoint
 */
async function testWebRTCStreamStatus(streamId) {
  if (!streamId) {
    console.log('\nSkipping stream status test - no stream ID available');
    return false;
  }
  
  try {
    console.log(`\nTesting WebRTC stream status endpoint for stream ${streamId}...`);
    const response = await axios.get(`${RUTH_AI_API_URL}/cameras/webrtc/streams/${streamId}/status`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    console.log('✓ WebRTC stream status endpoint working');
    console.log(`  Stream ID: ${response.data.stream_id}`);
    console.log(`  Status: ${response.data.status}`);
    console.log(`  Active: ${response.data.active}`);
    
    return true;
  } catch (error) {
    console.error('✗ WebRTC stream status endpoint failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test WebRTC system status endpoint
 */
async function testWebRTCSystemStatus() {
  try {
    console.log('\nTesting WebRTC system status endpoint...');
    const response = await axios.get(`${RUTH_AI_API_URL}/cameras/webrtc/system/status`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    console.log('✓ WebRTC system status endpoint working');
    console.log(`  Status: ${response.data.status}`);
    console.log(`  Active Streams: ${response.data.active_streams}`);
    console.log(`  Total Streams: ${response.data.total_streams}`);
    
    return true;
  } catch (error) {
    console.error('✗ WebRTC system status endpoint failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test direct VAS API access
 */
async function testDirectVASAccess() {
  try {
    console.log('\nTesting direct VAS API access...');
    
    // Authenticate with VAS
    const authResponse = await axios.post(`${VAS_API_URL}/auth/login-json`, credentials);
    const vasToken = authResponse.data.access_token;
    
    // Test VAS WebRTC streams endpoint
    const streamsResponse = await axios.get(`${VAS_API_URL}/streams/webrtc/streams`, {
      headers: { 'Authorization': `Bearer ${vasToken}` }
    });
    
    console.log('✓ Direct VAS API access working');
    console.log(`  VAS streams: ${streamsResponse.data.streams?.length || 0}`);
    
    return true;
  } catch (error) {
    console.error('✗ Direct VAS API access failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('Phase 1 Integration Test - Ruth-AI Monitor WebRTC API');
  console.log('====================================================');
  
  const results = {
    authentication: false,
    webrtcStreams: false,
    webrtcConfig: false,
    webrtcStatus: false,
    webrtcSystemStatus: false,
    directVAS: false
  };
  
  // Test authentication
  results.authentication = await authenticate();
  if (!results.authentication) {
    console.log('\n✗ Cannot proceed without authentication');
    return;
  }
  
  // Test WebRTC endpoints
  const streamId = await testWebRTCStreams();
  results.webrtcStreams = streamId !== null;
  
  results.webrtcConfig = await testWebRTCStreamConfig(streamId);
  results.webrtcStatus = await testWebRTCStreamStatus(streamId);
  results.webrtcSystemStatus = await testWebRTCSystemStatus();
  
  // Test direct VAS access
  results.directVAS = await testDirectVASAccess();
  
  // Summary
  console.log('\nTest Results Summary');
  console.log('====================');
  console.log(`Authentication: ${results.authentication ? '✓' : '✗'}`);
  console.log(`WebRTC Streams: ${results.webrtcStreams ? '✓' : '✗'}`);
  console.log(`WebRTC Config: ${results.webrtcConfig ? '✓' : '✗'}`);
  console.log(`WebRTC Status: ${results.webrtcStatus ? '✓' : '✗'}`);
  console.log(`WebRTC System Status: ${results.webrtcSystemStatus ? '✓' : '✗'}`);
  console.log(`Direct VAS Access: ${results.directVAS ? '✓' : '✗'}`);
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\nOverall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Phase 1 integration is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the error messages above.');
  }
}

// Run tests
runTests().catch(console.error);
