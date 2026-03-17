# Notification Workflow Documentation

## Overview
The notification system has been completely redesigned to be **user-role-specific** and include a comprehensive **vehicle handover workflow** between hub managers and riders.

---

## Key Components

### 1. **Personalized Notifications**
- Notifications are now filtered by user role/ID
- Different notification types appear to different users:
  - **Admin**: All notifications
  - **Hub Managers**: New rider assignments & hub-related notifications
  - **Riders**: Assignment details, handover status, and general notifications

### 2. **Database Changes**
New columns added to `notifications` table:
- `user_id` (TEXT) - Links to authenticated users
- `rider_id` (INTEGER) - Links to riders
- `hub_manager_id` (INTEGER) - Links to hub managers

New table: `vehicle_handovers`
- Tracks vehicle handover process between hub manager and rider
- Stores vehicle photos, rider signature, odometer reading, fuel level
- Status tracking (pending/completed)

---

## Notification Types & Workflow

### **Type 1: Rider Assignment** 🚗
**Triggered**: When admin assigns a rider to a hub and vehicle

**Recipients**: Rider (via user_id)

**Message Format**:
```
Title: "Welcome to the Team! 🎉"
Message: "You have been assigned to [Hub Name] ([Hub Code]). 
Vehicle: [Vehicle Number] ([Vehicle Type]). 
Head to the hub to complete the vehicle handover process."
```

**What happens next**: 
- Rider should navigate to their dashboard
- Rider can see the notification with assigned hub, store, and vehicle details
- Rider needs to go to the hub for handover

---

### **Type 2: New Rider Onboarding** 👤
**Triggered**: When a new rider is assigned to a hub

**Recipients**: Hub Manager (via hub_manager_id)

**Message Format**:
```
Title: "New Rider Registered - Ready for Handover"
Message: "[Rider Name] (CEE ID: [CEE_ID]) has been assigned to your hub 
and is ready for vehicle handover"
```

**What happens next**:
- Hub manager sees notification in their dashboard
- Hub manager goes to "New Riders" tab to see the list of riders awaiting handover
- Hub manager can search riders and click "Start Handover" button

---

### **Type 3: Vehicle Handover Complete** ✅
**Triggered**: When hub manager completes vehicle handover form

**Recipients**: Rider (via user_id)

**Message Format**:
```
Title: "Vehicle Handed Over Successfully! 🎉"
Message: "Congratulations! Your vehicle [Vehicle ID] has been handed over. 
You are all set to start delivering. Welcome to the team! 
Head to your assigned store and begin working. Best of luck!"
```

**What happens next**:
- Rider receives congratulation notification
- Rider is ready to start deliveries from their assigned store

---

## Hub Manager Handover Workflow

### Step 1: View New Riders
1. Hub Manager logs in to their dashboard
2. Clicks "New Riders" tab
3. Sees list of riders assigned to their hub waiting for handover
4. Can search by rider name or CEE ID

### Step 2: Start Handover
1. Hub Manager clicks "Start Handover" on a rider
2. Handover modal opens with:
   - Rider information (name, CEE ID, phone, vehicle)
   - Odometer reading field (required)
   - Fuel level selector (Full, Three-quarters, Half, Quarter, Empty)
   - Notes/remarks field (optional)
   - Vehicle photos uploader (up to 3 photos) (required)
   - Digital signature canvas (required)

### Step 3: Capture Details
1. Enter odometer reading
2. Select fuel level
3. Add notes about vehicle condition
4. Upload vehicle photos (front, side, interior, etc.)
5. Have rider sign on digital signature canvas

### Step 4: Complete Handover
1. Click "Complete Handover" button
2. System validates all required fields
3. Vehicle handover record is created
4. Rider notification is automatically sent
5. Handover modal closes and rider is removed from "New Riders" list

---

## API Endpoints

### GET /api/vehicle-handover
**Query Parameters**:
- `action=new-riders` - Get list of new riders awaiting handover
- `hubId={id}` - Filter by hub ID
- `riderId={id}` - Get handover details for specific rider

**Response**:
```json
[
  {
    "id": 1,
    "cee_id": "CEE-12345",
    "full_name": "John Doe",
    "phone": "9876543210",
    "email": "john@example.com",
    "assigned_vehicle_id": 5,
    "assigned_hub_id": 2,
    "vehicle_number": "KA-01-XY-1234",
    "vehicle_id": 5,
    "hub_name": "Hub 001",
    "hub_code": "HUB001"
  }
]
```

