import {
  deviceApi,
  getCurrentEmployeeId,
  maintenanceApi,
  notificationApi,
} from '../../../services/api.js';

const getListItems = (response) => {
  if (Array.isArray(response)) return response;
  const body = response;
  const data = body?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return Array.isArray(body?.items) ? body.items : [];
};

const unwrapResponse = (response) => response;

const withListData = (response) => ({
  ...response,
  success: response?.success ?? true,
  data: { items: getListItems(response) },
});

export const reportService = {
  resolveDeviceId: async (value) => {
    const rawValue = String(value || '').trim();
    const numericValue = Number(rawValue);
    if (Number.isInteger(numericValue) && numericValue > 0) return numericValue;

    const response = await deviceApi.getDevices({ limit: 100 });
    const devices = Array.isArray(response) ? response : response?.data || [];
    const normalizedValue = rawValue.toLowerCase();
    const device = devices.find((item) => [
      item?.code,
      item?.device_code,
      item?.deviceCode,
      item?.asset_code,
      item?.serial_number,
      item?.serialNumber,
    ].filter(Boolean).some((code) => String(code).trim().toLowerCase() === normalizedValue));

    const resolvedId = device?.id || device?._id || device?.device_id;
    if (!resolvedId) {
      throw new Error(`Không tìm thấy thiết bị có mã "${rawValue}".`);
    }
    return Number(resolvedId) || resolvedId;
  },

  getUnreadNotificationCount: async () => ({
    success: true,
    data: { unreadCount: await notificationApi.getUnreadCount() },
  }),

  getMaintenanceRequests: async (params) =>
    withListData(await maintenanceApi.getMaintenanceRequests(params)),

  getPlans: async (params) =>
    withListData(await maintenanceApi.getPlans(params)),

  createDamageReport: async (data) =>
    unwrapResponse(await maintenanceApi.createDamageReport(data)),

  createRepair: async (data) =>
    unwrapResponse(await maintenanceApi.createRepair(data)),

  createMaintenanceRequest: async (data) =>
    unwrapResponse(await maintenanceApi.createMaintenanceRequest(data)),

  createAdjustPlan: async (data) =>
    unwrapResponse(await maintenanceApi.createAdjustPlan(data)),

  approveCompletion: async (id, status) =>
    unwrapResponse(await maintenanceApi.approveAcceptanceReport(id, {
      approved_by: Number(getCurrentEmployeeId()) || getCurrentEmployeeId(),
      status: status === 'APPROVED' ? 'success' : 'fail',
    })),
};
