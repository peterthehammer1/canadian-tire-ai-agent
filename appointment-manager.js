const moment = require('moment');

class AppointmentManager {
  constructor() {
    this.appointments = [];
    this.serviceTypes = {
      'oil_change': { name: 'Oil Change', duration: 45, wrapUp: 15 },
      'tire_rotation': { name: 'Seasonal Tire Rotation', duration: 45, wrapUp: 15 },
      'general_service': { name: 'General Check-up/Repair', duration: 45, wrapUp: 15 },
      'brake_service': { name: 'Brake Service', duration: 60, wrapUp: 15 },
      'battery_service': { name: 'Battery Service', duration: 30, wrapUp: 15 },
      'inspection': { name: 'Vehicle Inspection', duration: 45, wrapUp: 15 }
    };
    
    this.businessHours = {
      start: '08:00',
      end: '17:00',
      lastAppointment: '16:00'
    };

    this.locations = [
      'Downtown Toronto',
      'North York',
      'Scarborough',
      'Etobicoke',
      'Mississauga',
      'Brampton',
      'Vaughan',
      'Markham'
    ];
  }

  // Parse natural language date/time into structured format
  parseNaturalDateTime(dateTimeString) {
    const lowerString = dateTimeString.toLowerCase();
    
    // Handle relative dates
    if (lowerString.includes('today')) {
      const today = moment();
      return this.extractTimeFromString(dateTimeString, today);
    } else if (lowerString.includes('tomorrow')) {
      const tomorrow = moment().add(1, 'day');
      return this.extractTimeFromString(dateTimeString, tomorrow);
    } else if (lowerString.includes('next week')) {
      const nextWeek = moment().add(1, 'week');
      return this.extractTimeFromString(dateTimeString, nextWeek);
    }
    
    // Handle specific days of the week
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (let i = 0; i < daysOfWeek.length; i++) {
      if (lowerString.includes(daysOfWeek[i])) {
        const targetDay = moment().day(i + 1);
        if (targetDay.isBefore(moment(), 'day')) {
          targetDay.add(1, 'week');
        }
        return this.extractTimeFromString(dateTimeString, targetDay);
      }
    }
    
    // Handle specific dates (e.g., "August 19", "19th August")
    const datePatterns = [
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?/i,
      /(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i
    ];
    
    for (const pattern of datePatterns) {
      const match = dateTimeString.match(pattern);
      if (match) {
        let month, day;
        if (isNaN(match[1])) {
          month = match[1];
          day = parseInt(match[2]);
        } else {
          month = match[2];
          day = parseInt(match[1]);
        }
        
        const currentYear = moment().year();
        let targetDate = moment(`${month} ${day}, ${currentYear}`, 'MMMM D, YYYY');
        
        // If the date has passed this year, try next year
        if (targetDate.isBefore(moment(), 'day')) {
          targetDate = moment(`${month} ${day}, ${currentYear + 1}`, 'MMMM D, YYYY');
        }
        
        return this.extractTimeFromString(dateTimeString, targetDate);
      }
    }
    
    // Default to today if no date found
    return this.extractTimeFromString(dateTimeString, moment());
  }

  // Extract time from string and combine with date
  extractTimeFromString(dateTimeString, date) {
    const timePatterns = [
      /(\d{1,2}):(\d{2})\s*(am|pm)/i,
      /(\d{1,2})\s*(am|pm)/i,
      /(\d{1,2}):(\d{2})/i,
      /(\d{1,2})/i
    ];
    
    for (const pattern of timePatterns) {
      const match = dateTimeString.match(pattern);
      if (match) {
        let hour = parseInt(match[1]);
        let minute = match[2] ? parseInt(match[2]) : 0;
        const period = match[3] ? match[3].toLowerCase() : null;
        
        // Convert to 24-hour format
        if (period === 'pm' && hour !== 12) {
          hour += 12;
        } else if (period === 'am' && hour === 12) {
          hour = 0;
        }
        
        // Ensure hour is within business hours
        if (hour < 8) hour = 8;
        if (hour > 16) hour = 16;
        
        return {
          date: date.format('YYYY-MM-DD'),
          time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          parsed: true
        };
      }
    }
    
    // Default time if none found
    return {
      date: date.format('YYYY-MM-DD'),
      time: '09:00',
      parsed: false
    };
  }

  // Get available appointment slots for a specific date and location
  getAvailableSlots(date, location, serviceType = null) {
    const service = serviceType ? this.serviceTypes[serviceType] : this.serviceTypes.oil_change;
    const totalDuration = service.duration + service.wrapUp; // 60 minutes total
    
    // Generate all possible time slots
    const slots = [];
    let currentTime = moment(date + ' ' + this.businessHours.start, 'YYYY-MM-DD HH:mm');
    const endTime = moment(date + ' ' + this.businessHours.lastAppointment, 'YYYY-MM-DD HH:mm');
    
    while (currentTime.isBefore(endTime) || currentTime.isSame(endTime)) {
      const slotEnd = currentTime.clone().add(totalDuration, 'minutes');
      
      // Check if slot conflicts with business hours
      if (slotEnd.isBefore(moment(date + ' ' + this.businessHours.end, 'YYYY-MM-DD HH:mm'))) {
        slots.push({
          start: currentTime.format('HH:mm'),
          end: slotEnd.format('HH:mm'),
          available: true,
          formatted: currentTime.format('h:mm A')
        });
      }
      
      // Move to next hour (since each appointment takes 1 hour total)
      currentTime.add(1, 'hour');
    }
    
    // Filter out conflicting appointments
    const conflictingAppointments = this.appointments.filter(apt => 
      apt.date === date && apt.location === location && apt.status === 'confirmed'
    );
    
    return slots.map(slot => {
      const hasConflict = conflictingAppointments.some(apt => {
        const aptStart = moment(date + ' ' + apt.time, 'YYYY-MM-DD HH:mm');
        const aptEnd = aptStart.clone().add(60, 'minutes');
        const slotStart = moment(date + ' ' + slot.start, 'YYYY-MM-DD HH:mm');
        const slotEnd = moment(date + ' ' + slot.end, 'YYYY-MM-DD HH:mm');
        
        return (slotStart.isBefore(aptEnd) && slotEnd.isAfter(aptStart));
      });
      
      return {
        ...slot,
        available: !hasConflict
      };
    }).filter(slot => slot.available);
  }

  // Check if a specific time slot is available
  isSlotAvailable(date, time, location, serviceType = null) {
    const availableSlots = this.getAvailableSlots(date, location, serviceType);
    return availableSlots.some(slot => slot.start === time);
  }

  // Book an appointment from call session data
  bookAppointmentFromSession(sessionData) {
    const { customerInfo, appointmentDetails } = sessionData;
    
    // Parse date and time from customer preferences
    let appointmentDate, appointmentTime;
    
    if (customerInfo.preferredDate && customerInfo.preferredTime) {
      // Try to parse natural language
      const parsed = this.parseNaturalDateTime(`${customerInfo.preferredDate} ${customerInfo.preferredTime}`);
      appointmentDate = parsed.date;
      appointmentTime = parsed.time;
    } else if (appointmentDetails && appointmentDetails.date && appointmentDetails.time) {
      appointmentDate = appointmentDetails.date;
      appointmentTime = appointmentDetails.time;
    } else {
      throw new Error('No appointment date and time specified');
    }
    
    // Check availability
    if (!this.isSlotAvailable(appointmentDate, appointmentTime, customerInfo.location, customerInfo.serviceType)) {
      throw new Error(`The requested time slot (${appointmentDate} at ${appointmentTime}) is not available. Please choose another time.`);
    }
    
    // Create appointment object
    const appointment = {
      id: this.generateId(),
      callId: sessionData.callId,
      date: appointmentDate,
      time: appointmentTime,
      location: customerInfo.location,
      fullName: customerInfo.name,
      phoneNumber: customerInfo.phone,
      email: customerInfo.email,
      carMake: customerInfo.carMake,
      carModel: customerInfo.carModel,
      carYear: customerInfo.carYear,
      serviceType: customerInfo.serviceType || 'general_service',
      loyaltyMember: customerInfo.triangleMember || false,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      slotEnd: moment(appointmentDate + ' ' + appointmentTime, 'YYYY-MM-DD HH:mm').add(1, 'hour').format('HH:mm'),
      totalDuration: 60,
      notes: customerInfo.serviceReason || ''
    };
    
    this.appointments.push(appointment);
    
    // Update the call session
    if (sessionData.callId) {
      // This would typically be done through the call session manager
      console.log(`✅ Appointment booked from call session: ${appointment.id}`);
    }
    
    return appointment;
  }

  // Book an appointment (legacy method)
  bookAppointment(appointmentData) {
    // Validate appointment data
    const validation = this.validateAppointmentData(appointmentData);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    // Check if slot is still available
    if (!this.isSlotAvailable(appointmentData.date, appointmentData.time, appointmentData.location, appointmentData.serviceType)) {
      throw new Error('Requested time slot is no longer available');
    }
    
    // Create appointment object
    const appointment = {
      id: this.generateId(),
      ...appointmentData,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      slotEnd: moment(appointmentData.date + ' ' + appointmentData.time, 'YYYY-MM-DD HH:mm').add(1, 'hour').format('HH:mm'),
      totalDuration: 60
    };
    
    this.appointments.push(appointment);
    return appointment;
  }

  // Validate appointment data
  validateAppointmentData(data) {
    const requiredFields = [
      'location', 'fullName', 'phoneNumber', 'email',
      'carMake', 'carModel', 'carYear', 'serviceType',
      'loyaltyMember', 'date', 'time'
    ];
    
    const missingFields = requiredFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
      return {
        valid: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      };
    }
    
    // Validate date format
    if (!moment(data.date, 'YYYY-MM-DD', true).isValid()) {
      return {
        valid: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      };
    }
    
    // Validate time format
    if (!moment(data.time, 'HH:mm', true).isValid()) {
      return {
        valid: false,
        error: 'Invalid time format. Use HH:mm'
      };
    }
    
    // Check if date is in the future
    if (moment(data.date).isBefore(moment(), 'day')) {
      return {
        valid: false,
        error: 'Cannot book appointments for past dates'
      };
    }
    
    // Check if date is not too far in the future (e.g., 3 months)
    if (moment(data.date).isAfter(moment().add(3, 'months'))) {
      return {
        valid: false,
        error: 'Cannot book appointments more than 3 months in advance'
      };
    }
    
    // Validate service type
    if (!this.serviceTypes[data.serviceType]) {
      return {
        valid: false,
        error: `Invalid service type. Available types: ${Object.keys(this.serviceTypes).join(', ')}`
      };
    }
    
    // Check if location is valid
    if (!this.locations.includes(data.location)) {
      return {
        valid: false,
        error: `Invalid location. Available locations: ${this.locations.join(', ')}`
      };
    }
    
    return { valid: true };
  }

