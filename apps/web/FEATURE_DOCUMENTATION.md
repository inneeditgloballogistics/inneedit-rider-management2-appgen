# Service Charges Feature Documentation

## Overview
This document explains the new **Service Charges** feature that allows technicians to apply optional charges to riders when resolving service tickets, with automatic deduction integration into weekly payroll.

---

## Feature Flow

### 1. **Technician Resolving Ticket**

When a technician marks a ticket as "Resolved":

**OLD FLOW:**
- Click "Mark as Resolved"
- Enter resolution notes
- Ticket marked as Completed

**NEW FLOW:**
- Click "Mark as Resolved"
- Enter resolution notes
- **NEW:** Optional service charges section appears:
  - Charge Type (dropdown): Transport Charges, Service Labor Charges, Spare Parts Installation, Emergency Service Charge, On-site Repair Charge, Other
  - Charge Amount (₹): Enter amount (can leave blank for no charges)
  - Charge Summary preview shown

### 2. **API Processing** 

When technician submits "Mark as Resolved":

```
PATCH /api/service-tickets
{
  "ticketId": 123,
  "status": "Completed",
  "resolution_notes": "...",
  "chargesAmount": 200,           // NEW FIELD (optional)
  "chargesReason": "Transport Charges"  // NEW FIELD (optional)
}
```

**API Actions:**
1. ✅ Update ticket status to 'Completed'
2. ✅ IF charges > 0: INSERT into `deductions` table
   ```sql
   INSERT INTO deductions (
     cee_id, 
     amount, 
     description: "Service Charge: Transport Charges (Ticket #TKT-xxx)",
     entry_date: TODAY,
     entry_type: "service_charge",
     status: "approved"  -- AUTO-APPROVED by technician
   )
   ```
3. ✅ Create notification for **rider** with charge info
4. ✅ Create notification for **hub manager** with charge info

