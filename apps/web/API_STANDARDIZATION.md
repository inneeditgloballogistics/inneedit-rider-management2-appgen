# API Standardization Rules (CRITICAL)

## Overview
All APIs must use a SINGLE source of truth for each data field. No more mixing field names or accepting multiple parameter names.

---

## 🔴 CRITICAL RULES

### 1. **Parameter Naming**
- **ALWAYS use snake_case** for all query parameters
- ❌ DO NOT use camelCase (hubId, vehicleId, riderId)
- ✅ USE snake_case ONLY (hub_id, vehicle_id, rider_id, cee_id)

### 2. **Single Data Source Per Table**
When storing data in a table, retrieve it from THE SAME TABLE:
- **Example**: manager_email is stored in `hub_managers.manager_email`
  - ❌ DO NOT fetch from `hubs.manager_email` 
  - ✅ JOIN with `hub_managers` table and use `hm.manager_email`

### 3. **Rider Identification**
- **Use `cee_id` as THE ONLY rider identifier**
- ❌ DO NOT mix `user_id`, `rider_id`, or `cee_id`
- ✅ Always reference riders by `cee_id`

### 4. **No Parameter Aliases**
- ❌ DO NOT accept both `hub_id` AND `hubId` in the same endpoint
- ✅ ACCEPT ONLY ONE parameter name (hub_id)

---

## Current API Status (FIXED)

### ✅ Fixed APIs

#### /api/hubs
- **GET**: Returns hubs with manager info from `hub_managers` table + technician count
- **Uses**: `hub_id` (snake_case)

#### /api/technicians
- **GET**: Accepts `hub_id` parameter (snake_case ONLY)
- **Returns**: List of technicians or count

#### /api/vehicles
- **GET**: Accepts `hub_id` parameter (not hubId)
- **Uses**: `cee_id` for `assigned_rider_id` field

#### /api/hub-managers/riders
- **GET**: Accepts `hub_id` parameter (snake_case ONLY)
- **Returns**: Riders assigned to a hub

#### /api/hub-managers/vehicles
- **GET**: Accepts `hub_id` parameter (snake_case ONLY)
- **Returns**: Vehicles at a hub

#### /api/service-tickets
- **GET**: Accepts `hub_id` for hub-manager action (snake_case)
- **POST**: Expects `hub_id` in body (snake_case)

#### /api/vehicle-handover
- **GET**: Accepts `hub_id` for new-riders action (snake_case)
- **POST**: Expects `hub_id` in body (snake_case)

---

## Frontend Usage Rules

### When Calling APIs:
```typescript
// ✅ CORRECT - Use snake_case
fetch(`/api/hubs`);
fetch(`/api/technicians?hub_id=${hubId}`);
fetch(`/api/vehicles?hub_id=${hubId}`);
fetch(`/api/hub-managers/riders?hub_id=${hubId}`);

// ❌ WRONG - Don't use camelCase
fetch(`/api/technicians?hubId=${hubId}`);
fetch(`/api/vehicles?hubId=${hubId}`);
```

### When Making POST Requests:
```typescript
// ✅ CORRECT
const response = await fetch('/api/service-tickets', {
  method: 'POST',
  body: JSON.stringify({
    ceeId: riderCeeId,
    hub_id: hubId,  // snake_case
    vehicleId: vehicleId,
    issueCategory: 'Mechanical'
  })
});

// ❌ WRONG
const response = await fetch('/api/service-tickets', {
  method: 'POST',
  body: JSON.stringify({
    ceeId: riderCeeId,
    hubId: hubId,  // ❌ camelCase
    vehicleId: vehicleId
  })
});
```

---

## Database Schema Alignment

| Table | Primary Field | Notes |
|-------|---|---|
| `hubs` | `id` (int) | Manager info comes from `hub_managers` table |
| `hub_managers` | `id` (int) | `hub_id` foreign key, `manager_email` stored here |
| `riders` | `id` (int), `cee_id` (text) | Primary identifier: `cee_id` |
| `vehicles` | `id` (int) | `hub_id` foreign key, `assigned_rider_id` = `cee_id` |
| `technicians` | `id` (int) | `hub_id` foreign key |
| `service_tickets` | `id` (int) | `cee_id` foreign key, `assigned_hub_id` foreign key |
| `vehicle_handovers` | `id` (int) | `rider_id` foreign key, `hub_id` foreign key |

---

## Components Using APIs (MUST UPDATE)

When updating components to call these APIs, use:
- `hub_id` (not `hubId`)
- `cee_id` (not `rider_id` or `user_id`)
- Always reference the `hub_managers` table for manager details

---

## Summary of Changes Made
1. ✅ Fixed `/api/hubs` to fetch manager_email from `hub_managers` table
2. ✅ Added technician count to `/api/hubs` response
3. ✅ Standardized all hub-related APIs to use `hub_id` (snake_case)
4. ✅ Removed duplicate parameter acceptance (no more hubId aliases)
5. ✅ Updated technician fetching to work with standardized parameters
6. ✅ Ensured all vehicle operations use `hub_id` consistently
7. ✅ Fixed service-tickets and vehicle-handover APIs to use `hub_id`

---

## Going Forward

**Before creating any NEW API:**
1. Check this document
2. Use `hub_id`, `cee_id`, `rider_id` (snake_case)
3. Fetch data from the CORRECT table (don't duplicate)
4. Accept ONLY ONE parameter name per field
5. Return complete data in single response (no multiple endpoints for same action)
