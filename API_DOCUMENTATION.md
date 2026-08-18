# API Documentation - Fix It Felix Backend

## Gateway Base URL
```
http://localhost:3000
```

---

## 1. Authentication Service (AUTH)

### Health Check
```
GET /auth/health
```
**Response:**
```json
{
  "status": "OK"
}
```

### Login
```
POST /auth/login
```
**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "employee_id": "string",
      "username": "string",
      "email": "string",
      "status": "active|locked",
      "role": "string",
      "employee": {
        "employee_code": "string",
        "full_name": "string",
        "position": "string",
        "phone": "string",
        "department_id": "number",
        "department_name": "string",
        "hire_date": "date"
      }
    },
    "accessToken": "string (JWT)",
    "refreshToken": "string (JWT)"
  },
  "message": "Login successful"
}
```

### Refresh Token
```
POST /auth/refresh
```
**Request:**
```json
{
  "refreshToken": "string"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "string (JWT)"
  },
  "message": "Token refreshed"
}
```

### Logout
```
POST /auth/logout
Authorization: Bearer <accessToken>
```
**Request:**
```json
{
  "refreshToken": "string"
}
```
**Response:**
```json
{
  "success": true,
  "data": {},
  "message": "Logged out successfully"
}
```

### Get Current User Info
```
GET /auth/me
Authorization: Bearer <accessToken>
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "employee_id": "string",
    "username": "string",
    "email": "string",
    "status": "active|locked",
    "role": "string",
    "employee": {
      "employee_code": "string",
      "full_name": "string",
      "position": "string",
      "phone": "string",
      "department_id": "number",
      "department_name": "string",
      "hire_date": "date"
    }
  },
  "message": "User info"
}
```

---

## 2. User Service

### Health Check
```
GET /users/health
```

### List Users
```
GET /users
Authorization: Bearer <accessToken>
```
**Required Role:** ADMIN, MANAGER

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "number",
      "department_id": "number",
      "employee_code": "string",
      "full_name": "string",
      "position": "string",
      "phone": "string",
      "date_of_birth": "date",
      "hire_date": "date",
      "termination_date": "date|null",
      "account": {
        "username": "string",
        "email": "string",
        "status": "active|locked"
      }
    }
  ],
  "message": "List users"
}
```

### Get User By ID
```
GET /users/:id
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "number",
    "department_id": "number",
    "employee_code": "string",
    "full_name": "string",
    "position": "string",
    "phone": "string",
    "date_of_birth": "date",
    "hire_date": "date",
    "termination_date": "date|null",
    "account": {
      "username": "string",
      "email": "string",
      "status": "active|locked",
      "role": "string"
    }
  },
  "message": "User found"
}
```

### Create User (Employee + Account)
```
POST /users
Authorization: Bearer <accessToken>
```
**Required Role:** ADMIN

**Request:**
```json
{
  "employee_code": "string",
  "full_name": "string",
  "position": "string",
  "phone": "string",
  "date_of_birth": "date (YYYY-MM-DD)",
  "hire_date": "date (YYYY-MM-DD)",
  "department_id": "number",
  "username": "string",
  "email": "string",
  "password": "string",
  "role_id": "number"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "number",
    "employee_code": "string",
    "full_name": "string",
    "position": "string",
    "phone": "string",
    "date_of_birth": "date",
    "hire_date": "date",
    "department_id": "number",
    "account": {
      "username": "string",
      "email": "string",
      "role": "string"
    }
  },
  "message": "User created"
}
```

### Update Employee
```
PUT /users/employees/:id
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "full_name": "string (optional)",
  "position": "string (optional)",
  "phone": "string (optional)",
  "department_id": "number (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "number",
    "employee_code": "string",
    "full_name": "string",
    "position": "string",
    "phone": "string",
    "department_id": "number"
  },
  "message": "Employee updated"
}
```

---

## 3. Device Service

### Health Check
```
GET /devices/health
```

### Device Categories

#### List Categories
```
GET /devices/categories
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "number",
      "code": "string",
      "name": "string",
      "description": "string",
      "depreciation_period_min_months": "number",
      "depreciation_period_max_months": "number",
      "is_active": "boolean"
    }
  ],
  "message": "List categories"
}
```

#### Get Category By ID
```
GET /devices/categories/:id
Authorization: Bearer <accessToken>
```

### Devices

#### List All Devices
```
GET /devices
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "number",
      "category_id": "number",
      "device_code": "string",
      "device_name": "string",
      "serial_number": "string",
      "model": "string",
      "manufacturer_name": "string",
      "supplier_name": "string",
      "manufacture_date": "date",
      "purchase_date": "date",
      "purchase_price": "decimal",
      "original_cost": "decimal",
      "warranty_start_date": "date",
      "warranty_end_date": "date",
      "state": "available|assigned|maintenance|disposed",
      "depreciation_method": "straight_line",
      "book_value": "decimal",
      "accumulated_depreciation": "decimal"
    }
  ],
  "message": "List devices"
}
```