  // Get appointment by ID
  getAppointment(id) {
    return this.appointments.find(apt => apt.id === id);
  }

  // Update appointment
  updateAppointment(id, updates) {
    const index = this.appointments.findIndex(apt => apt.id === id);
    if (index === -1) {
      throw new Error('Appointment not found');
    }
    
    // If updating time/date, check availability
    if (updates.time || updates.date) {
      const newDate = updates.date || this.appointments[index].date;
      const newTime = updates.time || this.appointments[index].time;
      const newLocation = updates.location || this.appointments[index].location;
      
      // Temporarily remove this appointment to check availability
      const tempAppointments = this.appointments.filter(apt => apt.id !== id);
      const tempManager = new AppointmentManager();
      tempManager.appointments = tempAppointments;
      
      if (!tempManager.isSlotAvailable(newDate, newTime, newLocation, this.appointments[index].serviceType)) {
        throw new Error('Requested time slot is not available');
      }
    }
    
    this.appointments[index] = { ...this.appointments[index], ...updates };
    return this.appointments[index];
  }

  // Cancel appointment
  cancelAppointment(id) {
    const index = this.appointments.findIndex(apt => apt.id === id);
    if (index === -1) {
      throw new Error('Appointment not found');
    }
    
    this.appointments[index].status = 'cancelled';
    return this.appointments[index];
  }

