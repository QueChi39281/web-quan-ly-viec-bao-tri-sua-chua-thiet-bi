# API Endpoints Summary

## 📊 Quick Reference Table

### Authentication Service (`/auth`)

| Method | Endpoint | Auth | Role | Purpose |
|--------|----------|------|------|---------|
| GET | `/auth/health` | ❌ | - | Health check |
| POST | `/auth/login` | ❌ | - | User login |
| POST | `/auth/refresh` | ❌ | - | Refresh access token |
| POST | `/auth/logout` | ✅ | Any | User logout |
| GET | `/auth/me` | ✅ | Any | Get current user info |

---

### User Service (`/users`)

| Method | Endpoint | Auth | Role | Purpose |
|--------|----------|------|------|---------|
| GET | `/users/health` | ❌ | - | Health check |
| GET | `/users` | ✅ | ADMIN, MANAGER | List all users |
| GET | `/users/:id` | ✅ | Any | Get user by ID |
| POST | `/users` | ✅ | ADMIN | Create new user |
| PUT | `/users/employees/:id` | ✅ | Any | Update employee info |

---

### Device Service (`/devices`)

| Method | Endpoint | Auth | Role | Purpose |
|--------|----------|------|------|---------|
| GET | `/devices/health` | ❌ | - | Health check |
| **Categories** | | | | |
| GET | `/devices/categories` | ✅ | Any | List device categories |
| GET | `/devices/categories/:id` | ✅ | Any | Get category by ID |
| **Devices** | | | | |
| GET | `/devices` | ✅ | Any | List all devices |
| GET | `/devices/:id` | ✅ | Any | Get device by ID |
| GET | `/devices/list/employees/:employeeId` | ✅ | Any | Devices by employee |
| GET | `/devices/list/categories/:categoryId` | ✅ | Any | Devices by category |
| GET | `/devices/:id/state-histories` | ✅ | Any | Get device state history |
| PUT | `/devices/:id` | ✅ | MANAGER | Update device |
| **Assign Requests** | | | | |
| POST | `/devices/assign-devices` | ✅ | Any | Create assign request |
| GET | `/devices/assign-requests` | ✅ | ADMIN, MANAGER | List assign requests |
| GET | `/devices/assign-requests/:id` | ✅ | Any | Get assign request |
| GET | `/devices/assign-requests/employees/:employeeId` | ✅ | Any | Requests by employee |
| PUT | `/devices/assign-requests/:id` | ✅ | MANAGER | Approve assign request |

---

### Inventory Service (`/inventory`)

| Method | Endpoint | Auth | Role | Purpose |
|--------|----------|------|------|---------|
| GET | `/inventory/health` | ❌ | - | Health check |
| **Inventory** | | | | |
| GET | `/inventory` | ✅ | Any | List inventory |
| GET | `/inventory/:id` | ✅ | Any | Get inventory by ID |
| **Item Requests** | | | | |
| POST | `/inventory/item-requests` | ✅ | TECHNICIAN | Create item request |
| GET | `/inventory/item-requests` | ✅ | ADMIN, MANAGER | List item requests |
| GET | `/inventory/item-requests/:id` | ✅ | ADMIN, MANAGER, TECH | Get item request |
| GET | `/inventory/item-requests/plans/:planId` | ✅ | ADMIN, MANAGER, TECH | Request by plan ID |
| PUT | `/inventory/item-requests/:id` | ✅ | MANAGER | Approve item request |

---

### Maintenance Service (`/maintenance`)

| Method | Endpoint | Auth | Role | Purpose |
|--------|----------|------|------|---------|
| GET | `/maintenance/health` | ❌ | - | Health check |
| **Plans** | | | | |
| POST | `/maintenance/plans` | ✅ | MANAGER | Create maintenance plan |
| GET | `/maintenance/plans` | ✅ | ADMIN, MANAGER | List plans |
| GET | `/maintenance/plans/:id` | ✅ | Any | Get plan by ID |
| GET | `/maintenance/plans/status/:status` | ✅ | Any | List by status |
| GET | `/maintenance/plans/assignments/:employeeId` | ✅ | Any | Get assigned plans |
| GET | `/maintenance/plans/:id/documents` | ✅ | ADMIN, MANAGER, TECH | List documents |
| PUT | `/maintenance/plans/:id` | ✅ | MANAGER | Update plan |
| PUT | `/maintenance/plans/:id/start` | ✅ | TECHNICIAN | Start plan |
| PUT | `/maintenance/plans/:id/complete` | ✅ | TECHNICIAN | Complete plan |
| **Repairs** | | | | |
| POST | `/maintenance/repairs` | ✅ | ADMIN, MANAGER | Create repair |
| GET | `/maintenance/repairs/:id` | ✅ | Any | Get repair by ID |
| PUT | `/maintenance/repairs/:id/approve` | ✅ | MANAGER | Approve repair |
| **Damage Reports** | | | | |
| POST | `/maintenance/damage-reports` | ✅ | TECHNICIAN | Create damage report |
| GET | `/maintenance/damage-reports/:id` | ✅ | Any | Get damage report |
| **Maintenance Requests** | | | | |
| POST | `/maintenance/maintenance-requests` | ✅ | TECHNICIAN | Create request |
| GET | `/maintenance/maintenance-requests/:id` | ✅ | Any | Get request |
| PUT | `/maintenance/maintenance-requests/:id/approve` | ✅ | MANAGER | Approve request |
| **Adjust Plans** | | | | |
| POST | `/maintenance/adjust-plans` | ✅ | TECHNICIAN | Create adjust request |
| GET | `/maintenance/adjust-plans/:id` | ✅ | Any | Get adjust plan |
| PUT | `/maintenance/adjust-plans/:id/approve` | ✅ | MANAGER | Approve adjust plan |
| **Acceptance Reports** | | | | |
| POST | `/maintenance/acceptance-reports` | ✅ | TECHNICIAN | Create acceptance |
| GET | `/maintenance/acceptance-reports/:id` | ✅ | Any | Get acceptance |
| PUT | `/maintenance/acceptance-reports/:id/approve` | ✅ | MANAGER | Approve acceptance |

