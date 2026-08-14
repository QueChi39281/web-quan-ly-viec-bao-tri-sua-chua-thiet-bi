// Giả lập cơ sở dữ liệu kết nối Backend API theo chuẩn JSON Envelope của bạn
export const reportService = {
  getUnreadNotificationCount: async () => {
    return { success: true, data: { unreadCount: 3 } };
  },

  getMaintenanceRequests: async () => {
    return {
      success: true,
      data: {
        items: [
          { id: "req-001", device: { code: "LP_03" }, status: "PENDING_REVIEW", priority: "HIGH", title: "Lỗi màn hình nhấp nháy" },
          { id: "req-002", device: { code: "PC_09" }, status: "COMPLETED", priority: "LOW", title: "Cài lại Windows" }
        ]
      }
    };
  },

  createMaintenanceRequest: async (payload) => {
    console.log("POST /api/v1/maintenance-requests | Payload:", payload);
    return { success: true, message: "Maintenance request created successfully" };
  },

  approveCompletion: async (id, decision) => {
    console.log(`PATCH /api/v1/maintenance-requests/${id}/approve-completion | Decision:`, decision);
    return { success: true, message: "Completion approved" };
  }
};