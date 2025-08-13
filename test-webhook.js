const axios = require('axios');

// Test webhook endpoint
const WEBHOOK_URL = 'http://localhost:3001/webhook/retell';

// Simulate different Retell AI events
const testEvents = [
  {
    event_type: 'call_started',
    data: {
      call_id: 'test-call-123',
      agent_id: 'canadian-tire-service-agent',
      customer_phone: '+1234567890',
      timestamp: new Date().toISOString()
    }
  },
  {
    event_type: 'transcript',
    data: {
      call_id: 'test-call-123',
      transcript: 'Customer: Hi, I need to book an oil change appointment. Agent: Hello! I\'d be happy to help you book an oil change appointment. What location would you prefer?',
      timestamp: new Date().toISOString()
    }
  },
  {
    event_type: 'call_ended',
    data: {
      call_id: 'test-call-123',
      duration: 180,
      reason: 'completed',
      timestamp: new Date().toISOString()
    }
  }
];

async function testWebhook() {
  console.log('🧪 Testing Retell AI Webhook Integration...\n');
  
  for (let i = 0; i < testEvents.length; i++) {
    const event = testEvents[i];
    console.log(`📞 Testing ${event.event_type} event...`);
    
    try {
      const response = await axios.post(WEBHOOK_URL, event);
      console.log(`✅ ${event.event_type}: Success (${response.status})`);
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
    } catch (error) {
      console.error(`❌ ${event.event_type}: Failed`);
      console.error(`   Error: ${error.message}`);
    }
    console.log('');
  }
  
  console.log('🎯 Webhook testing completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Start your server: npm start');
  console.log('2. In another terminal, run: npx ngrok http 3001');
  console.log('3. Copy the ngrok URL and use it as your webhook in Retell AI');
  console.log('4. Test with real calls from Retell AI');
}

// Run the test
testWebhook().catch(console.error);
