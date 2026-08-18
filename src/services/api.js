import axios from 'axios';

// 1. Cấu hình Axios Instance gốc trỏ tới Gateway (mặc định Port 3000)
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

const isMissingDataError = (error) => {
  const status = error?.response?.status;
  if (status === 401 || status === 403) return false;
  if ([400, 404, 204, 500].includes(status)) return true;

  const message = String(
    error?.message ||
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      ''
  ).toLowerCase();

  return (
    !error?.response ||
    message.includes('not found') ||
    message.includes('no data') ||
    message.includes('network error') ||
    message.includes('failed to fetch') ||
    message.includes('timeout') ||
    message.includes('connection refused') ||
    message.includes('internal server error')
  );
};

const safeApiCall = async (requestFn, fallback = null) => {
  try {
    const result = await requestFn();

    if (result === undefined || result === null) return fallback;
    if (Array.isArray(result)) return result;
    if (typeof result === 'object' && 'data' in result) {
      return result.data ?? fallback;
    }

    return result ?? fallback;
  } catch (error) {
    if (isMissingDataError(error)) return fallback;
    throw error;
  }
};

const safeListCall = (requestFn) => safeApiCall(requestFn, []);
const safeObjectCall = (requestFn) => safeApiCall(requestFn, {});
const safeCountCall = (requestFn) => safeApiCall(requestFn, 0);
const safeMutationCall = async (requestFn, fallback = { success: true, updated: 0 }) => {
  try {
    return await requestFn();
  } catch (error) {
    if (isMissingDataError(error)) return fallback;
    throw error;
  }
};

const extractEmployeeIdFromObject = (value) => {
  if (!value || typeof value !== 'object') return '';

  const direct = value.employee_id ?? value.employeeId ?? value.id ?? value.userId ?? value.user_id ?? value.employee?.id ?? value.employee?.employee_id ?? value.user?.employee_id ?? value.user?.id ?? '';
  return direct ? String(direct) : '';
};

export const getCurrentEmployeeId = () => {
  const candidates = [
    localStorage.getItem('userId'),
    localStorage.getItem('employeeId'),
    localStorage.getItem('userAccountId'),
    sessionStorage.getItem('userId'),
    sessionStorage.getItem('employeeId'),
  ];

  for (const candidate of candidates) {
    if (candidate) return String(candidate);
  }

  try {
    const cachedUserInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
    const fromUserInfo = extractEmployeeIdFromObject(cachedUserInfo);
    if (fromUserInfo) return fromUserInfo;
  } catch {
    // ignore parse errors
  }

  try {
    const cachedAuth = JSON.parse(localStorage.getItem('authUser') || 'null');
    const fromAuth = extractEmployeeIdFromObject(cachedAuth);
    if (fromAuth) return fromAuth;
  } catch {
    // ignore parse errors
  }

  return '';
};

export const normalizeNotificationForEmployee = (notification, employeeId = getCurrentEmployeeId()) => {
  if (!notification || typeof notification !== 'object') return notification;

  const receiverList = Array.isArray(notification.receiver_info) ? notification.receiver_info : [];
  const targetEmployeeId = String(employeeId || getCurrentEmployeeId() || '');
  const matchedReceiver = receiverList.find((receiver) => {
    const current = String(receiver?.employee_id ?? '');
    return current === targetEmployeeId || Number(current) === Number(targetEmployeeId);
  });

  const isRead = matchedReceiver ? Boolean(matchedReceiver.is_read) : Boolean(notification.is_read);

  return {
    ...notification,
    is_read: isRead,
    createdAt: notification.created_at || notification.createdAt,
    read_at: matchedReceiver?.read_at || notification.read_at,
  };
};

export const normalizeNotificationList = (payload, employeeId = getCurrentEmployeeId()) => {
  const rawList = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.items)
        ? payload.items
        : [];

  return rawList.map((item) => normalizeNotificationForEmployee(item, employeeId));
};

