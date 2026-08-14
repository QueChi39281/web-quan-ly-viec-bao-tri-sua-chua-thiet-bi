// Danh mục loại yêu cầu sửa chữa/bảo trì thiết bị điện tử văn phòng
export const REQUEST_TYPES = {
  WARRANTY: { label: 'Yêu cầu bảo hành', color: '#8e44ad', bg: '#f3e8ff' },
  SUPPLY_REQUEST: { label: 'Yêu cầu linh kiện điện tử', color: '#2980b9', bg: '#e0f2fe' },
  SUPPLY_RETURN: { label: 'Trả linh kiện dư/lỗi', color: '#d35400', bg: '#ffedf0' },
  DAMAGE_REPORT: { label: 'Báo hỏng thiết bị VP', color: '#c0392b', bg: '#fee2e2' },
  ACCEPTANCE: { label: 'Yêu cầu nghiệm thu', color: '#27ae60', bg: '#dcfce7' },
};

// Dữ liệu giả lập 16 bản ghi chuẩn nghiệp vụ Bảo trì Điện tử Văn phòng
export const MOCK_TECHNICIAN_REQUESTS = [
  {
    id: 1,
    type: 'SUPPLY_REQUEST',
    employeeName: 'NguyenVanA_IT',
    deviceCode: 'PRN-HP-404',
    content: 'Đề xuất mua Bo nguồn (Power Board) và Cụm sấy (Fuser Unit) thay thế cho máy in phòng Kế toán bị chập nguồn.',
    estimatedCost: 1850000,
    managerName: 'TranQuanLy_01',
    createdAt: '2026-03-30T08:30:00',
    status: 'PENDING',
    rejectReason: ''
  },
  {
    id: 2,
    type: 'DAMAGE_REPORT',
    employeeName: 'LeVanB_Fixer',
    deviceCode: 'PROJECTOR-EPSON-02',
    content: 'Máy chiếu phòng họp lớn bị hỏng bóng đèn chiếu (Lamp) và chập bo cao áp, bật lên tự tắt sau 5 giây.',
    estimatedCost: 3200000,
    managerName: 'TranQuanLy_01',
    createdAt: '2026-03-30T09:15:00',
    status: 'PENDING',
    rejectReason: ''
  },
  {
    id: 3,
    type: 'WARRANTY',
    employeeName: 'PhamVanC_Tech',
    deviceCode: 'SW-CISCO-2960',
    content: 'Gửi nhà cung cấp bảo hành Switch mạng Cisco 24-port do chết toàn bộ cổng PoE cấp nguồn cho IP Phone.',
    estimatedCost: 0,
    managerName: 'TranQuanLy_01',
    createdAt: '2026-03-29T14:20:00',
    status: 'PENDING',
    rejectReason: ''
  },
  {
    id: 4,
    type: 'SUPPLY_RETURN',
    employeeName: 'NguyenVanA_IT',
    deviceCode: 'PC-DELL-OPT-05',
    content: 'Hoàn trả 01 Thanh RAM DDR4 16GB dư thừa do máy tính phòng Nhân sự chỉ bị lỗi lỏng khe cắm chứ không hỏng RAM.',
    estimatedCost: 0,
    managerName: 'TranQuanLy_01',
    createdAt: '2026-03-29T16:45:00',
    status: 'ACCEPTED',
    rejectReason: ''
  },
  {
    id: 5,
    type: 'ACCEPTANCE',
    employeeName: 'HoangVanD_Tech',
    deviceCode: 'UPS-SANTAK-2000',
    content: 'Nghiệm thu bàn giao bộ lưu điện UPS Santak 2000VA phòng Server sau khi thay dàn ắc quy 12V/9Ah và test xả tải.',
    estimatedCost: 1100000,
    managerName: 'TranQuanLy_01',
    createdAt: '2026-03-28T11:00:00',
    status: 'PENDING',
    rejectReason: ''
  },
  {
    id: 6,
    type: 'DAMAGE_REPORT',
    employeeName: 'DangThaiSon_IT',
    deviceCodes: ['CAM-HIK-01', 'CAM-HIK-02'],
    content: '02 Camera IP Hikvision khu vực sảnh lễ tân bị sét đánh chập cháy bo mạch hồng ngoại và rò điện.',
    estimatedCost: 2400000,
    managerName: 'TranQuanLy_01',
    createdAt: '2026-03-28T13:10:00',
    status: 'PENDING',
    rejectReason: ''
  },
  {
    id: 7,
    type: 'SUPPLY_REQUEST',
    employeeName: 'BuiAnhTuan_Fixer',
    deviceCode: 'ATTENDANCE-RONALD-01',
    content: 'Đề xuất mua Mắt đọc vân tay quang học và Pin CMOS cho máy chấm công Ronald Jack bị mất dữ liệu ngày giờ.',
    estimatedCost: 450000,
    managerName: 'TranQuanLy_01',
    createdAt: '2026-03-27T08:45:00',
    status: 'ACCEPTED',
    rejectReason: ''
  },
  {
    id: 8,
    type: 'WARRANTY',
    employeeName: 'LeVanB_Fixer',
    deviceCode: 'SCANNER-FUJITSU-09',
    content: 'Gửi bảo hành máy Scan tài liệu 2 mặt Fujitsu bị lỗi kẹt giấy liên tục và nứt khay cuốn tự động.',
    estimatedCost: 0,
    managerName: 'TranQuanLy_01',
    createdAt: '2026-03-27T10:30:00',
    status: 'REJECTED',
    rejectReason: 'Máy bị vỡ khay do tác động ngoại lực (rơi rớt), hãng từ chối bảo hành miễn phí. Yêu cầu báo giá sửa chữa.'
  },
  {
    id: 9,
    type: 'ACCEPTANCE',
    employeeName: 'NguyenVanA_IT',
    deviceCodes: ['MON-DELL-24-01', 'MON-DELL-24-02'],
    content: 'Nghiệm thu đóng vỏ và đóng Chip cao áp màn hình Dell 24 inch phòng Thiết kế sau khi xử lý lỗi chớp nháy.',
    estimatedCost: 350000,
    managerName: 'TranQuanLy_01',
    createdAt: '2026-03-26T15:20:00',
    status: 'ACCEPTED',
    rejectReason: ''
  },
  {
    id: 10,
    type: 'SUPPLY_RETURN',
    employeeName: 'PhamVanC_Tech',
    deviceCode: 'ROUTER-DRAYTEK-2925',
    content: 'Trả lại kho 01 Adapter nguồn 12V/2A do thiết bị Router đã được thay thế bằng dòng chạy nguồn PoE trực tiếp.',
    estimatedCost: 0,
    managerName: 'TranQuanLy_01',
    createdAt: '2026-03-26T16:00:00',
    status: 'PENDING',
    rejectReason: ''
  },
  {
    id: 11,
    type: 'SUPPLY_REQUEST',
    employeeName: 'DoTienDung_IT',
    deviceCode: 'SERVER-DELL-R740',
    content: 'Đề xuất mua 01 Bộ Nguồn Hot-plug 750W Titanium dự phòng cho máy chủ dữ liệu ERP.',
    estimatedCost: 4200000,
    managerName: 'TranQuanLy_01',
    createdAt: '2026-03-25T09:10:00',
    status: 'PENDING',
    rejectReason: ''
  },
  {
    id: 12,
    type: 'DAMAGE_REPORT',
    employeeName: 'HoangVanD_Tech',
    deviceCode: 'PHOTO-RICOH-6055',
    content: 'Máy photo Ricoh phòng Hành chính bị chập Bo điều khiển màn hình cảm ứng, hiển thị mã lỗi SC-542.',
    estimatedCost: 2800000,
    managerName: 'TranQuanLy_01',
    createdAt: '2026-03-25T11:40:00',
    status: 'ACCEPTED',
    rejectReason: ''
  },
  {
    id: 13,
    type: 'WARRANTY',
    employeeName: 'DangThaiSon_IT',
    deviceCode: 'AP-ARUBA-305',
    content: 'Gửi bảo hành Bộ phát Wi-Fi Aruba 305 do treo đèn đỏ Flash và không nhận địa chỉ IP từ Router.',
    estimatedCost: 0,
    managerName: 'TranQuanLy_01',
    createdAt: '2026-03-24T14:15:00',
    status: 'PENDING',
    rejectReason: ''
  },
  {
    id: 14,
    type: 'SUPPLY_REQUEST',
    employeeName: 'VuQuocHuy_Fixer',
    deviceCode: 'CABINET-NETWORK-01',
    content: 'Đề xuất mua 10 Thanh Patch Panel 24 port Cat6 và 2 cuộn Dây mạng AMP Cat6e phục vụ đi lại dây tủ Network tầng 3.',
    estimatedCost: 3500000,
    managerName: 'TranQuanLy_01',
    createdAt: '2026-03-24T16:50:00',
    status: 'REJECTED',
    rejectReason: 'Kho vật tư IT vẫn còn 01 cuộn dây mạng AMP. Chỉ duyệt mua Patch Panel và 01 cuộn cáp.'
  },
  {
    id: 15,
    type: 'ACCEPTANCE',
    employeeName: 'BuiAnhTuan_Fixer',
    deviceCodes: ['MIC-SHURE-01', 'MIC-SHURE-02'],
    content: 'Nghiệm thu thay thế vi mạch thu sóng VHF và Jack sạc micro không dây phòng hội nghị tổng công ty.',
    estimatedCost: 600000,
    managerName: 'TranQuanLy_01',
    createdAt: '2026-03-23T10:00:00',
    status: 'ACCEPTED',
    rejectReason: ''
  },
  {
    id: 16,
    type: 'DAMAGE_REPORT',
    employeeName: 'NguyenVanA_IT',
    deviceCode: 'SHREDDER-SILICON-04',
    content: 'Máy hủy tài liệu Silicon bị gãy bánh răng truyền động cơ học và chập rơ-le tự ngắt khi kẹt giấy.',
    estimatedCost: 850000,
    managerName: 'TranQuanLy_01',
    createdAt: '2026-03-23T13:30:00',
    status: 'PENDING',
    rejectReason: ''
  }
];