#### Get Device By ID
```
GET /devices/:id
Authorization: Bearer <accessToken>
```

#### List Devices By Employee
```
GET /devices/list/employees/:employeeId
Authorization: Bearer <accessToken>
```

#### List Devices By Category
```
GET /devices/list/categories/:categoryId
Authorization: Bearer <accessToken>
```

#### Get Device State Histories
```
GET /devices/:id/state-histories
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "number",
      "device_id": "number",
      "old_state": "string",
      "new_state": "string",
      "created_at": "timestamp"
    }
  ]
}
```

#### Update Device
```
PUT /devices/:id
Authorization: Bearer <accessToken>
```
**Required Role:** MANAGER

**Request:**
```json
{
  "device_name": "string (optional)",
  "model": "string (optional)",
  "purchase_price": "decimal (optional)",
  "warranty_start_date": "date (optional)",
  "warranty_end_date": "date (optional)",
  "specifications": "string (optional)"
}
```

### Device Assign Requests

#### Create Assign Request
```
POST /devices/assign-devices
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "request_name": "string",
  "reason": "string (optional)",
  "details": [
    {
      "category_id": "number",
      "requested_quantity": "number"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "number",
    "created_by_employee_id": "number",
    "request_name": "string",
    "reason": "string",
    "status": "pending|success|fail",
    "requested_at": "timestamp",
    "details": [
      {
        "id": "number",
        "category_id": "number",
        "requested_quantity": "number",
        "approved_quantity": "number",
        "status": "pending|success|fail"
      }
    ]
  }
}
```

#### List Assign Requests
```
GET /devices/assign-requests
Authorization: Bearer <accessToken>
```
**Required Role:** ADMIN, MANAGER

#### Get Assign Request By ID
```
GET /devices/assign-requests/:id
Authorization: Bearer <accessToken>
```

#### List Assign Requests By Employee
```
GET /devices/assign-requests/employees/:employeeId
Authorization: Bearer <accessToken>
```

#### Approve Assign Request
```
PUT /devices/assign-requests/:id
Authorization: Bearer <accessToken>
```
**Required Role:** MANAGER

**Request:**
```json
{
  "details": [
    {
      "id": "number",
      "approved_quantity": "number"
    }
  ]
}
```

---

## 4. Inventory Service

### Health Check
```
GET /inventory/health
```

### Inventory

#### List Inventory
```
GET /inventory
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "number",
      "item_id": "number",
      "supplier_id": "number",
      "quantity": "number",
      "item": {
        "id": "number",
        "code": "string",
        "name": "string",
        "unit": "string",
        "minimum_stock": "number"
      },
      "supplier": {
        "id": "number",
        "code": "string",
        "name": "string"
      }
    }
  ]
}
```

#### Get Inventory By ID
```
GET /inventory/:id
Authorization: Bearer <accessToken>
```

### Item Requests

#### Create Item Request
```
POST /inventory/item-requests
Authorization: Bearer <accessToken>
```
**Required Role:** TECHNICIAN

**Request:**
```json
{
  "plan_id": "number (optional)",
  "request_type": "issue|return",
  "reason": "string (optional)",
  "details": [
    {
      "inventory_id": "number",
      "quantity": "number"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "number",
    "created_by_employee_id": "number",
    "plan_id": "number",
    "request_type": "issue|return",
    "status": "pending|success|fail",
    "reason": "string",
    "details": [
      {
        "id": "number",
        "inventory_id": "number",
        "quantity": "number"
      }
    ]
  }
}
```

#### List Item Requests
```
GET /inventory/item-requests
Authorization: Bearer <accessToken>
```
**Required Role:** ADMIN, MANAGER

#### Get Item Request By ID
```
GET /inventory/item-requests/:id
Authorization: Bearer <accessToken>
```
**Required Role:** ADMIN, MANAGER, TECHNICIAN

#### Get Item Request By Plan ID
```
GET /inventory/item-requests/plans/:planId
Authorization: Bearer <accessToken>
```
**Required Role:** ADMIN, MANAGER, TECHNICIAN

#### Approve Item Request
```
PUT /inventory/item-requests/:id
Authorization: Bearer <accessToken>
```
**Required Role:** MANAGER

**Request:**
```json
{
  "details": [
    {
      "id": "number",
      "approved_quantity": "number"
    }
  ]
}
```

---

