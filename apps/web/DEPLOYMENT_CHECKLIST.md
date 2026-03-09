# Deployment Checklist: Rider Email/Password Auth

## Pre-Deployment

### Code Review
- [ ] All old Firebase phone auth code removed
- [ ] No `RecaptchaVerifier` imports remain
- [ ] No `signInWithPhoneNumber` references
- [ ] No TypeScript errors: `npm run build`
- [ ] All new files have proper imports

### Database
- [ ] `password_hash` column added to `riders` table
- [ ] Column is TEXT type and nullable
- [ ] Test password_hash can be updated
- [ ] Session table exists and working
- [ ] No migration errors

### Testing
- [ ] Set password via admin page
- [ ] Login with correct credentials works
- [ ] Login with wrong password shows error
- [ ] Session persists after refresh
- [ ] Logout clears session
- [ ] No console errors
- [ ] All test cases in TEST_RIDER_AUTH.md pass

### Security
- [ ] Passwords are hashed (SHA-256)
- [ ] Session tokens are random
- [ ] Cookies are httpOnly
- [ ] HTTPS enabled in production
- [ ] No credentials in logs
- [ ] No SQL injection vulnerabilities

---

## Staging Deployment

### Deploy Code
```bash
# Ensure you're in /home/user/apps/web
npm run build
npm start
```

### Verify Staging
- [ ] App loads without errors
- [ ] Can access `/rider-login`
- [ ] Can access `/admin/rider-password-setup`
- [ ] Database connection works
- [ ] All API routes respond
- [ ] Session cookies set correctly

### Run Full Test Suite
- [ ] Run tests from TEST_RIDER_AUTH.md
- [ ] Verify all test cases pass
- [ ] Check performance metrics
- [ ] Monitor for any runtime errors

---

## Production Deployment

### Pre-Production Tasks
- [ ] Database backed up
- [ ] Rider passwords pre-set via admin page
- [ ] All riders notified of new login method
- [ ] Test account created for monitoring
- [ ] Fallback support plan ready
- [ ] Rollback procedure documented

### Deploy
```bash
# Follow your standard deployment process
# (Vercel, Docker, custom server, etc.)
```

### Post-Deployment Verification
- [ ] All API endpoints return 200
- [ ] Can set rider passwords
- [ ] Can login successfully
- [ ] Session management works
- [ ] No errors in production logs
- [ ] Monitor login success rate

### Communication
- [ ] Notify all riders of new credentials
- [ ] Send login instructions
- [ ] Provide support contact info
- [ ] Monitor for support tickets
- [ ] Create FAQ for common issues

---

## Files Deployed

### New Files (7)
```
✅ /app/api/rider-auth/login/route.ts
✅ /app/api/rider-auth/set-password/route.ts
✅ /app/api/rider-auth/admin-set-password/route.ts
✅ /app/admin/rider-password-setup/page.tsx
✅ /components/RiderPasswordManager.tsx
✅ Documentation files (3 md files)
```

### Modified Files (2)
```
✅ /app/rider-login/page.tsx
✅ /app/api/rider-auth/route.ts
```

### Database Changes (1)
```
✅ riders table: Added password_hash column
```

---

## Rollback Plan

### If Critical Issues Found
1. **Immediate Actions**
   - [ ] Revert code to previous version
   - [ ] Keep `/rider-login` pointing to old implementation
   - [ ] Stop accepting new rider signups (if needed)

2. **Restore From Backup**
   ```bash
   # If needed, restore database from backup
   # (specific to your backup solution)
   ```

3. **Notify Users**
   - [ ] Post status update
   - [ ] Provide alternative login method
   - [ ] Estimate recovery time

4. **Root Cause Analysis**
   - [ ] Identify what went wrong
   - [ ] Fix in development
   - [ ] Test thoroughly
   - [ ] Re-deploy

---

## Monitoring & Metrics

### Key Metrics to Track
- Login success rate (target: > 95%)
- Failed login attempts (alert if > 50/hour)
- Average login time (target: < 500ms)
- Session cookie issues (target: 0)
- Support tickets related to auth

### Monitoring URLs
- Rider login: `/rider-login`
- Admin password setup: `/admin/rider-password-setup`
- API health: `/api/rider-auth`

### Alerts to Set Up
- [ ] High failed login rate
- [ ] API response time > 2s
- [ ] Database connection errors
- [ ] Session token errors
- [ ] Authentication service down

---

## Post-Deployment Support

### Common Support Issues & Responses

**"I forgot my password"**
→ Direct to `/admin/rider-password-setup` to reset
→ Share new temporary password
→ Encourage password manager usage

**"Login doesn't work"**
→ Verify email is correct (case-insensitive)
→ Check password was set via admin page
→ Clear browser cookies and try again
→ Check internet connection

**"Session keeps expiring"**
→ Sessions last 30 days
→ Check if browser cookies are enabled
→ Clear cookies and login again
→ Check if computer clock is correct

**"Can't access admin password setup page"**
→ Verify user has admin role
→ Check if route is deployed
→ Clear browser cache
→ Try different browser

---

## Optimization (Post-Launch)

### Phase 2 Enhancements
- [ ] Add password reset via email
- [ ] Implement rate limiting (5 failures/15 min)
- [ ] Add email verification
- [ ] Upgrade to bcrypt hashing
- [ ] Add 2FA support (TOTP)
- [ ] Session timeout warning
- [ ] Remember me checkbox
- [ ] Audit logging for admin actions

### Performance Improvements
- [ ] Cache rider data (if applicable)
- [ ] Optimize database queries
- [ ] Add CDN for static assets
- [ ] Implement session compression

---

## Documentation for Team

### Share These Files
- [ ] QUICK_REFERENCE_RIDER_AUTH.md (for admins)
- [ ] RIDER_EMAIL_PASSWORD_AUTH_SETUP.md (for technical team)
- [ ] TEST_RIDER_AUTH.md (for QA team)
- [ ] IMPLEMENTATION_SUMMARY.md (for stakeholders)

### Training Checklist
- [ ] Admin team trained on password setup
- [ ] Support team knows common issues
- [ ] Dev team can troubleshoot
- [ ] Product team understands workflow
- [ ] Security team reviewed implementation

---

## Success Criteria

### Launch is Successful When:
- ✅ All riders can login with email/password
- ✅ No critical security issues found
- ✅ Admin can manage all passwords
- ✅ Login success rate > 95%
- ✅ Average response time < 500ms
- ✅ Zero unplanned downtime
- ✅ Support tickets < 5/day for auth issues
- ✅ Rider feedback positive

---

## Post-Deployment Report

Date: ___________
Deployer: ___________
Status: ✅ Successful / ❌ Rollback

### Issues Encountered:
___________________________________________________________

### Resolution:
___________________________________________________________

### Performance Metrics:
- Login success rate: ____%
- Average response time: ___ms
- Support tickets: _____
- Critical issues: _____

### Next Steps:
___________________________________________________________

### Sign Off:
- [ ] Technical Lead
- [ ] Product Manager
- [ ] Security Officer
- [ ] Operations

---

## Emergency Contacts

**If critical issue during deployment:**

| Role | Name | Contact |
|------|------|---------|
| Tech Lead | _________ | _________ |
| DB Admin | _________ | _________ |
| Security | _________ | _________ |
| Support | _________ | _________ |

---

**Last Updated:** 2024
**Version:** 1.0
**Status:** Ready for Deployment
