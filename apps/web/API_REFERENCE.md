# Vehicle Handover & Notification API Reference

## Base URL
All endpoints are relative to your app domain (e.g., `http://localhost:3000`)

---

## 📋 Notifications API

### GET /api/notifications
Fetch notifications with optional filtering

**Query Parameters:**
```
userId=string          (optional) - Get notifications for a specific authenticated user
hubManagerId=number    (optional) - Get notifications for a hub manager
riderId=number         (optional) - Get notifications for a specific rider
isRead=boolean         (optional) - Filter by read status (true/false)
```

**Example Requests:**

```javascript
// Get all notifications (Admin)
GET /api/notifications

// Get rider notifications
GET /api/notifications?userId=user_123

// Get hub manager notifications
GET /api/notifications?hubManagerId=7

// Get unread notifications only
GET /api/notifications?userId=user_123&isRead=false

// Get specific rider's notifications
GET /api/notifications?riderId=1
```

**Response (200 OK):**
```json
{
  "notifications": [
    {
      "id": 1,
      "type": "rider_assignment",
      "title": "Welcome to the Team! 🎉",
      "message": "You have been assigned to Hub 001 (HUB001). Vehicle: KA-01-XY-1234 (Two Wheeler). Head to the hub to complete the vehicle handover process.",
      "user_id": "user_123",
      "rider_id": 1,
      "hub_manager_id": null,
      "related_id": 1,
      "is_read": false,
      "created_at": "2024-01-15T09:00:00Z"
    },
    {
      "id": 2,
      "type": "new_rider_onboarding",
      "title": "New Rider Registered - Ready for Handover",
      "message": "John Doe (CEE ID: CEE-12345) has been assigned to your hub and is ready for vehicle handover",
      "user_id": null,
      "rider_id": 1,
      "hub_manager_id": 7,
      "related_id": 1,
      "is_read": false,
      "created_at": "2024-01-15T09:00:00Z"
    }
  ],
  "unreadCount": 2
}
```

**Error Response (500):**
```json
{
  "error": "Failed to fetch notifications"
}
```

---

### PATCH /api/notifications
Update notification read status

**Body:**
```json
{
  "id": 1,
  "isRead": true
}
```

**Mark All as Read:**
```json
{
  "isRead": true
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "type": "rider_assignment",
  "title": "Welcome to the Team! 🎉",
  "is_read": true,
  "updated_at": "2024-01-15T09:05:00Z"
}
```

**Error Response (500):**
```json
{
  "error": "Failed to update notification"
}
```

---

## 🚚 Vehicle Handover API

### GET /api/vehicle-handover
Fetch handover data with filtering

**Query Parameters:**
```
action=new-riders     (required) - Get new riders awaiting handover
hubId=number          (optional) - Filter by hub ID
riderId=number        (optional) - Get handover details for specific rider
```

**Example Requests:**

```javascript
// Get new riders for a hub
GET /api/vehicle-handover?action=new-riders&hubId=2

// Get handover history for a rider
GET /api/vehicle-handover?riderId=1
```

**Response (200 OK) - New Riders:**
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

