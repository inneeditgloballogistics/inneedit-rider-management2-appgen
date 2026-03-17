# Hub Manager Login & Credentials Guide

## Overview
Hub managers are authorized personnel assigned to manage and monitor specific hubs within the inneedit platform. They can login to their dedicated hub manager dashboard using email and password credentials.

---

## 📋 For Administrators: Creating Hub Manager Credentials

### Step 1: Add Hub Manager Email to Hub
1. Go to **Admin Dashboard** → **Hubs** tab
2. Click **"Add Hub"** or **"Edit"** an existing hub
3. In the **"Hub In-charge"** section, add:
   - **Name**: Hub manager's full name
   - **Email Address**: Manager's email (e.g., `rajesh@inneedit.com`) ⭐ **Required for login**
   - **Phone Number**: Contact number
4. Save the hub

### Step 2: Generate Login Credentials
1. Go to **Admin Dashboard** → Click on **Hubs** → Switch to **"Manager Credentials"** tab
2. Click **"Generate Hub Manager Credentials"**
3. **Select Hub**: Choose the hub and manager from the list
4. **Enter Email**: The manager's email address (should match the hub's manager email)
5. **Enter Password**: 
   - Manually enter a secure password, OR
   - Click **Generate** button to auto-generate a strong random password
6. Click **"Create Credentials"** button
7. **Copy and securely share** the credentials with the hub manager:
   - Email address
   - Password
   - Login URL: `/login`

### Step 3: Share Login Information
Send the manager the following information through a secure channel:
```
Hub Manager Login Credentials
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hub Name: [Hub Name]
Hub Code: [Hub Code]

Email: [manager_email@inneedit.com]
Password: [SecurePassword123!]

Login URL: https://yourapp.com/login
(Select "Hub Manager" tab)

First Login: Please update your password after first login.
```

---

## 🔐 For Hub Managers: Logging In

### Step 1: Access Login Page
1. Open the application URL and go to `/login`
2. You'll see 4 login tabs: **Admin**, **Rider**, **Hub Manager**, **Technician**
3. Click on the **"Hub Manager"** tab

### Step 2: Enter Credentials
- **Manager Email**: Enter the email provided by admin
- **Password**: Enter the password provided by admin
- Click **"Sign In"** button

### Step 3: Access Your Dashboard
After successful login, you'll be redirected to `/hub-manager-dashboard` where you can:

---

## 📊 Hub Manager Dashboard Features

Once logged in, hub managers can access:

### 1. **Hub Information**
- View complete hub details (name, code, location, coordinates)
- See manager information
- View hub contact details

### 2. **Rider Management**
- View all riders assigned to their hub
- See rider status (active, inactive, suspended)
- Monitor rider details and assignments
- Track rider performance metrics

### 3. **Vehicle Monitoring**
- View all vehicles assigned to the hub
- Check vehicle status (available, assigned, maintenance)
- See vehicle details and assignments
- Monitor vehicle inventory

### 4. **Daily Statistics**
- View daily order counts
- Monitor hub capacity and utilization
- Track active riders and vehicles
- View performance metrics

### 5. **Weather Information**
- Real-time weather data for the hub location
- Temperature, humidity, wind speed
- Weather-based operational insights

---

## 🔄 Password Management

### First Login
After receiving credentials:
1. Login with the provided email and password
2. You can change your password if needed via API call to `/api/admin/hub-manager-credentials` (PUT request)

### Changing Password
Hub managers can update their password using:
```
PUT /api/admin/hub-manager-credentials
{
  "email": "manager@inneedit.com",
  "old_password": "CurrentPassword123",
  "new_password": "NewPassword123"
}
```

### Forgot Password
If a hub manager forgets their password:
1. Contact the admin
2. Admin can generate new credentials using the **Manager Credentials Generator**
3. Admin shares the new credentials securely

---

## 🗄️ Database Schema

### hub_managers Table
```sql
CREATE TABLE hub_managers (
  id SERIAL PRIMARY KEY,
  hub_id INTEGER NOT NULL UNIQUE,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  manager_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (hub_id) REFERENCES hubs(id)
);
```

