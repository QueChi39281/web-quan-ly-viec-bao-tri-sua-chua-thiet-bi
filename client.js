const defaultBaseUrl = "http://localhost:3000";

const tokenStore = {
  getAccessToken: () => globalThis.localStorage?.getItem("accessToken") ?? null,
  getRefreshToken: () => globalThis.localStorage?.getItem("refreshToken") ?? null,
  saveTokens: ({ accessToken, refreshToken }) => {
    if (accessToken) globalThis.localStorage?.setItem("accessToken", accessToken);
    if (refreshToken) globalThis.localStorage?.setItem("refreshToken", refreshToken);
  },
  clear: () => {
    globalThis.localStorage?.removeItem("accessToken");
    globalThis.localStorage?.removeItem("refreshToken");
  },
};

const buildUrl = (baseUrl, path, query) => {
  const url = new URL(path, baseUrl);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
};

const parseResponse = async (response) => {
  const body = await response.json().catch(() => ({}));

  if (!response.ok || body.success === false) {
    const error = new Error(body.message || "API request failed");
    error.status = response.status;
    error.errors = body.errors ?? null;
    throw error;
  }

  return body;
};

export function createApiClient({ baseUrl = defaultBaseUrl, fetcher = fetch } = {}) {
  let refreshPromise = null;

  const request = async (path, { method = "GET", query, body, headers, retry = true } = {}) => {
    const requestHeaders = {
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(tokenStore.getAccessToken()
        ? { Authorization: `Bearer ${tokenStore.getAccessToken()}` }
        : {}),
      ...headers,
    };

    const response = await fetcher(buildUrl(baseUrl, path, query), {
      method,
      headers: requestHeaders,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

    if (response.status === 401 && retry && tokenStore.getRefreshToken()) {
      refreshPromise ??= request("/auth/refresh", {
        method: "POST",
        body: { refreshToken: tokenStore.getRefreshToken() },
        retry: false,
      })
        .then(({ data }) => tokenStore.saveTokens(data))
        .finally(() => {
          refreshPromise = null;
        });

      await refreshPromise;
      return request(path, { method, query, body, headers, retry: false });
    }

    return parseResponse(response);
  };

  return {
    request,
    get: (path, options = {}) => request(path, { ...options, method: "GET" }),
    post: (path, body, options = {}) => request(path, { ...options, method: "POST", body }),
    put: (path, body, options = {}) => request(path, { ...options, method: "PUT", body }),
    delete: (path, options = {}) => request(path, { ...options, method: "DELETE" }),
  };
}

export const api = createApiClient();

export const authApi = {
  health: () => api.get("/auth/health"),
  login: (credentials) => api.post("/auth/login", credentials),
  refresh: (refreshToken) => api.post("/auth/refresh", { refreshToken }),
  logout: (refreshToken) => api.post("/auth/logout", { refreshToken }),
  me: () => api.get("/auth/me"),
};

export const userApi = {
  health: () => api.get("/users/health"),
  list: (query) => api.get("/users", { query }),
  getById: (id) => api.get(`/users/${id}`),
  create: (payload) => api.post("/users", payload),
  updateEmployee: (id, payload) => api.put(`/users/employees/${id}`, payload),
};

export const deviceApi = {
  health: () => api.get("/devices/health"),
  list: (query) => api.get("/devices", { query }),
  getById: (id) => api.get(`/devices/${id}`),
  listCategories: (query) => api.get("/devices/categories", { query }),
  getCategoryById: (id) => api.get(`/devices/categories/${id}`),
  listByEmployee: (employeeId, query) => api.get(`/devices/list/employees/${employeeId}`, { query }),
  listByCategory: (categoryId, query) => api.get(`/devices/list/categories/${categoryId}`, { query }),
  stateHistories: (id, query) => api.get(`/devices/${id}/state-histories`, { query }),
  update: (id, payload) => api.put(`/devices/${id}`, payload),
};

export const inventoryApi = {
  health: () => api.get("/inventories/health"),
  list: (query) => api.get("/inventories", { query }),
  getById: (id) => api.get(`/inventories/${id}`),
  createItemRequest: (payload) => api.post("/inventories/item-requests", payload),
  listItemRequests: (query) => api.get("/inventories/item-requests", { query }),
  getItemRequest: (id) => api.get(`/inventories/item-requests/${id}`),
  getItemRequestsByPlan: (planId, query) => api.get(`/inventories/item-requests/plans/${planId}`, { query }),
  approveItemRequest: (id, payload) => api.put(`/inventories/item-requests/${id}`, payload),
};

export const maintenanceApi = {
  health: () => api.get("/maintenances/health"),
  createPlan: (payload) => api.post("/maintenances/plans", payload),
  listPlans: (query) => api.get("/maintenances/plans", { query }),
  getPlan: (id) => api.get(`/maintenances/plans/${id}`),
  listPlansByStatus: (status, query) => api.get(`/maintenances/plans/status/${status}`, { query }),
  getPlansByAssignment: (employeeId, query) => api.get(`/maintenances/plans/assignments/${employeeId}`, { query }),
  updatePlan: (id, payload) => api.put(`/maintenances/plans/${id}`, payload),
  listPlanDocuments: (id) => api.get(`/maintenances/plans/${id}/documents`),
  startPlan: (id, payload = {}) => api.put(`/maintenances/plans/${id}/start`, payload),
  completePlan: (id, payload = {}) => api.put(`/maintenances/plans/${id}/complete`, payload),
  createRepair: (payload) => api.post("/maintenances/repairs", payload),
  getRepair: (id) => api.get(`/maintenances/repairs/${id}`),
  approveRepair: (id, payload) => api.put(`/maintenances/repairs/${id}/approve`, payload),
  createAdjustPlan: (payload) => api.post("/maintenances/adjust-plans", payload),
  getAdjustPlan: (id) => api.get(`/maintenances/adjust-plans/${id}`),
  approveAdjustPlan: (id, payload) => api.put(`/maintenances/adjust-plans/${id}/approve`, payload),
  createDamageReport: (payload) => api.post("/maintenances/damage-reports", payload),
  getDamageReport: (id) => api.get(`/maintenances/damage-reports/${id}`),
  createRequest: (payload) => api.post("/maintenances/maintenance-requests", payload),
  getRequest: (id) => api.get(`/maintenances/maintenance-requests/${id}`),
  approveRequest: (id, payload) => api.put(`/maintenances/maintenance-requests/${id}/approve`, payload),
  createAcceptanceReport: (payload) => api.post("/maintenances/acceptance-reports", payload),
  getAcceptanceReport: (id) => api.get(`/maintenances/acceptance-reports/${id}`),
  approveAcceptanceReport: (id, payload) => api.put(`/maintenances/acceptance-reports/${id}/approve`, payload),
};

export const notificationApi = {
  health: () => api.get("/notifications/health"),
  create: (payload) => api.post("/notifications", payload),
  list: (query) => api.get("/notifications", { query }),
  byEmployee: (employeeId, query) => api.get(`/notifications/employees/${employeeId}`, { query }),
  getById: (id) => api.get(`/notifications/${id}`),
  update: (id, isRead) => api.put(`/notifications/${id}`, { is_read: isRead }),
};

export const auditApi = {
  health: () => api.get("/audits/health"),
  create: (payload) => api.post("/audits", payload),
  list: (query) => api.get("/audits", { query }),
  getById: (id) => api.get(`/audits/${id}`),
};

export const authTokens = tokenStore;