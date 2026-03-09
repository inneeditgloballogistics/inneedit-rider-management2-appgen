# Quick Reference: Rider Email/Password Authentication

## 🎯 Quick Start for Admins

### Set Rider Passwords
1. Navigate to: **`/admin/rider-password-setup`**
2. Search for rider by name, email, or CEE ID
3. Click **"Set Password"** or **"Reset Password"**
4. Enter email and new password
5. Confirm password
6. Click **"Set Password"**
7. Share password with rider

---

## 👤 For Riders

### Login Steps
1. Go to **`/rider-login`**
2. Enter your **email address**
3. Enter your **password**
4. Click **"Sign In"**
5. Access your dashboard

---

## 🔐 Password Requirements
- ✅ Minimum 6 characters
- ✅ Can contain letters, numbers, special characters
- ✅ Examples: `Naveen@123`, `Rider2024!`, `Password123`

---

## 📊 Admin Dashboard Statistics
On the password setup page, you'll see:
- **Total Riders**: How many riders exist
- **With Password**: Riders who can login
- **Without Password**: Riders needing password setup

---

## 🔗 Key URLs

| Purpose | URL |
|---------|-----|
| Rider Login | `/rider-login` |
| Password Setup | `/admin/rider-password-setup` |
| Rider Dashboard | `/rider-dashboard` |
| Main Admin | `/admin-dashboard` |

---

## 🐛 Common Issues & Fixes

### "Email not found"
→ Check if rider email is correct in the system
→ Update rider email in rider management

### "Password too short"
→ Password must be at least 6 characters
→ Try a longer password

### "Login fails after setting password"
→ Try again with exact email/password
→ Check if email is in lowercase
→ Reset password and try again

---

## 📝 Important Notes

✅ **No Firebase billing needed** - This is a simple email/password system
✅ **Fast login** - No SMS or OTP delays
✅ **Secure** - Passwords are hashed, stored safely
✅ **Easy to manage** - Set/reset passwords anytime

---

## 🚀 Next Steps

1. Set passwords for all riders using `/admin/rider-password-setup`
2. Share login credentials securely (email, not SMS)
3. Riders login with their email + password
4. Monitor login success on dashboard

---

## Need Support?

- **Set password**: Use `/admin/rider-password-setup` page
- **Reset password**: Click "Reset Password" button
- **Debug login**: Check browser console for error messages
- **Database**: Check `riders` table for email and `password_hash`

---

**Last Updated:** 2024
**Authentication Type:** Email/Password (SHA-256 hashing)
**Session Duration:** 30 days
