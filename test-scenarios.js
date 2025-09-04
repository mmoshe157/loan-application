const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_KEY = 'loan-service-secret-key-2024';

// Test scenarios based on requirements
const testScenarios = [
  {
    name: 'REQ-001: Valid Loan Application - Should be Approved',
    description: 'Test with valid data that meets all eligibility criteria',
    data: {
      applicantName: 'John Doe',
      propertyAddress: '558 Carlisle Way Sunnyvale CA 94087',
      creditScore: 750,
      monthlyIncome: 10000,
      requestedAmount: 150000,
      loanTermMonths: 24
    },
    expectedEligible: true,
    expectedReason: 'Passed all checks'
  },
  {
    name: 'REQ-005: Credit Score Too Low - Should be Denied',
    description: 'Test with credit score below 700',
    data: {
      applicantName: 'Jane Smith',
      propertyAddress: '123 Main St',
      creditScore: 650,
      monthlyIncome: 8000,
      requestedAmount: 200000,
      loanTermMonths: 360
    },
    expectedEligible: false,
    expectedReason: 'Credit score must be at least 700'
  },
  {
    name: 'REQ-005: Insufficient Income - Should be Denied',
    description: 'Test with insufficient monthly income',
    data: {
      applicantName: 'Bob Johnson',
      propertyAddress: '456 Oak Street',
      creditScore: 750,
      monthlyIncome: 2000,
      requestedAmount: 200000,
      loanTermMonths: 120
    },
    expectedEligible: false,
    expectedReason: 'Insufficient monthly income for requested loan amount'
  },
  {
    name: 'REQ-007: Crime Grade F - Should be Denied',
    description: 'Test with property in high crime area (Grade F)',
    data: {
      applicantName: 'Alice Brown',
      propertyAddress: 'East Palo Alto CA',
      creditScore: 750,
      monthlyIncome: 8000,
      requestedAmount: 100000,
      loanTermMonths: 240
    },
    expectedEligible: false,
    expectedReason: 'Property location has unacceptable crime grade (F)'
  },
  {
    name: 'REQ-013: Invalid Data - Missing Fields',
    description: 'Test validation with missing required fields',
    data: {
      applicantName: '',
      creditScore: 'invalid',
      monthlyIncome: -1000
    },
    expectedStatus: 400,
    expectValidationError: true
  },
  {
    name: 'REQ-013: Invalid Data - Out of Range Values',
    description: 'Test validation with out of range values',
    data: {
      applicantName: 'Test User',
      propertyAddress: '123 Test St',
      creditScore: 900, // Above 850
      monthlyIncome: 5000,
      requestedAmount: 100000,
      loanTermMonths: 500 // Above 480
    },
    expectedStatus: 400,
    expectValidationError: true
  }
];

// Authentication test scenarios
const authTestScenarios = [
  {
    name: 'REQ-011: No API Key - Should Return 401',
    description: 'Test request without API key',
    useApiKey: false,
    expectedStatus: 401
  },
  {
    name: 'REQ-011: Invalid API Key - Should Return 401',
    description: 'Test request with invalid API key',
    useApiKey: 'invalid-key',
    expectedStatus: 401
  },
  {
    name: 'REQ-011: Valid API Key - Should Process Request',
    description: 'Test request with valid API key',
    useApiKey: API_KEY,
    expectedStatus: 201
  }
];

// Utility functions
function makeRequest(endpoint, method = 'GET', data = null, apiKey = API_KEY) {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {}
  };

  if (apiKey) {
    config.headers['x-api-key'] = apiKey;
  }

  if (data) {
    config.headers['Content-Type'] = 'application/json';
    config.data = data;
  }

  return axios(config);
}