## 5. Maintenance Service

### Health Check
```
GET /maintenance/health
```

### Plans

#### Create Plan
```
POST /maintenance/plans
Authorization: Bearer <accessToken>
```
**Required Role:** MANAGER

**Request:**
```json
{
  "device_id": "number",
  "plan_type": "maintenance|repair",
  "description": "string (optional)",
  "estimated_cost": "decimal (optional)",
  "planned_start_at": "datetime (ISO8601)",
  "planned_end_at": "datetime (ISO8601)",
  "assignments": [
    {
      "employee_id": "number"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "number",
    "device_id": "number",
    "plan_type": "maintenance|repair",
    "description": "string",
    "estimated_cost": "decimal",
    "planned_start_at": "datetime",
    "planned_end_at": "datetime",
    "actual_start_at": "datetime",
    "actual_end_at": "datetime",
    "status": "not_started|ongoing|completed|cancelled",
    "assignments": [
      {
        "id": "number",
        "employee_id": "number",
        "availability_status": "available|unavailable"
      }
    ]
  }
}
```

#### List Plans
```
GET /maintenance/plans
Authorization: Bearer <accessToken>
```
**Required Role:** ADMIN, MANAGER

#### Get Plan By ID
```
GET /maintenance/plans/:id
Authorization: Bearer <accessToken>
```

#### List Plans By Status
```
GET /maintenance/plans/status/:status
Authorization: Bearer <accessToken>
```

#### Get Plans By Assignment
```
GET /maintenance/plans/assignments/:employeeId
Authorization: Bearer <accessToken>
```

#### List All Plan Documents
```
GET /maintenance/plans/:id/documents
Authorization: Bearer <accessToken>
```

#### Update Plan
```
PUT /maintenance/plans/:id
Authorization: Bearer <accessToken>
```
**Required Role:** MANAGER

**Request:**
```json
{
  "description": "string (optional)",
  "estimated_cost": "decimal (optional)",
  "planned_start_at": "datetime (optional)",
  "planned_end_at": "datetime (optional)",
  "assignments": [
    {
      "employee_id": "number"
    }
  ]
}
```

#### Start Plan
```
PUT /maintenance/plans/:id/start
Authorization: Bearer <accessToken>
```
**Required Role:** TECHNICIAN

#### Complete Plan
```
PUT /maintenance/plans/:id/complete
Authorization: Bearer <accessToken>
```
**Required Role:** TECHNICIAN

### Repairs

#### Create Repair Request
```
POST /maintenance/repairs
Authorization: Bearer <accessToken>
```
**Required Role:** ADMIN, MANAGER

**Request:**
```json
{
  "device_id": "number",
  "request_name": "string",
  "priority": "low|medium|high|critical",
  "description": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "number",
    "device_id": "number",
    "request_name": "string",
    "priority": "low|medium|high|critical",
    "description": "string",
    "status": "pending|success|fail",
    "created_by_employee_id": "number",
    "created_at": "timestamp"
  }
}
```

#### Get Repair Request By ID
```
GET /maintenance/repairs/:id
Authorization: Bearer <accessToken>
```

#### Approve Repair Request
```
PUT /maintenance/repairs/:id/approve
Authorization: Bearer <accessToken>
```
**Required Role:** MANAGER

**Request:**
```json
{
  "estimated_cost": "decimal (optional)"
}
```

### Damage Reports

#### Create Damage Report
```
POST /maintenance/damage-reports
Authorization: Bearer <accessToken>
```
**Required Role:** TECHNICIAN

**Request:**
```json
{
  "plan_id": "number",
  "device_id": "number",
  "description": "string",
  "solution": "string (optional)",
  "repair_action": "normal_repair|send_warranty|request_parts|dispose"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "number",
    "plan_id": "number",
    "device_id": "number",
    "report_name": "string",
    "description": "string",
    "solution": "string",
    "repair_action": "string",
    "created_by_employee_id": "number",
    "created_at": "timestamp"
  }
}
```

#### Get Damage Report By ID
```
GET /maintenance/damage-reports/:id
Authorization: Bearer <accessToken>
```

### Maintenance Requests

#### Create Maintenance Request
```
POST /maintenance/maintenance-requests
Authorization: Bearer <accessToken>
```
**Required Role:** TECHNICIAN

**Request:**
```json
{
  "plan_id": "number",
  "request_type": "send_warranty|dispose",
  "reason": "string (optional)"
}
```

#### Get Maintenance Request By ID
```
GET /maintenance/maintenance-requests/:id
Authorization: Bearer <accessToken>
```

#### Approve Maintenance Request
```
PUT /maintenance/maintenance-requests/:id/approve
Authorization: Bearer <accessToken>
```
**Required Role:** MANAGER

