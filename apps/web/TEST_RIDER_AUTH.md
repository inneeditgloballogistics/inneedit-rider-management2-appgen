# Testing Rider Email/Password Authentication

## Prerequisites
- App is running on `http://localhost:3000`
- Database is connected
- At least one rider exists in the system

---

## Test Case 1: Set Rider Password (Admin)

### Steps
1. Navigate to: `http://localhost:3000/admin/rider-password-setup`
2. You should see a list of riders
3. Search for a rider or scroll to find one
4. Click "Set Password" button
5. A modal should open with rider info
6. Enter password: `TestPassword123`
7. Confirm password: `TestPassword123`
8. Click "Set Password"

### Expected Results
✅ Modal shows success message
✅ "Password set successfully..." appears
✅ Modal closes automatically
✅ Rider status updates to show "Set" instead of "Not set"

### If It Fails
❌ Database error → Check if `password_hash` column exists
❌ Modal doesn't open → Check browser console for JS errors
❌ Password validation error → Ensure password is 6+ characters
❌ Cannot find rider → Verify riders exist in database

---

## Test Case 2: Rider Login with Valid Credentials

### Setup
- Rider email: `naveenladdu143@gmail.com` (or any rider you just set a password for)
- Rider password: `TestPassword123` (whatever you set above)

### Steps
1. Navigate to: `http://localhost:3000/rider-login`
2. Enter email: `naveenladdu143@gmail.com`
3. Enter password: `TestPassword123`
4. Click "Sign In"

### Expected Results
✅ Loading spinner appears briefly
✅ Redirected to `/rider-dashboard`
✅ Dashboard displays rider name and info
✅ Session cookie is set (check DevTools → Application → Cookies)

### If It Fails
❌ "Email not found" → Verify email exists in riders table
❌ "Invalid email or password" → Check if password hash was saved correctly
❌ "Account not active" → Update rider status to 'active'
❌ Stays on login page → Check browser console for JS errors

---

## Test Case 3: Rider Login with Invalid Password

### Steps
1. Navigate to: `http://localhost:3000/rider-login`
2. Enter email: `naveenladdu143@gmail.com`
3. Enter password: `WrongPassword123`
4. Click "Sign In"

### Expected Results
✅ Error message appears: "Invalid email or password"
✅ Stays on login page
✅ Form not cleared (UX improvement)
✅ No redirection

---

## Test Case 4: Rider Login with Invalid Email

### Steps
1. Navigate to: `http://localhost:3000/rider-login`
2. Enter email: `nonexistent@example.com`
3. Enter password: `TestPassword123`
4. Click "Sign In"

### Expected Results
✅ Error message appears: "Email not found..."
✅ Stays on login page
✅ Does not reveal invalid password error (security)

---

## Test Case 5: Session Persistence

### Setup
- Be logged in as a rider (from Test Case 2)

### Steps
1. You should be on `/rider-dashboard`
2. Refresh the page (F5 or Cmd+R)
3. Wait for page to load

### Expected Results
✅ Dashboard loads without redirecting to login
✅ Rider data is displayed
✅ Session persists across refresh
✅ Session cookie still exists in DevTools

---

## Test Case 6: Logout

### Setup
- Be logged in as a rider

### Steps
1. Look for logout button (should be in header)
2. Click logout button
3. You should be redirected to `/rider-login`

### Expected Results
✅ Redirected to login page
✅ Session cookie is deleted (check DevTools)
✅ Going back to dashboard redirects to login again

---

## Test Case 7: Password Reset

### Setup
- A rider already has a password set

### Steps
1. Navigate to: `http://localhost:3000/admin/rider-password-setup`
2. Search for the rider
3. Click "Reset Password" button
4. Enter new password: `NewPassword456`
5. Confirm: `NewPassword456`
6. Click "Set Password"

### Expected Results
✅ Success message shows
✅ Old password no longer works
✅ New password works for login
✅ Password history not stored (optional feature)

---

## Test Case 8: Password Validation

### Steps
1. Navigate to: `http://localhost:3000/admin/rider-password-setup`
2. Click "Set Password" for any rider
3. Try password: `12345` (5 characters - too short)
4. Try to submit

### Expected Results
✅ Error message: "Password must be at least 6 characters"
✅ Form not submitted

---

## Test Case 9: API Testing (Curl/Postman)

