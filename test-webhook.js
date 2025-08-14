// Test script for Canadian Tire webhook
const fetch = require('node-fetch');

const WEBHOOK_URL = 'https://canadian-tire-ai-agent.vercel.app/api/webhook';

// Test data - simulating Retell AI sending customer information piece by piece
const testData = [
  {
    callId: 'test-call-001',
    field: 'name',
    value: 'John Smith'
  },
  {
    callId: 'test-call-001',
    field: 'phone',
    value: '555-123-4567'
  },
  {
    callId: 'test-call-001',
    field: 'email',
    value: 'john.smith@email.com'
  },
  {
    callId: 'test-call-001',
    field: 'carMake',
    value: 'Toyota'
  },
  {
    callId: 'test-call-001',
    field: 'carModel',
    value: 'Camry'
  },
  {
    callId: 'test-call-001',
    field: 'carYear',
    value: '2020'
  },
  {
    callId: 'test-call-001',
    field: 'serviceType',
    value: 'Oil Change'
  },
  {
    callId: 'test-call-001',
    field: 'location',
    value: 'Downtown Toronto'
  },
  {
    callId: 'test-call-001',
    field: 'preferredDate',
    value: '2024-01-15'
  },
  {
    callId: 'test-call-001',
    field: 'preferredTime',
    value: '10:00 AM'
  }
];

async function testWebhook() {
  console.log('🧪 Testing Canadian Tire webhook...\n');
  
  for (let i = 0; i < testData.length; i++) {
    const data = testData[i];
    
    try {
      console.log(`📝 Sending: ${data.field} = ${data.value}`);
      
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ Response: ${result.message}`);
        if (result.status === 'completed') {
          console.log(`🎉 Customer record created! ID: ${result.recordId}`);
        } else if (result.status === 'collecting') {
          console.log(`⏳ Still collecting data. Missing: ${result.missingFields.join(', ')}`);
        }
      } else {
        console.log(`❌ Error: ${result.message}`);
      }
      
    } catch (error) {
      console.log(`❌ Failed to send ${data.field}: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
    
    // Wait 1 second between requests
    if (i < testData.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('🧪 Test completed! Check your dashboard and Airtable base.');
}

// Run the test
testWebhook().catch(console.error);
