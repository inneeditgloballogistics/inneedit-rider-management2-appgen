# Firebase Phone Authentication Setup Guide

## Overview
This app uses Firebase Phone Authentication for secure OTP-based rider login. Follow these steps to set it up.

---

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or select an existing project
3. Enter project name: `inneedit-logistics` (or any name you prefer)
4. Disable Google Analytics (optional)
5. Click **"Create project"**

---

## Step 2: Enable Phone Authentication

1. In Firebase Console, go to **Build** → **Authentication**
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Find **"Phone"** in the list
5. Click on it and toggle **Enable**
6. Click **"Save"**

---

## Step 3: Get Firebase Configuration

1. In Firebase Console, click the **gear icon** (⚙️) → **Project settings**
2. Scroll down to **"Your apps"** section
3. Click the **Web icon** (`</>`)
4. Register app:
   - App nickname: `inneedit-web`
   - Click **"Register app"**
5. Copy the `firebaseConfig` object values:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",              // ← Copy this
  authDomain: "project.firebaseapp.com",  // ← Copy this
  projectId: "project-id",        // ← Copy this
  storageBucket: "project.appspot.com",   // ← Copy this
  messagingSenderId: "123456",    // ← Copy this
  appId: "1:123:web:abc"          // ← Copy this
};
```

---

## Step 4: Add Configuration to .env

Open `/home/user/apps/web/.env` and replace the placeholder values:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...your_actual_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123def456
```

---

## Step 5: Add Authorized Domain (Vercel Deployment)

When deploying to Vercel, you need to add your domain to Firebase:

1. In Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Click **"Add domain"**
3. Add your Vercel domain: `your-app.vercel.app`
4. Also add: `localhost` (for local testing)

---

## Step 6: Test the Login Flow

1. Go to `/rider-login` page
2. Enter a test phone number (format: `+91 9876543210`)
3. Click **"Send OTP"**
4. Enter the OTP received on your phone
5. Click **"Verify & Login"**

**Note:** For testing without a real phone number, you can add test phone numbers in Firebase Console:
- Go to **Authentication** → **Sign-in method** → **Phone** → **Phone numbers for testing**
- Add test number (e.g., `+91 1234567890`) and OTP (e.g., `123456`)

---

## Troubleshooting

### Issue: "reCAPTCHA not initialized"
- Make sure all Firebase env variables are set correctly
- Clear browser cache and try again

### Issue: "Invalid phone number"
- Ensure phone number includes country code (e.g., `+91` for India)
- Format: `+[country code][number]` (e.g., `+919876543210`)

### Issue: "Too many requests"
- Wait a few minutes before trying again
- Use test phone numbers in Firebase Console for development

### Issue: "Domain not authorized"
- Add your domain to Firebase Console → Authentication → Authorized domains

---

## Security Notes

- Firebase OTP is valid for **5 minutes**
- Riders must have an active account in the database
- Session expires after **30 days**
- Each OTP can only be used once

---

## Next Steps

After setup:
1. Test rider login with a registered phone number
2. Register riders via Admin Dashboard
3. Ensure rider phone numbers match Firebase format
4. Deploy to Vercel and add domain to Firebase

---

**Need help?** Check Firebase documentation: https://firebase.google.com/docs/auth/web/phone-auth
