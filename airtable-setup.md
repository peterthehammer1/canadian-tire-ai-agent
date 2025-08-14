# 🚗 Airtable Setup for Canadian Tire Appointments

## 📊 **Database Structure**

### **Base Name:** Canadian Tire Service Appointments

### **Table 1: Customers**
| Field Name | Type | Description |
|------------|------|-------------|
| Customer ID | Auto Number | Unique identifier |
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

### **Table 2: Appointments**
| Field Name | Type | Description |
|------------|------|-------------|
| Appointment ID | Auto Number | Unique identifier |
| Customer | Link to Customers | Links to customer record |
| Date | Date | Confirmed appointment date |
| Time | Single Select | Confirmed appointment time |
| Service Type | Single Select | Service being performed |
| Location | Single Line Text | Canadian Tire location |
| Status | Single Select | Scheduled, In Progress, Completed |
| Notes | Long Text | Additional notes |
| Created At | Created Time | When appointment was created |

## 🔗 **Relationships**
- **Customers** → **Appointments** (One-to-Many)
- Each customer can have multiple appointments
- Appointments are linked to customer records

## 📱 **Data Flow**
1. **Retell AI** sends customer data to webhook
2. **Webhook** combines all pieces into one customer record
3. **Airtable** stores complete customer information
4. **Dashboard** reads from Airtable and displays data
5. **Real-time updates** as new data comes in

## 🎯 **Benefits**
- ✅ **No data fragmentation** - all info in one record
- ✅ **Reliable storage** - no data loss
- ✅ **Easy to manage** - visual interface
- ✅ **Real-time updates** - instant data sync
- ✅ **Structured data** - easy to query and display
