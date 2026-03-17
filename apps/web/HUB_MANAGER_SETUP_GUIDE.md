# Hub Manager Authentication & Dashboard - Complete Setup Guide

## Overview

Hub managers now have a dedicated login and dashboard system. They can log in with their email and password, view their hub information, manage riders and vehicles, and access order statistics.

---

## 🚀 Quick Start: Test Hub Manager Login

### Test Account Details
- **Email**: `rajesh@inneedit.com`
- **Password**: `demo1234`

### Login Steps
1. Navigate to `/login` page
2. Click the **"Hub Manager"** tab
3. Enter email: `rajesh@inneedit.com`
4. Enter password: `demo1234`
5. Click **"Sign In"**
6. You'll be redirected to `/hub-manager-dashboard`

---

## 📋 What Was Built

### 1. Database Changes
- **New Table**: `hub_managers` - stores manager information linked to hubs
  - Fields: id, user_id, hub_id, manager_name, manager_email, manager_phone, password_hash, status, created_at, updated_at

### 2. Authentication System
- **Login Endpoint**: `POST /api/hub-manager-auth/login`
  - Accepts email and password
  - Creates session with 30-day expiry
  - Returns manager and hub information

- **Password Setup Endpoint**: `POST /api/hub-manager-auth/set-password`
  - For admins to set manager passwords
  - Uses SHA256 hashing

### 3. Dashboard Pages
- **Page**: `/hub-manager-dashboard`
  - Displays hub information
  - Shows list of assigned riders
  - Shows list of hub vehicles
  - Displays quick statistics (active riders, vehicles, daily orders)

### 4. API Endpoints
- `GET /api/hub-managers/dashboard` - Get hub manager's info and hub details
- `GET /api/hub-managers/riders?hubId=X` - List all riders at a hub
- `GET /api/hub-managers/vehicles?hubId=X` - List all vehicles at a hub
- `GET /api/hub-managers/orders?hubId=X` - Get order statistics for a hub

### 5. Updated Components
- **Login Page** (`/app/login/page.tsx`): 
  - Added "Hub Manager" tab
  - Routes to `/api/hub-manager-auth/login`
  - Redirects to `/hub-manager-dashboard` after login

- **Home Page** (`/app/page.tsx`): 
  - Redirects hub managers to their dashboard

---

## 🔧 How to Create Hub Manager Accounts

### Method 1: Database Direct (Quick)
```sql
-- Step 1: Create user account
INSERT INTO "user" (id, name, email, role, "emailVerified", "createdAt", "updatedAt")
VALUES ('unique-id-here', 'Manager Name', 'manager@email.com', 'hub_manager', true, NOW(), NOW());

-- Step 2: Create hub manager
INSERT INTO hub_managers (user_id, hub_id, manager_name, manager_email, manager_phone, password_hash, status)
VALUES (
  'unique-id-here', 
  1,  -- hub_id (get from hubs table)
  'Manager Name', 
  'manager@email.com', 
  '+91-9876543210', 
  '0c9c1d19487186c62a6b3f2a23dc11c5be94b1c5644ad8e81f3e03e43d89d68f',  -- SHA256 of "demo1234"
  'active'
);
```

### Method 2: Use Password Setup API (Recommended for Production)

First, create the manager without password:
```sql
INSERT INTO "user" (id, name, email, role, "emailVerified", "createdAt", "updatedAt")
VALUES ('manager-id', 'Manager Name', 'manager@email.com', 'hub_manager', true, NOW(), NOW());

INSERT INTO hub_managers (user_id, hub_id, manager_name, manager_email, manager_phone, status)
VALUES ('manager-id', 1, 'Manager Name', 'manager@email.com', '+91-9876543210', 'active');
```

Then use the API to set password:
```bash
curl -X POST http://localhost:3000/api/hub-manager-auth/set-password \
  -H "Content-Type: application/json" \
  -d '{
    "managerId": 1,
    "password": "YourSecurePassword123"
  }'
```

---

## 🎯 Hub Manager Dashboard Features

The dashboard displays:

