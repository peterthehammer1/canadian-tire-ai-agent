const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Simple in-memory storage
const sessions = new Map();

// Simple CallSessionManager
class SimpleCallSessionManager {
  constructor() {
    this.sessions = new Map();
  }

  createSession(callId, customerPhone) {
    const session = {
      callId,
      customerPhone,
      sessionId: uuidv4(),
      startTime: new Date(),
      lastActivity: new Date(),
      status: 'active',
      customerInfo: {
        name: null,
        phone: customerPhone,
        email: null,
        carMake: null,
        carModel: null,
        carYear: null,
        serviceType: null,
        triangleMember: null,
        location: null,
        preferredDate: null,
        preferredTime: null
      },
      appointmentBooked: false
    };

    this.sessions.set(callId, session);
    console.log(`📞 New call session created: ${callId}`);
    return session;
  }

  getAllSessions() {
    return Array.from(this.sessions.values());
  }

  getSession(callId) {
    return this.sessions.get(callId);
  }
}

const callSessionManager = new SimpleCallSessionManager();

// API Routes
app.get('/api/call/sessions', (req, res) => {
  try {
    const allSessions = callSessionManager.getAllSessions();
    res.json({
      success: true,
      sessions: allSessions,
      count: allSessions.length,
      message: allSessions.length > 0 ? 'Sessions retrieved successfully' : 'No sessions found'
    });
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Store customer data endpoint
app.post('/api/store-customer-data', (req, res) => {
  try {
    console.log('🔧 Storing customer data:', JSON.stringify(req.body, null, 2));
    
    // Create a new session
    const callId = 'customer-' + Date.now();
    const session = callSessionManager.createSession(callId, req.body.phone || 'unknown');
    
    // Store all the data directly in the session object
    if (req.body.name) session.customerInfo.name = req.body.name;
    if (req.body.phone) session.customerInfo.phone = req.body.phone;
    if (req.body.email) session.customerInfo.email = req.body.email;
    if (req.body.carMake) session.customerInfo.carMake = req.body.carMake;
    if (req.body.carModel) session.customerInfo.carModel = req.body.carModel;
    if (req.body.carYear) session.customerInfo.carYear = req.body.carYear;
    if (req.body.serviceType) session.customerInfo.serviceType = req.body.serviceType;
    if (req.body.triangleMember !== undefined) session.customerInfo.triangleMember = req.body.triangleMember;
    if (req.body.location) session.customerInfo.location = req.body.location;
    if (req.body.preferredDate) session.customerInfo.preferredDate = req.body.preferredDate;
    if (req.body.preferredTime) session.customerInfo.preferredTime = req.body.preferredTime;
    
    console.log('✅ Customer data stored successfully:', callId);
    console.log('📝 Session data:', JSON.stringify(session, null, 2));
    
    res.json({ 
      success: true, 
      message: 'Customer data stored successfully',
      sessionId: callId
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
    const callId = 'test-' + Date.now();
    const session = callSessionManager.createSession(callId, phone || '555-1234');
    
    if (name) session.customerInfo.name = name;
    if (serviceType) session.customerInfo.serviceType = serviceType;
    if (location) session.customerInfo.location = location;
    
    res.json({ 
      success: true, 
      message: 'Test session created',
      sessionId: callId,
      session: session
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Canadian Tire AI Agent - Simple Version',
    timestamp: new Date().toISOString(),
    sessionsCount: callSessionManager.getAllSessions().length
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚗 Canadian Tire AI Agent (Simple) running on port ${port}`);
  console.log(`📊 API endpoints available at http://localhost:${port}/api/`);
  console.log(`🔗 Store customer data: POST http://localhost:${port}/api/store-customer-data`);
});

module.exports = app;
