# 🚗 Canadian Tire Service Appointments

A simple, clean appointment booking system for Canadian Tire service department.

## ✨ Features

- **Customer Information Display** - Shows customer details, car information, and service requests
- **Appointment Calendar** - Calendar view of all booked appointments
- **Webhook Integration** - Receives appointment data from Retell AI
- **Simple Dashboard** - Clean, focused interface

## 🚀 Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Open dashboard:**
   ```
   http://localhost:3000/dashboard.html
   ```

### Vercel Deployment

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Simple appointment system"
   git push origin main
   ```

2. **Deploy automatically** via Vercel GitHub integration

## 🔗 API Endpoints

- **`POST /api/webhook`** - Receives appointment data from Retell AI
- **`GET /api/appointments`** - Returns all appointments
- **`GET /health`** - Health check endpoint

## 📱 Webhook Data Format

Send appointment data to `/api/webhook`:

```json
{
  "name": "John Doe",
  "phone": "555-123-4567",
  "email": "john@example.com",
  "carMake": "Toyota",
  "carModel": "Camry",
  "carYear": "2020",
  "serviceType": "Oil Change",
  "location": "Downtown Toronto",
  "preferredDate": "2024-01-15",
  "preferredTime": "10:00 AM"
}
```

## 🎯 What This System Does

1. **Receives webhook data** from Retell AI when customers book appointments
2. **Stores appointment information** in memory (simple, reliable)
3. **Displays customer details** in an organized dashboard
4. **Shows appointment calendar** with dates and times
5. **Auto-refreshes** every 30 seconds

## 🗂️ File Structure

```
├── app.js                 # Main server file
├── public/
│   └── dashboard.html    # Dashboard interface
├── package.json          # Dependencies
├── vercel.json          # Vercel configuration
└── README.md            # This file
```

## 🔧 Configuration

### Retell AI Webhook URL

Set your webhook URL in Retell AI to:
```
https://your-domain.vercel.app/api/webhook
```

### Environment Variables

No environment variables required - this is a simple, self-contained system.

## 📊 Dashboard Features

- **Statistics Cards** - Total appointments, today's count, confirmed/pending
- **Customer List** - All customer information and car details
- **Calendar View** - Appointments organized by date and time
- **Auto-refresh** - Updates every 30 seconds

## 🚨 Important Notes

- **In-memory storage** - Data is lost on server restart
- **Simple design** - Focused on functionality, not complex features
- **Vercel compatible** - Designed for serverless deployment
- **No external databases** - Self-contained for reliability

## 🆘 Troubleshooting

### Dashboard not loading data
- Check that the server is running
- Verify webhook endpoint is accessible
- Check browser console for errors

### Webhook not receiving data
- Verify Retell AI webhook URL is correct
- Check server logs for incoming requests
- Ensure data format matches expected schema

## 📞 Support

This is a simple, focused system. If you need additional features or encounter issues, the system is designed to be easy to modify and extend.
