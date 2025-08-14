const { v4: uuidv4 } = require('uuid');

class CallSessionManager {
  constructor() {
    this.sessions = new Map();
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
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
      conversationHistory: [],
      extractedData: {},
      appointmentBooked: false,
      appointmentDetails: null
    };

    this.sessions.set(callId, session);
    console.log(`📞 New call session created: ${callId}`);
    return session;
  }

  updateCustomerInfo(callId, field, value) {
    const session = this.sessions.get(callId);
    if (session) {
      session.customerInfo[field] = value;
      session.lastActivity = new Date();
      console.log(`📝 Updated ${field}: ${value} for call ${callId}`);
      return true;
    }
    return false;
  }

  addConversationEntry(callId, entry) {
    const session = this.sessions.get(callId);
    if (session) {
      session.conversationHistory.push({
        timestamp: new Date(),
        ...entry
      });
      session.lastActivity = new Date();
    }
  }

  extractCustomerData(callId, transcript) {
    const session = this.sessions.get(callId);
    if (!session) return false;

    // Add transcript to conversation history
    this.addConversationEntry(callId, {
      type: 'transcript',
      content: transcript,
      aiExtracted: false
    });

    // Use AI to extract structured data from transcript
    const extractedData = this.parseTranscriptForData(transcript);
    
    // Update session with extracted data
    Object.keys(extractedData).forEach(field => {
      if (extractedData[field] && !session.customerInfo[field]) {
        this.updateCustomerInfo(callId, field, extractedData[field]);
      }
    });

    // Store raw extracted data
    session.extractedData = { ...session.extractedData, ...extractedData };
    
    return extractedData;
  }

  parseTranscriptForData(transcript) {
    const extracted = {};
    const lowerTranscript = transcript.toLowerCase();

    // Extract name (look for patterns like "my name is", "I'm", "call me")
    const namePatterns = [
      /(?:my name is|i'm|call me|this is)\s+([a-zA-Z\s]+?)(?:\s|\.|$)/i,
      /(?:name|called)\s*[:\-]?\s*([a-zA-Z\s]+?)(?:\s|\.|$)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = transcript.match(pattern);
      if (match && match[1]) {
        extracted.name = match[1].trim();
        break;
      }
    }

    // Extract email
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const emailMatch = transcript.match(emailPattern);
    if (emailMatch) {
      extracted.email = emailMatch[0];
    }

    // Extract car make
    const carMakes = ['toyota', 'honda', 'ford', 'chevrolet', 'nissan', 'bmw', 'mercedes', 'audi', 'volkswagen', 'hyundai', 'kia', 'mazda', 'subaru', 'lexus', 'acura', 'infiniti', 'cadillac', 'buick', 'chrysler', 'dodge', 'jeep', 'ram', 'gmc', 'pontiac', 'saturn', 'scion'];
    for (const make of carMakes) {
      if (lowerTranscript.includes(make)) {
        extracted.carMake = make.charAt(0).toUpperCase() + make.slice(1);
        break;
      }
    }

    // Extract car model (look for patterns after car make)
    if (extracted.carMake) {
      const makeIndex = lowerTranscript.indexOf(extracted.carMake.toLowerCase());
      if (makeIndex !== -1) {
        const afterMake = transcript.substring(makeIndex + extracted.carMake.length).trim();
        const modelMatch = afterMake.match(/^([a-zA-Z0-9\s]+?)(?:\s|\.|$)/);
        if (modelMatch) {
          extracted.carModel = modelMatch[1].trim();
        }
      }
    }

    // Extract car year
    const yearPattern = /(?:19|20)\d{2}/;
    const yearMatch = transcript.match(yearPattern);
    if (yearMatch) {
      extracted.carYear = parseInt(yearMatch[0]);
    }

    // Extract service type
    const serviceTypes = {
      'oil change': 'Oil Change',
      'tire rotation': 'Seasonal Tire Rotation',
      'tire': 'Seasonal Tire Rotation',
      'general check': 'General Check-up/Repair',
      'check up': 'General Check-up/Repair',
      'repair': 'General Check-up/Repair',
      'maintenance': 'General Check-up/Repair'
    };
    
    for (const [key, value] of Object.entries(serviceTypes)) {
      if (lowerTranscript.includes(key)) {
        extracted.serviceType = value;
        break;
      }
    }

    // Extract triangle membership
    if (lowerTranscript.includes('triangle member') || lowerTranscript.includes('loyalty program')) {
      extracted.triangleMember = lowerTranscript.includes('yes') || lowerTranscript.includes('member');
    }

    // Extract location
    const locationPatterns = [
      /(?:location|store|branch)\s*[:\-]?\s*([a-zA-Z\s]+?)(?:\s|\.|$)/i,
      /(?:canadian tire|ct)\s+([a-zA-Z\s]+?)(?:\s|\.|$)/i
    ];
    
    for (const pattern of locationPatterns) {
      const match = transcript.match(pattern);
      if (match && match[1]) {
        extracted.location = match[1].trim();
        break;
      }
    }

    // Extract date preferences
    const datePatterns = [
      /(?:on|for|this|next)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
      /(?:on|for)\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/i,
      /(?:on|for)\s+\d{1,2}\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i
    ];
    
    for (const pattern of datePatterns) {
      const match = transcript.match(pattern);
      if (match) {
        extracted.preferredDate = match[0];
        break;
      }
    }

    // Extract time preferences
    const timePatterns = [
      /(?:at|around|about)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i,
      /(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i
    ];
    
    for (const pattern of timePatterns) {
      const match = transcript.match(pattern);
      if (match) {
        extracted.preferredTime = match[1] || match[0];
        break;
      }
    }

    return extracted;
  }

  bookAppointment(callId, appointmentData) {
    const session = this.sessions.get(callId);
    if (session) {
      session.appointmentBooked = true;
      session.appointmentDetails = appointmentData;
      session.lastActivity = new Date();
      console.log(`✅ Appointment booked for call ${callId}:`, appointmentData);
      return true;
    }
    return false;
  }

  getSession(callId) {
    return this.sessions.get(callId);
  }

  getAllActiveSessions() {
    const activeSessions = [];
    for (const [callId, session] of this.sessions) {
      if (session.status === 'active') {
        activeSessions.push({
          callId,
          sessionId: session.sessionId,
          startTime: session.startTime,
          lastActivity: session.lastActivity,
          customerInfo: session.customerInfo,
          appointmentBooked: session.appointmentBooked,
          appointmentDetails: session.appointmentDetails,
          conversationLength: session.conversationHistory.length
        });
      }
    }
    return activeSessions;
  }

  getAllSessions() {
    const allSessions = [];
    for (const [callId, session] of this.sessions) {
      allSessions.push({
        callId,
        sessionId: session.sessionId,
        startTime: session.startTime,
        endTime: session.endTime || null,
        lastActivity: session.lastActivity,
        status: session.status,
        customerInfo: session.customerInfo,
        appointmentBooked: session.appointmentBooked,
        appointmentDetails: session.appointmentDetails,
        conversationLength: session.conversationHistory.length,
        conversationHistory: session.conversationHistory,
        extractedData: session.extractedData
      });
    }
    return allSessions;
  }

  getSessionData(callId) {
    const session = this.sessions.get(callId);
    if (!session) return null;

    return {
      callId: session.callId,
      sessionId: session.sessionId,
      startTime: session.startTime,
      lastActivity: session.lastActivity,
      status: session.status,
      customerInfo: session.customerInfo,
      appointmentBooked: session.appointmentBooked,
      appointmentDetails: session.appointmentDetails,
      conversationHistory: session.conversationHistory,
      extractedData: session.extractedData
    };
  }

  endSession(callId) {
    const session = this.sessions.get(callId);
    if (session) {
      session.status = 'ended';
      session.endTime = new Date();
      console.log(`📞 Call session ended: ${callId}`);
      return true;
    }
    return false;
  }

  cleanupExpiredSessions() {
    const now = new Date();
    let cleaned = 0;
    
    for (const [callId, session] of this.sessions) {
      if (session.status === 'active' && 
          (now - session.lastActivity) > this.sessionTimeout) {
        session.status = 'expired';
        cleaned++;
      }
    }
    
    return cleaned;
  }
}

module.exports = CallSessionManager;
