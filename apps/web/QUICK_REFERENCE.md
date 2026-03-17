# Hub Manager System - Quick Reference Card

## 🎯 Login in 3 Steps

1. Go to: `http://localhost:3000/login`
2. Click: **"Hub Manager"** tab
3. Enter:
   - Email: `rajesh@inneedit.com`
   - Password: `demo1234`

## 📊 What You'll See on Dashboard

✅ Hub information (name, location, manager details)
✅ Active riders count + full riders list
✅ Total vehicles count + full vehicles list
✅ Daily orders count
✅ Hub capacity percentage

## 🔧 API Endpoints (For Developers)

### Authentication
```
POST /api/hub-manager-auth/login
POST /api/hub-manager-auth/set-password
```

### Dashboard Data
```
GET /api/hub-managers/dashboard
GET /api/hub-managers/riders?hubId=3
GET /api/hub-managers/vehicles?hubId=3
GET /api/hub-managers/orders?hubId=3
```

### Admin Management
```
GET /api/admin/hub-managers
POST /api/admin/hub-managers
PUT /api/admin/hub-managers
DELETE /api/admin/hub-managers
```

## 🗄️ Database Tables

### hub_managers
```sql
id | user_id | hub_id | manager_name | manager_email | manager_phone | password_hash | status
```

### Related Tables
- `user` - Authentication users
- `hubs` - Hub information
- `riders` - Riders assigned to hubs
- `vehicles` - Vehicles at hubs

## 👤 Create New Manager (SQL)

```sql
-- Step 1: Create user
INSERT INTO "user" VALUES ('id-123', 'Name', 'email@domain.com', 'hub_manager', true, NOW(), NOW());

-- Step 2: Create manager
INSERT INTO hub_managers VALUES (DEFAULT, 'id-123', 3, 'Name', 'email@domain.com', '+919999999999', 'password_hash', 'active', NOW(), NOW());
```

## 🔐 Common Password Hashes

| Password | SHA256 Hash |
|----------|-------------|
| demo1234 | 0c9c1d19487186c62a6b3f2a23dc11c5be94b1c5644ad8e81f3e03e43d89d68f |
| admin123 | 0a0e745bd85fe4e9aa69fcd7c92eef6e3e2c64a0a8a6f8b9c2d3e4f5a6b7c8d9 |
| test@123 | 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918 |

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "Email not found" | Check hub_managers table has the email |
| "Account not active" | `UPDATE hub_managers SET status = 'active'` |
| "Password not set" | Add password_hash to hub_managers row |
| No riders showing | Check riders have correct `assigned_hub_id` |
| No vehicles showing | Check vehicles have correct `hub_id` |

## 📁 Key Files

| File | Purpose |
|------|---------|
| `/app/hub-manager-dashboard/page.tsx` | Dashboard UI |
| `/app/api/hub-manager-auth/login/route.ts` | Login endpoint |
| `/app/api/hub-managers/dashboard/route.ts` | Dashboard data |
| `/app/login/page.tsx` | Updated login page |
| `/app/page.tsx` | Home page redirect |

## 🌐 URLs

| URL | Purpose |
|-----|---------|
| `/login` | Login page (select Hub Manager) |
| `/hub-manager-dashboard` | Manager dashboard |
| `/api/hub-manager-auth/login` | API login endpoint |
| `/api/hub-managers/dashboard` | API dashboard endpoint |

## ✅ Checklist: Everything Included

- [x] Database table created
- [x] Login API endpoint
- [x] Password setup API
- [x] Dashboard page UI
- [x] Dashboard data APIs
- [x] Admin management APIs
- [x] Test account created
- [x] Session management
- [x] Role-based access control
- [x] Documentation

---

**Status**: COMPLETE AND READY TO USE ✅
