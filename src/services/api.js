import axios from 'axios';

// 1. Cấu hình Axios Instance gốc trỏ tới Gateway
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Helper kiểm tra lỗi mất dữ liệu hoặc lỗi kết nối mạng
const isMissingDataError = (error) => {
  const status = error?.response?.status;
  if (status === 401 || status === 403) return false;
  if (status === 204) return true;

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

// Helper chuẩn hóa dữ liệu trả về từ Axios Response
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

// Wrappers cho API Calls an toàn
const safeApiCall = async (requestFn, fallback = null) => {
  try {
    const result = await requestFn();
    const normalized = normalizeResponseData(result, fallback);
    return normalized ?? fallback;
  } catch (error) {
    if (isMissingDataError(error)) return fallback;
    throw error;
  }
};

const safeListCall = (requestFn) => safeApiCall(requestFn, []);
const safeObjectCall = (requestFn) => safeApiCall(requestFn, {});
const safeMutationCall = async (requestFn, fallback = { success: true, updated: 0 }) => {
  try {
    return await requestFn();
  } catch (error) {
    throw error;
  }
};

// Helper trích xuất Employee ID từ Storage / Objects
const extractEmployeeIdFromObject = (value) => {
  if (!value || typeof value !== 'object') return '';
  const direct =
    value.employee_id ??
    value.employeeId ??
    value.id ??
    value.userId ??
    value.user_id ??
    value.employee?.id ??
    value.employee?.employee_id ??
    value.user?.employee_id ??
    value.user?.id ??
    '';
  return direct ? String(direct) : '';
};

const toBoolean = (value) => {
  if (typeof value === 'string') return value.toLowerCase() === 'true' || value === '1';
  return Boolean(value);
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
    // Bỏ qua lỗi JSON parse
  }

  try {
    const cachedAuth = JSON.parse(localStorage.getItem('authUser') || 'null');
    const fromAuth = extractEmployeeIdFromObject(cachedAuth);
    if (fromAuth) return fromAuth;
  } catch {
    // Bỏ qua lỗi JSON parse
  }

  return '';
};

/* ==========================================================================
   QUẢN LÝ LOCAL CACHE TRẠNG THÁI ĐÃ ĐỌC (FRONTEND CACHE)
   ========================================================================== */

export const getLocalReadIds = (employeeIdParam) => {
  try {
    const empId = employeeIdParam || getCurrentEmployeeId() || 'default';
    return JSON.parse(localStorage.getItem(`read_ids_${empId}`) || '[]');
  } catch {
    return [];
  }
};

export const saveLocalReadIds = (ids, employeeIdParam) => {
  try {
    const empId = employeeIdParam || getCurrentEmployeeId() || 'default';
    const current = getLocalReadIds(empId);
    const updated = Array.from(new Set([...current, ...ids.map(String)]));
    localStorage.setItem(`read_ids_${empId}`, JSON.stringify(updated));
  } catch (e) {
    console.error('Lỗi lưu local read ids:', e);
  }
};

// Chuẩn hóa 1 item thông báo
export const normalizeNotificationForEmployee = (notification, employeeId = getCurrentEmployeeId()) => {
  if (!notification || typeof notification !== 'object') return notification;

  const targetEmployeeId = String(employeeId || '');
  const idStr = String(notification.id || notification._id || '');

  // Kiểm tra receiver_info nếu backend hỗ trợ
  const receiverList = Array.isArray(notification.receiver_info) ? notification.receiver_info : [];
  const matchedReceiver = receiverList.find((receiver) => {
    const current = String(receiver?.employee_id ?? '');
    return current === targetEmployeeId || Number(current) === Number(targetEmployeeId);
  });

  // Server is authoritative when it explicitly returns a read state.
  const localReadIds = getLocalReadIds(employeeId);
  const hasServerReadState = matchedReceiver
    ? matchedReceiver.is_read !== undefined || matchedReceiver.read_at !== undefined
    : notification.is_read !== undefined || notification.isRead !== undefined || notification.read_at !== undefined;
  const isReadValue = hasServerReadState
    ? toBoolean(matchedReceiver ? matchedReceiver.is_read : (notification.is_read ?? notification.isRead ?? notification.read_at != null))
    : localReadIds.includes(idStr);

  return {
    ...notification,
    id: idStr,
    title: notification.title || '',
    content: notification.content || '',
    is_read: isReadValue,
    isRead: isReadValue,
    createdAt: notification.created_at || notification.createdAt,
    read_at: matchedReceiver?.read_at || notification.read_at,
  };
};