### Test Login API
```bash
curl -X POST http://localhost:3000/api/rider-auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "naveenladdu143@gmail.com",
    "password": "TestPassword123"
  }' \
  -c cookies.txt
```

Expected response:
```json
{
  "success": true,
  "rider": {
    "id": 8,
    "ceeId": "BB123456",
    "name": "Naveen",
    "phone": "9876543210",
    "email": "naveenladdu143@gmail.com"
  }
}
```

### Test Session Check
```bash
curl -X GET http://localhost:3000/api/rider-auth \
  -b cookies.txt
```

Expected response: Rider details (if session valid)

---

## Browser DevTools Verification

### Check Session Cookie
1. Press F12 to open DevTools
2. Go to Application → Cookies → http://localhost:3000
3. Look for cookie named: `session_token`
4. Verify it has:
   - **Value**: Long random string (starts with `rider_`)
   - **HttpOnly**: ✅ Checked
   - **Secure**: ✅ Checked (in production) or unchecked (dev)
   - **SameSite**: Lax

### Check Console for Errors
1. Open DevTools → Console tab
2. No errors should appear after login
3. Look for any failed API calls
4. Check Network tab → see successful 200 response

---

## Database Verification

### Check if Password Hash is Saved
```sql
SELECT id, cee_id, full_name, email, password_hash FROM riders WHERE cee_id = 'BB123456';
```

Expected: `password_hash` column has a 64-character hex string (SHA-256 hash)

### Check Session Table
```sql
SELECT id, "userId", token, "expiresAt" FROM session WHERE token LIKE 'rider_%' ORDER BY "createdAt" DESC LIMIT 5;
```

Expected: Recent session records with valid expiry dates

---

## Performance Testing

### Measure Login Time
1. Open DevTools → Network tab
2. Go to `/rider-login`
3. Enter credentials
4. Click "Sign In"
5. Check response time for `/api/rider-auth/login`

Expected: Response in < 500ms

### Check Page Load Performance
1. After login, open DevTools → Performance tab
2. Click record
3. Refresh dashboard page
4. Stop recording
5. Check for any long tasks or bottlenecks

---

## Security Testing

### Test SQL Injection Protection
1. Try email: `' OR '1'='1`
2. Should get "Invalid email or password"
3. Should not expose any database error

### Test Password in Logs
1. Check server logs after login
2. Password should NOT appear in logs
3. Only email and hashed password should be visible

### Test Session Hijacking Prevention
1. Copy session cookie from one browser
2. Paste into another browser's DevTools
3. Should work (same device)
4. If you implement IP checking, test cross-IP access

---

## Cleanup After Testing

### Delete Test Data (Optional)
```sql
-- If you created test riders for testing
DELETE FROM riders WHERE email = 'test@example.com';

-- Clear old sessions
DELETE FROM session WHERE "expiresAt" < NOW();
```

---

## Checklist: All Tests Passing? ✅

- [ ] Admin can set rider passwords
- [ ] Rider can login with correct credentials
- [ ] Rider cannot login with wrong password
- [ ] Rider cannot login with nonexistent email
- [ ] Session persists after page refresh
- [ ] Logout clears session
- [ ] Password can be reset
- [ ] Password validation works
- [ ] API responds with correct data
- [ ] Session cookie is httpOnly
- [ ] No errors in browser console
- [ ] Login completes in < 500ms
- [ ] No passwords in logs
- [ ] SQL injection prevented
- [ ] Database has password_hash column

---

## Common Test Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 404 on password setup page | Route not created | Check if `/app/admin/rider-password-setup/page.tsx` exists |
| "Email not found" | Rider not in DB | Check riders table has this email |
| Login page blank | Syntax error in component | Check DevTools console |
| Modal doesn't open | JavaScript error | Open DevTools → Console → Check for errors |
| Password doesn't save | API error | Check API logs, verify request format |
| Session doesn't persist | Cookie not set | Check if httpOnly cookie is sent in response |
| CORS errors | Wrong API URL | Ensure using relative URL `/api/...` not absolute |

---

## Next Steps After Testing

1. ✅ All manual tests pass
2. ✅ Ready for staging environment
3. ✅ Ready for production deployment
4. ✅ Monitor real-world usage
5. ✅ Consider adding: password reset, 2FA, rate limiting
6. ✅ Upgrade to bcrypt for production
7. ✅ Implement audit logging

---

**Test Date:** ___________
**Tested By:** ___________
**Status:** ✅ Pass / ❌ Fail
**Issues Found:** ___________