async function testHealthEndpoint() {
  console.log('\n🏥 Testing Health Endpoint (REQ-019)...');
  try {
    const response = await makeRequest('/health', 'GET', null, null); // No auth required
    console.log('✅ Health check passed:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return false;
  }
}

async function testLoanApplicationScenarios() {
  console.log('\n💰 Testing Loan Application Scenarios...');
  let passedTests = 0;
  let totalTests = testScenarios.length;

  for (const scenario of testScenarios) {
    console.log(`\n📋 ${scenario.name}`);
    console.log(`   ${scenario.description}`);

    try {
      const response = await makeRequest('/loan', 'POST', scenario.data);
      
      if (scenario.expectedStatus && response.status !== scenario.expectedStatus) {
        console.log(`❌ Expected status ${scenario.expectedStatus}, got ${response.status}`);
        continue;
      }

      if (scenario.expectValidationError) {
        console.log(`❌ Expected validation error but request succeeded`);
        continue;
      }

      const result = response.data;
      
      // Check eligibility
      if (scenario.expectedEligible !== undefined) {
        if (result.eligible === scenario.expectedEligible) {
          console.log(`✅ Eligibility correct: ${result.eligible}`);
        } else {
          console.log(`❌ Expected eligible: ${scenario.expectedEligible}, got: ${result.eligible}`);
          continue;
        }
      }

      // Check reason
      if (scenario.expectedReason) {
        if (result.reason.includes(scenario.expectedReason)) {
          console.log(`✅ Reason correct: ${result.reason}`);
        } else {
          console.log(`❌ Expected reason to contain: ${scenario.expectedReason}`);
          console.log(`   Got: ${result.reason}`);
          continue;
        }
      }

      // Check required fields
      const requiredFields = ['id', 'applicantName', 'propertyAddress', 'creditScore', 
                             'monthlyIncome', 'requestedAmount', 'loanTermMonths', 
                             'eligible', 'reason', 'crimeGrade', 'createdAt', 'updatedAt'];
      
      const missingFields = requiredFields.filter(field => !(field in result));
      if (missingFields.length > 0) {
        console.log(`❌ Missing fields: ${missingFields.join(', ')}`);
        continue;
      }

      console.log(`✅ All checks passed - Crime Grade: ${result.crimeGrade}`);
      passedTests++;

    } catch (error) {
      if (scenario.expectedStatus && error.response?.status === scenario.expectedStatus) {
        console.log(`✅ Expected error status ${scenario.expectedStatus}: ${error.response.data.message}`);
        passedTests++;
      } else {
        console.log(`❌ Unexpected error:`, error.response?.data || error.message);
      }
    }
  }

  console.log(`\n📊 Loan Application Tests: ${passedTests}/${totalTests} passed`);
  return passedTests === totalTests;
}

async function testAuthenticationScenarios() {
  console.log('\n🔐 Testing Authentication Scenarios...');
  let passedTests = 0;
  let totalTests = authTestScenarios.length;

  const validLoanData = {
    applicantName: 'Test User',
    propertyAddress: '123 Test St',
    creditScore: 750,
    monthlyIncome: 8000,
    requestedAmount: 100000,
    loanTermMonths: 240
  };

  for (const scenario of authTestScenarios) {
    console.log(`\n🔑 ${scenario.name}`);
    console.log(`   ${scenario.description}`);

    try {
      const apiKey = scenario.useApiKey === false ? null : scenario.useApiKey;
      const response = await makeRequest('/loan', 'POST', validLoanData, apiKey);
      
      if (response.status === scenario.expectedStatus) {
        console.log(`✅ Expected status ${scenario.expectedStatus} received`);
        passedTests++;
      } else {
        console.log(`❌ Expected status ${scenario.expectedStatus}, got ${response.status}`);
      }

    } catch (error) {
      if (error.response?.status === scenario.expectedStatus) {
        console.log(`✅ Expected error status ${scenario.expectedStatus}: ${error.response.data.message}`);
        passedTests++;
      } else {
        console.log(`❌ Unexpected error:`, error.response?.data || error.message);
      }
    }
  }

  console.log(`\n📊 Authentication Tests: ${passedTests}/${totalTests} passed`);
  return passedTests === totalTests;
}

async function testLoanRetrieval() {
  console.log('\n📄 Testing Loan Retrieval (REQ-004)...');
  
  // First create a loan
  const loanData = {
    applicantName: 'Retrieval Test User',
    propertyAddress: '789 Retrieval St',
    creditScore: 750,
    monthlyIncome: 8000,
    requestedAmount: 100000,
    loanTermMonths: 240
  };

  try {
    console.log('Creating loan for retrieval test...');
    const createResponse = await makeRequest('/loan', 'POST', loanData);
    const loanId = createResponse.data.id;
    console.log(`✅ Loan created with ID: ${loanId}`);

    // Test retrieval
    console.log('Testing loan retrieval...');
    const getResponse = await makeRequest(`/loan/${loanId}`, 'GET');
    const retrievedLoan = getResponse.data;

    // Verify data matches
    if (retrievedLoan.id === loanId && 
        retrievedLoan.applicantName === loanData.applicantName &&
        retrievedLoan.propertyAddress === loanData.propertyAddress) {
      console.log('✅ Loan retrieval successful - data matches');
    } else {
      console.log('❌ Retrieved loan data does not match');
      return false;
    }

    // Test 404 for non-existent loan
    console.log('Testing 404 for non-existent loan...');
    try {
      await makeRequest('/loan/non-existent-id', 'GET');
      console.log('❌ Expected 404 but request succeeded');
      return false;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ 404 correctly returned for non-existent loan');
        return true;
      } else {
        console.log(`❌ Expected 404, got ${error.response?.status}`);
        return false;
      }
    }

  } catch (error) {
    console.log('❌ Loan retrieval test failed:', error.response?.data || error.message);
    return false;
  }
}

async function testErrorHandling() {
  console.log('\n⚠️  Testing Error Handling...');
  
  // Test malformed JSON
  console.log('Testing malformed JSON handling...');
  try {
    const response = await axios({
      method: 'POST',
      url: `${BASE_URL}/loan`,
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      data: '{ invalid json }'
    });
    console.log('❌ Expected error for malformed JSON but request succeeded');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Malformed JSON correctly returns 400');
    } else {
      console.log(`❌ Expected 400 for malformed JSON, got ${error.response?.status}`);
      return false;
    }
  }

  return true;
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Loan Application Service Tests');
  console.log('=' .repeat(60));

  const results = {
    health: await testHealthEndpoint(),
    loanApplications: await testLoanApplicationScenarios(),
    authentication: await testAuthenticationScenarios(),
    loanRetrieval: await testLoanRetrieval(),
    errorHandling: await testErrorHandling()
  };

  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL TEST RESULTS');
  console.log('=' .repeat(60));

  let totalPassed = 0;
  let totalTests = 0;

  Object.entries(results).forEach(([category, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${category.toUpperCase().padEnd(20)} ${status}`);
    if (passed) totalPassed++;
    totalTests++;
  });

  console.log('=' .repeat(60));
  console.log(`OVERALL RESULT: ${totalPassed}/${totalTests} test categories passed`);
  
  if (totalPassed === totalTests) {
    console.log('🎉 ALL TESTS PASSED - Service is working correctly!');
    return true;
  } else {
    console.log('⚠️  Some tests failed - please review the issues above');
    return false;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests, testScenarios, authTestScenarios };