  // Get appointments with filters
  getAppointments(filters = {}) {
    let filtered = [...this.appointments];
    
    if (filters.date) {
      filtered = filtered.filter(apt => apt.date === filters.date);
    }
    
    if (filters.location) {
      filtered = filtered.filter(apt => apt.location === filters.location);
    }
    
    if (filters.status) {
      filtered = filtered.filter(apt => apt.status === filters.status);
    }
    
    if (filters.serviceType) {
      filtered = filtered.filter(apt => apt.serviceType === filters.serviceType);
    }
    
    if (filters.customerName) {
      filtered = filtered.filter(apt => 
        apt.fullName.toLowerCase().includes(filters.customerName.toLowerCase())
      );
    }
    
    return filtered.sort((a, b) => moment(a.date + ' ' + a.time).diff(moment(b.date + ' ' + b.time)));
  }

  // Get all confirmed appointments for a specific date range
  getConfirmedAppointments(startDate, endDate, location = null) {
    const start = moment(startDate);
    const end = moment(endDate);
    
    let filtered = this.appointments.filter(apt => 
      apt.status === 'confirmed' &&
      moment(apt.date).isBetween(start, end, 'day', '[]')
    );
    
    if (location) {
      filtered = filtered.filter(apt => apt.location === location);
    }
    
    return filtered.sort((a, b) => moment(a.date + ' ' + a.time).diff(moment(b.date + ' ' + b.time)));
  }

