# 🚗 Canadian Tire Airtable Setup Guide

## 🎯 **What This System Does**

This new system solves your data fragmentation problem by:
1. **Combining all customer data pieces** into one complete record
2. **Storing everything in Airtable** (reliable, no data loss)
3. **Real-time updates** as data comes in from Retell AI
4. **Clean dashboard** showing complete customer information

## 📋 **Step 1: Set Up Airtable**

### **1.1 Create Airtable Account**
- Go to [airtable.com](https://airtable.com)
- Sign up for free account
- Create new workspace

### **1.2 Create New Base**
- Click "Add a base" → "Start from scratch"
- Name it: **"Canadian Tire Service Appointments"**

### **1.3 Create Customers Table**
- Rename first table to **"Customers"**
- Add these fields:

| Field Name | Type | Description |
|------------|------|-------------|
| Name | Single Line Text | Customer's full name |
| Phone | Phone Number | Customer's phone number |
| Email | Email | Customer's email address |
| Car Make | Single Line Text | Vehicle make (Toyota, Honda, etc.) |
| Car Model | Single Line Text | Vehicle model (Camry, Civic, etc.) |
| Car Year | Number | Vehicle year (2020, 2021, etc.) |
| Service Type | Single Select | Oil Change, Tire Rotation, General Service |
| Location | Single Line Text | Preferred Canadian Tire location |
| Preferred Date | Date | Requested appointment date |
| Preferred Time | Single Select | 8:00 AM, 9:00 AM, 10:00 AM, etc. |
| Status | Single Select | Pending, Confirmed, Completed, Cancelled |
| Call ID | Single Line Text | Retell AI call identifier |
| Created At | Created Time | When record was created |
| Last Updated | Last Modified Time | When record was last updated |

### **1.4 Configure Service Type Options**
- Click on "Service Type" field
- Set options: `Oil Change`, `Tire Rotation`, `General Service`

### **1.5 Configure Time Options**
- Click on "Preferred Time" field
- Set options: `8:00 AM`, `9:00 AM`, `10:00 AM`, `11:00 AM`, `12:00 PM`, `1:00 PM`, `2:00 PM`, `3:00 PM`, `4:00 PM`

### **1.6 Configure Status Options**
- Click on "Status" field
- Set options: `Pending`, `Confirmed`, `Completed`, `Cancelled`

## 🔑 **Step 2: Get Airtable Personal Access Token**

### **2.1 Generate Personal Access Token**
- Go to [airtable.com/account](https://airtable.com/account)
- Click **"Personal access tokens"**
- Click **"Create new token"**
- **Name:** "ServiceDept" (or any name you prefer)
- **Scopes needed:**
  - ✅ `data.records:read` - "See the data in records"
  - ✅ `data.records:write` - "Create, edit, and delete records"
  - ✅ `webhook:manage` - "View, create, delete webhooks" (optional but recommended)
- **Access:** Click "+ Add a base" and select your "Canadian Tire Service Appointments" base
- Click **"Create token"**
- **Copy the token** (starts with `pat_...`)

### **2.2 Get Base ID**
- Open your base in Airtable
- Look at the URL: `https://airtable.com/appXXXXXXXXXXXXXX`
- Copy the part after `/app/` (this is your Base ID)

## 🌐 **Step 3: Deploy to Vercel**

### **3.1 Set Environment Variables**
In your Vercel project, add these environment variables:
- `AIRTABLE_PERSONAL_ACCESS_TOKEN` = Your Personal Access Token from step 2.1 (starts with `pat_...`)
- `AIRTABLE_BASE_ID` = Your Base ID from step 2.2

### **3.2 Deploy**
- Push code to GitHub
- Vercel will auto-deploy
- System will be available at your domain

## 📱 **Step 4: Configure Retell AI**

### **4.1 Webhook URL**
Set your webhook URL to:
```
https://your-domain.vercel.app/api/webhook
```

### **4.2 Data Format**
Retell AI should send data in this format:
```json
{
  "callId": "unique-call-identifier",
  "field": "name",
  "value": "John Doe"
}
```

**Important:** Each piece of data should be sent separately with the same `callId` but different `field` and `value`.

## 🎯 **Step 5: Test the System**

### **5.1 Check System Status**
Visit: `https://your-domain.vercel.app/api/status`

### **5.2 View Dashboard**
Visit: `https://your-domain.vercel.app/airtable-dashboard.html`

### **5.3 Make Test Call**
- Call your Retell AI agent
- Give customer information
- Watch data appear in real-time

## 🔧 **How It Works**

### **Data Collection Process:**
1. **Customer calls** Retell AI
2. **AI asks for name** → sends `{"callId": "123", "field": "name", "value": "John Doe"}`
3. **AI asks for phone** → sends `{"callId": "123", "field": "phone", "value": "555-123-4567"}`
4. **AI asks for car** → sends `{"callId": "123", "field": "carMake", "value": "Toyota"}`
5. **System combines** all pieces into one customer record
6. **Record created** in Airtable when complete
7. **Dashboard updates** in real-time

### **Required Fields:**
- `name` (required)
- `phone` (required)
- `serviceType` (required)
- `location` (required)

## 📊 **Dashboard Features**

- **Real-time status** of system
- **Customer information** display
- **Appointment calendar** view
- **Statistics** (total customers, completed, errors)
- **Data source indicator** (Airtable vs Cache)
- **Auto-refresh** every 30 seconds

## 🚨 **Troubleshooting**

### **Dashboard shows "No customers found"**
- Check Airtable API key and Base ID
- Verify environment variables in Vercel
- Check webhook endpoint is accessible

### **Data not appearing**
- Verify Retell AI webhook URL
- Check webhook data format
- Look at server logs for errors

### **Airtable errors**
- Verify API key has access to base
- Check field names match exactly
- Ensure required fields are filled

## 🎉 **Success Indicators**

✅ **Dashboard loads** without errors  
✅ **Status shows** "System Ready"  
✅ **Data appears** after making calls  
✅ **Airtable shows** customer records  
✅ **Real-time updates** work  

## 📞 **Support**

If you encounter issues:
1. Check the console for error messages
2. Verify all environment variables
3. Test webhook endpoint manually
4. Check Airtable permissions

This system will solve your data fragmentation problem and give you reliable, organized customer data! 🚀
