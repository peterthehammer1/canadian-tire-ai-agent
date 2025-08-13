const moment = require('moment');

class CallSessionManager {
  constructor() {
    this.activeSessions = new Map();
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
  }

  // Create a new call session
  createSession(callId, customerPhone) {
    const session = {
      callId,
      customerPhone,
      createdAt: new Date(),
      lastActivity: new Date(),
      customerInfo: {
        location: null,
        fullName: null,
        phoneNumber: customerPhone,
        email: null,
        carMake: null,
        carModel: null,
        carYear: null,
        serviceType: null,
        loyaltyMember: null,
        preferredDate: null,
        preferredTime: null
      },
      conversationState: 'greeting', // greeting, collecting_info, checking_availability, confirming_booking, completed
      availableSlots: [],
      selectedSlot: null,
      appointmentId: null
    };

    this.activeSessions.set(callId, session);
    console.log(`📞 New call session created: ${callId} for ${customerPhone}`);
    return session;
  }

  // Get session by call ID
  getSession(callId) {
    const session = this.activeSessions.get(callId);
    if (session) {
      session.lastActivity = new Date();
    }
    return session;
  }

  // Update customer information during the call
  updateCustomerInfo(callId, updates) {
    const session = this.getSession(callId);
    if (!session) {
      throw new Error('Call session not found');
    }

    Object.assign(session.customerInfo, updates);
    session.lastActivity = new Date();
    
    console.log(`📝 Updated customer info for call ${callId}:`, updates);
    return session;
  }

  // Check appointment availability for a customer
  async checkAvailability(callId, date, location, serviceType) {
    const session = this.getSession(callId);
    if (!session) {
      throw new Error('Call session not found');
    }

    // Update session with availability request
    session.customerInfo.preferredDate = date;
    session.customerInfo.location = location;
    session.customerInfo.serviceType = serviceType;
    session.conversationState = 'checking_availability';

    // Get available slots (this would integrate with your appointment manager)
    const availableSlots = this.getAvailableSlotsForDate(date, location, serviceType);
    session.availableSlots = availableSlots;
    session.lastActivity = new Date();

    console.log(`🔍 Availability checked for call ${callId}: ${availableSlots.length} slots available`);
    return availableSlots;
  }

  // Get available slots for a specific date/location/service
  getAvailableSlotsForDate(date, location, serviceType) {
    // This would integrate with your AppointmentManager
    // For now, returning mock data
    const businessHours = [
      '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'
    ];
    
    // Simulate some slots being taken
    const takenSlots = ['10:00', '14:00']; // Mock taken slots
    const availableSlots = businessHours.filter(time => !takenSlots.includes(time));
    
    return availableSlots.map(time => ({
      time,
      displayTime: moment(`2000-01-01 ${time}`).format('h:mm A'),
      available: true
    }));
  }

  // Select a time slot for the customer
  selectTimeSlot(callId, time) {
    const session = this.getSession(callId);
    if (!session) {
      throw new Error('Call session not found');
    }

    const selectedSlot = session.availableSlots.find(slot => slot.time === time);
    if (!selectedSlot) {
      throw new Error('Selected time slot is not available');
    }

    session.selectedSlot = selectedSlot;
    session.customerInfo.preferredTime = time;
    session.conversationState = 'confirming_booking';
    session.lastActivity = new Date();

    console.log(`⏰ Time slot selected for call ${callId}: ${time}`);
    return selectedSlot;
  }

