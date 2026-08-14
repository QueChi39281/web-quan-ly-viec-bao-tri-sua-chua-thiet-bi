// src/constants/maintenanceData.js

// 1. DỮ LIỆU DANH MỤC LỰA CHỌN
export const DEVICE_OPTIONS = [
  'Máy chủ Server Dell PowerEdge',
  'Bộ lưu điện UPS APC 10kVA',
  'Switch Cisco Catalyst 48 Port',
  'Máy đo sóng Oscilloscope Tektronix',
  'Trạm hàn khò điện tử Hakko',
  'Máy cấp nguồn DC lập trình Keysight',
  'Máy soi bo mạch kính hiển vi',
  'Máy chiếu phòng họp Epson'
];

export const STAFF_OPTIONS = [
  'Nguyễn Văn An',
  'Trần Thị Bích',
  'Lê Hoàng Cường',
  'Phạm Minh Đức',
  'Vũ Thị Hoa',
  'Đặng Quốc Anh'
];

// 2. DỮ LIỆU NHÂN VIÊN KÈM TRẠNG THÁI SẴN SÀNG
export const STAFF_WITH_STATUS = [
  { id: 'NV01', name: 'Nguyễn Văn An', status: 'Sẵn sàng', role: 'Kỹ sư phần cứng' },
  { id: 'NV02', name: 'Trần Thị Bích', status: 'Đang bận', role: 'Kỹ thuật viên bo mạch' },
  { id: 'NV03', name: 'Lê Hoàng Cường', status: 'Sẵn sàng', role: 'Chuyên viên mạng/Server' },
  { id: 'NV04', name: 'Phạm Minh Đức', status: 'Nghỉ phép', role: 'Kỹ thuật viên điện tử' },
  { id: 'NV05', name: 'Vũ Thị Hoa', status: 'Sẵn sàng', role: 'Kỹ sư đo lường' },
  { id: 'NV06', name: 'Đặng Quốc Anh', status: 'Đang bận', role: 'Trưởng nhóm kỹ thuật' }
];

// 3. KHỞI TẠO DỮ LIỆU BẢNG KẾ HOẠCH BẢO TRÌ & SỬA CHỮA
export const getInitialMaintenanceRows = (todayStr = '2026-08-13') => [
  {
    id: 101,
    selected: false,
    deviceType: 'Bộ lưu điện UPS APC 10kVA',
    deviceCode: 'UPS-PLANT-01',
    status: 'Cần sửa chữa',
    actionType: 'Sửa chữa',
    content: 'Thay thế Battery Pack suy hao dung lượng và tụ lọc nguồn chính',
    supplies: [
      { name: 'Ắc quy 12V 9Ah CSB', quantity: 16, price: 450000 },
      { name: 'Tụ điện nhôm 450V 680uF', quantity: 4, price: 120000 }
    ],
    cost: 7680000,
    assignedStaffs: [
      { staffId: 'NV01', name: 'Nguyễn Văn An', status: 'Sẵn sàng' },
      { staffId: 'NV02', name: 'Trần Thị Bích', status: 'Đang bận' }
    ],
    startDate: todayStr,
    endDate: todayStr
  },
  {
    id: 102,
    selected: false,
    deviceType: 'Máy chủ Server Dell PowerEdge',
    deviceCode: 'SRV-DC-03',
    status: 'Đang hoạt động',
    actionType: 'Bảo trì',
    content: 'Vệ sinh công nghiệp, tra keo tản nhiệt CPU, nâng cấp Firmware RAID Controller',
    supplies: [
      { name: 'Keo tản nhiệt Noctua NT-H2', quantity: 1, price: 250000 },
      { name: 'Chai xịt khí nén B-52', quantity: 2, price: 85000 }
    ],
    cost: 420000,
    assignedStaffs: [
      { staffId: 'NV03', name: 'Lê Hoàng Cường', status: 'Sẵn sàng' }
    ],
    startDate: todayStr,
    endDate: '2026-08-15'
  },
  {
    id: 103,
    selected: false,
    deviceType: 'Oscilloscope Tektronix',
    deviceCode: 'LAB-OSC-02',
    status: 'Cần sửa chữa',
    actionType: 'Sửa chữa',
    content: 'Lỗi méo dải tần kênh CH1, khắc phục mạch khuếch đại đầu vào (Preamplifier)',
    supplies: [
      { name: 'IC Op-Amp tốc độ cao AD8009', quantity: 2, price: 180000 },
      { name: 'Trở dán SMD 0805 chính xác 1%', quantity: 10, price: 5000 }
    ],
    cost: 410000,
    assignedStaffs: [
      { staffId: 'NV05', name: 'Vũ Thị Hoa', status: 'Sẵn sàng' },
      { staffId: 'NV01', name: 'Nguyễn Văn An', status: 'Sẵn sàng' }
    ],
    startDate: '2026-08-14',
    endDate: '2026-08-16'
  },
  {
    id: 104,
    selected: false,
    deviceType: 'Trạm hàn khò điện tử Hakko',
    deviceCode: 'FIX-HK-05',
    status: 'Cần sửa chữa',
    actionType: 'Sửa chữa',
    content: 'Tay khò không nóng, hỏng sensor nhiệt và dây đốt',
    supplies: [
      { name: 'Lõi nhiệt tay khò 857DW+', quantity: 1, price: 220000 },
      { name: 'Mũi hàn Hakko T12', quantity: 3, price: 95000 }
    ],
    cost: 505000,
    assignedStaffs: [], // Chưa phân công
    startDate: '2026-08-18',
    endDate: '2026-08-18'
  },
  {
    id: 105,
    selected: false,
    deviceType: 'Switch Cisco Catalyst 48 Port',
    deviceCode: 'SW-FL02-01',
    status: 'Đang hoạt động',
    actionType: 'Bảo trì',
    content: 'Bảo trì nguồn Redundant Power Supply (RPS), đo kiểm cổng SFP quang',
    supplies: [
      { name: 'Modul quang SFP+ 10G Cisco', quantity: 2, price: 1200000 }
    ],
    cost: 2400000,
    assignedStaffs: [
      { staffId: 'NV03', name: 'Lê Hoàng Cường', status: 'Sẵn sàng' },
      { staffId: 'NV06', name: 'Đặng Quốc Anh', status: 'Đang bận' }
    ],
    startDate: '2026-08-20',
    endDate: '2026-08-21'
  }
];