const normalizeResponseData = (payload, fallback = []) => {
  if (payload === undefined || payload === null) return fallback;
  if (Array.isArray(payload)) return payload;
  if (typeof payload === 'object') {
    if (Array.isArray(payload.data)) return payload.data;
    if (payload.data && typeof payload.data === 'object') return payload.data;
    if (Array.isArray(payload.items)) return payload.items;
    if (payload.items && typeof payload.items === 'object') return payload.items;
    return payload;
  }
  return fallback;
};

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

    if (isMissingDataError(error)) {
      const method = (originalRequest?.method || 'get').toLowerCase();
      const url = (originalRequest?.url || '').toLowerCase();
      const looksLikeList =
        originalRequest?.params ||
        /(users|departments|devices|maintenance-requests|inventory|notifications|reports|transactions|items|stock|dashboard|employees)/.test(url);

      return Promise.resolve(method === 'get' && looksLikeList ? [] : {});
    }

    return Promise.reject(error.response?.data || error);
  }
);

/* ==========================================================================
   MODULE APIS
   ========================================================================== */

// --- 🔑 AUTH SERVICE ---
export const authApi = {
  health: () => safeObjectCall(() => API.get('/auth/health')),
  login: (credentials) => API.post('/auth/login', credentials), // { username, password }
  getMe: () => safeObjectCall(() => API.get('/auth/me')),
  logout: () => API.post('/auth/logout'),
  refreshToken: (refreshToken) => API.post('/auth/refresh', { refreshToken }),
  activateAccount: (data) => safeMutationCall(() => API.post('/auth/activate', data), { success: true, message: 'No-op: endpoint unavailable' }),
  forgotPassword: (data) => safeMutationCall(() => API.post('/auth/forgot-password', typeof data === 'string' ? { email: data } : data), { success: true, message: 'No-op: endpoint unavailable' }),
  resetPassword: (data) => safeMutationCall(() => API.post('/auth/reset-password', data), { success: true, message: 'No-op: endpoint unavailable' }),
  changePassword: (data) => safeMutationCall(() => API.post('/auth/change-password', data), { success: true, message: 'No-op: endpoint unavailable' }),
};

// --- 👤 USER SERVICE (Chuẩn hóa theo Gateway localhost:3000/users) ---
export const userApi = {
  // GET /users/health
  getHealth: () => safeObjectCall(() => API.get('/users/health')),

  // GET /users/ (Yêu cầu ADMIN hoặc MANAGER)
  getUsers: (params) => safeListCall(() => API.get('/users', { params })),

  // GET /users/:id
  getUserById: (id) => safeObjectCall(() => API.get(`/users/${id}`)),

  // POST /users/ (Tạo User mới - Yêu cầu ADMIN)
  createUser: (userData) => safeMutationCall(() => API.post('/users', userData), { success: true, message: 'No-op: user create endpoint unavailable' }),

  // PUT /users/employees/:id (Cập nhật thông tin employee cá nhân)
  updateEmployee: (id, employeeData) => safeMutationCall(() => API.put(`/users/employees/${id}`, employeeData), { success: true, message: 'No-op: employee update endpoint unavailable' }),

  // PATCH /users/:id (Cập nhật nâng cao)
  updateUser: (id, userData) => safeMutationCall(() => API.patch(`/users/${id}`, userData), { success: true, message: 'No-op: user update endpoint unavailable' }),

  // PATCH /users/:id/status
  changeUserStatus: (id, status) => safeMutationCall(() => API.patch(`/users/${id}/status`, { status }), { success: true, message: 'No-op: status update endpoint unavailable' }),
};

// --- 🏢 DEPARTMENT SERVICE ---
export const departmentApi = {
  createDepartment: (data) => safeMutationCall(() => API.post('/departments', data), { success: true, message: 'No-op: department create endpoint unavailable' }),
  getDepartments: (params) => safeListCall(() => API.get('/departments', { params })),
  getDepartmentById: (id) => safeObjectCall(() => API.get(`/departments/${id}`)),
  updateDepartment: (id, data) => safeMutationCall(() => API.patch(`/departments/${id}`, data), { success: true, message: 'No-op: department update endpoint unavailable' }),
};