### POST /api/vehicle-handover
**Body**:
```json
{
  "riderId": 1,
  "hubManagerId": 5,
  "vehicleId": 3,
  "hubId": 2,
  "vehiclePhotos": ["data:image/...", "data:image/..."],
  "riderSignature": "data:image/canvas/...",
  "odometerReading": "50,234 KM",
  "fuelLevel": "full",
  "notes": "Vehicle in good condition"
}
```

**Response**:
```json
{
  "success": true,
  "handover": {
    "id": 1,
    "rider_id": 1,
    "hub_manager_id": 5,
    "vehicle_id": 3,
    "status": "completed",
    "vehicle_photos": ["data:image/...", "..."],
    "rider_signature_url": "data:image/canvas/...",
    "odometer_reading": "50,234 KM",
    "fuel_level": "full",
    "notes": "Vehicle in good condition",
    "handed_over_at": "2024-01-15T10:30:00Z"
  },
  "message": "Vehicle handover completed successfully"
}
```

### GET /api/notifications
**Query Parameters**:
- `userId={id}` - Get notifications for authenticated user (rider)
- `hubManagerId={id}` - Get notifications for hub manager
- `riderId={id}` - Get notifications for specific rider
- `isRead=true/false` - Filter by read status

**Response**:
```json
{
  "notifications": [
    {
      "id": 1,
      "type": "rider_assignment",
      "title": "Welcome to the Team! 🎉",
      "message": "You have been assigned to Hub 001...",
      "user_id": "user_123456",
      "rider_id": 1,
      "hub_manager_id": null,
      "is_read": false,
      "created_at": "2024-01-15T09:00:00Z"
    }
  ],
  "unreadCount": 1
}
```

---

## Frontend Components

### NotificationBell.tsx
Enhanced to:
- Detect user role from localStorage (hubManager or currentUser)
- Fetch role-specific notifications
- Display notification type icons
- Mark notifications as read
- Show unread count badge

### VehicleHandoverModal.tsx (NEW)
Provides:
- Rider information display
- Odometer reading input
- Fuel level selector
- Notes/remarks textarea
- Vehicle photo uploader (up to 3 images)
- Digital signature canvas with clear/capture
- Submit button with validation

### Hub Manager Dashboard
Enhanced with:
- "New Riders" tab showing awaiting handover riders
- Search functionality (by name or CEE ID)
- Status indicator ("Awaiting Handover")
- "Start Handover" button per rider
- Handover modal integration

---

## Notification Icon Mapping

```javascript
{
  'new_rider_onboarding': '👤',
  'rider_assignment': '🚗',
  'vehicle_handover_complete': '✅',
  'referral': '🎁',
  'referral_approved': '✅',
  'bank_update': '🏦',
  'default': '📢'
}
```

---

## Usage Example

### For Admin (Creating a Rider):
```javascript
// Admin creates rider with hub and vehicle assignment
POST /api/riders
{
  "fullName": "John Doe",
  "mobile": "9876543210",
  "email": "john@example.com",
  "assignedHub": 2,  // Hub ID
  "assignedVehicleId": 5  // Vehicle ID
}

// Two notifications are automatically created:
// 1. Hub Manager: "New Rider Registered - Ready for Handover"
// 2. Rider: "Welcome to the Team! 🎉" with hub/vehicle details
```

### For Hub Manager (Completing Handover):
```javascript
// Hub manager submits handover form
POST /api/vehicle-handover
{
  "riderId": 1,
  "hubManagerId": 5,
  "vehicleId": 3,
  "vehiclePhotos": [/* image data */],
  "riderSignature": /* canvas data */,
  "odometerReading": "50,234 KM",
  "fuelLevel": "full"
}

// Notification is automatically sent to rider:
// "Vehicle Handed Over Successfully! 🎉"
```

---

## Testing the Workflow

1. **Admin creates a rider** with hub and vehicle assignment
2. **Check NotificationBell** on rider's dashboard - should see "Welcome" notification
3. **Check NotificationBell** on hub manager's dashboard - should see "New Rider" notification
4. **Hub Manager** opens "New Riders" tab and clicks "Start Handover"
5. **Fill handover form** with all details and photos
6. **Click "Complete Handover"** button
7. **Check rider's notifications** - should see "Congratulations" message

---

## Future Enhancements

- Email notifications for critical events
- SMS notifications for handover reminders
- Notification preferences per user
- Vehicle damage documentation with photo comparison
- Handover history and audit trail
- Rider acknowledgment of handover