**Example Deduction Created:**
- **CEE ID:** RD12345
- **Amount:** ₹200
- **Description:** Service Charge: Transport Charges (Ticket #TKT-1700000001)
- **Entry Type:** service_charge
- **Status:** approved
- **Entry Date:** Today's date

---

### 3. **Hub Manager Reviews & Manages Charges**

Hub Manager sees completed/resolved tickets in "Support Tickets" tab.

**Clicking on a Completed Ticket:**
- Modal opens showing all ticket details
- **NEW Section: "Service Charges"**
  - Lists all charges applied to this ticket
  - Shows: Amount, Description
  - Can **Edit** charge amount or description
  - Can **Remove** charge (with confirmation warning)

**Why Hub Manager Can Edit?**
- Sometimes technician might apply charges incorrectly
- Disputes/corrections needed
- Rider disputes the charge

**Important Warning Message:**
```
"Are you sure you want to remove this charge? This will affect the rider's payout."
```

---

### 4. **Deductions Visible in Payout Calculation**

The deduction is **automatically** included in weekly payout calculation:

**Example Payout Breakdown:**
```
Rider: RD12345
Week: Week 1, March 2025

EARNINGS:
  Base Payout:          ₹5,000
  Incentives:           +₹500
  Referrals:            +₹200
  
DEDUCTIONS:
  Service Charge:       -₹200  ← FROM TECHNICIAN'S CHARGES
  Vehicle Rent:         -₹1,500
  Other Deductions:     -₹300
  
NET PAYOUT:            ₹3,700
```

**Important:** Status is `approved` so it's included in calculation automatically.

---

### 5. **Rider Notification**

When ticket is marked resolved with charges:

**Notification Message:**
```
"Your service ticket #TKT-1700000001 has been resolved. 
Service charges: ₹200 (Transport Charges)."
```

**Notification Type:** `ticket_resolved`
**Recipient:** Rider
**Includes:** Charge amount and reason

---

## Database Schema

### Deductions Table Changes

**Column: `entry_type`** now includes:
```
'service_charge'  -- NEW VALUE
```

**Deduction Entry Example:**
```
id: 1234
cee_id: 'RD12345'
amount: 200
description: 'Service Charge: Transport Charges (Ticket #TKT-1700000001)'
entry_date: 2025-03-01
entry_type: 'service_charge'  -- NEW TYPE
status: 'approved'  -- AUTO-APPROVED
created_at: 2025-03-01 10:30:00
```

---

## API Endpoints

### 1. **Service Tickets - Add/Update Charges** 
```
PATCH /api/service-tickets
{
  ticketId: number
  status: "Completed"
  chargesAmount?: number
  chargesReason?: string
}
```

**Response:** Updated ticket + created deduction if charges > 0

---

### 2. **Service Charges - View**
```
GET /api/service-charges?ticketId=123
GET /api/service-charges?riderId=RD12345
```

**Response:**
```json
[
  {
    "id": 1234,
    "cee_id": "RD12345",
    "amount": 200,
    "description": "Service Charge: Transport Charges (Ticket #TKT-xxx)",
    "entry_type": "service_charge",
    "status": "approved",
    "entry_date": "2025-03-01",
    "created_at": "2025-03-01T10:30:00Z"
  }
]
```

---

### 3. **Service Charges - Edit**
```
PUT /api/service-charges
{
  deductionId: number
  amount?: number
  description?: string
}
```

**Response:** Updated deduction

---

### 4. **Service Charges - Delete**
```
DELETE /api/service-charges?deductionId=1234
```

**Response:** 
```json
{
  "success": true,
  "deleted": { ...deduction }
}
```

---

## User Interface

### Technician: Mark as Resolved Modal

**Section: Service Charges (Optional)**
```
┌─────────────────────────────────────────────────────────┐
│ SERVICE CHARGES (OPTIONAL)                              │
│ Add charges if applicable (e.g., transport fees).       │
│ Leave blank if no charges.                              │
│                                                          │
│ Charge Type: [-- No charges -- v]                       │
│              [Transport Charges]                        │
│              [Service Labor Charges]                    │
│              [Spare Parts Installation]                 │
│              [Emergency Service Charge]                 │
│              [On-site Repair Charge]                    │
│              [Other]                                    │
│                                                          │
│ Amount (₹): [_________]                                 │
│                                                          │
│ Charge Summary:                                         │
│ Transport Charges: ₹200                                 │
│ This will be auto-approved and deducted from rider's   │
│ payout this week.                                       │
└─────────────────────────────────────────────────────────┘
```

### Hub Manager: Completed Ticket Modal - Charges Section

```
┌─────────────────────────────────────────────────────────┐
│ SERVICE CHARGES                                          │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ₹200                                          [Edit]│ │
│ │ Service Charge: Transport Charges (TKT-#xxx) [Remove]│
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ [Edit Mode]                                             │
│ Amount (₹): [_________]                                 │
│ Description: [_______________________]                  │
│ [Save] [Cancel]                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Business Rules

### ✅ What Happens

1. **Technician can add charges** when resolving ANY ticket (small or complex)
2. **Charges are auto-approved** (no manager approval needed)
3. **Charges appear in deductions** for next week's payout
4. **Hub manager can override** - edit or remove if needed
5. **Rider gets notified** with charge amount and reason
6. **Charge is persistent** - stays in database until removed

### ❌ What Doesn't Happen

- Charges don't require manager approval (auto-approved by technician)
- Charges aren't "pending" - they're directly in payout calculation
- Rider can't dispute (only manager can remove)
- Charges don't need a second confirmation

---

## Scenarios

### Scenario 1: Rider comes to hub for small issue

**Technician Action:**
1. Fixes issue (e.g., chain alignment)
2. Marks ticket as "Resolved"
3. **Leaves charges blank** (no charges)
4. Clicks "Mark as Resolved"

**Result:**
- Ticket resolved, no deduction, no charges

---

### Scenario 2: Technician travels to rider location for repair

**Technician Action:**
1. Goes to rider location
2. Fixes issue (e.g., battery swap, repair)
3. Marks ticket as "Resolved"
4. **Selects:** "Transport Charges"
5. **Enters:** ₹200 (travel + fuel)
6. Clicks "Mark as Resolved"

**Result:**
- Ticket resolved
- ₹200 deduction automatically added to deductions table
- Rider notified: "Service charges: ₹200 (Transport Charges)"
- Next week's payout includes -₹200
- Hub manager can see and adjust if needed

---

### Scenario 3: Hub manager disputes charge

**Hub Manager Action:**
1. Opens completed ticket
2. Sees "Service Charges" section
3. Charge shows: ₹200 (Transport Charges)
4. Clicks "Remove"
5. Confirms: "Are you sure? This will affect the rider's payout."
6. Clicks "Remove"

**Result:**
- Deduction removed from database
- Rider's next payout recalculated without that charge
- No notification sent (internal correction)

---

### Scenario 4: Hub manager adjusts charge amount

**Hub Manager Action:**
1. Opens completed ticket
2. Sees charge: ₹200
3. Clicks "Edit"
4. Changes to: ₹150
5. Clicks "Save"

**Result:**
- Deduction amount updated from ₹200 → ₹150
- Rider's payout recalculated with new amount
- Next payout deduction: ₹150 instead of ₹200

---

## Notifications Created

### When Technician Marks Resolved with Charges

#### Notification 1: To Rider
```
type: 'ticket_resolved'
recipient_type: 'rider'
recipient_id: <rider_id>
title: 'Service Ticket Resolved'
message: 'Your service ticket #TKT-xxx has been resolved. 
          Service charges: ₹200 (Transport Charges).'
related_id: <ticket_id>
```

#### Notification 2: To Hub Manager
```
type: 'ticket_resolved'
recipient_type: 'hub_manager'
recipient_id: <hub_manager_id>
title: 'Service Ticket Resolved'
message: 'Service ticket #TKT-xxx from Rider Name has been resolved. 
          Service charges applied: ₹200.'
related_id: <ticket_id>
```

---

## Implementation Summary

### Files Modified/Created:

1. **components/TechnicianTickets.tsx** - Added:
   - `chargesAmount` and `chargesReason` state
   - Service Charges UI section with dropdown and amount input
   - Charge summary preview
   - Pass charges to API

2. **app/api/service-tickets/route.ts** - Updated PATCH handler:
   - Accept `chargesAmount` and `chargesReason` parameters
   - Create deduction entry if charges > 0
   - Send notifications to rider and hub manager

3. **app/api/service-charges/route.ts** - NEW endpoint:
   - GET: Fetch charges by ticket or rider
   - PUT: Edit charge amount/description
   - DELETE: Remove charge

4. **components/HubManagerTickets.tsx** - Added:
   - Service Charges section in completed ticket modal
   - Fetch charges when completed ticket opened
   - Edit/Remove functionality with state management

---

## Testing Checklist

- [ ] Technician can leave charges blank
- [ ] Technician can enter charges with reason
- [ ] Deduction created in database with correct values
- [ ] Rider gets notification with charge info
- [ ] Hub manager gets notification
- [ ] Deduction appears in rider's payout calculation
- [ ] Hub manager can see charges in ticket modal
- [ ] Hub manager can edit charge amount
- [ ] Hub manager can edit charge description
- [ ] Hub manager can remove charge with confirmation
- [ ] Payout recalculated after charge edit/removal
- [ ] Charge type dropdown shows all options

---

## FAQ

**Q: Can a rider refuse to pay the charge?**
A: No. The charge is auto-approved and deducted from payout. Only hub manager can remove it.

**Q: What if technician applies wrong charge?**
A: Hub manager can edit or remove it from the completed ticket view.

**Q: Are charges visible to riders?**
A: Yes, via notification and in their deductions list (if accessible to riders).

**Q: Can charges be applied to non-resolved tickets?**
A: No. Only when marking as Completed/Resolved.

**Q: Is there an audit trail for charge edits?**
A: Currently no. All changes are saved but no edit history is maintained.

**Q: What about partial charges?**
A: Hub manager can set any amount (e.g., ₹75.50) via edit.

---

## Notes for Future Enhancement

1. Add charge edit audit trail (who changed it, when, from what to what)
2. Allow rider to dispute charges (with manager review)
3. Add pre-configured charge templates by hub
4. Charge approval workflow option (manager approves before applied)
5. Bulk charge application for multiple tickets
6. Auto-calculate common charges (distance × rate for transport)
