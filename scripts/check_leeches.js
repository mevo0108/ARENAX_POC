#!/usr/bin/env node

/**
 * ARENAX Lichess Integration Test Script
 *
 * This script tests the Lichess OAuth integration endpoints.
 * Note: Lichess API now uses OAuth instead of API keys.
 * This script tests that the ARENAX API endpoints are properly configured.
 */

import 'dotenv/config';
import axios from 'axios';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

console.log('🧪 ARENAX Lichess Integration Test');
console.log('=====================================');
console.log(`Testing API at: ${BASE_URL}`);
console.log('');

async function testEndpoint(name, url, method = 'GET', options = {}) {
  try {
    console.log(`Testing ${name}...`);
    const response = await axios({
      method,
      url,
      timeout: 5000,
      ...options
    });

    console.log(`✅ ${name}: ${response.status} ${response.statusText}`);
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    if (error.response) {
      console.log(`❌ ${name}: ${error.response.status} ${error.response.statusText}`);
      return { success: false, status: error.response.status, error: error.response.data };
    } else {
      console.log(`❌ ${name}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

async function main() {
  // Test basic API endpoints
  const results = [];

  // Health check
  results.push(await testEndpoint('Health Check', `${BASE_URL}/health`));

  // Auth endpoints (should return 400/401 without proper data)
  results.push(await testEndpoint('Auth Register (missing data)', `${BASE_URL}/api/auth/register`, 'POST'));

  // Lichess OAuth endpoints
  results.push(await testEndpoint('Lichess Login (no auth)', `${BASE_URL}/api/auth/lichess/login`));

  console.log('');
  console.log('📊 Test Results Summary:');
  console.log('========================');

  const successful = results.filter(r => r.success).length;
  const total = results.length;

  console.log(`✅ Successful: ${successful}/${total}`);
  console.log(`❌ Failed: ${total - successful}/${total}`);

  if (successful === total) {
    console.log('');
    console.log('🎉 All basic API endpoints are responding!');
    console.log('');
    console.log('Next steps for full testing:');
    console.log('1. Register a user account');
    console.log('2. Set up Lichess OAuth credentials');
    console.log('3. Test tournament creation flow');
  } else {
    console.log('');
    console.log('⚠️  Some tests failed. Check the API logs for details.');
  }
}

main().catch(console.error);
