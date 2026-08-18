import { getCurrentEmployeeId, maintenanceApi, notificationApi } from '../../../services/api.js';

const normalizeStatus = (status) => {
  if (!status) return 'PENDING_REVIEW';
  const normalized = String(status).toUpperCase();
  if (normalized.includes('COMPLETED') || normalized.includes('DONE')) return 'COMPLETED';
  if (normalized.includes('IN_PROGRESS')) return 'IN_PROGRESS';
  if (normalized.includes('REJECTED')) return 'REJECTED';
  return normalized;
};

const normalizePriority = (priority) => {
  if (!priority) return 'LOW';
  const normalized = String(priority).toUpperCase();
  if (normalized.includes('HIGH')) return 'HIGH';
  if (normalized.includes('MEDIUM')) return 'MEDIUM';
  return 'LOW';
};

const normalizeRequestList = (payload) => {
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.data?.items)
          ? payload.data.items
          : [];

  return items.map((item, index) => {
    const deviceObj = item.device || {};
    const deviceCode = item.deviceCode || deviceObj.code || deviceObj.deviceCode || item.deviceId || item.device?.id || `DEV-${index + 1}`;
    const deviceName = deviceObj.name || deviceObj.deviceName || item.deviceName || item.title || 'Thiết bị';

    return {
      id: item.id || item._id || item.requestId || item.code || `req-${index + 1}`,
      title: item.title || item.subject || item.description || 'Yêu cầu bảo trì',
      description: item.description || item.notes || item.content || '',
      status: normalizeStatus(item.status),
      priority: normalizePriority(item.priority),
      device: {
        id: deviceObj.id || item.deviceId || item.device_id || deviceCode,
        code: deviceCode,
        name: deviceName,
      },
      createdAt: item.createdAt || item.created_at || item.requestedAt || new Date().toISOString(),
    };
  });
};

export const reportService = {
  getUnreadNotificationCount: async () => {
    try {
      const response = await notificationApi.getUnreadCount();
      const count = Number(
        response?.count ?? response?.data?.count ?? response?.data?.unreadCount ?? response?.unreadCount ?? response ?? 0
      );

      return { success: true, data: { unreadCount: Number.isFinite(count) ? count : 0 } };
    } catch (error) {
      console.error('Failed to fetch unread notification count:', error);
      return { success: false, data: { unreadCount: 0 } };
    }
  },

  getMaintenanceRequests: async () => {
    try {
      const response = await maintenanceApi.getRequests({ limit: 50 });
      return {
        success: true,
        data: { items: normalizeRequestList(response) },
      };
    } catch (error) {
      console.error('Failed to fetch maintenance requests:', error);
      return { success: false, data: { items: [] } };
    }
  },

  createMaintenanceRequest: async (payload) => {
    try {
      const requestPayload = {
        created_by: Number(payload.created_by || getCurrentEmployeeId()) || 1,
        device_id: Number(payload.deviceId || payload.device_id),
        priority: String(payload.priority || 'LOW').toLowerCase(),
        description: payload.description,
      };

      const response = await maintenanceApi.createRepair(requestPayload);
      return {
        success: true,
        message: response?.message || 'Maintenance request created successfully',
        data: response?.data ?? response,
      };
    } catch (error) {
      console.error('Failed to create maintenance request:', error);
      return { success: false, message: 'Không thể gửi yêu cầu đến quản lý' };
    }
  },

  approveCompletion: async (id, decision) => {
    try {
      const response = await maintenanceApi.approveRepair(id, {
        approved_by: Number(getCurrentEmployeeId()) || 1,
        status: decision === 'APPROVED' ? 'success' : 'fail',
      });
      return {
        success: true,
        message: response?.message || 'Completion approved',
        data: response?.data ?? response,
      };
    } catch (error) {
      console.error('Failed to approve completion:', error);
      return { success: false, message: 'Không thể xác nhận hoàn thành' };
    }
  }
};