#!/usr/bin/env node

/**
 * Rate Limiter Test Script
 * Tests if API rate limiting is working correctly
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const ENDPOINT = '/api/auth/login'; // Public endpoint, no auth required
const EXPECTED_LIMIT = 100;

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function makeRequest(requestNum) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: ENDPOINT,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      const rateLimitInfo = {
        requestNum,
        status: res.statusCode,
        limit: res.headers['ratelimit-limit'],
        remaining: res.headers['ratelimit-remaining'],
        reset: res.headers['ratelimit-reset'],
      };

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          rateLimitInfo.body = JSON.parse(data);
        } catch (e) {
          rateLimitInfo.body = data;
        }
        resolve(rateLimitInfo);
      });
    });

    req.on('error', (error) => {
      resolve({
        requestNum,
        error: error.message,
      });
    });

    // Send minimal body for POST request (will fail validation, but that's ok for rate limit test)
    req.write(JSON.stringify({ email: 'test@example.com', password: 'test' }));
    req.end();
  });
}

async function testRateLimiter() {
  console.log(`${colors.cyan}===========================================`);
  console.log(`   API Rate Limiter Test`);
  console.log(`===========================================${colors.reset}\n`);

  console.log(`${colors.blue}Testing endpoint: ${BASE_URL}${ENDPOINT}${colors.reset}`);
  console.log(`${colors.blue}Expected limit: ${EXPECTED_LIMIT} requests per 15 minutes${colors.reset}\n`);

  // Test 1: Check rate limit headers
  console.log(`${colors.yellow}Test 1: Checking rate limit headers...${colors.reset}`);
  const firstRequest = await makeRequest(1);

  if (firstRequest.error) {
    console.log(`${colors.red}✗ Error: ${firstRequest.error}${colors.reset}`);
    console.log(`${colors.red}  Make sure the server is running on port 3000${colors.reset}\n`);
    process.exit(1);
  }

  console.log(`${colors.green}✓ Status: ${firstRequest.status}${colors.reset}`);
  console.log(`  RateLimit-Limit: ${firstRequest.limit}`);
  console.log(`  RateLimit-Remaining: ${firstRequest.remaining}`);
  console.log(`  RateLimit-Reset: ${firstRequest.reset} (${new Date(firstRequest.reset * 1000).toLocaleString()})\n`);

  // Test 2: Make multiple requests
  console.log(`${colors.yellow}Test 2: Making ${EXPECTED_LIMIT + 5} requests...${colors.reset}`);
  
  const totalRequests = EXPECTED_LIMIT + 5;
  let successCount = 0;
  let blockedCount = 0;
  let firstBlockedRequest = null;

  for (let i = 2; i <= totalRequests; i++) {
    const result = await makeRequest(i);

    // Accept both 200, 400, and 401 as "successful" for rate limit testing
    // (endpoint might return validation errors, but rate limiter still counts them)
    if (result.status === 200 || result.status === 400 || result.status === 401) {
      successCount++;
      if (i <= 5 || i >= EXPECTED_LIMIT - 2) {
        console.log(`  Request ${i}: ${colors.green}✓ ${result.status}${colors.reset} (Remaining: ${result.remaining})`);
      } else if (i === 6) {
        console.log(`  ${colors.cyan}... (showing only first 5 and last few)${colors.reset}`);
      }
    } else if (result.status === 429) {
      blockedCount++;
      if (!firstBlockedRequest) {
        firstBlockedRequest = i;
      }
      console.log(`  Request ${i}: ${colors.red}✗ 429 Too Many Requests${colors.reset} - BLOCKED`);
    }
  }

  console.log();

  // Test 3: Summary
  console.log(`${colors.cyan}===========================================`);
  console.log(`   Test Results`);
  console.log(`===========================================${colors.reset}\n`);

  console.log(`Total requests made: ${totalRequests}`);
  console.log(`${colors.green}Successful (200): ${successCount}${colors.reset}`);
  console.log(`${colors.red}Blocked (429): ${blockedCount}${colors.reset}`);

  if (firstBlockedRequest) {
    console.log(`First blocked at request: ${firstBlockedRequest}\n`);
  }

  // Validation
  const expectedSuccess = EXPECTED_LIMIT;
  const expectedBlocked = totalRequests - EXPECTED_LIMIT;

  if (successCount === expectedSuccess && blockedCount === expectedBlocked) {
    console.log(`${colors.green}✓ PASSED: Rate limiter is working correctly!${colors.reset}`);
    console.log(`  - Allowed exactly ${EXPECTED_LIMIT} requests`);
    console.log(`  - Blocked requests after limit was reached`);
  } else {
    console.log(`${colors.red}✗ FAILED: Rate limiter not working as expected${colors.reset}`);
    console.log(`  Expected ${expectedSuccess} successful, got ${successCount}`);
    console.log(`  Expected ${expectedBlocked} blocked, got ${blockedCount}`);
  }

  console.log(`\n${colors.cyan}Note: Wait 15 minutes for rate limit to reset${colors.reset}\n`);
}

// Run the test
testRateLimiter().catch(console.error);