// 4. DỮ LIỆU MOCK ĐƠN YÊU CẦU THIẾT BỊ ĐIỆN TỬ
export const mockDeviceRequests = [
  {
    requestId: 'REQ-2026-0801',
    requestType: 'Cấp thiết bị',
    createdDate: '2026-08-10',
    requester: 'Nguyễn Minh Hùng (Phòng R&D)',
    items: [
      { itemId: 'IT-101', deviceCode: 'LAB-OSC-02', deviceType: 'Oscilloscope Tektronix', approvalStatus: 'Đã duyệt' },
      { itemId: 'IT-102', deviceCode: 'PWR-DC-01', deviceType: 'Máy cấp nguồn DC lập trình', approvalStatus: 'Chờ duyệt' },
      { itemId: 'IT-103', deviceCode: 'MIC-PCB-04', deviceType: 'Máy soi bo mạch kính hiển vi', approvalStatus: 'Từ chối' }
    ]
  },
  {
    requestId: 'REQ-2026-0802',
    requestType: 'Thu hồi / Sửa chữa',
    createdDate: '2026-08-11',
    requester: 'Hoàng Văn Nam (Xưởng Sản xuất)',
    items: [
      { itemId: 'IT-201', deviceCode: 'UPS-PLANT-01', deviceType: 'Bộ lưu điện UPS APC 10kVA', approvalStatus: 'Đã duyệt' },
      { itemId: 'IT-202', deviceCode: 'FIX-HK-05', deviceType: 'Trạm hàn khò điện tử Hakko', approvalStatus: 'Chờ duyệt' }
    ]
  },
  {
    requestId: 'REQ-2026-0803',
    requestType: 'Trả thiết bị',
    createdDate: '2026-08-12',
    requester: 'Đỗ Thùy Trang (Phòng CNTT)',
    items: [
      { itemId: 'IT-301', deviceCode: 'SW-FL02-01', deviceType: 'Switch Cisco Catalyst 48 Port', approvalStatus: 'Đã duyệt' },
      { itemId: 'IT-302', deviceCode: 'PJ-MEET-02', deviceType: 'Máy chiếu phòng họp Epson', approvalStatus: 'Đã duyệt' }
    ]
  }
];