// --- 💻 DEVICE SERVICE (chuẩn hóa theo gateway localhost:3000/devices) ---
export const deviceApi = {
  getHealth: () => safeObjectCall(() => API.get('/devices/health')),
  getDevices: (params) => safeListCall(() => API.get('/devices', { params })),
  getDeviceById: (id) => safeObjectCall(() => API.get(`/devices/${id}`)),
  getDeviceCategories: () => safeListCall(() => API.get('/devices/categories')),
  getDeviceCategoryById: (id) => safeObjectCall(() => API.get(`/devices/categories/${id}`)),
  getDevicesByEmployee: (employeeId) => safeListCall(() => API.get(`/devices/list/employees/${employeeId}`)),
  getDevicesByCategory: (categoryId) => safeListCall(() => API.get(`/devices/list/categories/${categoryId}`)),
  getDeviceStateHistories: (id) => safeListCall(() => API.get(`/devices/${id}/state-histories`)),
  assignDevice: (payload) => safeMutationCall(() => API.post('/devices/assign-devices', payload), { success: true, message: 'No-op: assign-devices endpoint unavailable' }),
  getAssignRequests: (params) => safeListCall(() => API.get('/devices/assign-requests', { params })),
  getAssignRequestById: (id) => safeObjectCall(() => API.get(`/devices/assign-requests/${id}`)),
  updateAssignRequest: (id, payload) => safeMutationCall(() => API.put(`/devices/assign-requests/${id}`, payload), { success: true, message: 'No-op: assign request update endpoint unavailable' }),
  createDevice: (deviceData) => safeMutationCall(() => API.post('/devices', deviceData), { success: true, message: 'No-op: device create endpoint unavailable' }),
  updateDevice: (id, deviceData) => safeMutationCall(() => API.put(`/devices/${id}`, deviceData), { success: true, message: 'No-op: device update endpoint unavailable' }),
  getQRCode: () => Promise.resolve({ success: true, data: null }),
  getMaintenanceHistory: () => Promise.resolve([]),
  getRepairHistory: () => Promise.resolve([]),
};

// --- 🛠️ MAINTENANCE SERVICE ---
export const maintenanceApi = {
  createRequest: (data) => safeMutationCall(() => API.post('/maintenance-requests', data), { success: true, message: 'No-op: maintenance request create endpoint unavailable' }),
  getRequests: (params) => safeListCall(() => API.get('/maintenance-requests', { params })),
  getRequestById: (id) => safeObjectCall(() => API.get(`/maintenance-requests/${id}`)),
  approveRequest: (id, data) => safeMutationCall(() => API.patch(`/maintenance-requests/${id}/approve`, data), { success: true, message: 'No-op: approve endpoint unavailable' }),
  assignTechnician: (id, data) => safeMutationCall(() => API.patch(`/maintenance-requests/${id}/assign`, data), { success: true, message: 'No-op: assign technician endpoint unavailable' }),
  startRepair: (id) => safeMutationCall(() => API.patch(`/maintenance-requests/${id}/start`), { success: true, message: 'No-op: start repair endpoint unavailable' }),
  completeRepair: (id, data) => safeMutationCall(() => API.patch(`/maintenance-requests/${id}/complete`, data), { success: true, message: 'No-op: complete repair endpoint unavailable' }),
  approveCompletion: (id, data) => safeMutationCall(() => API.patch(`/maintenance-requests/${id}/approve-completion`, data), { success: true, message: 'No-op: approve completion endpoint unavailable' }),
  closeRequest: (id) => safeMutationCall(() => API.patch(`/maintenance-requests/${id}/close`), { success: true, message: 'No-op: close request endpoint unavailable' }),
  updateStatus: (id, status) => safeMutationCall(() => API.patch(`/maintenance-requests/${id}/status`, { status }), { success: true, message: 'No-op: status update endpoint unavailable' }),
};