**Response (200 OK) - Handover History:**
```json
[
  {
    "id": 1,
    "rider_id": 1,
    "hub_manager_id": 7,
    "vehicle_id": 5,
    "hub_id": 2,
    "status": "completed",
    "vehicle_photos": ["data:image/jpeg;base64,...", "data:image/jpeg;base64,..."],
    "rider_signature_url": "data:image/png;base64,...",
    "odometer_reading": "50234 KM",
    "fuel_level": "full",
    "notes": "Vehicle in excellent condition",
    "handed_over_at": "2024-01-15T10:30:00Z",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

**Error Response (500):**
```json
{
  "error": "Failed to fetch handover data"
}
```

---

### POST /api/vehicle-handover
Create a vehicle handover record

**Content-Type:** `application/json`

**Body:**
```json
{
  "riderId": 1,
  "hubManagerId": 7,
  "vehicleId": 5,
  "hubId": 2,
  "vehiclePhotos": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
  ],
  "riderSignature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...",
  "odometerReading": "50234 KM",
  "fuelLevel": "full",
  "notes": "Vehicle in excellent condition"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "handover": {
    "id": 1,
    "rider_id": 1,
    "hub_manager_id": 7,
    "vehicle_id": 5,
    "hub_id": 2,
    "status": "completed",
    "vehicle_photos": ["data:image/...", "data:image/..."],
    "rider_signature_url": "data:image/...",
    "odometer_reading": "50234 KM",
    "fuel_level": "full",
    "notes": "Vehicle in excellent condition",
    "handed_over_at": "2024-01-15T10:30:00Z",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "message": "Vehicle handover completed successfully"
}
```

**Error Response (400 - Validation Error):**
```json
{
  "error": "Rider not found"
}
```

**Error Response (500):**
```json
{
  "error": "Failed to complete handover"
}
```

---

### PATCH /api/vehicle-handover
Update handover status

**Body:**
```json
{
  "handoverId": 1,
  "status": "completed"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "rider_id": 1,
  "status": "completed",
  "updated_at": "2024-01-15T10:35:00Z"
}
```

**Error Response (500):**
```json
{
  "error": "Failed to update handover"
}
```

---

## 👥 Riders API (Enhanced)

### POST /api/riders
Create a new rider with optional hub and vehicle assignment

**Body:**
```json
{
  "fullName": "John Doe",
  "mobile": "9876543210",
  "email": "john@example.com",
  "ceeId": "CEE-12345",
  "assignedHub": 2,
  "assignedVehicleId": 5,
  "client": "Client Name",
  "joinDate": "2024-01-15"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "rider": {
    "id": 1,
    "user_id": "user_123456789",
    "cee_id": "CEE-12345",
    "full_name": "John Doe",
    "phone": "9876543210",
    "email": "john@example.com",
    "assigned_hub_id": 2,
    "assigned_vehicle_id": 5,
    "status": "active",
    "created_at": "2024-01-15T09:00:00Z"
  },
  "ceeId": "CEE-12345",
  "userId": "user_123456789"
}
```

**Side Effects:**
- Creates notification for hub manager (if hub assigned)
- Creates notification for rider (if hub and vehicle assigned)
- Updates vehicle status to 'assigned'

**Error Response (500):**
```json
{
  "success": false,
  "error": "Failed to create rider"
}
```

---

## 🔄 Data Types & Enums

### Notification Types
```
- rider_assignment                 (Sent to riders)
- new_rider_onboarding            (Sent to hub managers)
- vehicle_handover_complete       (Sent to riders)
- referral                        (Sent to admin)
- referral_approved               (Sent to riders)
- bank_update                     (Sent to admin)
```

### Handover Status
```
- pending   (Not yet completed)
- completed (Handover finished and signed)
```

### Fuel Level Options
```
- empty
- quarter
- half
- three-quarters
- full
```

### Rider Status
```
- active      (Active and available)
- inactive    (Not available)
- suspended   (Temporarily suspended)
```

---

## 📊 Request/Response Examples

### Example 1: Admin Creates Rider
```javascript
// Request
const response = await fetch('/api/riders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fullName: 'John Doe',
    mobile: '9876543210',
    email: 'john@example.com',
    assignedHub: 2,
    assignedVehicleId: 5
  })
});

const data = await response.json();
console.log(data.userId); // user_123456789
console.log(data.ceeId);  // CEE-12345

// Automatic Actions:
// 1. Hub Manager receives notification
// 2. Rider receives notification
// 3. Vehicle marked as 'assigned'
```

### Example 2: Hub Manager Fetches New Riders
```javascript
// Request
const response = await fetch('/api/vehicle-handover?action=new-riders&hubId=2');
const riders = await response.json();

console.log(riders[0]);
// {
//   id: 1,
//   full_name: 'John Doe',
//   cee_id: 'CEE-12345',
//   vehicle_number: 'KA-01-XY-1234',
//   ...
// }
```

### Example 3: Hub Manager Completes Handover
```javascript
// Prepare photos and signature
const file = new File([...], 'photo.jpg', { type: 'image/jpeg' });
const reader = new FileReader();

