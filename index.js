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
      serviceTypes: appointmentManager.getServiceTypes()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
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

app.get('/api/call/sessions', (req, res) => {
  try {
    const sessions = callSessionManager.getAllActiveSessions();
    res.json({ 
      success: true, 
      sessions,
      count: sessions.length,
      message: 'Active sessions retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook endpoint for AI service (simulated)
app.post('/webhook/ai', async (req, res) => {
  try {
    const { event_type, data } = req.body;
    
    console.log(`📞 AI Service Webhook: ${event_type}`, data);
    
    if (event_type === 'call_started') {
      // Create a new call session
      const session = callSessionManager.createSession(data.call_id, data.customer_phone);
      console.log('Call started:', data.call_id, 'Session created:', session.callId);
    } else if (event_type === 'call_ended') {
      // End the call session
      callSessionManager.endSession(data.call_id);
      console.log('Call ended:', data.call_id);
    } else if (event_type === 'transcript') {
      // Process transcript for intent recognition (simplified)
      console.log('Transcript received:', data.transcript);
      
      // Here you would integrate with your AI service to:
      // 1. Extract customer information from conversation
      // 2. Update the call session
      // 3. Trigger availability checks
      // 4. Handle appointment booking
    }
    
    res.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
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