---

### Notification Service (`/notifications`)

| Method | Endpoint | Auth | Role | Purpose |
|--------|----------|------|------|---------|
| GET | `/notifications/health` | ❌ | - | Health check |
| POST | `/notifications` | ✅ | Any | Create notification |
| GET | `/notifications` | ✅ | ADMIN | List all notifications |
| GET | `/notifications/employees/:employeeId` | ✅ | Any | Get by employee |
| GET | `/notifications/:id` | ✅ | Any | Get notification |
| PUT | `/notifications/:id` | ✅ | Any | Update notification |

---

### Audit Service (`/audits`)

| Method | Endpoint | Auth | Role | Purpose |
|--------|----------|------|------|---------|
| GET | `/audits/health` | ❌ | - | Health check |
| POST | `/audits` | ✅ | Any | Create audit log |
| GET | `/audits` | ✅ | ADMIN | List audit logs |
| GET | `/audits/:id` | ✅ | ADMIN | Get audit by ID |

---

## 🔐 Authentication Methods

### Adding Authorization Header
```javascript
headers: {
  'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
}
```

### Token Endpoints
- **Login**: `POST /auth/login` → Returns `accessToken` and `refreshToken`
- **Refresh**: `POST /auth/refresh` → Returns new `accessToken`
- **Logout**: `POST /auth/logout` → Invalidates tokens
- **Me**: `GET /auth/me` → Returns current user info

---

## 📊 Data Models Overview

### User/Employee
- id, employee_code, full_name, position, phone, date_of_birth, hire_date, termination_date, department_id

### Device
- id, device_code, device_name, serial_number, model, manufacturer_name, supplier_name, category_id, purchase_date, purchase_price, state, warranty dates, depreciation info

### Maintenance Plan
- id, device_id, plan_type (maintenance/repair), status, planned_start_at, planned_end_at, actual_start_at, actual_end_at, assignments

### Inventory
- id, item_id, supplier_id, quantity

### Item
- id, code, name, unit, minimum_stock, manufacturer_id

---

## 🚦 Common Status/State Values

### Device States
`available` | `assigned` | `maintenance` | `disposed`

### Request Status
`pending` | `success` | `fail`

### Plan Status
`not_started` | `ongoing` | `completed` | `cancelled`

### Plan Type
`maintenance` | `repair`

### Repair Priority
`low` | `medium` | `high` | `critical`

### Request Type (Items/Devices)
`issue` | `return`

---

## 🎯 Common Workflows

### 1. Device Assignment Flow
```
1. POST /devices/assign-devices (Employee creates request)
   ↓
2. GET /devices/assign-requests/:id (Manager views request)
   ↓
3. PUT /devices/assign-requests/:id (Manager approves)
   ↓
4. GET /devices/:id (Verify device is assigned)
```

### 2. Maintenance Workflow
```
1. POST /maintenance/plans (Manager creates plan)
   ↓
2. GET /maintenance/plans/assignments/:employeeId (Technician sees assignment)
   ↓
3. PUT /maintenance/plans/:id/start (Technician starts work)
   ↓
4. POST /maintenance/damage-reports (Report issues if found)
   ↓
5. POST /inventory/item-requests (Request parts if needed)
   ↓
6. PUT /maintenance/plans/:id/complete (Complete work)
   ↓
7. POST /maintenance/acceptance-reports (Create acceptance report)
   ↓
8. PUT /maintenance/acceptance-reports/:id/approve (Manager approves)
```

### 3. Repair Workflow
```
1. POST /maintenance/repairs (Manager/Admin creates repair request)
   ↓
2. PUT /maintenance/repairs/:id/approve (Manager approves)
   ↓
3. POST /maintenance/plans (Manager creates repair plan)
   ↓
4. [Follow Maintenance Workflow from step 2]
```

### 4. Inventory Item Request Flow
```
1. POST /inventory/item-requests (Technician requests items)
   ↓
2. GET /inventory/item-requests/:id (Manager reviews)
   ↓
3. PUT /inventory/item-requests/:id (Manager approves)
   ↓
4. Inventory quantity updated
```

---

## 💡 Frontend Integration Tips

| Aspect | Note |
|--------|------|
| **Auth** | Always include Authorization header for protected endpoints |
| **Dates** | Use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ) |
| **Errors** | Check `success` field and handle `error` object |
| **Loading** | Show loading states for long operations |
| **Roles** | Conditionally render UI based on `user.role` |
| **Lists** | API returns full list, implement pagination on frontend |
| **Tokens** | Store in localStorage/sessionStorage, refresh on 401 |

---

## 🔗 API Response Structure

### Success Response
```json
{
  "success": true,
  "data": { /* actual data */ },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error",
    "details": [ /* validation errors */ ]
  }
}
```

---

## 📱 HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid data |
| 401 | Unauthorized - Invalid/missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Server Error - Backend issue |

---

## 🛠️ Testing Tools

### Online
- **Postman** - API testing and documentation
- **Insomnia** - REST client
- **Thunder Client** - VS Code extension

### cURL Example
```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### JavaScript Fetch
```javascript
fetch('http://localhost:3000/auth/me', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log(data))
```

---

**Version**: 1.0  
**Last Updated**: 2026-08-18  
**Base URL**: http://localhost:3000
