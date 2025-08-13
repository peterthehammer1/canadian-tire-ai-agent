# 🚀 Quick Start Guide - Canadian Tire AI Agent

Get your Canadian Tire AI Customer Service Agent up and running in minutes!

## ⚡ 5-Minute Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp env.example .env
# Edit .env and add your API key
```

### 3. Start the Application
```bash
npm start
```

### 4. Test the API
```bash
curl http://localhost:3001/health
```

### 5. Open Demo Interface
Visit: http://localhost:3001

## 🔑 What You Need

- **API Key**: Get one from your AI service provider
- **Node.js 16+**: Download from [nodejs.org](https://nodejs.org)

## 📱 Test the Agent

### Check Available Appointments
```bash
curl -X POST http://localhost:3001/api/check-availability \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-15",
    "location": "Toronto Downtown",
    "serviceType": "oil_change"
  }'
```

### Book an Appointment
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

## 🎯 Key Features

- ✅ **Smart Scheduling**: 45-min service + 15 min wrap-up
- ✅ **Service Types**: Oil Change, Tire Rotation, General Service
- ✅ **Business Hours**: 8 AM - 5 PM (last appointment at 4 PM)
- ✅ **Customer Info Collection**: All required fields
- ✅ **Roadside Assistance Promotion**: Built-in reminder
- ✅ **AI Integration**: Voice-based customer service

## 🚨 Troubleshooting

**Port already in use?**
```bash
# Change port in .env file
PORT=3002
```

**API key issues?**
```bash
# Verify your API key is correct
# Check .env file has API_KEY=your_key_here
```

**Dependencies not installing?**
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 📚 Next Steps

1. **Read the full README.md** for detailed documentation
2. **Check DEPLOYMENT.md** for production deployment
3. **Customize agent-config.json** for your specific needs
4. **Test with the demo interface** at http://localhost:3001
5. **Integrate with your AI service** for voice calls

## 🆘 Need Help?

- Check the logs: `npm start` shows detailed output
- Review the API responses for error messages
- Verify your API key configuration
- Check the health endpoint: http://localhost:3001/health

---

**Happy coding! 🚗✨**
