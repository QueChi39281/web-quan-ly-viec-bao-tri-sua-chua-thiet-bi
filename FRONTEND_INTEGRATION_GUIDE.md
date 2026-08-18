# Frontend Integration Quick Reference

## API Base URL
```
http://localhost:3000
```

---

## 🔐 Authentication Flow

### 1. Login
```javascript
const response = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'user@example.com',
    password: 'password123'
  })
});

const { data } = await response.json();
// data: { user, accessToken, refreshToken }

// Store tokens
localStorage.setItem('accessToken', data.accessToken);
localStorage.setItem('refreshToken', data.refreshToken);
```

### 2. Authenticated Request Helper
```javascript
async function apiCall(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    ...options.headers
  };

  let response = await fetch(`http://localhost:3000${endpoint}`, {
    ...options,
    headers
  });

  // Handle token expiration
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      // Redirect to login
      window.location.href = '/login';
      return;
    }
    
    headers['Authorization'] = `Bearer ${localStorage.getItem('accessToken')}`;
    response = await fetch(`http://localhost:3000${endpoint}`, {
      ...options,
      headers
    });
  }

  return response.json();
}

async function refreshAccessToken() {
  const response = await fetch('http://localhost:3000/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refreshToken: localStorage.getItem('refreshToken')
    })
  });

  if (response.ok) {
    const { data } = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    return true;
  }
  return false;
}

async function logout() {
  await fetch('http://localhost:3000/auth/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    },
    body: JSON.stringify({
      refreshToken: localStorage.getItem('refreshToken')
    })
  });

  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  window.location.href = '/login';
}
```

---

## 📋 Common API Calls

### Get Current User
```javascript
const user = await apiCall('/auth/me');
console.log(user.data); // User object with employee info
```

### List Devices
```javascript
const devices = await apiCall('/devices');
console.log(devices.data); // Array of devices
```

### Get Device By ID
```javascript
const device = await apiCall('/devices/123');
console.log(device.data);
```

### List Users (Admin/Manager)
```javascript
const users = await apiCall('/users');
console.log(users.data); // Array of users
```

### Create User (Admin)
```javascript
const newUser = await apiCall('/users', {
  method: 'POST',
  body: JSON.stringify({
    employee_code: 'EMP001',
    full_name: 'John Doe',
    position: 'Engineer',
    phone: '0123456789',
    date_of_birth: '1990-01-15',
    hire_date: '2023-01-01',
    department_id: 1,
    username: 'johndoe',
    email: 'john@example.com',
    password: 'SecurePass123',
    role_id: 1
  })
});
```

### Create Assign Device Request
```javascript
const assignRequest = await apiCall('/devices/assign-devices', {
  method: 'POST',
  body: JSON.stringify({
    request_name: 'Request for Laptops',
    reason: 'New team members',
    details: [
      {
        category_id: 1,
        requested_quantity: 5
      }
    ]
  })
});
```

### Create Maintenance Plan (Manager)
```javascript
const plan = await apiCall('/maintenance/plans', {
  method: 'POST',
  body: JSON.stringify({
    device_id: 123,
    plan_type: 'maintenance',
    description: 'Quarterly maintenance',
    estimated_cost: 500000,
    planned_start_at: '2026-09-01T08:00:00Z',
    planned_end_at: '2026-09-01T17:00:00Z',
    assignments: [
      { employee_id: 45 },
      { employee_id: 46 }
    ]
  })
});
```

### Create Item Request (Technician)
```javascript
const itemRequest = await apiCall('/inventory/item-requests', {
  method: 'POST',
  body: JSON.stringify({
    plan_id: 789,
    request_type: 'issue',
    reason: 'Maintenance needed',
    details: [
      {
        inventory_id: 10,
        quantity: 2
      },
      {
        inventory_id: 11,
        quantity: 1
      }
    ]
  })
});
```

### Create Damage Report (Technician)
```javascript
const damageReport = await apiCall('/maintenance/damage-reports', {
  method: 'POST',
  body: JSON.stringify({
    plan_id: 789,
    device_id: 123,
    description: 'Broken screen and keyboard',
    solution: 'Replace screen and keyboard',
    repair_action: 'normal_repair'
  })
});
```

### Approve Device Assign Request (Manager)
```javascript
await apiCall('/devices/assign-requests/456', {
  method: 'PUT',
  body: JSON.stringify({
    details: [
      {
        id: 789,
        approved_quantity: 5
      }
    ]
  })
});
```

### Start Maintenance Plan (Technician)
```javascript
await apiCall('/maintenance/plans/123/start', {
  method: 'PUT'
});
```

### Complete Maintenance Plan (Technician)
```javascript
await apiCall('/maintenance/plans/123/complete', {
  method: 'PUT'
});
```

---

## 🔑 Role-Based Access Control

### Role Hierarchy
- **ADMIN** - System administrator, full access
- **MANAGER** - Approve/manage devices and plans
- **TECHNICIAN** - Create/execute maintenance
- **USER** - Basic employee access

### Check User Role
```javascript
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
const isAdmin = currentUser.role === 'ADMIN';
const isManager = currentUser.role === 'MANAGER';
const isTechnician = currentUser.role === 'TECHNICIAN';
```

---

## 📊 Status Values

### Device States
- `available` - Available for assignment
- `assigned` - Assigned to employee
- `maintenance` - Under maintenance
- `disposed` - Disposed/Removed from service

### Request Status
- `pending` - Waiting for approval
- `success` - Approved/Completed
- `fail` - Rejected

### Plan Status
- `not_started` - Not yet started
- `ongoing` - In progress
- `completed` - Completed
- `cancelled` - Cancelled

### Repair Priority
- `low`
- `medium`
- `high`
- `critical`

### Repair Action
- `normal_repair` - Regular repair
- `send_warranty` - Send for warranty service
- `request_parts` - Request replacement parts
- `dispose` - Dispose the device

---

## 🛠️ Request/Response Examples

### Success Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Device Name",
    "status": "active"
  },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

---

## 📱 Common Frontend Components

### Login Page
```javascript
// Form submission
handleLogin = async (username, password) => {
  const response = await fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const result = await response.json();
  
  if (result.success) {
    localStorage.setItem('accessToken', result.data.accessToken);
    localStorage.setItem('refreshToken', result.data.refreshToken);
    localStorage.setItem('currentUser', JSON.stringify(result.data.user));
    
    // Redirect to dashboard
    navigate('/dashboard');
  } else {
    // Show error message
    showError(result.error.message);
  }
};
```

### Device List Page
```javascript
useEffect(() => {
  loadDevices();
}, []);

