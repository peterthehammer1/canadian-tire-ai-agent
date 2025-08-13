# Canadian Tire AI Customer Service Agent

An intelligent AI-powered customer service agent that helps customers book automotive service appointments at Canadian Tire locations.

## 🚗 Features

- **Intelligent Appointment Booking**: AI agent collects all required information and books service appointments
- **Service Types Supported**:
  - Oil Change (45 min + 15 min wrap-up)
  - Seasonal Tire Rotation (45 min + 15 min wrap-up)
  - General Check-up/Repair (45 min + 15 min wrap-up)
- **Smart Scheduling**: Automatically finds available time slots based on business hours
- **Customer Information Collection**: Gathers all necessary details for service booking
- **Roadside Assistance Promotion**: Ends every call with a reminder about Canadian Tire's roadside assistance program

## 📋 Required Customer Information

The AI agent collects the following information during each call:

1. **Canadian Tire location** (city/store)
2. **Full Name**
3. **Phone Number**
4. **Email**
5. **Car Make**
6. **Car Model**
7. **Car Year**
8. **Service type** (Oil Change, Seasonal Tire Rotation, or General Check-up/Repair)
9. **Loyalty program membership status**

## 🕒 Business Hours & Scheduling

- **Service Hours**: 8:00 AM - 5:00 PM
- **Last Appointment**: 4:00 PM
- **Appointment Duration**: 45 minutes service + 15 minutes wrap-up = 1 hour total
- **Available Time Slots**: 8:00 AM, 9:00 AM, 10:00 AM, 11:00 AM, 12:00 PM, 1:00 PM, 2:00 PM, 3:00 PM, 4:00 PM

## 🛠️ Technical Requirements

- Node.js 16+ 
- npm or yarn
- AI service API key

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd canadian-tire-ai-agent
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy the environment template and add your API key:
```bash
cp env.example .env
```

Edit `.env` and add your API key:
```env
API_KEY=your_actual_api_key_here
PORT=3001
NODE_ENV=development
```

### 4. Start the Application
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The application will be available at `http://localhost:3001`

## 📡 API Endpoints

### Appointment Management
- `POST /api/check-availability` - Check available appointment slots
- `POST /api/book-appointment` - Book a new appointment
- `GET /api/appointments` - Get all appointments (with optional filters)
- `GET /api/appointments/:id` - Get specific appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

### Information & Statistics
- `GET /api/service-types` - Get available service types
- `GET /api/business-hours` - Get business hours
- `GET /api/statistics` - Get appointment statistics for a date/location
- `GET /health` - Health check endpoint

### AI Integration
- `POST /webhook/ai` - Webhook endpoint for AI service events

## 🤖 AI Agent Configuration

The AI agent is configured through `agent-config.json` and includes:

- **Voice**: Professional female voice (en-US-Neural2-F)
- **Language**: English (US)
- **Initial Message**: Welcoming greeting
- **Detailed Prompt**: Comprehensive instructions for appointment booking

## 📱 Usage Examples

### Check Availability
```bash
curl -X POST http://localhost:3001/api/check-availability \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-15",
    "location": "Toronto Downtown",
    "serviceType": "oil_change"
  }'
```

### Book Appointment
```bash
curl -X POST http://localhost:3001/api/book-appointment \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Toronto Downtown",
    "fullName": "John Doe",
    "phoneNumber": "416-555-0123",
    "email": "john.doe@email.com",
    "carMake": "Toyota",
    "carModel": "Camry",
    "carYear": "2020",
    "serviceType": "oil_change",
    "loyaltyMember": true,
    "date": "2024-01-15",
    "time": "10:00"
  }'
```

## 🔧 Customization

### Adding New Service Types
Edit `appointment-manager.js` and add new service types to the `serviceTypes` object:

```javascript
this.serviceTypes = {
  'oil_change': { name: 'Oil Change', duration: 45, wrapUp: 15 },
  'tire_rotation': { name: 'Seasonal Tire Rotation', duration: 45, wrapUp: 15 },
  'general_service': { name: 'General Check-up/Repair', duration: 45, wrapUp: 15 },
  'brake_service': { name: 'Brake Service', duration: 90, wrapUp: 15 } // New service
};
```

### Modifying Business Hours
Update the `businessHours` object in `appointment-manager.js`:

```javascript
this.businessHours = {
  start: '07:00',  // Earlier start time
  end: '18:00',    // Later end time
  lastAppointment: '17:00'  // Last appointment time
};
```

## 🗄️ Data Storage

Currently, the application uses in-memory storage for appointments. For production use, consider implementing:

- **Database**: PostgreSQL, MongoDB, or MySQL
- **Caching**: Redis for session management
- **File Storage**: For customer documents and service records

## 🚨 Production Considerations

1. **Security**: Implement proper authentication and authorization
2. **Rate Limiting**: Add API rate limiting to prevent abuse
3. **Logging**: Implement comprehensive logging and monitoring
4. **Error Handling**: Add proper error handling and user feedback
5. **Database**: Replace in-memory storage with persistent database
6. **SSL**: Use HTTPS in production
7. **Environment Variables**: Secure all sensitive configuration

## 📞 AI Integration

The agent integrates with AI services for:

- **Voice Calls**: Handle customer service calls
- **Natural Language Processing**: Understand customer requests
- **Appointment Management**: Seamlessly book appointments
- **Customer Interaction**: Professional and helpful service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For technical support or questions about the Canadian Tire AI agent, please contact the development team.

---

**Note**: This is a demonstration project. For production use with Canadian Tire, ensure compliance with all company policies, data protection regulations, and security requirements.
