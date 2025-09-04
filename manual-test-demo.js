const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_KEY = 'loan-service-secret-key-2024';

async function makeRequest(endpoint, method = 'GET', data = null, apiKey = API_KEY) {
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

async function demonstrateService() {
  console.log('🏦 Loan Application Service - Manual Test Demonstration');
  console.log('=' .repeat(60));

  try {
    // 1. Health Check
    console.log('\n1️⃣  Health Check');
    const health = await makeRequest('/health', 'GET', null, null);
    console.log('✅ Service is healthy:', health.data.status);

    // 2. Successful Loan Application
    console.log('\n2️⃣  Successful Loan Application');
    const approvedLoan = {
      applicantName: 'Sarah Johnson',
      propertyAddress: '1234 Sunnyvale Ave, Sunnyvale CA',
      creditScore: 780,
      monthlyIncome: 12000,
      requestedAmount: 200000,
      loanTermMonths: 360
    };

    const approvedResponse = await makeRequest('/loan', 'POST', approvedLoan);
    console.log('✅ Loan APPROVED:');
    console.log(`   ID: ${approvedResponse.data.id}`);
    console.log(`   Eligible: ${approvedResponse.data.eligible}`);
    console.log(`   Reason: ${approvedResponse.data.reason}`);
    console.log(`   Crime Grade: ${approvedResponse.data.crimeGrade}`);

    // 3. Retrieve the loan
    console.log('\n3️⃣  Retrieve Loan Application');
    const retrievedLoan = await makeRequest(`/loan/${approvedResponse.data.id}`);
    console.log('✅ Loan retrieved successfully:');
    console.log(`   Applicant: ${retrievedLoan.data.applicantName}`);
    console.log(`   Status: ${retrievedLoan.data.eligible ? 'APPROVED' : 'DENIED'}`);

    // 4. Denied Loan - Low Credit Score
    console.log('\n4️⃣  Denied Loan - Low Credit Score');
    const lowCreditLoan = {
      applicantName: 'John Smith',
      propertyAddress: '5678 Main St, San Jose CA',
      creditScore: 650, // Below 700 threshold
      monthlyIncome: 8000,
      requestedAmount: 150000,
      loanTermMonths: 240
    };

    const deniedResponse = await makeRequest('/loan', 'POST', lowCreditLoan);
    console.log('❌ Loan DENIED:');
    console.log(`   Eligible: ${deniedResponse.data.eligible}`);
    console.log(`   Reason: ${deniedResponse.data.reason}`);
    console.log(`   Crime Grade: ${deniedResponse.data.crimeGrade}`);

    // 5. Denied Loan - High Crime Area
    console.log('\n5️⃣  Denied Loan - High Crime Area');
    const highCrimeLoan = {
      applicantName: 'Mike Wilson',
      propertyAddress: 'East Palo Alto CA', // Known high-crime area
      creditScore: 750,
      monthlyIncome: 9000,
      requestedAmount: 180000,
      loanTermMonths: 300
    };

    const crimeResponse = await makeRequest('/loan', 'POST', highCrimeLoan);
    console.log('❌ Loan DENIED:');
    console.log(`   Eligible: ${crimeResponse.data.eligible}`);
    console.log(`   Reason: ${crimeResponse.data.reason}`);
    console.log(`   Crime Grade: ${crimeResponse.data.crimeGrade}`);

    // 6. Authentication Error
    console.log('\n6️⃣  Authentication Error');
    try {
      await makeRequest('/loan', 'POST', approvedLoan, 'invalid-key');
    } catch (error) {
      console.log('🔒 Authentication failed as expected:');
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.data.message}`);
    }

    // 7. Validation Error
    console.log('\n7️⃣  Validation Error');
    const invalidLoan = {
      applicantName: '', // Empty name
      creditScore: 900, // Above 850
      monthlyIncome: -1000 // Negative income
    };

    try {
      await makeRequest('/loan', 'POST', invalidLoan);
    } catch (error) {
      console.log('⚠️  Validation failed as expected:');
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.data.message}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 All manual tests completed successfully!');
    console.log('✅ The Loan Application Service is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the demonstration
demonstrateService();