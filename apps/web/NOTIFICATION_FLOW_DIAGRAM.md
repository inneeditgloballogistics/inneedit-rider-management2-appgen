# Notification Flow Diagram

## Complete Ticket & Swap Lifecycle

```
RIDER RAISES TICKET
│
├─► Service Ticket Created (status: 'Open')
│   └─► NOTIFICATION → HUB MANAGER ✅
│       Type: 'service_ticket_raised'
│       Hub Manager Dashboard: "New Service Ticket" badge
│
│
HUB MANAGER ASSIGNS TECHNICIAN
│
├─► Service Ticket Updated (status: 'In Progress', technician_id: set)
│   └─► NOTIFICATION → TECHNICIAN ✅
│       Type: 'ticket_assigned_to_technician'
│       Technician Dashboard: "New Service Ticket Assigned" badge
│       ❌ NOT shown to rider, NOT shown to hub manager again
│
│
TECHNICIAN VIEWS TICKET
│
├─► Technician clicks notification
│   └─► Routes to /technician-dashboard?tab=tickets
│       (Stays within technician portal, doesn't leave)
│
│
TECHNICIAN WORKS & RESOLVES
│
├─► Option A: Mark as Resolved
│    └─► Ticket status: 'Completed'
│        NOTIFICATION → RIDER ✅
│        Type: 'ticket_resolved'
│        Rider Dashboard: "Ticket Resolved" notification
│
└─► Option B: Request Swap
    │
    └─► Swap Request Created (status: 'pending')
        │
        └─► NOTIFICATION → HUB MANAGER ✅
            Type: 'swap_request_pending'
            Hub Manager Dashboard: "Vehicle Swap Request" badge
            ❌ NOT shown to technician, NOT shown to rider yet
            │
            │
            HUB MANAGER APPROVES SWAP
            │
            ├─► Swap Request Updated (status: 'approved')
            │   │
            │   ├─► NOTIFICATION → TECHNICIAN ✅
            │   │    Type: 'swap_approved'
            │   │    Technician Dashboard: "Swap Approved" notification
            │   │
            │   └─► NOTIFICATION → RIDER ✅
            │        Type: 'swap_approved'
            │        Rider Dashboard: "Vehicle Swap Approved" notification
            │        (Rider instructed to collect replacement vehicle)
            │
            │
            HUB MANAGER COMPLETES SWAP
            │
            └─► Swap Request Updated (status: 'completed')
                Old vehicle → 'in_maintenance' status
                New vehicle → assigned to rider
                Service ticket → status: 'Completed'
                Repair cost → deducted from rider's payout
```

---

## Notification Routing by Role