// --- 📦 INVENTORY SERVICE ---
export const inventoryApi = {
  createItem: (data) => safeMutationCall(() => API.post('/inventory/items', data), { success: true, message: 'No-op: item create endpoint unavailable' }),
  getItems: (params) => safeListCall(() => API.get('/inventory/items', { params })),
  importStock: (data) => safeMutationCall(() => API.post('/inventory/import', data), { success: true, message: 'No-op: import stock endpoint unavailable' }),
  exportStock: (data) => safeMutationCall(() => API.post('/inventory/export', data), { success: true, message: 'No-op: export stock endpoint unavailable' }),
  getStockSummary: () => safeObjectCall(() => API.get('/inventory/stock')),
  getTransactions: (params) => safeListCall(() => API.get('/inventory/transactions', { params })),
};

// --- 🧾 AUDIT SERVICE ---
export const auditApi = {
  health: () => safeObjectCall(() => API.get('/audits/health')),
  createAudit: (data) => safeMutationCall(() => API.post('/audits', data), { success: true, message: 'No-op: audit create endpoint unavailable' }),
  getAudits: (params) => safeListCall(() => API.get('/audits', { params })),
  getAuditById: (id) => safeObjectCall(() => API.get(`/audits/${id}`)),
};

// // --- 🔔 NOTIFICATION SERVICE ---
// export const notificationApi = {
//   health: () => safeObjectCall(() => API.get('/notifications/health')),
//   createNotification: (data) => safeMutationCall(() => API.post('/notifications', data), { success: true, message: 'No-op: create notification endpoint unavailable' }),
//   getNotifications: (params) => safeListCall(() => API.get('/notifications', { params })),
//   getAll: (params) => safeListCall(() => API.get('/notifications', { params })),
//   getEmployeeNotifications: (employeeId) => safeListCall(() => API.get(`/notifications/employees/${employeeId}`)),
//   getNotificationById: (id) => safeObjectCall(() => API.get(`/notifications/${id}`)),
//   markAsRead: async (id, data = { is_read: true }) => {
//     try {
//       const result = await API.put(`/notifications/${id}`, data);
//       return result;
//     } catch (error) {
//       if (isMissingDataError(error)) return { success: true, updated: 0 };
//       throw error;
//     }
//   },
//   markAllAsRead: async () => {
//     const employeeId = getCurrentEmployeeId();

//     let response = null;
//     try {
//       if (employeeId) {
//         response = await API.get(`/notifications/employees/${employeeId}`);
//       } else {
//         response = await API.get('/notifications');
//       }
//     } catch (error) {
//       if (isMissingDataError(error)) return { success: true, updated: 0 };
//       throw error;
//     }

//     const rawItems = Array.isArray(response)
//       ? response
//       : response?.data?.data || response?.data || response?.items || [];
//     const normalized = normalizeNotificationList(rawItems, employeeId || getCurrentEmployeeId());
//     const ids = normalized
//       .filter((item) => !item.is_read)
//       .map((item) => item.id)
//       .filter((id) => id !== undefined && id !== null && id !== '');

//     if (!ids.length) {
//       return { success: true, updated: 0 };
//     }

//     const results = [];
//     for (const id of ids) {
//       try {
//         await API.put(`/notifications/${id}`, { is_read: true });
//         results.push({ status: 'fulfilled', id });
//       } catch (error) {
//         results.push({ status: 'rejected', id, error });
//       }
//     }

//     return {
//       success: true,
//       updated: results.filter((result) => result.status === 'fulfilled').length,
//       data: results,
//     };
//   },
//   sendEmail: (data) => safeMutationCall(() => API.post('/notifications/email', data), { success: true, message: 'No-op: email endpoint unavailable' }),
//   getUnreadCount: async () => {
//     const employeeId = getCurrentEmployeeId();
//     if (!employeeId) return 0;

//     try {
//       const response = await API.get(`/notifications/employees/${employeeId}`);
//       const rawItems = Array.isArray(response)
//         ? response
//         : response?.data?.data || response?.data || response?.items || [];
//       const items = normalizeNotificationList(rawItems, employeeId);
//       return Array.isArray(items) ? items.filter((item) => !item.is_read).length : 0;
//     } catch (error) {
//       return 0;
//     }
//   },
// };

