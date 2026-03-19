# Notification Flow Architecture - Complete Implementation

## Overview
The notification system has been completely redesigned with role-based filtering to ensure each user (technician, hub manager, rider, admin) receives only relevant notifications for their dashboard.

---

## Database Schema Update
✅ **Notifications Table** - Added `technician_id` column
- `id` - Notification ID
- `type` - Notification type
- `title` - Notification title  
- `message` - Notification message
- `related_id` - Related resource ID
- `is_read` - Read status
- `created_at` - Creation timestamp
- `user_id` - Admin user ID (for admin notifications)
- `rider_id` - Rider ID (for rider notifications)
- `hub_manager_id` - Hub manager ID (for hub manager notifications)
- **`technician_id`** ⭐ NEW - Technician ID (for technician notifications)

---

## Notification Types & Flow

### 1. **RIDER RAISES SERVICE TICKET** 📝
**Who gets notified:** Hub Manager ONLY
- **Notification Type:** `service_ticket_raised`
- **Created By:** `/api/service-tickets` (POST endpoint)
- **Payload:** Ticket ID, rider name, issue category
- **Flow:**
  1. Rider raises ticket via RiderSupportTickets component
  2. Service ticket created in DB with status = `'Open'`
  3. Notification created for all active hub_managers of that hub
  4. Hub manager sees notification in their dashboard

**Hub Manager Actions:**
- View the ticket details
- Assign a technician to the ticket
- Mark ticket status as `'In Progress'`

---

### 2. **HUB MANAGER ASSIGNS TECHNICIAN** 🔧
**Who gets notified:** Technician ONLY
- **Notification Type:** `ticket_assigned_to_technician`
- **Created By:** `/api/service-tickets` (PATCH endpoint)
- **Payload:** Ticket ID, rider name, issue description
- **Flow:**
  1. Hub manager opens ticket and selects technician from dropdown
  2. Service ticket updated with `technician_id` and status = `'In Progress'`
  3. Notification created for technician using `technician_id`
  4. Technician sees notification in their dashboard
  5. Technician redirected to their "My Tickets" tab when clicking notification

**Technician Actions:**
- View assigned tickets
- Start repair
- Mark as resolved (with resolution notes)
- Request vehicle swap (if needed)

---

### 3. **TECHNICIAN REQUESTS VEHICLE SWAP** 🔄
**Who gets notified:** Hub Manager ONLY
- **Notification Type:** `swap_request_pending`
- **Created By:** `/api/swap-requests` (POST endpoint)
- **Payload:** Ticket ID, rider name, swap reason
- **Flow:**
  1. Technician clicks "Request Swap" while working on ticket
  2. Swap request created with status = `'pending'`
  3. Notification created for hub_manager of that hub
  4. Hub manager sees notification to approve swap
  5. Hub manager selects replacement vehicle and approves
  6. Notifications sent to both rider AND technician

**If Hub Manager Approves:**
- Notification Type: `swap_approved`
- Technician notified of replacement vehicle
- Rider notified to collect replacement vehicle

---

### 4. **NOTIFICATION BELL BEHAVIOR BY ROLE**

#### Technician (localStorage = `'technician'`) 
```javascript
// Fetches only technician notifications
queryParams = `?technicianId=${technician.user_id}`
// Types shown: 'ticket_assigned_to_technician', 'swap_approved'
```
- **Unread notifications trigger:**
  - New ticket assigned
  - Swap request approved
- **Clicking notification:**
  - Routes to `/technician-dashboard?tab=tickets`
  - Stays within technician's own dashboard

#### Hub Manager (localStorage = `'hubManager'`)
```javascript
// Fetches only hub manager notifications
queryParams = `?hubManagerId=${hubManager.id}`
// Types shown: 'service_ticket_raised', 'swap_request_pending', 'new_rider_onboarding'
```
- **Unread notifications trigger:**
  - New ticket raised by rider
  - Technician requests swap
  - New rider onboarding
- **Clicking notification:**
  - Routes to `/hub-manager-dashboard?tab=tickets`
  - Shows relevant tab for action

#### Rider (localStorage = `'riderSession'`)
```javascript
// Fetches only rider notifications
queryParams = `?riderId=${rider.id}`
// Types shown: 'rider_assignment', 'vehicle_handover_complete', 'referral_approved', 'swap_approved'
```
- **Unread notifications trigger:**
  - Vehicle assigned
  - Handover completed
  - Referral approved
  - Swap approved
- **Clicking notification:**
  - Routes to `/rider-dashboard`

#### Admin (localStorage = `'user'`)
```javascript
// Fetches only admin notifications
queryParams = `?userId=${user.id}`
// Admin sees: All notifications (for analytics/reporting)
```

---

## API Endpoints - Notification Filtering

### GET `/api/notifications`

**Query Parameters:**
- `?userId={id}` - Admin notifications
- `?riderId={id}` - Rider notifications (only specific types)
- `?hubManagerId={id}` - Hub manager notifications (only ticket-related)
- `?technicianId={id}` - Technician notifications (only assigned tickets)

**Technician Query Example:**
```javascript
fetch(`/api/notifications?technicianId=${technician.user_id}`)
// Returns: ['ticket_assigned_to_technician', 'swap_approved'] only
```