### Adjust Plans

#### Create Adjust Plan Request
```
POST /maintenance/adjust-plans
Authorization: Bearer <accessToken>
```
**Required Role:** TECHNICIAN

**Request:**
```json
{
  "plan_id": "number",
  "reason": "string",
  "suggestion": "string (optional)"
}
```

#### Get Adjust Plan By ID
```
GET /maintenance/adjust-plans/:id
Authorization: Bearer <accessToken>
```

#### Approve Adjust Plan
```
PUT /maintenance/adjust-plans/:id/approve
Authorization: Bearer <accessToken>
```
**Required Role:** MANAGER

### Acceptance Reports

#### Create Acceptance Report
```
POST /maintenance/acceptance-reports
Authorization: Bearer <accessToken>
```
**Required Role:** TECHNICIAN

**Request:**
```json
{
  "plan_id": "number",
  "description": "string (optional)",
  "review": "string (optional)"
}
```

#### Get Acceptance Report By ID
```
GET /maintenance/acceptance-reports/:id
Authorization: Bearer <accessToken>
```

#### Approve Acceptance Report
```
PUT /maintenance/acceptance-reports/:id/approve
Authorization: Bearer <accessToken>
```
**Required Role:** MANAGER

---

## 6. Notification Service

### Health Check
```
GET /notifications/health
```

### Notifications

#### Create Notification
```
POST /notifications
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "employee_id": "number",
  "type": "string",
  "title": "string",
  "content": "string",
  "reference_type": "string (optional)",
  "reference_id": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "number",
    "employee_id": "number",
    "type": "string",
    "title": "string",
    "content": "string",
    "is_read": "boolean",
    "created_at": "timestamp"
  }
}
```

#### List Notifications
```
GET /notifications
Authorization: Bearer <accessToken>
```
**Required Role:** ADMIN

#### Get Notifications By Employee
```
GET /notifications/employees/:employeeId
Authorization: Bearer <accessToken>
```

#### Get Notification By ID
```
GET /notifications/:id
Authorization: Bearer <accessToken>
```

#### Update Notification
```
PUT /notifications/:id
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "is_read": "boolean (optional)"
}
```

---

## 7. Audit Service

### Health Check
```
GET /audits/health
```

### Audits

#### Create Audit Log
```
POST /audits
Authorization: Bearer <accessToken>
```

**Request:**
```json
{
  "action": "string",
  "entity_type": "string",
  "entity_id": "number",
  "changes": "object (optional)",
  "description": "string (optional)"
}
```

#### List Audits
```
GET /audits
Authorization: Bearer <accessToken>
```
**Required Role:** ADMIN

#### Get Audit By ID
```
GET /audits/:id
Authorization: Bearer <accessToken>
```
**Required Role:** ADMIN

---

## Authentication & Authorization

### Required Headers
```
Authorization: Bearer <accessToken>
```

### Available Roles
- `ADMIN` - Full system access
- `MANAGER` - Manage devices, plans, and approvals
- `TECHNICIAN` - Create maintenance requests and reports
- `USER` - Basic employee access

### Response Format

All successful responses follow this format:
```json
{
  "success": true,
  "data": { ... },
  "message": "string"
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string",
    "details": []
  }
}
```

### Common HTTP Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Notes for Frontend Integration

1. **Token Management**: Store `accessToken` and `refreshToken` in secure storage (httpOnly cookies recommended)
2. **Token Refresh**: Use `/auth/refresh` endpoint before token expiration
3. **Date Format**: Use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
4. **Timezone**: All timestamps are in UTC (Timestamptz)
5. **Pagination**: Implement on frontend if needed (API returns full list)
6. **Error Handling**: Check `success` field and handle error details properly
7. **CORS**: Gateway is configured with CORS enabled
8. **Request Validation**: All inputs are validated server-side

---

## Example Frontend Integration Flow

### 1. Login
```javascript
POST /auth/login
Body: { username, password }
→ Returns: { user, accessToken, refreshToken }
```

### 2. Store Tokens
```javascript
localStorage.setItem('accessToken', accessToken)
localStorage.setItem('refreshToken', refreshToken)
```

### 3. Make Authenticated Request
```javascript
GET /devices
Header: Authorization: Bearer accessToken
```

### 4. Handle Token Expiration
```javascript
If 401 Unauthorized:
  POST /auth/refresh
  Body: { refreshToken }
  → Returns: { accessToken }
  → Retry original request
```

### 5. Logout
```javascript
POST /auth/logout
Header: Authorization: Bearer accessToken
Body: { refreshToken }
→ Clear tokens from storage
```

---

Generated: 2026-08-18
