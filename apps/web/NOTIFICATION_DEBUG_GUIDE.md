# Notification System Debug Guide

## Issue
When a rider raises a ticket, the hub manager doesn't see the notification in the NotificationBell.

## Test Account Details
```
Hub Manager Login:
Email: lokesh@gmail.com
Password: [Use the one set during hub manager creation]
Hub: Hub 3 (Lokesh's hub)
Hub Manager ID: 6

Rider CEE ID: BB123478 (or any rider in Hub 3)
```

## Testing Steps

### Step 1: Login as Hub Manager
1. Open the app and go to `/login`
2. Select "Hub Manager" tab
3. Enter: `lokesh@gmail.com` and password
4. You should be redirected to `/hub-manager-dashboard`

### Step 2: Verify Hub Manager Data is Stored
1. Open browser DevTools (F12)
2. Go to Application → Local Storage
3. Look for `hubManager` key
4. It should contain JSON with:
   ```json
   {
     "id": 6,
     "name": "Lokesh",
     "email": "lokesh@gmail.com",
     "hub_id": 3,
     "hubId": 3,
     ...
   }
   ```
5. **Note the `id` value** - it should be `6`

### Step 3: Check Console Logs During Login
1. Open DevTools Console
2. Look for blue console.log messages starting with `🔐 [Login]`
3. It should show:
   ```
   🔐 [Login] Hub Manager login successful: {
     id: 6,
     name: "Lokesh",
     email: "lokesh@gmail.com",
     ...
   }
   ```

### Step 4: Verify NotificationBell is Fetching Correctly
1. Keep DevTools open (Console tab)
2. You should see logs like:
   ```
   🔵 [NotificationBell] Checking hubManager localStorage: Found
   🔵 [NotificationBell] Fetching notifications with params: ?hubManagerId=6
   ```

### Step 5: Raise a Ticket as Rider
1. Open another browser tab/window for the app
2. Go to Rider Dashboard (or `/rider-dashboard`)
3. Go to "Support Tickets" section
4. Click "+ Raise Ticket"
5. Select a hub (should be Hub 3 for Lokesh)
6. Select any issue category
7. Click "Submit Ticket"
8. You should see: "Ticket raised successfully!"

### Step 6: Check Hub Manager Console
1. Go back to the hub manager browser tab
2. Open DevTools Console
3. You should see logs from the API:
   ```
   [POST service-tickets] Found hub managers: {count: 1, hubId: 3, managers: [{id: 6}]}
   [POST service-tickets] Creating notification for manager: {managerId: 6, ticketId: 32, type: 'service_ticket_raised'}
   [POST service-tickets] Notification created: {id: 65, hub_manager_id: 6, type: 'service_ticket_raised', ...}
   ```

### Step 7: Check NotificationBell
1. On the hub manager dashboard, look at the top-right corner
2. There should be a bell icon
3. It should have a red badge with the count of unread notifications
4. Click the bell icon to open the notification panel
5. You should see the ticket notification

## Expected Console Logs

### When NotificationBell Fetches (every 5 seconds):
```
🟢 [NotificationBell] Fetching notifications with params: ?hubManagerId=6 {source: 'hub_manager', id: '6'}
🟢 [NotificationBell] Notifications response: {count: 3, unreadCount: 3, queryParams: '?hubManagerId=6'}
🔵 [NotificationBell] Full notifications data: [...]
[API /notifications] 🔍 Fetching notifications for hub manager: {raw_hubManagerId: '6', parsedInt: 6, type: 'number'}
[API /notifications] ℹ️ Total notifications for this hub manager: 3
[API /notifications] Sample notifications: [{id: 65, type: 'service_ticket_raised', hub_manager_id: 6, ...}, ...]
[API /notifications] ✅ Filtered notifications (by type): 3 records
```

## Debugging Checklist

### If Notifications Don't Appear:

❌ **Check 1: Is hub manager ID in localStorage?**
- Open DevTools → Application → Local Storage
- Find `hubManager` key
- Check if it has an `id` field with value `6`
- **If missing**: Issue with login API response

❌ **Check 2: Is the notification being created in the database?**
- Run this SQL:
  ```sql
  SELECT * FROM notifications 
  WHERE hub_manager_id = 6 
  ORDER BY created_at DESC LIMIT 5
  ```
- You should see notifications created when tickets are raised
- **If none**: Service-tickets API isn't creating notifications

❌ **Check 3: Is NotificationBell reading the ID correctly?**
- Open DevTools Console
- Look for messages: `🔵 [NotificationBell] Hub Manager ID found: 6`
- **If showing `undefined`**: localStorage isn't being read correctly

❌ **Check 4: Is the API query correct?**
- Check Network tab when NotificationBell fetches
- Look for request to `/api/notifications?hubManagerId=6`
- Check the response - it should have array of notifications
- **If response is empty**: Database query issue

## Database Query to Check

```sql
-- Check if notifications exist for hub manager 6
SELECT id, hub_manager_id, type, title, is_read, created_at 
FROM notifications 
WHERE hub_manager_id = 6 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if service tickets are being created
SELECT id, ticket_number, assigned_hub_id, cee_id, status, created_at 
FROM service_tickets 
WHERE assigned_hub_id = 3 
ORDER BY created_at DESC 
LIMIT 10;

-- Check hub managers
SELECT id, manager_name, manager_email, hub_id, status 
FROM hub_managers 
WHERE hub_id = 3;
```

## Most Likely Issues

1. **Type Mismatch**: Hub manager ID being passed as string `"6"` instead of number `6`
   - Fix: Check login API response type
   
2. **Wrong ID Field**: API might be storing different ID than what's returned
   - Fix: Verify login response includes correct hub_manager.id

3. **localStorage Not Persisting**: Data cleared between page reloads
   - Fix: Check if any code is clearing localStorage

4. **API Not Creating Notifications**: Notifications table insert failing silently
   - Fix: Check service-tickets API logs for errors

## Contact Information

If notifications still don't work after these steps, check:
1. Browser console errors (red text)
2. Network tab for API response errors
3. Database notifications table for created records
4. Server logs for SQL query errors
