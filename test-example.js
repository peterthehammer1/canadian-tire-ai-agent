const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_LOCATION = 'Toronto Downtown';
const TEST_DATE = '2024-01-15';

// Test data
const testAppointment = {
  location: TEST_LOCATION,
  fullName: 'John Doe',
  phoneNumber: '416-555-0123',
  email: 'john.doe@email.com',
  carMake: 'Toyota',
  carModel: 'Camry',
  carYear: '2020',
  serviceType: 'oil_change',
  loyaltyMember: true,
  date: TEST_DATE,
  time: '10:00'
};

// Test functions
async function testHealthCheck() {
  try {
    console.log('🔍 Testing health check...');
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testServiceTypes() {
  try {
    console.log('\n🔍 Testing service types...');
    const response = await axios.get(`${BASE_URL}/api/service-types`);
    console.log('✅ Service types retrieved:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Service types test failed:', error.message);
    return false;
  }
}

async function testBusinessHours() {
  try {
    console.log('\n🔍 Testing business hours...');
    const response = await axios.get(`${BASE_URL}/api/business-hours`);
    console.log('✅ Business hours retrieved:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Business hours test failed:', error.message);
    return false;
  }
}

async function testCheckAvailability() {
  try {
    console.log('\n🔍 Testing availability check...');
    const response = await axios.post(`${BASE_URL}/api/check-availability`, {
      date: TEST_DATE,
      location: TEST_LOCATION,
      serviceType: 'oil_change'
    });
    console.log('✅ Availability check passed:', response.data);
    return response.data.availableSlots;
  } catch (error) {
    console.error('❌ Availability check failed:', error.message);
    return null;
  }
}

async function testBookAppointment() {
  try {
    console.log('\n🔍 Testing appointment booking...');
    const response = await axios.post(`${BASE_URL}/api/book-appointment`, testAppointment);
    console.log('✅ Appointment booked successfully:', response.data);
    return response.data.appointment;
  } catch (error) {
    console.error('❌ Appointment booking failed:', error.message);
    return null;
  }
}

async function testGetAppointments() {
  try {
    console.log('\n🔍 Testing get appointments...');
    const response = await axios.get(`${BASE_URL}/api/appointments`, {
      params: { location: TEST_LOCATION, date: TEST_DATE }
    });
    console.log('✅ Appointments retrieved:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Get appointments failed:', error.message);
    return null;
  }
}

async function testStatistics() {
  try {
    console.log('\n🔍 Testing statistics...');
    const response = await axios.get(`${BASE_URL}/api/statistics`, {
      params: { date: TEST_DATE, location: TEST_LOCATION }
    });
    console.log('✅ Statistics retrieved:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Statistics test failed:', error.message);
    return null;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚗 Starting Canadian Tire AI Agent Tests...\n');
  
  // Check if server is running
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('\n❌ Server is not running. Please start the server first with: npm start');
    return;
  }
  
  // Run all tests
  await testServiceTypes();
  await testBusinessHours();
  const availableSlots = await testCheckAvailability();
  
  if (availableSlots && availableSlots.length > 0) {
    // Update test appointment with first available slot
    testAppointment.time = availableSlots[0].start;
    
    await testBookAppointment();
    await testGetAppointments();
    await testStatistics();
  }
  
  console.log('\n🎉 All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testHealthCheck,
  testServiceTypes,
  testBusinessHours,
  testCheckAvailability,
  testBookAppointment,
  testGetAppointments,
  testStatistics,
  runAllTests
};
