const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Simple data storage - this will work on Vercel
let customerData = [];
let sessionCounter = 0;

// API Routes
app.get('/api/call/sessions', (req, res) => {
  try {
    // Convert our simple data to the expected format
    const sessions = customerData.map((data, index) => ({
      callId: `customer-${data.timestamp}`,
      customerPhone: data.phone || 'unknown',
      sessionId: uuidv4(),
      startTime: new Date(data.timestamp).toISOString(),
      lastActivity: new Date(data.timestamp).toISOString(),
      status: 'active',
      customerInfo: {
        name: data.name || null,
        phone: data.phone || null,
        email: data.email || null,
        carMake: data.carMake || null,
        carModel: data.carModel || null,
        carYear: data.carYear || null,
        serviceType: data.serviceType || null,
        triangleMember: data.triangleMember || null,
        location: data.location || null,
        preferredDate: data.preferredDate || null,
        preferredTime: data.preferredTime || null
      },
      appointmentBooked: false
    }));

    res.json({
      success: true,
      sessions: sessions,
      count: sessions.length,
      message: sessions.length > 0 ? 'Sessions retrieved successfully' : 'No sessions found'
    });
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Store customer data endpoint - SIMPLE AND WORKING
app.post('/api/store-customer-data', (req, res) => {
  try {
    console.log('🔧 Storing customer data:', JSON.stringify(req.body, null, 2));
    
    // Create a simple data object
    const customerRecord = {
      id: ++sessionCounter,
      timestamp: Date.now(),
      name: req.body.name || null,
      phone: req.body.phone || null,
      email: req.body.email || null,
      carMake: req.body.carMake || null,
      carModel: req.body.carModel || null,
      carYear: req.body.carYear || null,
      serviceType: req.body.serviceType || null,
      triangleMember: req.body.triangleMember || null,
      location: req.body.location || null,
      preferredDate: req.body.preferredDate || null,
      preferredTime: req.body.preferredTime || null
    };
    
    // Store the data directly
    customerData.push(customerRecord);
    
    console.log('✅ Customer data stored successfully:', customerRecord.id);
    console.log('📝 Data stored:', JSON.stringify(customerRecord, null, 2));
    console.log('📊 Total records:', customerData.length);
    
    res.json({ 
      success: true, 
      message: 'Customer data stored successfully',
      sessionId: customerRecord.id,
      data: customerRecord
    });
  } catch (error) {
    console.error('❌ Error storing customer data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint
app.post('/api/test/create-session', (req, res) => {
  try {
    const { name, phone, serviceType, location } = req.body;
    
    const customerRecord = {
      id: ++sessionCounter,
      timestamp: Date.now(),
      name: name || 'Test User',
      phone: phone || '555-1234',
      serviceType: serviceType || 'test_service',
      location: location || 'Test Location'
    };
    
    customerData.push(customerRecord);
    
    res.json({ 
      success: true, 
      message: 'Test session created',
      sessionId: customerRecord.id,
      data: customerRecord
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Canadian Tire AI Agent - WORKING VERSION',
    timestamp: new Date().toISOString(),
    sessionsCount: customerData.length,
    message: 'Simple data storage - reliable on Vercel'
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚗 Canadian Tire AI Agent (WORKING VERSION) running on port ${port}`);
  console.log(`📊 API endpoints available at http://localhost:${port}/api/`);
  console.log(`🔗 Store customer data: POST http://localhost:${port}/api/store-customer-data`);
  console.log(`💾 Simple data storage: ${customerData.length} records`);
});

module.exports = app;
