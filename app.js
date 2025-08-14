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
    
    // Extract appointment data from Retell AI
    const appointmentData = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      customerName: req.body.name || 'Unknown',
      phone: req.body.phone || 'Unknown',
      email: req.body.email || '',
      carMake: req.body.carMake || '',
      carModel: req.body.carModel || '',
      carYear: req.body.carYear || '',
      serviceType: req.body.serviceType || 'Unknown',
      location: req.body.location || 'Unknown',
      appointmentDate: req.body.preferredDate || 'Unknown',
      appointmentTime: req.body.preferredTime || 'Unknown',
      status: 'confirmed'
    };
    
    // Store the appointment
    appointments.push(appointmentData);
    
    console.log('✅ Appointment stored:', appointmentData.id);
    console.log('📊 Total appointments:', appointments.length);
    
    res.json({
      success: true,
      message: 'Appointment received and stored',
      appointmentId: appointmentData.id
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
