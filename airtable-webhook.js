const express = require('express');
const Airtable = require('airtable');

// Airtable configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = 'Customers';

// Initialize Airtable
const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

// In-memory cache to combine data pieces (temporary until Airtable is set up)
let customerDataCache = new Map(); // callId -> customerData

const app = express();
app.use(express.json());

// Webhook endpoint for Retell AI
app.post('/api/webhook', async (req, res) => {
  try {
    console.log('📞 Webhook received:', JSON.stringify(req.body, null, 2));
    
    const { callId, data, field, value } = req.body;
    
    if (!callId) {
      return res.status(400).json({
        success: false,
        message: 'Missing callId'
      });
    }
    
    // Get or create customer data for this call
    if (!customerDataCache.has(callId)) {
      customerDataCache.set(callId, {
        callId,
        createdAt: new Date().toISOString(),
        status: 'collecting',
        fields: {}
      });
    }
    
    const customerData = customerDataCache.get(callId);
    
    // Update the specific field
    if (field && value !== undefined) {
      customerData.fields[field] = value;
      customerData.lastUpdated = new Date().toISOString();
      
      console.log(`📝 Updated ${field}: ${value} for call ${callId}`);
    }
    
    // Check if we have enough data to create a complete customer record
    const requiredFields = ['name', 'phone', 'serviceType', 'location'];
    const hasRequiredFields = requiredFields.every(field => 
      customerData.fields[field] && customerData.fields[field] !== 'unknown'
    );
    
    if (hasRequiredFields) {
      console.log('✅ Complete customer data collected, creating record...');
      
      try {
        // Create customer record in Airtable
        const record = await createCustomerRecord(customerData);
        
        // Mark as completed
        customerData.status = 'completed';
        customerData.airtableId = record.id;
        
        console.log('✅ Customer record created in Airtable:', record.id);
        
        res.json({
          success: true,
          message: 'Customer record created successfully',
          recordId: record.id,
          status: 'completed'
        });
        
      } catch (error) {
        console.error('❌ Error creating Airtable record:', error);
        
        // Fallback: store in cache with error status
        customerData.status = 'error';
        customerData.error = error.message;
        
        res.status(500).json({
          success: false,
          message: 'Error creating customer record',
          error: error.message,
          status: 'error'
        });
      }
      
    } else {
      // Still collecting data
      const missingFields = requiredFields.filter(field => 
        !customerData.fields[field] || customerData.fields[field] === 'unknown'
      );
      
      console.log(`⏳ Still collecting data. Missing: ${missingFields.join(', ')}`);
      
      res.json({
        success: true,
        message: 'Data received, still collecting',
        status: 'collecting',
        missingFields,
        collectedFields: Object.keys(customerData.fields)
      });
    }
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing webhook',
      error: error.message
    });
  }
});

// Create customer record in Airtable
async function createCustomerRecord(customerData) {
  const fields = customerData.fields;
  
  const recordData = {
    'Name': fields.name || '',
    'Phone': fields.phone || '',
    'Email': fields.email || '',
    'Car Make': fields.carMake || '',
    'Car Model': fields.carModel || '',
    'Car Year': fields.carYear ? parseInt(fields.carYear) : null,
    'Service Type': fields.serviceType || '',
    'Location': fields.location || '',
    'Preferred Date': fields.preferredDate || '',
    'Preferred Time': fields.preferredTime || '',
    'Status': 'Pending',
    'Call ID': customerData.callId,
    'Created At': customerData.createdAt
  };
  
  console.log('📊 Creating Airtable record:', recordData);
  
  const records = await base(AIRTABLE_TABLE_NAME).create([
    { fields: recordData }
  ]);
  
  return records[0];
}

// Get all customers from Airtable
app.get('/api/customers', async (req, res) => {
  try {
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      // Fallback to cache if Airtable not configured
      const customers = Array.from(customerDataCache.values())
        .filter(customer => customer.status === 'completed')
        .map(customer => ({
          id: customer.callId,
          ...customer.fields,
          status: customer.status,
          createdAt: customer.createdAt
        }));
      
      return res.json({
        success: true,
        customers,
        count: customers.length,
        source: 'cache'
      });
    }
    
    const records = await base(AIRTABLE_TABLE_NAME).select().all();
    const customers = records.map(record => ({
      id: record.id,
      ...record.fields
    }));
    
    res.json({
      success: true,
      customers,
      count: customers.length,
      source: 'airtable'
    });
    
  } catch (error) {
    console.error('❌ Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customers',
      error: error.message
    });
  }
});

// Get customer data cache status
app.get('/api/status', (req, res) => {
  const cacheStats = {
    totalCalls: customerDataCache.size,
    completed: Array.from(customerDataCache.values()).filter(c => c.status === 'completed').length,
    collecting: Array.from(customerDataCache.values()).filter(c => c.status === 'collecting').length,
    errors: Array.from(customerDataCache.values()).filter(c => c.status === 'error').length,
    airtableConfigured: !!(AIRTABLE_API_KEY && AIRTABLE_BASE_ID)
  };
  
  res.json({
    success: true,
    cache: cacheStats,
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Canadian Tire Airtable Webhook',
    airtableConfigured: !!(AIRTABLE_API_KEY && AIRTABLE_BASE_ID),
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚗 Canadian Tire Airtable Webhook running on port ${PORT}`);
  console.log(`📞 Webhook: POST http://localhost:${PORT}/api/webhook`);
  console.log(`📊 Customers: GET http://localhost:${PORT}/api/customers`);
  console.log(`📈 Status: GET http://localhost:${PORT}/api/status`);
});

module.exports = app;