  // Generate unique ID
  generateId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // Get business hours
  getBusinessHours() {
    return this.businessHours;
  }

  // Get service types
  getServiceTypes() {
    return this.serviceTypes;
  }

  // Get available locations
  getLocations() {
    return this.locations;
  }

  // Get appointment statistics
  getStatistics(date, location) {
    const dayAppointments = this.appointments.filter(apt => 
      apt.date === date && apt.location === location && apt.status === 'confirmed'
    );
    
    const totalBooked = dayAppointments.length;
    const totalSlots = 9; // 8 AM to 4 PM = 9 slots
    const availableSlots = totalSlots - totalBooked;
    
    const serviceBreakdown = {};
    dayAppointments.forEach(apt => {
      serviceBreakdown[apt.serviceType] = (serviceBreakdown[apt.serviceType] || 0) + 1;
    });
    
    return {
      date,
      location,
      totalBooked,
      totalSlots,
      availableSlots,
      utilizationRate: ((totalBooked / totalSlots) * 100).toFixed(1) + '%',
      serviceBreakdown
    };
  }

  // Get next available slot for a specific date and location
  getNextAvailableSlot(date, location, serviceType = null) {
    const availableSlots = this.getAvailableSlots(date, location, serviceType);
    return availableSlots.length > 0 ? availableSlots[0] : null;
  }

  // Suggest alternative times when requested slot is unavailable
  suggestAlternativeTimes(date, location, serviceType = null, count = 3) {
    const availableSlots = this.getAvailableSlots(date, location, serviceType);
    return availableSlots.slice(0, count);
  }
}

module.exports = AppointmentManager;