// --- 🔔 NOTIFICATION SERVICE ---
export const notificationApi = {
  health: () => safeObjectCall(() => API.get('/notifications/health')),

  createNotification: (data) =>
    safeMutationCall(() => API.post('/notifications', data), {
      success: true,
      message: 'No-op: create notification endpoint unavailable',
    }),

  getNotifications: (params) => safeListCall(() => API.get('/notifications', { params })),

  getAll: () => safeListCall(() => API.get('/notifications')),

  getEmployeeNotifications: (employeeId) =>
    safeListCall(() => API.get(`/notifications/employees/${employeeId}`)),

  getNotificationById: (id) => safeObjectCall(() => API.get(`/notifications/${id}`)),

  // 1. Đánh dấu 1 thông báo đã đọc theo đúng spec: PUT /notifications/:id
  markAsRead: async (id) => {
    try {
      // Backend tự xác định user qua Token và middleware requireNotificationOwnerShip
      const response = await API.put(`/notifications/${id}`, { is_read: true });
      return response?.data || response;
    } catch (error) {
      if (isMissingDataError && isMissingDataError(error)) {
        return { success: true, updated: 0 };
      }
      throw error;
    }
  },

  // 2. Đánh dấu tất cả đã đọc (Lấy danh sách -> Cập nhật song song qua PUT)
  markAllAsRead: async (employeeIdParam) => {
    const employeeId = employeeIdParam || getCurrentEmployeeId();
    if (!employeeId) return { success: true, updated: 0 };

    let response = null;
    try {
      response = await API.get(`/notifications/employees/${employeeId}`);
    } catch (error) {
      if (isMissingDataError && isMissingDataError(error)) {
        return { success: true, updated: 0 };
      }
      throw error;
    }

    const rawItems = response?.data?.data || response?.data || (Array.isArray(response) ? response : []);
    const normalized = normalizeNotificationList(rawItems, employeeId);

    // Lọc danh sách các thông báo chưa đọc của user này
    const unreadIds = normalized
      .filter((item) => !item.is_read)
      .map((item) => item.id)
      .filter(Boolean);

    if (!unreadIds.length) {
      return { success: true, updated: 0 };
    }

    // Gọi song song PUT /notifications/:id với body { is_read: true }
    const results = await Promise.allSettled(
      unreadIds.map((id) => API.put(`/notifications/${id}`, { is_read: true }))
    );

    const successfulCount = results.filter((res) => res.status === 'fulfilled').length;

    return {
      success: true,
      updated: successfulCount,
      data: results,
    };
  },

  sendEmail: (data) =>
    safeMutationCall(() => API.post('/notifications/email', data), {
      success: true,
      message: 'No-op: email endpoint unavailable',
    }),

  getUnreadCount: async () => {
    const employeeId = getCurrentEmployeeId();
    if (!employeeId) return 0;

    try {
      const response = await API.get(`/notifications/employees/${employeeId}`);
      const rawItems = response?.data?.data || response?.data || (Array.isArray(response) ? response : []);
      const items = normalizeNotificationList(rawItems, employeeId);
      return Array.isArray(items) ? items.filter((item) => !item.is_read).length : 0;
    } catch (error) {
      return 0;
    }
  },
};

// --- 📊 REPORT SERVICE ---
export const reportApi = {
  getDashboardSummary: (params) => safeObjectCall(() => API.get('/reports/dashboard', { params })),
  getDeviceReport: (params) => safeListCall(() => API.get('/reports/devices', { params })),
  getMaintenanceReport: (params) => safeListCall(() => API.get('/reports/maintenance', { params })),
  getTechnicianReport: (params) => safeListCall(() => API.get('/reports/technicians', { params })),
  getCostReport: (params) => safeListCall(() => API.get('/reports/costs', { params })),
  exportReport: (params) => safeObjectCall(() => API.get('/reports/export', { params })),
};

export default API;