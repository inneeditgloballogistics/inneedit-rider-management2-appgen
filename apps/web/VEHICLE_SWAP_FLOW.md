# Vehicle Swap Workflow - Complete Flow

This document explains the complete vehicle swap workflow in the inneedit Global Logistics system.

## Overview

The vehicle swap process allows riders whose vehicles have mechanical issues to receive a replacement vehicle. This involves multiple steps with notifications at each stage and proper vehicle status tracking in the admin dashboard.

---

## Complete Workflow Steps

### **STEP 1: Rider Raises Support Ticket**
- Rider experiences vehicle issue
- Rider creates a support ticket describing the problem
- Status: Ticket created in "Open" state

### **STEP 2: Technician Requests Vehicle Swap**
- Hub manager reviews ticket and assigns technician
- Technician inspects the faulty vehicle
- Technician requests a vehicle swap with issue reason and notes
- **Action:** Creates `swap_requests` record with status **"pending"**
- **Notification:** Hub manager receives notification about swap request

### **STEP 3: Hub Manager Approves Swap Request**
- Hub manager reviews the swap request
- Hub manager selects a replacement vehicle from available inventory
- Hub manager sets repair cost (optional) - this will be deducted from rider's payout
- **Action:** Updates `swap_requests` status to **"approved"**
- **Action:** Sets `replacement_vehicle_id` and `approved_at` timestamp
- **Notification:** 
  - Rider gets notified that swap is approved
  - Rider knows new vehicle is ready for collection

### **STEP 4: Hub Manager Completes Handover (NEW FLOW)**
- ✅ **NEW:** Hub manager must now formally handover the NEW vehicle to the rider
- Hub manager opens the "Approved Swaps - Awaiting Handover" section in the dashboard
- Hub manager clicks "Complete Handover" on the approved swap
- **Form to fill:**
  - Take photos of the NEW vehicle (required, up to 3)
  - Record odometer reading
  - Record fuel level
  - Add any notes/remarks
  - Collect rider's signature

### **STEP 5: Vehicle Status Updates in Admin Dashboard**
- When handover is completed:
  1. **OLD VEHICLE:** Status changes to **"in_maintenance"** (unassigned from rider)
  2. **NEW VEHICLE:** Status changes to **"assigned"** (assigned to rider)
  3. Repair cost (if any) is automatically deducted from rider's payroll
  4. Swap request marked as **"completed"**
  5. Service ticket marked as **"Completed"**

### **STEP 6: Notifications Sent**
- **To Rider:** "Vehicle Swap Completed! 🎉" - New vehicle assigned, old vehicle will be serviced
- **To Hub Manager:** Confirmation that handover is complete with vehicle details
- **In Admin Dashboard:**
  - Old vehicle shows as "In Maintenance"
  - New vehicle shows as "Assigned" to rider
  - Both visible in the vehicles tab with proper status badges

---

## Database Records Created/Updated

### Records Created:
```
1. swap_requests (when technician requests swap)
   - status: "pending" → "approved" → "completed"
   - replacement_vehicle_id (set during approval)
   - repair_cost (optional)
   - approved_at (timestamp when approved)
   - completed_at (timestamp when handover finished)

2. vehicle_handovers (when handover is completed)
   - rider_id
   - vehicle_id (NEW vehicle)
   - handover_photos (up to 3 photos)
   - rider_signature_url
   - odometer_reading
   - fuel_level
   - notes
   - status: "completed"

3. handover_photos (photo records for each image)
   - handover_id (references vehicle_handovers)
   - photo_data (base64 encoded image)
   - photo_order (1, 2, 3)

4. deductions (if repair_cost is set)
   - cee_id: rider's CEE ID
   - amount: repair_cost value
   - description: "Vehicle repair cost - [issue_reason]"
   - entry_type: "vehicle_repair"
   - status: "approved"
   - entry_date: current date

5. notifications (to rider, hub manager, technician)
```

### Records Updated:
```
1. vehicles (OLD)
   - status: "assigned" → "in_maintenance"
   - assigned_rider_id: NULL

2. vehicles (NEW)
   - status: "available" → "assigned"
   - assigned_rider_id: rider's CEE_ID

3. riders
   - assigned_vehicle_id: NEW vehicle ID

4. service_tickets
   - status: "Open" → "In Progress" → "Completed"

5. swap_requests
   - status: "pending" → "approved" → "completed"
```