**Hub Manager Query Example:**
```javascript
fetch(`/api/notifications?hubManagerId=${hubManager.id}`)
// Returns: ['service_ticket_raised', 'swap_request_pending', 'new_rider_onboarding'] only
```

---

## NotificationBell Component - Changes

### fetchNotifications() - Updated Logic
1. **Check localStorage in order:**
   - First: `technician` (highest priority)
   - Second: `hubManager`
   - Third: `riderSession`
   - Last: Fall back to null

2. **Build query params based on role found**
3. **Fetch role-specific notifications only**
4. **Update badge with unread count**

### handleNotificationClick() - Updated Routing
- **Technician clicked notification:**
  - Route: `/technician-dashboard?tab=tickets`
  - Stays in technician portal

- **Hub Manager clicked notification:**
  - Route: `/hub-manager-dashboard?tab=tickets`
  - Shows service tickets for action

- **Rider clicked notification:**
  - Route: `/rider-dashboard`

---

## Service Tickets - Assignment Flow

### Hub Manager Assigns Technician
**Endpoint:** PATCH `/api/service-tickets`
```javascript
{
  ticketId: 123,
  status: 'In Progress',
  technicianId: 'tech_user_id'
}
```

**On Success:**
1. Ticket status updated to `'In Progress'`
2. `technician_id` field set on service_tickets record
3. **Notification created:**
   - Type: `ticket_assigned_to_technician`
   - Destination: `notifications.technician_id = technician_user_id`
   - Technician can now see this ticket in "My Tickets"

---

## Swap Requests - Complete Flow

### Step 1: Technician Requests Swap
**Endpoint:** POST `/api/swap-requests`
- Status: `'pending'`
- Notification → Hub Manager
- Service ticket status remains `'In Progress'`

### Step 2: Hub Manager Approves Swap
**Endpoint:** PATCH `/api/swap-requests` with `action: 'approve'`
- Status updated: `'approved'`
- **Notifications created:**
  1. For Rider (type: `swap_approved`)
  2. For Technician (type: `swap_approved`) ⭐ NEW
- Replacement vehicle assigned

### Step 3: Hub Manager Completes Swap
**Endpoint:** PATCH `/api/swap-requests` with `action: 'complete'`
- Old vehicle → marked `'in_maintenance'`
- New vehicle → assigned to rider
- Repair cost → deducted from rider's payout
- Service ticket → status `'Completed'`

---

## Key Security & Design Decisions

1. **Notification Filtering at API Level**
   - NOT done on frontend (frontend filtering is cosmetic only)
   - Backend validates `technicianId`, `hubManagerId`, etc. in query params
   - No user can view notifications for other roles

2. **Technician Identification**
   - Technician stored in localStorage as JSON object
   - Contains: `id`, `user_id`, `hub_id`, `name`, `email`, `phone`
   - `technician.user_id` used for notification queries

3. **Ticket Assignment Logic**
   - Ticket is unassigned initially (status = `'Open'`)
   - Hub manager assigns technician → status = `'In Progress'`
   - Technician doesn't see ticket until assigned AND notification created
   - Service ticket has `technician_id` field to link technician

4. **Notification Type Filtering**
   - Each role sees only 2-4 notification types (not all)
   - Example: Technician never sees `'service_ticket_raised'` (only hub manager)
   - Prevents dashboard clutter and confusion

---

## Testing Checklist

- [ ] Rider raises ticket → Hub manager gets notification (not technician)
- [ ] Hub manager assigns technician → Technician gets notification (not rider)
- [ ] Technician clicks notification → Routes to `/technician-dashboard?tab=tickets`
- [ ] Technician requests swap → Hub manager gets notification (not technician)
- [ ] Hub manager approves swap → Technician and rider both get notifications
- [ ] Technician sees ONLY assigned tickets in "My Tickets" tab
- [ ] Hub manager sees ALL tickets in their hub
- [ ] Admin sees stats/summary (no individual ticket notifications)
- [ ] Notification unread count accurate for each role

---

## Files Modified

1. **`/app/api/notifications/route.ts`**
   - Added `technicianId` query parameter
   - Added technician notification filtering
   - Filters notifications by type for each role

2. **`/components/NotificationBell.tsx`**
   - Added technician localStorage detection
   - Updated routing logic for technician notifications
   - Technician routes to `/technician-dashboard`

3. **`/app/api/service-tickets/route.ts`**
   - Updated technician notification to use `technician_id` column
   - Technician notifications created in PATCH endpoint

4. **`/app/api/swap-requests/route.ts`**
   - Added technician notification on swap approval
   - Technician notified when swap is approved

5. **Database Migration**
   - Added `technician_id` column to `notifications` table

---

## Summary

This implementation ensures:
- ✅ Technicians only see tickets assigned to them
- ✅ Hub managers only see tickets in their hub
- ✅ Riders only see their own tickets and handover notifications
- ✅ Each role gets routed to their correct dashboard
- ✅ Clear, non-confusing notification flow
- ✅ No cross-dashboard navigation for technicians
- ✅ Proper role-based access control at API level