const loadDevices = async () => {
  const result = await apiCall('/devices');
  if (result.success) {
    setDevices(result.data);
  }
};
```

### Create Device Request Form
```javascript
const handleCreateRequest = async (formData) => {
  const result = await apiCall('/devices/assign-devices', {
    method: 'POST',
    body: JSON.stringify(formData)
  });

  if (result.success) {
    showSuccess('Request created successfully');
    // Refresh list or navigate
  } else {
    showError(result.error.message);
  }
};
```

### Approve Request (Manager Only)
```javascript
const handleApprove = async (requestId, approvalData) => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  
  if (currentUser.role !== 'MANAGER') {
    showError('Only managers can approve requests');
    return;
  }

  const result = await apiCall(`/devices/assign-requests/${requestId}`, {
    method: 'PUT',
    body: JSON.stringify(approvalData)
  });

  if (result.success) {
    showSuccess('Request approved');
    // Refresh list
  }
};
```

---

## ⏰ Date/Time Format

### ISO 8601 Format Required
```javascript
// Correct format
const date = '2026-09-01T14:30:00Z'; // UTC time
const dateOnly = '2026-09-01'; // Date only

// Convert from JavaScript Date
const now = new Date();
const isoString = now.toISOString(); // e.g., "2026-08-18T10:30:00.000Z"

// Parse date string
const parseDate = (dateString) => new Date(dateString);
```

---

## 🔍 Debugging Tips

### Log API Calls
```javascript
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('API Call:', args[0], args[1]);
  return originalFetch.apply(this, args).then(response => {
    response.clone().json().then(data => {
      console.log('Response:', data);
    });
    return response;
  });
};
```

### Check Token Expiration
```javascript
const isTokenExpired = (token) => {
  const payload = JSON.parse(atob(token.split('.')[1]));
  return Date.now() >= payload.exp * 1000;
};

const accessToken = localStorage.getItem('accessToken');
console.log('Token expired:', isTokenExpired(accessToken));
```

---

## 📋 Checklist for Frontend Implementation

- [ ] Set up API base URL configuration
- [ ] Implement login/logout functionality
- [ ] Set up token storage and refresh mechanism
- [ ] Create API call helper with auth header
- [ ] Implement error handling and retry logic
- [ ] Create loading states for async operations
- [ ] Add role-based conditional rendering
- [ ] Handle 401 unauthorized errors
- [ ] Validate form inputs before sending
- [ ] Format dates to ISO 8601
- [ ] Display user-friendly error messages
- [ ] Implement token expiration check
- [ ] Add CSRF protection if needed
- [ ] Test all API endpoints
- [ ] Handle network errors gracefully

---

## 🚀 Testing API Endpoints

### Using cURL
```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"pass"}'

# Get user (with token)
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create device request
curl -X POST http://localhost:3000/devices/assign-devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "request_name":"Test",
    "details":[{"category_id":1,"requested_quantity":5}]
  }'
```

### Using Postman
1. Set up environment variable: `baseUrl` = `http://localhost:3000`
2. Create login request and extract `accessToken`
3. Add `Authorization: Bearer {{accessToken}}` header to other requests
4. Use `Tests` tab to auto-refresh token on 401

---

Last Updated: 2026-08-18