```
┌─────────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION BELL COMPONENT                       │
│                                                                       │
│  Checks localStorage in priority order:                             │
│  1. technician  → Query: ?technicianId={user_id}                    │
│  2. hubManager  → Query: ?hubManagerId={id}                         │
│  3. riderSession → Query: ?riderId={id}                             │
│  4. user (admin) → Query: ?userId={id}                              │
└─────────────────────────────────────────────────────────────────────┘
         ↓
         ↓
┌─────────────────────────────────────────────────────────────────────┐
│              API: GET /api/notifications                             │
│                                                                       │
│  TECHNICIAN (?technicianId=xxx)                                     │
│  ├─ Shows only: ['ticket_assigned_to_technician', 'swap_approved']  │
│  └─ Updates: unread count badge                                     │
│                                                                       │
│  HUB_MANAGER (?hubManagerId=xxx)                                    │
│  ├─ Shows only: ['service_ticket_raised', 'swap_request_pending',   │
│  │              'new_rider_onboarding']                              │
│  └─ Updates: unread count badge                                     │
│                                                                       │
│  RIDER (?riderId=xxx)                                               │
│  ├─ Shows only: ['rider_assignment', 'swap_approved',               │
│  │              'vehicle_handover_complete', 'referral_approved']    │
│  └─ Updates: unread count badge                                     │
│                                                                       │
│  ADMIN (?userId=xxx)                                                │
│  ├─ Shows all notifications (for analytics/reporting)               │
│  └─ Updates: unread count badge                                     │
└─────────────────────────────────────────────────────────────────────┘
         ↓
         ↓
┌─────────────────────────────────────────────────────────────────────┐
│            USER CLICKS NOTIFICATION                                  │
│                                                                       │
│  TECHNICIAN clicks:                                                 │
│  └─ Routes to: /technician-dashboard?tab=tickets                    │
│     (Stays in technician portal)                                     │
│                                                                       │
│  HUB_MANAGER clicks:                                                │
│  └─ Routes to: /hub-manager-dashboard?tab=tickets                   │
│     (Shows service tickets for action)                              │
│                                                                       │
│  RIDER clicks:                                                      │
│  └─ Routes to: /rider-dashboard                                     │
│                                                                       │
│  ADMIN clicks:                                                      │
│  └─ Routes based on notification type (view analytics)              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Database Notification Records Created

### When Rider Raises Ticket
```sql
INSERT INTO notifications (
  type: 'service_ticket_raised',
  title: 'New Service Ticket - [Issue Category]',
  message: 'Rider [Name] ([CEE_ID]) raised a ticket: [Category]',
  related_id: [ticket.id],
  hub_manager_id: [hub_manager.id],  -- ✓ Set
  rider_id: NULL,                     -- ✗ Empty
  technician_id: NULL,                -- ✗ Empty
  user_id: NULL,                      -- ✗ Empty
  is_read: false,
  created_at: NOW()
)
```

### When Hub Manager Assigns Technician
```sql
INSERT INTO notifications (
  type: 'ticket_assigned_to_technician',
  title: 'New Service Ticket Assigned',
  message: 'You have been assigned a service ticket from [Rider Name]. Ticket #[TKT_NUMBER]',
  related_id: [ticket.id],
  hub_manager_id: NULL,               -- ✗ Empty
  rider_id: NULL,                     -- ✗ Empty
  technician_id: [technician.user_id],-- ✓ Set
  user_id: NULL,                      -- ✗ Empty
  is_read: false,
  created_at: NOW()
)
```

### When Technician Requests Swap
```sql
INSERT INTO notifications (
  type: 'swap_request_pending',
  title: 'Vehicle Swap Request',
  message: 'Technician has requested vehicle swap for rider [Name] ([CEE_ID]). Reason: [Reason]',
  related_id: [swap_request.id],
  hub_manager_id: [hub_manager.id],  -- ✓ Set
  rider_id: NULL,                     -- ✗ Empty
  technician_id: NULL,                -- ✗ Empty
  user_id: NULL,                      -- ✗ Empty
  is_read: false,
  created_at: NOW()
)
```

### When Hub Manager Approves Swap - TO TECHNICIAN
```sql
INSERT INTO notifications (
  type: 'swap_approved',
  title: 'Vehicle Swap Approved',
  message: 'Vehicle swap has been approved for rider [Name]. Replacement vehicle: [Vehicle_Number]',
  related_id: [swap_request.id],
  hub_manager_id: NULL,               -- ✗ Empty
  rider_id: NULL,                     -- ✗ Empty
  technician_id: [technician.user_id],-- ✓ Set
  user_id: NULL,                      -- ✗ Empty
  is_read: false,
  created_at: NOW()
)
```

### When Hub Manager Approves Swap - TO RIDER
```sql
INSERT INTO notifications (
  type: 'swap_approved',
  title: 'Vehicle Swap Approved',
  message: 'Your vehicle swap has been approved. Please report to the hub to collect your replacement vehicle. Current vehicle: [Old], New vehicle: [New]',
  related_id: [swap_request.id],
  hub_manager_id: NULL,               -- ✗ Empty
  rider_id: [rider.id],               -- ✓ Set
  technician_id: NULL,                -- ✗ Empty
  user_id: NULL,                      -- ✗ Empty
  is_read: false,
  created_at: NOW()
)
```

---

## Key Design Principles

### 🔒 Role Isolation
- Each role only sees notifications meant for them
- Backend filters at API level (not just frontend)
- No information leakage between roles

### 🎯 Clear Ownership
- Each notification has ONE owner (identified by exactly one of: `user_id`, `rider_id`, `hub_manager_id`, `technician_id`)
- Query param must match the owner's ID
- Prevents cross-role notification access

### 📍 Correct Navigation
- Each role routes to their own dashboard when clicking notification
- Technician never leaves `/technician-dashboard`
- Hub manager never leaves `/hub-manager-dashboard`
- Rider stays on `/rider-dashboard`

### 📊 State Progression
- Tickets follow strict state progression:
  - `Open` → (Hub Manager assigns) → `In Progress` → (Technician completes) → `Completed`
  - `Open` → (Hub Manager assigns) → `In Progress` → (Technician requests swap) → (swap flow)
- Each state transition triggers appropriate notifications

---

## Error Prevention

### ❌ What Won't Happen
1. Technician seeing unassigned tickets (API filters by `technician_id`)
2. Rider seeing ticket unless it's resolved (only `swap_approved` shown during repair)
3. Technician receiving service_ticket_raised notifications (only hub managers)
4. Admin getting individual ticket notifications (stats only)
5. Hub manager seeing another hub's tickets (filtered by `hub_id`)
6. Technician navigating away from technician dashboard

### ✅ What WILL Happen
1. Rider raised ticket → Hub manager notified immediately
2. Hub manager assigned technician → Technician notified immediately
3. Technician requested swap → Hub manager notified immediately
4. Hub manager approved swap → Both technician and rider notified immediately
5. Each role sees correct dashboard when clicking notification