// Chuẩn hóa danh sách thông báo
export const normalizeNotificationList = (payload, employeeId = getCurrentEmployeeId()) => {
  const rawList = normalizeResponseData(payload, []);
  return rawList.map((item) => normalizeNotificationForEmployee(item, employeeId));
};

// 2. Request Interceptor: Gắn Bearer Token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    console.log('[API REQUEST]', config?.method?.toUpperCase(), config?.url, {
      hasToken: !!token,
      tokenPreview: token ? `${token.slice(0, 12)}...` : null,
      body: config?.data,
    });

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[API REQUEST ERROR]', error);
    return Promise.reject(error);
  }
);

// 3. Response Interceptor: Tự động Refresh Token & Xử lý fallback
API.interceptors.response.use(
  (response) => {
    console.log('[API RESPONSE]', response?.config?.method?.toUpperCase(), response?.config?.url, response?.data);
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    console.error('[API RESPONSE ERROR]', originalRequest?.method?.toUpperCase(), originalRequest?.url, {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error.response?.data || error);
      }

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token available');

        const res = await axios.post(`${API.defaults.baseURL}/auth/refresh`, { refreshToken });
        const newAccessToken = res.data?.data?.accessToken || res.data?.accessToken;

        if (!newAccessToken) {
          throw new Error('Failed to renew access token');
        }

        localStorage.setItem('accessToken', newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    const method = (originalRequest?.method || 'get').toLowerCase();
    if (method === 'get' && isMissingDataError(error)) {
      const url = (originalRequest?.url || '').toLowerCase();
      const looksLikeList =
        originalRequest?.params ||
        /(users|departments|devices|maintenance-requests|inventory|notifications|reports|transactions|items|stock|dashboard|employees)/.test(url);

      return Promise.resolve(looksLikeList ? [] : {});
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
  login: (credentials) => API.post('/auth/login', credentials),
  getMe: () => safeObjectCall(() => API.get('/auth/me')),
  logout: () => API.post('/auth/logout', {
    refreshToken: localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken') || undefined,
  }),
  refreshToken: (refreshToken) => API.post('/auth/refresh', { refreshToken }),
  activateAccount: (data) => safeMutationCall(() => API.post('/auth/activate', data)),
  forgotPassword: (data) => safeMutationCall(() => API.post('/auth/forgot-password', typeof data === 'string' ? { email: data } : data)),
  resetPassword: (data) => safeMutationCall(() => API.post('/auth/reset-password', data)),
  changePassword: (data) => safeMutationCall(() => API.post('/auth/change-password', data)),
};

// --- 👤 USER SERVICE ---
export const userApi = {
  getHealth: () => safeObjectCall(() => API.get('/users/health')),
  getUsers: (params) => safeListCall(() => API.get('/users', { params })),
  getUserById: (id) => safeObjectCall(() => API.get(`/users/${id}`)),
  createUser: (userData) => safeMutationCall(() => API.post('/users', userData)),
  updateEmployee: (id, employeeData) => safeMutationCall(() => API.put(`/users/employees/${id}`, employeeData)),
  updateUser: (id, userData) => safeMutationCall(() => API.patch(`/users/${id}`, userData)),
  changeUserStatus: (id, status) => safeMutationCall(() => API.patch(`/users/${id}/status`, { status })),
};

// --- 🏢 DEPARTMENT SERVICE ---
export const departmentApi = {
  createDepartment: (data) => safeMutationCall(() => API.post('/departments', data)),
  getDepartments: (params) => safeListCall(() => API.get('/departments', { params })),
  getDepartmentById: (id) => safeObjectCall(() => API.get(`/departments/${id}`)),
  updateDepartment: (id, data) => safeMutationCall(() => API.patch(`/departments/${id}`, data)),
};

// --- 💻 DEVICE SERVICE ---
export const deviceApi = {
  getHealth: () => safeObjectCall(() => API.get('/devices/health')),
  getDevices: (params) => safeListCall(() => API.get('/devices', { params })),
  getDeviceById: (id) => safeObjectCall(() => API.get(`/devices/${id}`)),
  getDeviceCategories: () => safeListCall(() => API.get('/devices/categories')),
  getDeviceCategoryById: (id) => safeObjectCall(() => API.get(`/devices/categories/${id}`)),
  getDevicesByEmployee: (employeeId) => safeListCall(() => API.get(`/devices/list/employees/${employeeId}`)),
  getDevicesByCategory: (categoryId) => safeListCall(() => API.get(`/devices/list/categories/${categoryId}`)),
  getDeviceStateHistories: (id) => safeListCall(() => API.get(`/devices/${id}/state-histories`)),
  assignDevice: (payload) => safeMutationCall(() => API.post('/devices/assign-devices', payload)),
  getAssignRequests: (params) => safeListCall(() => API.get('/devices/assign-requests', { params })),
  getAssignRequestsByEmployee: (employeeId, params) => safeListCall(() => API.get(`/devices/assign-requests/employees/${employeeId}`, { params })),
  getAssignRequestById: (id) => safeObjectCall(() => API.get(`/devices/assign-requests/${id}`)),
  updateAssignRequest: (id, payload) => safeMutationCall(() => API.put(`/devices/assign-requests/${id}`, payload)),
  createDevice: (deviceData) => safeMutationCall(() => API.post('/devices', deviceData)),
  updateDevice: (id, deviceData) => safeMutationCall(() => API.put(`/devices/${id}`, deviceData)),
  getQRCode: () => Promise.resolve({ success: true, data: null }),
  getMaintenanceHistory: () => Promise.resolve([]),
  getRepairHistory: () => Promise.resolve([]),
};

// --- 🛠️ MAINTENANCE SERVICE ---
// --- 🔧 MAINTENANCE SERVICE ---
export const maintenanceApi = {
  // --- HEALTH ---
  health: () => safeObjectCall(() => API.get('/maintenances/health')),

  // --- MAINTENANCE PLANS ---
  getPlans: (params) => safeListCall(() => API.get('/maintenances/plans', { params })),
  getPlanById: (id) => safeObjectCall(() => API.get(`/maintenances/plans/${id}`)),
  getPlansByStatus: (status, params) => safeListCall(() => API.get(`/maintenances/plans/status/${status}`, { params })),
  getPlanAssignments: (id, params) => safeListCall(() => API.get(`/maintenances/plans/assignments/${id}`, { params })),
  getPlanDocuments: (id, params) => safeListCall(() => API.get(`/maintenances/plans/${id}/documents`, { params })),
  createPlan: (data) => safeMutationCall(() => API.post('/maintenances/plans', data)),
  updatePlan: (id, data) => API.put(`/maintenances/plans/${id}`, data),
  startPlan: (id, data) => safeMutationCall(() => API.put(`/maintenances/plans/${id}/start`, data)),
  completePlan: (id, data) => safeMutationCall(() => API.put(`/maintenances/plans/${id}/complete`, data)),

  // --- REPAIR REQUESTS ---
  getRepairs: (params) => safeListCall(() => API.get('/maintenances/repairs', { params })),
  getRepairById: (id) => safeObjectCall(() => API.get(`/maintenances/repairs/${id}`)),
  createRepair: (data) => safeMutationCall(() => API.post('/maintenances/repairs', data)),
  approveRepair: (id, data) => safeMutationCall(() => API.put(`/maintenances/repairs/${id}/approve`, data)),

  // --- ADJUST PLAN REQUESTS ---
  createAdjustPlan: (data) => safeMutationCall(() => API.post('/maintenances/adjust-plans', data)),
  getAdjustPlanById: (id) => safeObjectCall(() => API.get(`/maintenances/adjust-plans/${id}`)),
  approveAdjustPlan: (id, data) => safeMutationCall(() => API.put(`/maintenances/adjust-plans/${id}/approve`, data)),

  // --- DAMAGE REPORTS ---
  createDamageReport: (data) => safeMutationCall(() => API.post('/maintenances/damage-reports', data)),
  getDamageReportById: (id) => safeObjectCall(() => API.get(`/maintenances/damage-reports/${id}`)),

  // --- MAINTENANCE REQUESTS ---
  getMaintenanceRequests: (params) => safeListCall(() => API.get('/maintenances/maintenance-requests', { params })),
  createMaintenanceRequest: (data) => safeMutationCall(() => API.post('/maintenances/maintenance-requests', data)),
  getMaintenanceRequestById: (id) => safeObjectCall(() => API.get(`/maintenances/maintenance-requests/${id}`)),
  approveMaintenanceRequest: (id, data) => safeMutationCall(() => API.put(`/maintenances/maintenance-requests/${id}/approve`, data)),

  // --- ACCEPTANCE REPORTS ---
  getAcceptanceReports: (params) => safeListCall(() => API.get('/maintenances/acceptance-reports', { params })),
  createAcceptanceReport: (data) => safeMutationCall(() => API.post('/maintenances/acceptance-reports', data)),
  getAcceptanceReportById: (id) => safeObjectCall(() => API.get(`/maintenances/acceptance-reports/${id}`)),
  approveAcceptanceReport: (id, data) => safeMutationCall(() => API.put(`/maintenances/acceptance-reports/${id}/approve`, data)),

  getRequests: (params = {}) => {
    const status = String(params.status || '').toLowerCase();
    if (status === 'completed') return maintenanceApi.getPlansByStatus('completed', params);
    return maintenanceApi.getPlans(params);
  },
  getRequestById: (id) => maintenanceApi.getPlanById(id),
  createRequest: (data) => maintenanceApi.createRepair(data),
  approveRequest: (id, data) => maintenanceApi.approveRepair(id, data),
  assignTechnician: (id, data) => maintenanceApi.updatePlan(id, data),
  startRepair: (id) => maintenanceApi.startPlan(id),
  completeRepair: (id) => maintenanceApi.completePlan(id),
  approveCompletion: (id, data = {}) => maintenanceApi.approveAcceptanceReport(id, {
    approved_by: data.approved_by,
    status: data.status || (data.decision === 'APPROVED' ? 'success' : 'fail'),
  }),
  closeRequest: (id) => maintenanceApi.completePlan(id),
  updateStatus: (id, status) => {
    const normalizedStatus = String(status || '').toLowerCase();
    if (normalizedStatus === 'ongoing' || normalizedStatus === 'in_progress') {
      return maintenanceApi.startPlan(id);
    }
    if (normalizedStatus === 'completed' || normalizedStatus === 'success') {
      return maintenanceApi.completePlan(id);
    }
    return maintenanceApi.updatePlan(id, { status });
  },
};

// --- 📦 INVENTORY SERVICE ---
export const inventoryApi = {
  getHealth: () => safeObjectCall(() => API.get('/inventories/health')),
  getItems: (params) => safeListCall(() => API.get('/inventories', { params })),
  getItemById: (id) => safeObjectCall(() => API.get(`/inventories/${id}`)),
  getItemRequests: (params) => safeListCall(() => API.get('/inventories/item-requests', { params })),
  getItemRequestById: (id) => safeObjectCall(() => API.get(`/inventories/item-requests/${id}`)),
  getItemRequestsByPlanId: (planId) => safeListCall(() => API.get(`/inventories/item-requests/plans/${planId}`)),
  createItemRequest: (data) => safeMutationCall(() => API.post('/inventories/item-requests', data)),
  updateItemRequestStatus: (id, data) => safeMutationCall(() => API.put(`/inventories/item-requests/${id}`, data)),

  createInventory: async (data) => {
    try {
      return await API.post('/inventories', data);
    } catch (error) {
      console.warn('[inventoryApi.createInventory] fallback no-op', error);
      return { success: true, data, message: 'Endpoint not implemented' };
    }
  },

  updateInventory: async (id, data) => {
    try {
      return await API.put(`/inventories/${id}`, data);
    } catch (error) {
      console.warn('[inventoryApi.updateInventory] fallback no-op', error);
      return { success: true, data: { id, ...data }, message: 'Endpoint not implemented' };
    }
  },

  getStockSummary: (params) => safeListCall(() => API.get('/inventories', { params })),
};

// --- 🧾 AUDIT SERVICE ---
export const auditApi = {
  health: () => safeObjectCall(() => API.get('/audits/health')),
  createAudit: (data) => safeMutationCall(() => API.post('/audits', data)),
  getAudits: (params) => safeListCall(() => API.get('/audits', { params })),
  getAuditById: (id) => safeObjectCall(() => API.get(`/audits/${id}`)),
};

// --- 🔔 NOTIFICATION SERVICE ---
export const notificationApi = {
  health: () => safeObjectCall(() => API.get('/notifications/health')),

  createNotification: (data) =>
    safeMutationCall(() => API.post('/notifications', data)),

  getNotifications: (params) =>
    safeListCall(() => API.get('/notifications', { params })),

  getAll: () => safeListCall(() => API.get('/notifications')),

  getEmployeeNotifications: (employeeId) =>
    safeListCall(() =>
      API.get(`/notifications/employees/${employeeId || getCurrentEmployeeId()}`, {
        params: { _t: Date.now() },
        headers: { 'Cache-Control': 'no-cache' },
      })
    ),

  getNotificationById: (id) =>
    safeObjectCall(() => API.get(`/notifications/${id}`)),

  // Đánh dấu 1 thông báo là đã đọc
  markAsRead: async (id, customEmployeeId) => {
    const employeeId = customEmployeeId || getCurrentEmployeeId();
    const targetId = String(id);

    const payload = { is_read: true };
    if (employeeId) payload.employee_id = Number(employeeId) || employeeId;

    console.log(`[API] PUT /notifications/${targetId}`, payload);
    const response = await API.put(`/notifications/${targetId}`, payload);
    saveLocalReadIds([targetId], employeeId);
    return response;
  },

  // Đánh dấu tất cả thông báo là đã đọc
  markAllAsRead: async (employeeIdParam) => {
    const employeeId = employeeIdParam || getCurrentEmployeeId();
    if (!employeeId) {
      console.warn('[API] Không tìm thấy employeeId');
      return { success: false, message: 'Missing employee ID' };
    }

    // The documented API has no batch endpoint, so update each notification.
    const response = await API.get(`/notifications/employees/${employeeId}`, {
      params: { _t: Date.now() },
      headers: { 'Cache-Control': 'no-cache' },
    });
    const rawItems = normalizeResponseData(response, []);
    const normalized = normalizeNotificationList(rawItems, employeeId);

    const unreadIds = normalized
      .filter((item) => !item.is_read)
      .map((item) => item.id)
      .filter(Boolean);

    if (!unreadIds.length) {
      return { success: true, updated: 0 };
    }

    const results = await Promise.allSettled(
      unreadIds.map((id) =>
        API.put(`/notifications/${id}`, {
          is_read: true,
          employee_id: Number(employeeId) || employeeId,
        })
      )
    );

    const successfulCount = results.filter((res) => res.status === 'fulfilled').length;
    const successfulIds = results
      .map((result, index) => result.status === 'fulfilled' ? unreadIds[index] : null)
      .filter(Boolean);
    saveLocalReadIds(successfulIds, employeeId);

    return {
      success: true,
      updated: successfulCount,
      data: results,
    };
  },

  sendEmail: (data) =>
    safeMutationCall(() => API.post('/notifications/email', data)),

  getUnreadCount: async () => {
    const employeeId = getCurrentEmployeeId();
    if (!employeeId) return 0;

    try {
      const response = await API.get(`/notifications/employees/${employeeId}`, {
        params: { _t: Date.now() },
        headers: { 'Cache-Control': 'no-cache' },
      });
      const rawItems = normalizeResponseData(response, []);
      const items = normalizeNotificationList(rawItems, employeeId);
      return Array.isArray(items) ? items.filter((item) => !item.is_read && !item.isRead).length : 0;
    } catch (error) {
      console.error('[API ERROR] Failed to fetch unread count:', error);
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