### Quick Stats (Top Cards)
- **Active Riders**: Count of riders with 'active' status
- **Total Vehicles**: Count of vehicles at the hub
- **Orders Today**: Orders delivered today
- **Hub Capacity**: Percentage of hub capacity used (riders/100)

### Hub Information Section
- Hub name, code, location, city, state, pincode
- Manager name, email, phone

### Riders Table
Shows all riders assigned to the hub:
- Full name
- CEE ID
- Phone number
- Vehicle type
- Status (Active/Inactive)

### Vehicles Table
Shows all vehicles at the hub:
- Vehicle number
- Vehicle type
- Model
- Year
- Status (Active/Inactive)

---

## 🔐 Security Features

✅ **Session Management**
- 30-day session tokens
- HTTP-only cookies
- Automatic expiration

✅ **Role-Based Access Control**
- Only 'hub_manager' role can access dashboard
- Automatic redirect to login for unauthorized access

✅ **Password Hashing**
- SHA256 hashing (for demo/testing)
- Recommendation: Use bcrypt in production

✅ **Data Isolation**
- Hub managers only see their own hub's data
- Cannot access other hubs' information

---

## 📝 Password Hash Reference

Common test passwords and their SHA256 hashes:
- `demo1234` → `0c9c1d19487186c62a6b3f2a23dc11c5be94b1c5644ad8e81f3e03e43d89d68f`

To generate a hash for any password in your terminal:
```bash
# macOS/Linux
echo -n "yourpassword" | shasum -a 256

# or using OpenSSL
echo -n "yourpassword" | openssl dgst -sha256
```

---

## 🚀 Next Steps & Enhancements

### Recommended Improvements

1. **Password Reset Feature**
   - Add `/api/hub-manager-auth/forgot-password` endpoint
   - Email reset link with token

2. **Rider & Vehicle Management**
   - Allow managers to add new riders
   - Allow managers to assign/reassign vehicles
   - Implement bulk import via CSV

3. **Advanced Reporting**
   - Daily/weekly/monthly performance reports
   - Earnings breakdown
   - Attendance tracking

4. **Notification System**
   - Alert managers about pending approvals
   - Order delivery notifications
   - Rider performance alerts

5. **Approval Workflows**
   - Hub managers approve rider advances/deductions
   - Manager reports sent to admin
   - Audit trail for changes

6. **Security Upgrades**
   - Switch to bcrypt for password hashing
   - Implement 2FA (Two-Factor Authentication)
   - IP whitelisting

---

## 🐛 Troubleshooting

### "Email not found" error
- Ensure the manager's email exists in the `hub_managers` table
- Check email is spelled correctly (case-insensitive)

### "Your account is not active" error
- Check manager's status in database: `SELECT status FROM hub_managers WHERE manager_email = 'email@example.com'`
- Update if needed: `UPDATE hub_managers SET status = 'active' WHERE manager_email = 'email@example.com'`

### "Password not set" error
- The password_hash field is NULL
- Use the password setup API or update database directly with a valid SHA256 hash

### Dashboard shows no data
- Check if riders/vehicles have the correct `assigned_hub_id`
- Verify the hub_id in the hub_managers table matches the hub_id in riders/vehicles tables

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the API endpoint implementations in `/app/api/hub-managers/`
3. Check browser console and server logs for detailed error messages

---

## 📁 Files Created

- `/app/api/hub-manager-auth/login/route.ts` - Login endpoint
- `/app/api/hub-manager-auth/set-password/route.ts` - Password setup endpoint
- `/app/api/hub-managers/dashboard/route.ts` - Dashboard data
- `/app/api/hub-managers/riders/route.ts` - Riders list
- `/app/api/hub-managers/vehicles/route.ts` - Vehicles list
- `/app/api/hub-managers/orders/route.ts` - Order stats
- `/app/hub-manager-dashboard/page.tsx` - Dashboard UI

## 📝 Files Modified

- `/app/login/page.tsx` - Hub manager login flow
- `/app/page.tsx` - Dashboard redirect logic
