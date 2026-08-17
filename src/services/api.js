import axios from 'axios';

// 1. Cấu hình Axios Instance gốc trỏ tới Gateway (mặc định Port 3000)
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// 2. Request Interceptor: Tự động gắn Bearer Token vào Request Header
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. Response Interceptor: Xử lý Refresh Token tự động khi hết hạn (401)
API.interceptors.response.use(
  (response) => response.data, // Trả về trực tiếp response body { success, message, data }
  async (error) => {
    const originalRequest = error.config;

    // Nếu gặp lỗi 401 Unauthorized và chưa từng thử refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Bỏ qua không refresh nếu chính request login hoặc refresh bị lỗi
      if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh')) {
        return Promise.reject(error.response?.data || error);
      }

      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token available');

        // Gọi API Refresh Token qua Gateway
        const res = await axios.post(`${API.defaults.baseURL}/auth/refresh`, { refreshToken });
        
        // Trích xuất accessToken mới
        const newAccessToken = res.data?.data?.accessToken || res.data?.accessToken;

        if (!newAccessToken) {
          throw new Error('Failed to renew access token');
        }

        // Lưu Token mới & Gọi lại Request ban đầu
        localStorage.setItem('accessToken', newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        // Refresh thất bại -> Dọn sạch storage và đẩy về màn đăng nhập
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error.response?.data || error);
  }
);

/* ==========================================================================
   MODULE APIS
   ========================================================================== */

// --- 🔑 AUTH SERVICE ---
export const authApi = {
  health: () => API.get('/auth/health'),
  login: (credentials) => API.post('/auth/login', credentials), // { username, password }
  getMe: () => API.get('/auth/me'),
  logout: () => API.post('/auth/logout'),
  refreshToken: (refreshToken) => API.post('/auth/refresh', { refreshToken }),
  activateAccount: (data) => API.post('/auth/activate', data),
  forgotPassword: (data) => API.post('/auth/forgot-password', typeof data === 'string' ? { email: data } : data),
  resetPassword: (data) => API.post('/auth/reset-password', data),
  changePassword: (data) => API.post('/auth/change-password', data),
};

// --- 👤 USER SERVICE (Chuẩn hóa theo Gateway localhost:3000/users) ---
export const userApi = {
  // GET /users/health
  getHealth: () => API.get('/users/health'),

  // GET /users/ (Yêu cầu ADMIN hoặc MANAGER)
  getUsers: (params) => API.get('/users', { params }),

  // GET /users/:id
  getUserById: (id) => API.get(`/users/${id}`),

  // POST /users/ (Tạo User mới - Yêu cầu ADMIN)
  createUser: (userData) => API.post('/users', userData),

  // PUT /users/employees/:id (Cập nhật thông tin employee cá nhân)
  updateEmployee: (id, employeeData) => API.put(`/users/employees/${id}`, employeeData),

  // PATCH /users/:id (Cập nhật nâng cao)
  updateUser: (id, userData) => API.patch(`/users/${id}`, userData),

  // PATCH /users/:id/status
  changeUserStatus: (id, status) => API.patch(`/users/${id}/status`, { status }),
};

// --- 🏢 DEPARTMENT SERVICE ---
export const departmentApi = {
  createDepartment: (data) => API.post('/departments', data),
  getDepartments: (params) => API.get('/departments', { params }),
  getDepartmentById: (id) => API.get(`/departments/${id}`),
  updateDepartment: (id, data) => API.patch(`/departments/${id}`, data),
};

// --- 💻 DEVICE SERVICE ---
export const deviceApi = {
  createDevice: (deviceData) => API.post('/devices', deviceData),
  getDevices: (params) => API.get('/devices', { params }),
  getDeviceById: (id) => API.get(`/devices/${id}`),
  updateDevice: (id, deviceData) => API.patch(`/devices/${id}`, deviceData),
  getQRCode: (id) => API.get(`/devices/${id}/qr`),
  getMaintenanceHistory: (id) => API.get(`/devices/${id}/maintenance-history`),
  getRepairHistory: (id) => API.get(`/devices/${id}/repair-history`),
};

// --- 🛠️ MAINTENANCE SERVICE ---
export const maintenanceApi = {
  createRequest: (data) => API.post('/maintenance-requests', data),
  getRequests: (params) => API.get('/maintenance-requests', { params }),
  getRequestById: (id) => API.get(`/maintenance-requests/${id}`),
  approveRequest: (id, data) => API.patch(`/maintenance-requests/${id}/approve`, data),
  assignTechnician: (id, data) => API.patch(`/maintenance-requests/${id}/assign`, data),
  startRepair: (id) => API.patch(`/maintenance-requests/${id}/start`),
  completeRepair: (id, data) => API.patch(`/maintenance-requests/${id}/complete`, data),
  approveCompletion: (id, data) => API.patch(`/maintenance-requests/${id}/approve-completion`, data),
  closeRequest: (id) => API.patch(`/maintenance-requests/${id}/close`),
  updateStatus: (id, status) => API.patch(`/maintenance-requests/${id}/status`, { status }),
};

// --- 📦 INVENTORY SERVICE ---
export const inventoryApi = {
  createItem: (data) => API.post('/inventory/items', data),
  getItems: (params) => API.get('/inventory/items', { params }),
  importStock: (data) => API.post('/inventory/import', data),
  exportStock: (data) => API.post('/inventory/export', data),
  getStockSummary: () => API.get('/inventory/stock'),
  getTransactions: (params) => API.get('/inventory/transactions', { params }),
};

// --- 🔔 NOTIFICATION SERVICE ---
export const notificationApi = {
  health: () => API.get('/notifications/health'),
  createNotification: (data) => API.post('/notifications', data),
  getNotifications: (params) => API.get('/notifications', { params }),
  getEmployeeNotifications: (employeeId) => API.get(`/notifications/employees/${employeeId}`),
  getNotificationById: (id) => API.get(`/notifications/${id}`),
  markAsRead: (id, data) => API.patch(`/notifications/${id}`, data),
  sendEmail: (data) => API.post('/notifications/email', data),
  getUnreadCount: () => API.get('/notifications/unread-count'),
};

// --- 📊 REPORT SERVICE ---
export const reportApi = {
  getDashboardSummary: (params) => API.get('/reports/dashboard', { params }),
  getDeviceReport: (params) => API.get('/reports/devices', { params }),
  getMaintenanceReport: (params) => API.get('/reports/maintenance', { params }),
  getTechnicianReport: (params) => API.get('/reports/technicians', { params }),
  getCostReport: (params) => API.get('/reports/costs', { params }),
  exportReport: (params) => API.get('/reports/export', { params }),
};

export default API;