  // Book the appointment
  async bookAppointment(callId) {
    const session = this.getSession(callId);
    if (!session) {
      throw new Error('Call session not found');
    }

    // Validate all required information is present
    const requiredFields = [
      'location', 'fullName', 'phoneNumber', 'email',
      'carMake', 'carModel', 'carYear', 'serviceType',
      'loyaltyMember', 'preferredDate', 'preferredTime'
    ];

    const missingFields = requiredFields.filter(field => !session.customerInfo[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required information: ${missingFields.join(', ')}`);
    }

    // Create appointment data
    const appointmentData = {
      ...session.customerInfo,
      date: session.customerInfo.preferredDate,
      time: session.customerInfo.preferredTime,
      status: 'confirmed'
    };

    // This would integrate with your AppointmentManager
    const appointmentId = this.createMockAppointment(appointmentData);
    
    session.appointmentId = appointmentId;
    session.conversationState = 'completed';
    session.lastActivity = new Date();

    console.log(`✅ Appointment booked for call ${callId}: ${appointmentId}`);
    return {
      appointmentId,
      appointmentData,
      confirmationNumber: appointmentId
    };
  }

  // Mock appointment creation (replace with real AppointmentManager integration)
  createMockAppointment(appointmentData) {
    const appointmentId = `APT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    // In production, this would call appointmentManager.bookAppointment(appointmentData)
    console.log(`📅 Mock appointment created: ${appointmentId}`, appointmentData);
    
    return appointmentId;
  }

  // Get conversation state and next actions
  getConversationState(callId) {
    const session = this.getSession(callId);
    if (!session) {
      return { state: 'unknown', message: 'Call session not found' };
    }

    const stateInfo = {
      greeting: {
        state: 'greeting',
        message: 'Welcome! I can help you book a service appointment.',
        nextAction: 'Ask for service type and location',
        requiredInfo: []
      },
      collecting_info: {
        state: 'collecting_info',
        message: 'I\'m collecting your information to book the appointment.',
        nextAction: 'Continue gathering required information',
        requiredInfo: this.getMissingRequiredInfo(session)
      },
      checking_availability: {
        state: 'checking_availability',
        message: 'I\'m checking available appointment times.',
        nextAction: 'Present available time slots',
        requiredInfo: [],
        availableSlots: session.availableSlots
      },
      confirming_booking: {
        state: 'confirming_booking',
        message: 'I\'m ready to confirm your appointment.',
        nextAction: 'Confirm details and book appointment',
        requiredInfo: [],
        selectedSlot: session.selectedSlot
      },
      completed: {
        state: 'completed',
        message: 'Your appointment has been booked successfully!',
        nextAction: 'Provide confirmation details and end call',
        requiredInfo: [],
        appointmentId: session.appointmentId
      }
    };

    return stateInfo[session.conversationState] || stateInfo.greeting;
  }

  // Get missing required information
  getMissingRequiredInfo(session) {
    const requiredFields = [
      'location', 'fullName', 'phoneNumber', 'email',
      'carMake', 'carModel', 'carYear', 'serviceType',
      'loyaltyMember'
    ];

    return requiredFields.filter(field => !session.customerInfo[field]);
  }

  // End call session
  endSession(callId) {
    const session = this.activeSessions.get(callId);
    if (session) {
      console.log(`📞 Call session ended: ${callId}`);
      this.activeSessions.delete(callId);
    }
  }

  // Clean up expired sessions
  cleanupExpiredSessions() {
    const now = new Date();
    const expiredSessions = [];

    for (const [callId, session] of this.activeSessions.entries()) {
      if (now - session.lastActivity > this.sessionTimeout) {
        expiredSessions.push(callId);
      }
    }

    expiredSessions.forEach(callId => {
      console.log(`🧹 Cleaning up expired session: ${callId}`);
      this.activeSessions.delete(callId);
    });

    return expiredSessions.length;
  }

  // Get session summary for debugging
  getSessionSummary(callId) {
    const session = this.getSession(callId);
    if (!session) {
      return null;
    }

    return {
      callId: session.callId,
      customerPhone: session.customerPhone,
      conversationState: session.conversationState,
      customerInfo: session.customerInfo,
      availableSlots: session.availableSlots,
      selectedSlot: session.selectedSlot,
      appointmentId: session.appointmentId,
      lastActivity: session.lastActivity,
      sessionAge: Date.now() - session.createdAt.getTime()
    };
  }

  // Get all active sessions (for admin purposes)
  getAllActiveSessions() {
    const sessions = [];
    for (const [callId, session] of this.activeSessions.entries()) {
      sessions.push(this.getSessionSummary(callId));
    }
    return sessions;
  }
}

module.exports = CallSessionManager;
