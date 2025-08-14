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
    res.json({
      success: true,
      appointments: appointments,
      count: appointments.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
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
