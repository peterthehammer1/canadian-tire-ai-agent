const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Simple data storage - just appointments
let appointments = [];

// Webhook endpoint for Retell AI
app.post('/api/webhook', (req, res) => {
  try {
    console.log('📞 Webhook received:', JSON.stringify(req.body, null, 2));

    // Support multiple payload shapes:
    // A) { name: 'cust_info', arguments: { ...fields } }
    // B) { ...fields } direct
    // C) { payload: { ...fields } } or { data: { ...fields } }
    let payload = req.body;
    if (payload && payload.arguments) {
      // Function-call style – arguments may be an object or a JSON string
      if (typeof payload.arguments === 'string') {
        try {
          payload = JSON.parse(payload.arguments);
        } catch (e) {
          console.log('⚠️ Could not parse string arguments; falling back to body');
        }
      } else if (typeof payload.arguments === 'object') {
        payload = payload.arguments;
      }
    } else if (payload && payload.payload && typeof payload.payload === 'object') {
      payload = payload.payload;
    } else if (payload && payload.data && typeof payload.data === 'object') {
      payload = payload.data;
    }

    // If the wrapper name clobbered the real name (e.g., name: "cust_info"), prefer arguments
    if (req.body && (req.body.name === 'cust_info' || req.body.tool_name === 'cust_info')) {
      const maybeArgs = req.body.arguments;
      if (maybeArgs) {
        try {
          const parsed = typeof maybeArgs === 'string' ? JSON.parse(maybeArgs) : maybeArgs;
          if (parsed && typeof parsed === 'object') {
            payload = parsed;
          }
        } catch (e) {
          console.log('⚠️ Failed to coerce arguments from wrapper');
        }
      }
    }

    // Deep fallback: search recursively for the first object containing one of our expected fields
    const expectedKeys = new Set(['name','phone','email','carMake','carModel','carYear','serviceType','location','preferredDate','preferredTime','triangleMember']);
    function deepFind(obj, depth = 0) {
      if (!obj || typeof obj !== 'object' || depth > 4) return null;
      const keys = Object.keys(obj);
      if (keys.some(k => expectedKeys.has(k))) return obj;
      for (const k of keys) {
        const val = obj[k];
        if (typeof val === 'string') {
          // Sometimes arguments is a JSON string
          try {
            const parsed = JSON.parse(val);
            const found = deepFind(parsed, depth + 1);
            if (found) return found;
          } catch (_) {}
        } else {
          const found = deepFind(val, depth + 1);
          if (found) return found;
        }
      }
      return null;
    }
    const deepCandidate = deepFind(req.body);
    if (deepCandidate) payload = deepCandidate;

    // If we still don't have meaningful fields, acknowledge without storing
    const hasAnyField = payload && (
      payload.name || payload.phone || payload.serviceType || payload.location ||
      payload.preferredDate || payload.preferredTime
    );
    if (!hasAnyField) {
      return res.json({ success: true, message: 'No customer fields provided (noop)' });
    }

    // Extract appointment data from payload
    const appointmentData = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      customerName: payload.name || 'Unknown',
      phone: payload.phone || 'Unknown',
      email: payload.email || '',
      carMake: payload.carMake || '',
      carModel: payload.carModel || '',
      carYear: payload.carYear || '',
      serviceType: payload.serviceType || 'Unknown',
      location: payload.location || 'Unknown',
      appointmentDate: payload.preferredDate || 'Unknown',
      appointmentTime: payload.preferredTime || 'Unknown',
      status: 'confirmed'
    };

    // If this was a function-call wrapper, avoid creating placeholder/empty records
    const requiredFilled = appointmentData.customerName !== 'Unknown' &&
      appointmentData.phone !== 'Unknown' &&
      appointmentData.serviceType !== 'Unknown' &&
      appointmentData.location !== 'Unknown' &&
      appointmentData.appointmentDate !== 'Unknown' &&
      appointmentData.appointmentTime !== 'Unknown';

    // Store the appointment only if it has at least name+phone+serviceType or it's a full record
    if (
      appointmentData.customerName !== 'Unknown' ||
      appointmentData.phone !== 'Unknown' ||
      appointmentData.serviceType !== 'Unknown' ||
      appointmentData.location !== 'Unknown'
    ) {
      appointments.push(appointmentData);
    } else {
      return res.json({ success: true, message: 'Ignored empty payload' });
    }
    
    console.log('✅ Appointment stored:', appointmentData.id);
    console.log('📊 Total appointments:', appointments.length);
    
    res.json({
      success: true,
      message: 'Appointment received and stored',
      appointmentId: appointmentData.id,
      completeness: requiredFilled ? 'complete' : 'partial'
    });
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing webhook',
      error: error.message
    });
  }
});

// Get all appointments
app.get('/api/appointments', (req, res) => {
  try {
    console.log('📊 GET /api/appointments - Returning', appointments.length, 'appointments');
    res.json({
      success: true,
      appointments: appointments,
      count: appointments.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in /api/appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
});

// Test endpoint to verify server is running
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    appointments: appointments.length
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Canadian Tire Appointment System',
    status: 'running',
    endpoints: {
      webhook: 'POST /api/webhook',
      appointments: 'GET /api/appointments',
      test: 'GET /api/test',
      health: 'GET /health',
      dashboard: 'GET /dashboard'
    },
    timestamp: new Date().toISOString()
  });
});

// Serve dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(__dirname + '/public/dashboard.html');
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Canadian Tire Appointment System',
    appointments: appointments.length,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚗 Canadian Tire Appointment System running on port ${port}`);
  console.log(`📅 Webhook: POST http://localhost:${port}/api/webhook`);
  console.log(`📊 Appointments: GET http://localhost:${port}/api/appointments`);
});

module.exports = app;