---

## Admin Dashboard Views

### **Before Handover (Approved Swaps Section)**
```
✓ Approved Swaps - Awaiting Handover
├─ Rider Name (CEE ID)
├─ Ticket #XXXX
├─ Old Vehicle: AB-12-CD-1234 (EV Two Wheeler)
├─ Status: In Maintenance (pending pickup)
├─ New Vehicle: AB-12-CD-5678 (EV Two Wheeler)
└─ Button: [Complete Handover]
```

### **After Handover (Vehicles Tab)**
```
Vehicle Status Updates:
- OLD Vehicle shows: "In Maintenance" badge (gray/amber)
- NEW Vehicle shows: "Assigned" badge (blue)

In Admin Dashboard - Inventory Tab:
- If old vehicle had parts assigned, they remain in inventory
- Admin can manually update inventory status
```

---

## Key Features

✅ **Automatic Status Management**
- Vehicle statuses automatically updated to reflect current state
- No manual status changes needed by admin

✅ **Photo Documentation**
- Handover process includes vehicle photos for record
- Photos stored as base64 in database
- Useful for future reference/disputes

✅ **Rider Signature**
- Rider signs on handover completion form
- Signature stored as proof of receipt
- Can be used in case of disputes

✅ **Cost Tracking**
- Repair costs automatically deducted from rider payout
- Tracked in deductions table
- Appears in payroll management

✅ **Notifications**
- Real-time notifications to all stakeholders
- Transparent communication throughout process
- Rider knows exactly when swap is completed

✅ **Admin Visibility**
- Clear badge indicators in vehicles tab
- "In Maintenance" vehicles easily identifiable
- Swap status visible in swap requests tab with badge count

---

## Flow Diagram

```
┌─────────────────────────────┐
│ RIDER RAISES TICKET         │
│ Vehicle Issue Reported      │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ TECHNICIAN REQUESTS SWAP    │
│ swap_requests: "pending"    │
└──────────────┬──────────────┘
               │ Hub Manager Notified
               │
               ▼
┌─────────────────────────────┐
│ HUB MANAGER APPROVES SWAP   │
│ swap_requests: "approved"   │
│ replacement_vehicle_id set  │
└──────────────┬──────────────┘
               │ Rider Notified
               │
               ▼
┌─────────────────────────────────────┐
│ HUB MANAGER COMPLETES HANDOVER      │
│ ✓ Takes Photos of New Vehicle       │
│ ✓ Records Odometer & Fuel Level     │
│ ✓ Gets Rider Signature              │
│ ✓ Creates vehicle_handovers record  │
└──────────────┬──────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ VEHICLE STATUS UPDATES IN ADMIN DB   │
│ • OLD VEHICLE: "In Maintenance"      │
│ • NEW VEHICLE: "Assigned"            │
│ • Repair Cost: Auto-deducted         │
│ • swap_requests: "completed"         │
│ • service_tickets: "Completed"       │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ NOTIFICATIONS SENT               │
│ • Rider: Swap Complete ✓         │
│ • Hub Manager: Handover Done ✓   │
│ • Admin: Status Updated ✓        │
└──────────────────────────────────┘
```

---

## Important Notes

1. **Approved Swaps Tab Badge**: Shows count of swaps approved but not yet handed over (red badge)

2. **In Maintenance Status**: Only used for vehicles that are waiting for repair/service. After repair, admin must manually change status back to "available"

3. **Repair Cost Deduction**: Only applied if hub manager entered a repair cost during approval. Amount appears in rider's deductions and reduces final payout.

4. **Photo Storage**: Photos are stored as base64 strings. For production, consider external storage (S3, etc.)

5. **Multiple Handovers**: A rider can have multiple swaps if vehicle issues occur multiple times. Each creates separate records.

---

## Testing the Flow

1. **Create a Support Ticket** (rider-dashboard or technician section)
2. **Assign Technician** (hub-manager-dashboard → tickets tab)
3. **Request Swap** (technician requests swap with issue reason)
4. **Approve Swap** (hub-manager-dashboard → swap requests → approve & select vehicle)
5. **Complete Handover** (hub-manager-dashboard → approved swaps → take photos, get signature)
6. **Verify Status** (admin-dashboard → vehicles tab → check old/new vehicle status)

---

End of Document
