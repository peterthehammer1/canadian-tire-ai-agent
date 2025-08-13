const axios = require('axios');

// Test the complete call flow for appointment booking
const BASE_URL = 'http://localhost:3001';
const TEST_CALL_ID = 'test-call-' + Date.now();
const TEST_PHONE = '+1234567890';

// Simulate a complete customer call flow
async function testCompleteCallFlow() {
  console.log('🚗 Testing Complete Canadian Tire AI Call Flow...\n');
  
  try {
    // Step 1: Start the call
    console.log('📞 Step 1: Starting call session...');
    const startResponse = await axios.post(`${BASE_URL}/api/call/start`, {
      callId: TEST_CALL_ID,
      customerPhone: TEST_PHONE
    });
    console.log('✅ Call started:', startResponse.data.message);
    console.log('   Session ID:', startResponse.data.session.callId);
    console.log('   State:', startResponse.data.session.conversationState);
    
    // Step 2: Update customer information (simulating conversation)
    console.log('\n📝 Step 2: Collecting customer information...');
    const customerUpdates = [
      { location: 'Toronto Downtown' },
      { fullName: 'John Smith' },
      { email: 'john.smith@email.com' },
      { carMake: 'Toyota' },
      { carModel: 'Camry' },
      { carYear: '2020' },
      { serviceType: 'oil_change' },
      { loyaltyMember: true }
    ];
    
    for (const update of customerUpdates) {
      const updateResponse = await axios.post(`${BASE_URL}/api/call/update-info`, {
        callId: TEST_CALL_ID,
        updates: update
      });
      console.log(`   ✅ Updated: ${Object.keys(update)[0]} = ${Object.values(update)[0]}`);
    }
    
    // Step 3: Check availability
    console.log('\n🔍 Step 3: Checking appointment availability...');
    const availabilityResponse = await axios.post(`${BASE_URL}/api/call/check-availability`, {
      callId: TEST_CALL_ID,
      date: '2024-01-15',
      location: 'Toronto Downtown',
      serviceType: 'oil_change'
    });
    
    const availableSlots = availabilityResponse.data.availableSlots;
    console.log(`✅ Found ${availableSlots.length} available slots:`);
    availableSlots.forEach(slot => {
      console.log(`   - ${slot.displayTime} (${slot.time})`);
    });
    
    // Step 4: Select a time slot
    console.log('\n⏰ Step 4: Selecting time slot...');
    const selectedTime = availableSlots[0].time;
    const selectResponse = await axios.post(`${BASE_URL}/api/call/select-time`, {
      callId: TEST_CALL_ID,
      time: selectedTime
    });
    
    console.log(`✅ Selected time: ${selectedTime}`);
    console.log('   State:', selectResponse.data.session.conversationState);
    
    // Step 5: Book the appointment
    console.log('\n📅 Step 5: Booking the appointment...');
    const bookingResponse = await axios.post(`${BASE_URL}/api/call/book-appointment`, {
      callId: TEST_CALL_ID
    });
    
    console.log('✅ Appointment booked successfully!');
    console.log('   Confirmation Number:', bookingResponse.data.booking.confirmationNumber);
    console.log('   Final State:', bookingResponse.data.session.conversationState);
    
    // Step 6: Get final session state
    console.log('\n📊 Step 6: Final session summary...');
    const stateResponse = await axios.get(`${BASE_URL}/api/call/state/${TEST_CALL_ID}`);
    
    console.log('📋 Final Session Details:');
    console.log('   Customer:', stateResponse.data.session.customerInfo.fullName);
    console.log('   Service:', stateResponse.data.session.customerInfo.serviceType);
    console.log('   Date:', stateResponse.data.session.customerInfo.preferredDate);
    console.log('   Time:', stateResponse.data.session.customerInfo.preferredTime);
    console.log('   Location:', stateResponse.data.session.customerInfo.location);
    
    // Step 7: End the call
    console.log('\n📞 Step 7: Ending the call...');
    const endResponse = await axios.post(`${BASE_URL}/api/call/end`, {
      callId: TEST_CALL_ID
    });
    
    console.log('✅ Call ended:', endResponse.data.message);
    
    console.log('\n🎉 Complete call flow test successful!');
    console.log('\n📋 What this demonstrates:');
    console.log('   ✅ Real-time call session management');
    console.log('   ✅ Progressive customer information collection');
    console.log('   ✅ Live availability checking');
    console.log('   ✅ Time slot selection');
    console.log('   ✅ Appointment booking during calls');
    console.log('   ✅ Complete conversation flow tracking');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.error || error.message);
  }
}

// Test individual API endpoints
async function testIndividualEndpoints() {
  console.log('\n🧪 Testing Individual API Endpoints...\n');
  
  try {
    // Test health check
    console.log('🔍 Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed');
    console.log('   Active sessions:', healthResponse.data.activeCallSessions);
    
    // Test service types
    console.log('\n🔍 Testing service types...');
    const serviceResponse = await axios.get(`${BASE_URL}/api/service-types`);
    console.log('✅ Service types retrieved:', Object.keys(serviceResponse.data));
    
    // Test business hours
    console.log('\n🔍 Testing business hours...');
    const hoursResponse = await axios.get(`${BASE_URL}/api/business-hours`);
    console.log('✅ Business hours retrieved:', hoursResponse.data);
    
    // Test active sessions
    console.log('\n🔍 Testing active sessions...');
    const sessionsResponse = await axios.get(`${BASE_URL}/api/call/sessions`);
    console.log('✅ Active sessions retrieved:', sessionsResponse.data.count);
    
  } catch (error) {
    console.error('❌ Individual endpoint test failed:', error.response?.data?.error || error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚗 Canadian Tire AI Agent - Call Flow Testing\n');
  
  // Check if server is running
  try {
    await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running and ready for testing\n');
  } catch (error) {
    console.log('❌ Server is not running. Please start the server first with: npm start');
    return;
  }
  
  // Run tests
  await testIndividualEndpoints();
  await testCompleteCallFlow();
  
  console.log('\n🎯 All tests completed!');
  console.log('\n💡 Next steps:');
  console.log('   1. Configure your AI service webhook to: http://localhost:3001/webhook/ai');
  console.log('   2. Test with real voice calls');
  console.log('   3. Monitor call sessions in real-time');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testCompleteCallFlow,
  testIndividualEndpoints,
  runAllTests
};
