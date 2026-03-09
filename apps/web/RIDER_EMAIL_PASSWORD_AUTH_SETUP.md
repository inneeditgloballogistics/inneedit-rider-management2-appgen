# Rider Email/Password Authentication Setup

## Overview
Your rider login system has been updated from **Phone OTP** to **Email/Password** authentication. This is simpler, faster, and doesn't require Firebase billing or reCAPTCHA setup.

## What Changed

### Before (Phone OTP)
❌ Required Firebase billing enabled
❌ Charged money for SMS verification
❌ Required reCAPTCHA configuration
❌ Slower SMS delivery
❌ Domain authorization needed in Firebase

### Now (Email/Password)
✅ No billing required
✅ No external dependencies
✅ Instant authentication
✅ Simple email/password login
✅ Admin can set rider passwords easily

## How to Use

### For Riders (Login Process)
1. Go to `/rider-login`
2. Enter your **email address**
3. Enter your **password**
4. Click "Sign In"
5. You'll be redirected to your dashboard

### For Admins (Setting Up Rider Passwords)

#### Method 1: Using Admin Password Setup Page (Easiest)
1. Go to `/admin/rider-password-setup`
2. You'll see a list of all riders
3. For each rider, click "Set Password"
4. Enter the rider's email and new password
5. Share the password with the rider securely

#### Method 2: Using API
Send a POST request to `/api/rider-auth/admin-set-password`:

```bash
curl -X POST http://localhost:3000/api/rider-auth/admin-set-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "rider@example.com",
    "password": "SecurePassword123!"
  }'
```

### Password Requirements
- Minimum 6 characters
- Should be strong (mix of letters, numbers, special characters recommended)

## Database Changes

A new column `password_hash` was added to the `riders` table:
```sql
ALTER TABLE riders ADD COLUMN password_hash TEXT;
```

Passwords are stored as SHA-256 hashes (salted in production would use bcrypt).

## API Endpoints

### 1. Login
**Endpoint:** `POST /api/rider-auth/login`

**Request:**
```json
{
  "email": "rider@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "rider": {
    "id": 1,
    "ceeId": "BB123456",
    "name": "Naveen",
    "phone": "9876543210",
    "email": "rider@example.com"
  }
}
```

Sets a `session_token` cookie automatically for session management.

### 2. Check Authentication (Session)
**Endpoint:** `GET /api/rider-auth`

**Response:** Returns rider details if session is valid, otherwise 401

### 3. Logout
**Endpoint:** `DELETE /api/rider-auth`

Clears the session cookie.

### 4. Set/Reset Password (Admin Only)
**Endpoint:** `POST /api/rider-auth/admin-set-password`

**Request:**
```json
{
  "email": "rider@example.com",
  "password": "newpassword"
}
```

## Security Notes

### Current Implementation
- Passwords are hashed with SHA-256
- Session tokens are stored in `httpOnly` cookies
- Sessions expire after 30 days
- Rider must have `status = 'active'` to login

### Recommended Improvements for Production
1. Use **bcrypt** instead of SHA-256 for password hashing
2. Add **salt** to password hashing
3. Implement **rate limiting** on login attempts
4. Add **email verification** on password setup
5. Implement **password reset** via email
6. Use **HTTPS only** for cookies

To implement these, update `/app/api/rider-auth/login/route.ts` to use the `bcrypt` package.

## File Changes Made

### New Files Created:
- `/app/api/rider-auth/login/route.ts` - Login endpoint
- `/app/api/rider-auth/set-password/route.ts` - Admin password setting (alternative)
- `/app/api/rider-auth/admin-set-password/route.ts` - Admin password setting
- `/components/RiderPasswordManager.tsx` - Password management UI component
- `/app/admin/rider-password-setup/page.tsx` - Admin password setup page

### Modified Files:
- `/app/rider-login/page.tsx` - Replaced phone OTP with email/password form
- `/app/api/rider-auth/route.ts` - Removed phone verification logic
- Database: Added `password_hash` column to `riders` table

### Removed Dependency:
- No longer uses Firebase Phone Authentication
- Removed: `signInWithPhoneNumber`, `RecaptchaVerifier` imports

## Testing

### Test Login (Demo)
Email: `naveenladdu143@gmail.com`
Password: Set via admin page

### Test Rider:
```json
{
  "id": 8,
  "cee_id": "BB123456",
  "full_name": "Naveen",
  "email": "naveenladdu143@gmail.com"
}
```

## Troubleshooting

### Issue: "Email not found"
**Solution:** Make sure the rider email is correctly set in the riders table. You can update it in the rider management section.

### Issue: "Invalid email or password"
**Solution:** Check if the password was set correctly in the admin page. Try resetting the password.

### Issue: Session expires immediately
**Solution:** Check if the session token cookie is being set properly. Verify `NODE_ENV` is set correctly.

### Issue: CORS errors on login
**Solution:** Login API is same-origin, so use relative URLs. Make sure `credentials: 'include'` is sent with fetch requests.

## Next Steps

1. **Set passwords for all riders** using the admin page
2. **Communicate** new login credentials to riders
3. **Test login** with a test account
4. **Monitor** login success/failure in your analytics
5. **Implement password reset** functionality (optional)

## Need Help?

If you need to add additional features:
- **Password reset via email**: Use the `lib/email.ts` utility
- **Two-factor authentication**: Add TOTP or SMS verification
- **SSO/Social login**: Integrate Google/GitHub OAuth
- **Session management**: Adjust session expiry in the API routes

Good luck! 🚀