reader.onloadend = async () => {
  const response = await fetch('/api/vehicle-handover', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      riderId: 1,
      hubManagerId: 7,
      vehicleId: 5,
      hubId: 2,
      vehiclePhotos: [reader.result],
      riderSignature: canvasElement.toDataURL(),
      odometerReading: '50234 KM',
      fuelLevel: 'full',
      notes: 'Good condition'
    })
  });

  const result = await response.json();
  console.log(result.message); // "Vehicle handover completed successfully"
};

reader.readAsDataURL(file);
```

### Example 4: Rider Checks Notifications
```javascript
// Request
const response = await fetch('/api/notifications?userId=user_123');
const data = await response.json();

console.log(data.unreadCount); // 1
console.log(data.notifications[0].type); // 'rider_assignment'
console.log(data.notifications[0].title); // 'Welcome to the Team! 🎉'
```

### Example 5: Hub Manager Marks Notifications as Read
```javascript
// Mark one as read
await fetch('/api/notifications', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 1,
    isRead: true
  })
});

// Mark all as read
await fetch('/api/notifications', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    isRead: true
  })
});
```

---

## 🔐 Security Considerations

1. **User Isolation**: Notifications filtered by user role - users only see their own
2. **Hub Manager Scope**: Hub managers only see riders for their hub
3. **Data Validation**: All inputs validated before database operations
4. **Base64 Encoding**: Photos and signatures stored as base64 strings
5. **Timestamp Tracking**: All operations logged with timestamps

---

## ⚡ Performance Tips

1. **Pagination**: For large notification lists, consider adding pagination
2. **Indexing**: Notifications table should have indexes on user_id, rider_id, hub_manager_id
3. **Caching**: Poll for notifications every 30 seconds (configurable)
4. **Batch Operations**: Mark multiple notifications as read in one request

---

## 🐛 Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Failed to fetch notifications` | Database error | Check database connection |
| `Rider not found` | Invalid riderId | Verify rider exists in database |
| `Vehicle not found` | Invalid vehicleId | Verify vehicle exists and is in correct hub |
| `Hub Manager not found` | Invalid hubManagerId | Verify hub manager is logged in |
| `Photo upload failed` | Invalid base64 | Ensure photos are properly encoded |
| `Signature not captured` | Empty signature | Rider must sign before submission |

---

## 📱 Frontend Integration Example

```typescript
// Get new riders for handover
async function fetchNewRiders(hubId: number) {
  try {
    const response = await fetch(`/api/vehicle-handover?action=new-riders&hubId=${hubId}`);
    if (response.ok) {
      const riders = await response.json();
      return riders;
    }
  } catch (error) {
    console.error('Error fetching riders:', error);
  }
}

// Complete handover
async function completeHandover(handoverData: {
  riderId: number;
  hubManagerId: number;
  vehicleId: number;
  hubId: number;
  vehiclePhotos: string[];
  riderSignature: string;
  odometerReading: string;
  fuelLevel: string;
  notes?: string;
}) {
  try {
    const response = await fetch('/api/vehicle-handover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(handoverData)
    });
    
    if (response.ok) {
      const result = await response.json();
      return result.success;
    }
  } catch (error) {
    console.error('Error completing handover:', error);
  }
}

// Check notifications
async function checkNotifications(userId: string) {
  try {
    const response = await fetch(`/api/notifications?userId=${userId}`);
    if (response.ok) {
      const data = await response.json();
      return data.notifications;
    }
  } catch (error) {
    console.error('Error fetching notifications:', error);
  }
}
```

---

## 📚 Related Documentation

- **Workflow Diagram**: See `WORKFLOW_DIAGRAM.txt`
- **Quick Start Guide**: See `HANDOVER_QUICK_START.md`
- **Technical Details**: See `NOTIFICATION_WORKFLOW.md`
- **Implementation Summary**: See `IMPLEMENTATION_SUMMARY.md`