### hubs Table (Updated)
The `hubs` table includes:
- `manager_email` - Email used for login (must be unique)
- `manager_name` - Full name of the hub manager
- `manager_phone` - Contact number

---

## ⚙️ API Endpoints

### 1. Generate/Create Credentials
```
POST /api/admin/hub-manager-credentials
{
  "hub_id": 1,
  "email": "manager@inneedit.com",
  "password": "SecurePassword123",
  "manager_name": "John Doe"
}
```

### 2. Get Hub Manager Info
```
GET /api/admin/hub-manager-credentials?email=manager@inneedit.com
GET /api/admin/hub-manager-credentials?hub_id=1
```

### 3. Update Password
```
PUT /api/admin/hub-manager-credentials
{
  "email": "manager@inneedit.com",
  "old_password": "OldPassword",
  "new_password": "NewPassword"
}
```

### 4. Hub Manager Login
```
POST /api/hub-manager-auth/login
{
  "email": "manager@inneedit.com",
  "password": "SecurePassword123"
}
```

### 5. Hub Manager Dashboard Data
```
GET /api/hub-manager-dashboard?hub_id=1
GET /api/hub-manager-dashboard/riders?hub_id=1
GET /api/hub-manager-dashboard/vehicles?hub_id=1
GET /api/hub-manager-dashboard/orders?hub_id=1
```

---

## 🚀 Login Flow

```
┌─────────────────────────────────────┐
│ Admin Creates Hub & Email           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Admin Generates Credentials         │
│ (Email + Password)                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Admin Shares via Secure Channel     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Hub Manager Visits /login           │
│ Selects "Hub Manager" Tab           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Hub Manager Enters Email & Password │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ System Validates Credentials        │
│ Creates Session Token               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Redirect to Dashboard               │
│ /hub-manager-dashboard              │
└─────────────────────────────────────┘
```

---

## 🔒 Security Best Practices

1. **Strong Passwords**: Generate passwords with 12+ characters including:
   - Uppercase letters (A-Z)
   - Lowercase letters (a-z)
   - Numbers (0-9)
   - Special characters (!@#$%)

2. **Secure Sharing**: 
   - Share credentials through secure channels (encrypted email, secure messaging)
   - NEVER share in plain text in logs or unsecured documents
   - Use separate channels for email and password

3. **Session Management**:
   - Sessions expire after 30 days of inactivity
   - Managers should logout when not actively using the dashboard
   - Sessions are device/browser specific

4. **Password Changes**:
   - Managers should change default password on first login
   - Regular password updates recommended (every 90 days)
   - Old password required to set new password

5. **Access Control**:
   - Hub managers can only see their assigned hub's data
   - No cross-hub access
   - Admin approval required for any credential changes

---

## 🆘 Troubleshooting

### Issue: "Invalid email or password"
**Solution**: 
- Verify email address matches exactly (case-insensitive)
- Check password - it's case-sensitive
- Request admin to regenerate credentials

### Issue: "Hub manager not found"
**Solution**:
- Ensure credentials have been generated by admin
- Check that email is assigned to a hub
- Contact admin to create/update credentials

### Issue: "This email is already registered"
**Solution**:
- Each email can only be assigned to one hub
- Use a different email for the new hub manager
- Ask admin to change email if reassigning to different hub

### Issue: "Session expired"
**Solution**:
- Login again with credentials
- Clear browser cache/cookies if persistent issues
- Try different browser if problem continues

---

## 📞 Support

For issues or questions:
1. **Admin Issues**: Contact system administrator
2. **Login Problems**: Check credentials, verify email address
3. **Dashboard Access**: Ensure hub is active and assigned
4. **Technical Support**: Click "Contact Us" in app menu

---

## ✅ Checklist for Setting Up Hub Manager

- [ ] Hub created in system with location and details
- [ ] Manager name and phone added to hub
- [ ] Manager email added to hub record
- [ ] Credentials generated via Manager Credentials Generator
- [ ] Credentials securely shared with manager
- [ ] Manager confirmed receipt of credentials
- [ ] Manager successfully logged in to dashboard
- [ ] Manager can see their hub data and riders
- [ ] Manager has changed default password (recommended)
- [ ] Manager knows how to contact support

---

**Last Updated**: 2024
**Version**: 1.0
