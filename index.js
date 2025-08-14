const express = require('express');
const AppointmentManager = require('./appointment-manager');
const CallSessionManager = require('./call-session-manager');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize managers
const appointmentManager = new AppointmentManager();
const callSessionManager = new CallSessionManager();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Root route - serve the demo interface
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Dashboard route - view all extracted data
app.get('/dashboard', (req, res) => {
  res.sendFile(__dirname + '/public/dashboard.html');
});

// Initialize the AI agent
async function initializeAgent() {
  try {
    const agentConfig = require('./agent-config.json');
    
    console.log('🤖 Canadian Tire AI Agent initialized');
    console.log('📞 Agent ready to handle service appointments');
    console.log('🔑 API Key configured:', process.env.RETELL_API_KEY ? '✅ Yes' : '❌ No');
    
    return { 
      agent_id: agentConfig.agent_id,
      name: agentConfig.name,
      status: 'active'
    };
  } catch (error) {
    console.error('Error initializing agent:', error);
    throw error;
  }
}

// API Routes for appointment management
app.post('/api/check-availability', (req, res) => {
  try {
    const { date, location, serviceType } = req.body;
    
    if (!date || !location) {
      return res.status(400).json({ error: 'Date and location are required' });
    }
    
    const availableSlots = appointmentManager.getAvailableSlots(date, location, serviceType);
    res.json({ 
      availableSlots,
      businessHours: appointmentManager.getBusinessHours(),
      serviceTypes: appointmentManager.getServiceTypes(),
      locations: appointmentManager.getLocations()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// New endpoint to check availability for a specific time slot
app.post('/api/check-slot-availability', (req, res) => {
  try {
    const { date, time, location, serviceType } = req.body;
    
    if (!date || !time || !location) {
      return res.status(400).json({ error: 'Date, time, and location are required' });
    }
    
    const isAvailable = appointmentManager.isSlotAvailable(date, time, location, serviceType);
    
    if (isAvailable) {
      res.json({ 
        available: true,
        message: 'Time slot is available'
      });
    } else {
      // Suggest alternative times
      const alternativeSlots = appointmentManager.suggestAlternativeTimes(date, location, serviceType, 3);
      res.json({ 
        available: false,
        message: 'Time slot is not available',
        alternativeSlots,
        nextAvailable: appointmentManager.getNextAvailableSlot(date, location, serviceType)
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// New endpoint to book appointment from call session
app.post('/api/book-appointment-from-session', (req, res) => {
  try {
    const { callId, customerInfo, appointmentDetails } = req.body;
    
    if (!callId || !customerInfo) {
      return res.status(400).json({ error: 'Call ID and customer info are required' });
    }
    
    // Create session data object
    const sessionData = {
      callId,
      customerInfo,
      appointmentDetails
    };
    
    // Book the appointment
    const appointment = appointmentManager.bookAppointmentFromSession(sessionData);
    
    // Update the call session
    callSessionManager.bookAppointment(callId, appointment);
    
    res.json({ 
      success: true, 
      appointment,
      message: 'Appointment booked successfully from call session!' 
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message,
      message: 'Unable to book appointment. Please try another time.'
    });
  }
});

app.post('/api/book-appointment', (req, res) => {
  try {
    const appointmentData = req.body;
    const appointment = appointmentManager.bookAppointment(appointmentData);
    
    res.json({ 
      success: true, 
      appointment,
      message: 'Appointment booked successfully!' 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/appointments', (req, res) => {
  try {
    const filters = req.query;
    const appointments = appointmentManager.getAppointments(filters);
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// New endpoint to get appointments for a date range
app.get('/api/appointments/range', (req, res) => {
  try {
    const { startDate, endDate, location } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
    
    const appointments = appointmentManager.getConfirmedAppointments(startDate, endDate, location);
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/appointments/:id', (req, res) => {
  try {
    const appointment = appointmentManager.getAppointment(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// New endpoint to get appointment statistics
app.get('/api/appointments/stats/:date', (req, res) => {
  try {
    const { date } = req.params;
    const { location } = req.query;
    
    const stats = appointmentManager.getStatistics(date, location);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// New endpoint to get available locations and service types
app.get('/api/appointment-options', (req, res) => {
  try {
    res.json({
      locations: appointmentManager.getLocations(),
      serviceTypes: appointmentManager.getServiceTypes(),
      businessHours: appointmentManager.getBusinessHours()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/appointments/:id', (req, res) => {
  try {
    const appointment = appointmentManager.updateAppointment(req.params.id, req.body);
    res.json({ 
      success: true, 
      appointment,
      message: 'Appointment updated successfully!' 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/appointments/:id', (req, res) => {
  try {
    const appointment = appointmentManager.cancelAppointment(req.params.id);
    res.json({ 
      success: true, 
      appointment,
      message: 'Appointment cancelled successfully!' 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/statistics', (req, res) => {
  try {
    const { date, location } = req.query;
    
    if (!date || !location) {
      return res.status(400).json({ error: 'Date and location are required' });
    }
    
    const statistics = appointmentManager.getStatistics(date, location);
    res.json(statistics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/service-types', (req, res) => {
  try {
    const serviceTypes = appointmentManager.getServiceTypes();
    res.json(serviceTypes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/business-hours', (req, res) => {
  try {
    const businessHours = appointmentManager.getBusinessHours();
    res.json(businessHours);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Call Session Management Routes
app.post('/api/call/start', (req, res) => {
  try {
    const { callId, customerPhone } = req.body;
    
    if (!callId || !customerPhone) {
      return res.status(400).json({ error: 'Call ID and customer phone are required' });
    }
    
    const session = callSessionManager.createSession(callId, customerPhone);
    res.json({ 
      success: true, 
      session: callSessionManager.getSessionSummary(callId),
      message: 'Call session started successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/call/update-info', (req, res) => {
  try {
    const { callId, updates } = req.body;
    
    if (!callId || !updates) {
      return res.status(400).json({ error: 'Call ID and updates are required' });
    }
    
    const session = callSessionManager.updateCustomerInfo(callId, updates);
    res.json({ 
      success: true, 
      session: callSessionManager.getSessionSummary(callId),
      message: 'Customer information updated successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/call/check-availability', async (req, res) => {
  try {
    const { callId, date, location, serviceType } = req.body;
    
    if (!callId || !date || !location || !serviceType) {
      return res.status(400).json({ error: 'Call ID, date, location, and service type are required' });
    }
    
    const availableSlots = await callSessionManager.checkAvailability(callId, date, location, serviceType);
    const session = callSessionManager.getSessionSummary(callId);
    
    res.json({ 
      success: true, 
      availableSlots,
      session,
      message: 'Availability checked successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/call/select-time', (req, res) => {
  try {
    const { callId, time } = req.body;
    
    if (!callId || !time) {
      return res.status(400).json({ error: 'Call ID and time are required' });
    }
    
    const selectedSlot = callSessionManager.selectTimeSlot(callId, time);
    const session = callSessionManager.getSessionSummary(callId);
    
    res.json({ 
      success: true, 
      selectedSlot,
      session,
      message: 'Time slot selected successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/call/book-appointment', async (req, res) => {
  try {
    const { callId } = req.body;
    
    if (!callId) {
      return res.status(400).json({ error: 'Call ID is required' });
    }
    
    const booking = await callSessionManager.bookAppointment(callId);
    const session = callSessionManager.getSessionSummary(callId);
    
    res.json({ 
      success: true, 
      booking,
      session,
      message: 'Appointment booked successfully!'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/call/state/:callId', (req, res) => {
  try {
    const { callId } = req.params;
    const state = callSessionManager.getConversationState(callId);
    const session = callSessionManager.getSessionSummary(callId);
    
    res.json({ 
      success: true, 
      state,
      session,
      message: 'Call state retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/call/end', (req, res) => {
  try {
    const { callId } = req.body;
    
    if (!callId) {
      return res.status(400).json({ error: 'Call ID is required' });
    }
    
    callSessionManager.endSession(callId);
    res.json({ 
      success: true, 
      message: 'Call session ended successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all call sessions
app.get('/api/call/sessions', (req, res) => {
  try {
    console.log('📞 API: /api/call/sessions called');
    
    const allSessions = callSessionManager.getAllSessions();
    console.log('📊 API: Total sessions in manager:', allSessions.length);
    console.log('📋 API: Session IDs:', allSessions.map(s => s.callId));
    
    if (allSessions.length === 0) {
      console.log('⚠️ API: No sessions found in manager');
    }
    
    res.json({
      success: true,
      sessions: allSessions,
      count: allSessions.length,
      message: allSessions.length > 0 ? 'All sessions retrieved successfully' : 'No sessions found'
    });
  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({ error: 'Failed to retrieve sessions' });
  }
});

// Webhook endpoint for AI service - GET for testing, POST for data
app.get('/webhook/ai', (req, res) => {
  res.json({ 
    status: 'webhook_active',
    message: 'Canadian Tire AI Agent webhook is active and ready to receive data',
    timestamp: new Date().toISOString(),
    endpoint: '/webhook/ai',
    method: 'POST'
  });
});

app.post('/webhook/ai', async (req, res) => {
  try {
    console.log('📞 Webhook received!');
    console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 Body type:', typeof req.body);
    console.log('🔍 Body keys:', Object.keys(req.body || {}));
    console.log('🌐 Request URL:', req.url);
    console.log('🔧 Request method:', req.method);
    console.log('📊 Content-Type:', req.headers['content-type']);
    
    // Handle different possible data formats from Retell AI
    const event_type = req.body.event_type || req.body.type || req.body.event;
    const data = req.body.data || req.body.payload || req.body;
    
    console.log(`🎯 Extracted - Event Type: ${event_type}`);
    console.log(`📊 Extracted - Data:`, JSON.stringify(data, null, 2));
    
    // Handle customer data from Retell AI cust_info function
    if (req.body.name || req.body.phone || req.body.serviceType) {
      console.log('🔧 Customer data received from Retell:', JSON.stringify(req.body, null, 2));
      
      // Create a new session
      const callId = 'webhook-call-' + Date.now();
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
      
      console.log('✅ Session created with data:', callId);
      console.log('📝 Customer info stored:', session.customerInfo);
      
      // Check if we have enough info to mark as appointment ready
      const customerInfo = session.customerInfo;
      const hasRequiredInfo = customerInfo.name && customerInfo.phone && 
                             customerInfo.serviceType && customerInfo.location &&
                             customerInfo.preferredDate && customerInfo.preferredTime;
      
      if (hasRequiredInfo) {
        console.log('✅ All required info collected, appointment ready');
        session.appointmentBooked = true;
        session.appointmentDetails = {
          date: customerInfo.preferredDate,
          time: customerInfo.preferredTime,
          service: customerInfo.serviceType,
          location: customerInfo.location
        };
      }
    } else if (event_type === 'call_started' || event_type === 'start') {
      // Create a new call session
      const callId = data.call_id || data.callId || data.id;
      const customerPhone = data.customer_phone || data.phone || data.customerPhone;
      
      if (callId) {
        const session = callSessionManager.createSession(callId, customerPhone);
        console.log('✅ Call started:', callId, 'Session created:', session.callId);
      } else {
        console.log('⚠️ Call started but no call ID found');
      }
    } else if (event_type === 'call_ended' || event_type === 'end') {
      // End the call session
      const callId = data.call_id || data.callId || data.id;
      if (callId) {
        callSessionManager.endSession(callId);
        console.log('✅ Call ended:', callId);
      }
    } else if (event_type === 'transcript' || event_type === 'message') {
      // Process transcript for intent recognition
      const transcript = data.transcript || data.message || data.text;
      const callId = data.call_id || data.callId || data.id;
      
      console.log('📝 Transcript received for call:', callId);
      console.log('💬 Content:', transcript);
      
      if (transcript && callId) {
        // Extract customer data from transcript
        const extractedData = callSessionManager.extractCustomerData(callId, transcript);
        console.log('🎯 Extracted data:', extractedData);
        
        // Check if we have enough info to book an appointment
        const session = callSessionManager.getSession(callId);
        if (session) {
          const customerInfo = session.customerInfo;
          const hasRequiredInfo = customerInfo.name && customerInfo.phone && 
                                 customerInfo.serviceType && customerInfo.location;
          
          if (hasRequiredInfo) {
            console.log('✅ All required info collected, ready to book appointment');
            // Here you would trigger the appointment booking flow
          } else {
            console.log('⏳ Still collecting info. Missing:', 
              Object.entries(customerInfo)
                .filter(([key, value]) => !value && ['name', 'phone', 'serviceType', 'location'].includes(key))
                .map(([key]) => key)
            );
          }
        }
      }
    } else if (event_type === 'function_call' || event_type === 'function') {
      // Handle function calls from Retell AI
      console.log('🔧 Function call received:', data.function_name);
      console.log('📊 Function arguments:', data.arguments);
      
      const callId = data.call_id || data.callId || data.id || 'function-call-' + Date.now();
      
      // Create or get session for function calls
      let session = callSessionManager.getSession(callId);
      if (!session) {
        session = callSessionManager.createSession(callId, data.arguments?.phone || 'unknown');
      }
      
      // Update session with function data
      if (data.arguments) {
        Object.entries(data.arguments).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            callSessionManager.updateCustomerInfo(callId, key, value);
          }
        });
      }
      
      console.log('✅ Function data processed for call:', callId);
      console.log('📝 Updated customer info:', session.customerInfo);

    } else {
      console.log('❓ Unknown event type:', event_type);
      console.log('📋 Full payload:', JSON.stringify(req.body, null, 2));
    }
    
    // Log current sessions after processing
    const allSessions = callSessionManager.getAllSessions();
    console.log('📊 Total sessions after webhook processing:', allSessions.length);
    console.log('📋 Session IDs:', allSessions.map(s => s.callId));
    
    res.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Test endpoint to create sample data
app.post('/api/test/create-session', (req, res) => {
  try {
    console.log('🧪 Creating test session...');
    
    const testCallId = 'test-call-' + Date.now();
    const testPhone = '+15551234567';
    
    // Create a test session
    const session = callSessionManager.createSession(testCallId, testPhone);
    
    // Add some test customer data
    callSessionManager.updateCustomerInfo(testCallId, 'name', 'John Smith');
    callSessionManager.updateCustomerInfo(testCallId, 'email', 'john.smith@example.com');
    callSessionManager.updateCustomerInfo(testCallId, 'carMake', 'Honda');
    callSessionManager.updateCustomerInfo(testCallId, 'carModel', 'Civic');
    callSessionManager.updateCustomerInfo(testCallId, 'carYear', '2020');
    callSessionManager.updateCustomerInfo(testCallId, 'serviceType', 'oil_change');
    callSessionManager.updateCustomerInfo(testCallId, 'location', 'Downtown Toronto');
    callSessionManager.updateCustomerInfo(testCallId, 'preferredDate', '2025-01-20');
    callSessionManager.updateCustomerInfo(testCallId, 'preferredTime', '10:00');
    
    // End the session
    callSessionManager.endSession(testCallId);
    
    console.log('✅ Test session created:', testCallId);
    
    res.json({ 
      success: true, 
      message: 'Test session created successfully',
      sessionId: testCallId,
      session: callSessionManager.getSession(testCallId)
    });
  } catch (error) {
    console.error('❌ Error creating test session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint to get all sessions (for debugging)
app.get('/api/test/sessions', (req, res) => {
  try {
    console.log('🧪 Test endpoint - /api/test/sessions called');
    
    const allSessions = callSessionManager.getAllSessions();
    console.log('🧪 Test endpoint - Total sessions in manager:', allSessions.length);
    console.log('🧪 Test endpoint - Session IDs:', allSessions.map(s => s.callId));
    
    if (allSessions.length === 0) {
      console.log('⚠️ Test endpoint - No sessions found in manager');
    }
    
    res.json({ 
      success: true, 
      sessions: allSessions,
      count: allSessions.length,
      sessionIds: allSessions.map(s => s.callId)
    });
  } catch (error) {
    console.error('❌ Test endpoint Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Simple endpoint to store customer data from Retell AI
app.post('/api/store-customer-data', (req, res) => {
  try {
    console.log('🔧 Storing customer data:', JSON.stringify(req.body, null, 2));
    
    // Create a new session
    const callId = 'customer-' + Date.now();
    const session = callSessionManager.createSession(callId, req.body.phone || 'unknown');
    
    // Store all the data using updateCustomerInfo method
    if (req.body.name) callSessionManager.updateCustomerInfo(callId, 'name', req.body.name);
    if (req.body.phone) callSessionManager.updateCustomerInfo(callId, 'phone', req.body.phone);
    if (req.body.email) callSessionManager.updateCustomerInfo(callId, 'email', req.body.email);
    if (req.body.carMake) callSessionManager.updateCustomerInfo(callId, 'carMake', req.body.carMake);
    if (req.body.carModel) callSessionManager.updateCustomerInfo(callId, 'carModel', req.body.carModel);
    if (req.body.carYear) callSessionManager.updateCustomerInfo(callId, 'carYear', req.body.carYear);
    if (req.body.serviceType) callSessionManager.updateCustomerInfo(callId, 'serviceType', req.body.serviceType);
    if (req.body.triangleMember !== undefined) callSessionManager.updateCustomerInfo(callId, 'triangleMember', req.body.triangleMember);
    if (req.body.location) callSessionManager.updateCustomerInfo(callId, 'location', req.body.location);
    if (req.body.preferredDate) callSessionManager.updateCustomerInfo(callId, 'preferredDate', req.body.preferredDate);
    if (req.body.preferredTime) callSessionManager.updateCustomerInfo(callId, 'preferredTime', req.body.preferredTime);
    
    console.log('✅ Customer data stored successfully:', callId);
    
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

// Cleanup endpoint to remove duplicate sessions and consolidate data
app.post('/api/cleanup-duplicates', (req, res) => {
  try {
    console.log('�� Starting duplicate cleanup...');
    
    const allSessions = callSessionManager.getAllSessions();
    console.log('📊 Total sessions before cleanup:', allSessions.length);
    
    // Group sessions by phone number
    const sessionsByPhone = {};
    allSessions.forEach(session => {
      const phone = session.customerInfo.phone;
      if (phone && phone !== 'unknown') {
        if (!sessionsByPhone[phone]) {
          sessionsByPhone[phone] = [];
        }
        sessionsByPhone[phone].push(session);
      }
    });
    
    // Find and remove duplicates
    let duplicatesRemoved = 0;
    Object.entries(sessionsByPhone).forEach(([phone, sessions]) => {
      if (sessions.length > 1) {
        console.log(`📱 Found ${sessions.length} sessions for phone ${phone}`);
        
        // Sort by lastActivity to keep the most recent/complete one
        sessions.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
        
        // Keep the first (most recent) session and merge data from others
        const keepSession = sessions[0];
        console.log(`✅ Keeping session: ${keepSession.callId}`);
        
        // Merge data from other sessions
        for (let i = 1; i < sessions.length; i++) {
          const duplicateSession = sessions[i];
          console.log(`🔄 Merging data from duplicate: ${duplicateSession.callId}`);
          
          // Merge customer info
          Object.entries(duplicateSession.customerInfo).forEach(([key, value]) => {
            if (value && value !== null && value !== undefined && value !== '') {
              if (!keepSession.customerInfo[key] || keepSession.customerInfo[key] === null) {
                keepSession.customerInfo[key] = value;
                console.log(`📝 Merged ${key}: ${value}`);
              }
            }
          });
          
          // Remove the duplicate session
          callSessionManager.removeSession(duplicateSession.callId);
          duplicatesRemoved++;
        }
      }
    });
    
    const finalSessions = callSessionManager.getAllSessions();
    console.log('✅ Cleanup completed!');
    console.log('📊 Sessions removed:', duplicatesRemoved);
    console.log('📊 Total sessions after cleanup:', finalSessions.length);
    
    res.json({ 
      success: true, 
      message: 'Duplicate cleanup completed',
      duplicatesRemoved,
      totalSessionsBefore: allSessions.length,
      totalSessionsAfter: finalSessions.length
    });
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Canadian Tire AI Agent',
    timestamp: new Date().toISOString(),
    appointmentsCount: appointmentManager.appointments.length,
    activeCallSessions: callSessionManager.getAllActiveSessions().length,
    ai: {
      configured: !!process.env.RETELL_API_KEY,
      apiKey: process.env.RETELL_API_KEY ? '✅ Configured' : '❌ Not configured'
    }
  });
});

// Start the server
async function startServer() {
  try {
    // Initialize the agent
    const agent = await initializeAgent();
    
    // Start session cleanup interval
    setInterval(() => {
      const cleaned = callSessionManager.cleanupExpiredSessions();
      if (cleaned > 0) {
        console.log(`🧹 Cleaned up ${cleaned} expired sessions`);
      }
    }, 5 * 60 * 1000); // Every 5 minutes
    
    app.listen(port, () => {
      console.log(`🚗 Canadian Tire AI Agent running on port ${port}`);
      console.log(`📞 Agent ready to handle service appointments`);
      console.log(`🌐 Health check: http://localhost:${port}/health`);
      console.log(`📊 API endpoints available at http://localhost:${port}/api/`);
      console.log(`🎭 Demo interface: http://localhost:${port}`);
      console.log(`🔗 AI webhook: http://localhost:${port}/webhook/ai`);
      console.log(`\n✅ AI integration: ACTIVE`);
      console.log(`   Agent ID: ${agent.agent_id}`);
      console.log(`   Status: ${agent.status}`);
      console.log(`\n📞 Call Session Management: ENABLED`);
      console.log(`   Real-time appointment booking during calls`);
      console.log(`   Session timeout: 30 minutes`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
