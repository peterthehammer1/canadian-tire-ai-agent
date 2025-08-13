const moment = require('moment');

class AppointmentManager {
  constructor() {
    this.appointments = [];
    this.serviceTypes = {
      'oil_change': { name: 'Oil Change', duration: 45, wrapUp: 15 },
      'tire_rotation': { name: 'Seasonal Tire Rotation', duration: 45, wrapUp: 15 },
      'general_service': { name: 'General Check-up/Repair', duration: 45, wrapUp: 15 }
    };
    
    this.businessHours = {
      start: '08:00',
      end: '17:00',
      lastAppointment: '16:00'
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
          available: true
        });
      }
      
      // Move to next hour (since each appointment takes 1 hour total)
      currentTime.add(1, 'hour');
    }
    
    // Filter out conflicting appointments
    const conflictingAppointments = this.appointments.filter(apt => 
      apt.date === date && apt.location === location
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

  // Book an appointment
  bookAppointment(appointmentData) {
    // Validate appointment data
    const validation = this.validateAppointmentData(appointmentData);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    // Check if slot is still available
    const availableSlots = this.getAvailableSlots(
      appointmentData.date, 
      appointmentData.location, 
      appointmentData.serviceType
    );
    
    const requestedSlot = availableSlots.find(slot => slot.start === appointmentData.time);
    if (!requestedSlot) {
      throw new Error('Requested time slot is no longer available');
    }
    
    // Create appointment object
    const appointment = {
      id: this.generateId(),
      ...appointmentData,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      slotEnd: requestedSlot.end,
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
      
      const availableSlots = tempManager.getAvailableSlots(
        newDate, 
        newLocation, 
        this.appointments[index].serviceType
      );
      
      const requestedSlot = availableSlots.find(slot => slot.start === newTime);
      if (!requestedSlot) {
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
}

module.exports = AppointmentManager;
