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
      if (match) {
        extracted.name = match[1].trim();
        break;
      }
    }

    // Extract email
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emailMatch = transcript.match(emailPattern);
    if (emailMatch) {
      extracted.email = emailMatch[0];
    }

    // Extract car make
    const carMakePatterns = [
      /(?:car|vehicle|auto|truck)\s+(?:is\s+)?(?:a\s+)?([a-zA-Z]+)/i,
      /(?:drive|own|have)\s+(?:a\s+)?([a-zA-Z]+)/i,
      /(?:make|brand)\s*[:\-]?\s*([a-zA-Z]+)/i
    ];
    
    for (const pattern of carMakePatterns) {
      const match = transcript.match(pattern);
      if (match) {
        extracted.carMake = match[1].trim();
        break;
      }
    }

    // Extract car model
    const carModelPatterns = [
      /(?:model|type)\s*[:\-]?\s*([a-zA-Z0-9\s]+?)(?:\s|\.|$)/i,
      /(?:car|vehicle)\s+(?:is\s+)?(?:a\s+)?[a-zA-Z]+\s+([a-zA-Z0-9\s]+?)(?:\s|\.|$)/i
    ];
    
    for (const pattern of carModelPatterns) {
      const match = transcript.match(pattern);
      if (match) {
        extracted.carModel = match[1].trim();
        break;
      }
    }

    // Extract car year
    const yearPattern = /(?:19|20)\d{2}/g;
    const yearMatch = transcript.match(yearPattern);
    if (yearMatch) {
      extracted.carYear = yearMatch[0];
    }

    // Extract service type
    const servicePatterns = [
      /(?:need|want|looking for|require)\s+(?:a\s+)?([a-zA-Z\s]+?)(?:service|check|inspection|change|rotation|repair)/i,
      /(?:service|work|maintenance)\s*[:\-]?\s*([a-zA-Z\s]+)/i,
      /(?:oil change|tire rotation|brake service|battery service|inspection|general service)/i
    ];
    
    for (const pattern of servicePatterns) {
      const match = transcript.match(pattern);
      if (match) {
        let serviceType = match[1] || match[0];
        // Map to standardized service types
        if (serviceType.toLowerCase().includes('oil')) {
          extracted.serviceType = 'oil_change';
        } else if (serviceType.toLowerCase().includes('tire') || serviceType.toLowerCase().includes('rotation')) {
          extracted.serviceType = 'tire_rotation';
        } else if (serviceType.toLowerCase().includes('brake')) {
          extracted.serviceType = 'brake_service';
        } else if (serviceType.toLowerCase().includes('battery')) {
          extracted.serviceType = 'battery_service';
        } else if (serviceType.toLowerCase().includes('inspection')) {
          extracted.serviceType = 'inspection';
        } else {
          extracted.serviceType = 'general_service';
        }
        break;
      }
    }

    // Extract triangle member status
    const trianglePatterns = [
      /(?:triangle|loyalty|member|rewards)\s+(?:member|program|card)/i,
      /(?:have|am|is)\s+(?:a\s+)?(?:triangle|loyalty|rewards)\s+member/i
    ];
    
    for (const pattern of trianglePatterns) {
      const match = transcript.match(pattern);
      if (match) {
        extracted.triangleMember = true;
        break;
      }
    }

    // Extract location preference
    const locationPatterns = [
      /(?:location|store|branch|location)\s*[:\-]?\s*([a-zA-Z\s]+?)(?:\s|\.|$)/i,
      /(?:prefer|want|like)\s+(?:to\s+)?(?:go\s+to|visit)\s+([a-zA-Z\s]+?)(?:\s|\.|$)/i,
      /(?:near|at|in)\s+([a-zA-Z\s]+?)(?:\s|\.|$)/i
    ];
    
    for (const pattern of locationPatterns) {
      const match = transcript.match(pattern);
      if (match) {
        const location = match[1].trim();
        // Map to standardized locations
        const standardizedLocations = [
          'Downtown Toronto', 'North York', 'Scarborough', 'Etobicoke',
          'Mississauga', 'Brampton', 'Vaughan', 'Markham'
        ];
        
        for (const stdLocation of standardizedLocations) {
          if (location.toLowerCase().includes(stdLocation.toLowerCase().split(' ')[0])) {
            extracted.location = stdLocation;
            break;
          }
        }
        if (extracted.location) break;
      }
    }

    // Extract service reason/description
    const reasonPatterns = [
      /(?:because|since|as|reason)\s+([^\.]+)/i,
      /(?:issue|problem|concern)\s*[:\-]?\s*([^\.]+)/i,
      /(?:symptom|sign)\s*[:\-]?\s*([^\.]+)/i
    ];
    
    for (const pattern of reasonPatterns) {
      const match = transcript.match(pattern);
      if (match) {
        extracted.serviceReason = match[1].trim();
        break;
      }
    }

    // Enhanced date and time extraction
    const dateTimeExtracted = this.extractDateTimeFromTranscript(transcript);
    if (dateTimeExtracted.date) {
      extracted.preferredDate = dateTimeExtracted.date;
    }
    if (dateTimeExtracted.time) {
      extracted.preferredTime = dateTimeExtracted.time;
    }

    return extracted;
  }

  // Enhanced date and time extraction
  extractDateTimeFromTranscript(transcript) {
    const extracted = {};
    const lowerTranscript = transcript.toLowerCase();

    // Extract specific dates (e.g., "August 19", "19th August", "next Tuesday")
    const datePatterns = [
      // Specific month and day
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?/i,
      /(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i,
      // Relative dates
      /(today|tomorrow|next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday))/i,
      /(this\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday))/i,
      // Date ranges
      /(next\s+week|this\s+week|following\s+week)/i
    ];

    for (const pattern of datePatterns) {
      const match = transcript.match(pattern);
      if (match) {
        extracted.date = match[0];
        break;
      }
    }

    // Extract specific times
    const timePatterns = [
      // 12-hour format with AM/PM
      /(\d{1,2}):(\d{2})\s*(am|pm)/i,
      /(\d{1,2})\s*(am|pm)/i,
      // 24-hour format
      /(\d{1,2}):(\d{2})/i,
      // Just hour
      /(\d{1,2})\s+(?:o'clock|oclock|am|pm)/i,
      // Time ranges
      /(morning|afternoon|evening|night)/i,
      // Specific time periods
      /(9\s*am|10\s*am|11\s*am|12\s*pm|1\s*pm|2\s*pm|3\s*pm|4\s*pm)/i
    ];

    for (const pattern of timePatterns) {
      const match = transcript.match(pattern);
      if (match) {
        extracted.time = match[0];
        break;
      }
    }

    // Extract time preferences
    const timePreferencePatterns = [
      /(?:prefer|want|like|need)\s+(?:it\s+)?(?:at|around|about)\s+([^\.]+)/i,
      /(?:time|when)\s*[:\-]?\s*([^\.]+)/i,
      /(?:available|free)\s+(?:at|around|about)\s+([^\.]+)/i
    ];

    for (const pattern of timePreferencePatterns) {
      const match = transcript.match(pattern);
      if (match && !extracted.time) {
        extracted.time = match[1].trim();
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

  removeSession(callId) {
    const session = this.sessions.get(callId);
    if (session) {
      this.sessions.delete(callId);
      console.log(`🗑️ Call session removed: ${callId}`);
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
