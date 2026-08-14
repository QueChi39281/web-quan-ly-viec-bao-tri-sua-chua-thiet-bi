import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

import HeaderInfo from '../../components/HeaderInfo';
import ManagerSidebar from '../../components/ManagerSidebar';
import './DashboardPage.css';

// 1. Thống kê chi phí linh kiện
const mockSparePartsCostData = [
  { region: 'RAM & SSD', Q1: 45, Q2: 32, Q3: 28, Q4: 55 },
  { region: 'Màn hình', Q1: 60, Q2: 48, Q3: 52, Q4: 70 },
  { region: 'Pin Laptop', Q1: 30, Q2: 22, Q3: 25, Q4: 35 },
  { region: 'Mực in & Main', Q1: 25, Q2: 18, Q3: 22, Q4: 30 },
  { region: 'Phụ kiện', Q1: 15, Q2: 12, Q3: 10, Q4: 18 },
];

// 2. Thống kê thời gian trung bình sửa sự cố
const mockFixTimeData = [
  { region: 'N.V. An', Q1: 2.5, Q2: 2.0, Q3: 1.8, Q4: 2.2 },
  { region: 'T.T. Bích', Q1: 3.8, Q2: 3.1, Q3: 2.8, Q4: 3.2 },
  { region: 'L.H. Cường', Q1: 1.5, Q2: 1.2, Q3: 1.1, Q4: 1.4 },
  { region: 'P.M. Đức', Q1: 4.2, Q2: 3.5, Q3: 3.0, Q4: 3.8 },
  { region: 'V.Q. Huy', Q1: 2.8, Q2: 2.2, Q3: 2.0, Q4: 2.5 },
];

// 3. Thống kê tần suất hư hỏng của thiết bị
const mockFailureFrequencyData = [
  { region: 'Laptop', Q1: 35, Q2: 28, Q3: 22, Q4: 40 },
  { region: 'PC Bàn', Q1: 25, Q2: 18, Q3: 15, Q4: 28 },
  { region: 'Máy in', Q1: 45, Q2: 32, Q3: 38, Q4: 50 },
  { region: 'Màn hình', Q1: 18, Q2: 12, Q3: 10, Q4: 20 },
  { region: 'Mạng', Q1: 12, Q2: 8, Q3: 6, Q4: 15 },
];

// 4. Thống kê tần suất hư hỏng của thiết bị theo nhà cung cấp
const mockVendorFailureData = [
  { region: 'Dell', Q1: 12, Q2: 8, Q3: 6, Q4: 10 },
  { region: 'HP', Q1: 18, Q2: 14, Q3: 10, Q4: 15 },
  { region: 'Lenovo', Q1: 10, Q2: 6, Q3: 5, Q4: 8 },
  { region: 'Asus', Q1: 15, Q2: 11, Q3: 9, Q4: 12 },
  { region: 'Apple', Q1: 4, Q2: 2, Q3: 3, Q4: 5 },
];

// 5. Danh sách 10 dữ liệu mẫu (Gồm cả việc Gấp và Định kỳ đan xen)
const mockMaintenanceTasks = [
  { id: 1, name: 'Máy in Laser HP (TB-9981)', deadline: 'Hôm nay - 15:00', isUrgent: true, tagText: 'Gấp' },
  { id: 2, name: 'Laptop Dell Inspiron 15', deadline: 'Ngày mai - 09:00', isUrgent: false, tagText: 'Định kỳ' },
  { id: 3, name: 'Máy tính để bàn HP Pavilion', deadline: '15/08/2026', isUrgent: false, tagText: 'Định kỳ' },
  { id: 4, name: 'Server lưu trữ NAS Synology', deadline: '16/08/2026', isUrgent: true, tagText: 'Gấp' },
  { id: 5, name: 'Switch mạng Cisco Core 48P', deadline: '18/08/2026', isUrgent: false, tagText: 'Định kỳ' },
  { id: 6, name: 'Máy chiếu phòng họp A1', deadline: '20/08/2026', isUrgent: false, tagText: 'Định kỳ' },
  { id: 7, name: 'Bảo trì hệ thống mạng tầng 3', deadline: '22/08/2026', isUrgent: true, tagText: 'Gấp' },
  { id: 8, name: 'Dàn Desktop Đồ họa VIP 02', deadline: '25/08/2026', isUrgent: false, tagText: 'Nâng cấp' },
  { id: 9, name: 'UPS Bộ lưu điện Server 02', deadline: '28/08/2026', isUrgent: false, tagText: 'Thay Pin' },
  { id: 10, name: 'Camera an ninh Cổng chính', deadline: '30/08/2026', isUrgent: false, tagText: 'Định kỳ' },
];

export default function DashboardPage() {
  // Logic Sắp xếp: Công việc có isUrgent === true sẽ luôn đẩy lên đầu danh sách
  const sortedMaintenanceTasks = [...mockMaintenanceTasks].sort((a, b) => {
    return (b.isUrgent ? 1 : 0) - (a.isUrgent ? 1 : 0);
  });

  return (
    <div className="page-root-layout">
      <div className="page-header-wrapper">
        <HeaderInfo />
      </div>

      <div className="page-body-wrapper">
        <ManagerSidebar />

        <main className="main-content-container">
          <h2 className="dashboard-title">BẢNG ĐIỀU KHIỂN TỔNG QUAN</h2>

          {/* 1. KHU VỰC THỐNG KÊ KPI */}
          <div className="kpi-grid-container">
            <div className="kpi-card">
              <div className="kpi-icon-wrapper kpi-blue">⚙️</div>
              <div className="kpi-info-group">
                <span className="kpi-label">Tổng thiết bị</span>
                <span className="kpi-value">124</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrapper kpi-amber">🛠️</div>
              <div className="kpi-info-group">
                <span className="kpi-label">Chờ bảo trì</span>
                <span className="kpi-value">12</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrapper kpi-green">✅</div>
              <div className="kpi-info-group">
                <span className="kpi-label">Đã hoàn thành</span>
                <span className="kpi-value">85</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrapper kpi-red">⚠️</div>
              <div className="kpi-info-group">
                <span className="kpi-label">Sự cố hỏng hóc</span>
                <span className="kpi-value">3</span>
              </div>
            </div>
          </div>

          {/* 2. KHU VỰC NỘI DUNG CHÍNH (3 CỘT) */}
          <div className="dashboard-main-split">
            {/* CỘT 1 & 2: LƯỚI 2x2 DÀNH CHO 4 BIỂU ĐỒ */}
            <div className="chart-grid">
              <ChartCard title="Thống kê chi phí linh kiện:">
                <StackedBarChart data={mockSparePartsCostData} unit="Tr VNĐ" />
              </ChartCard>

              <ChartCard title="Thống kê thời gian trung bình sửa sự cố:">
                <StackedBarChart data={mockFixTimeData} unit="giờ" />
              </ChartCard>

              <ChartCard title="Thống kê tần suất hư hỏng của thiết bị:">
                <StackedBarChart data={mockFailureFrequencyData} unit="lần" />
              </ChartCard>

              <ChartCard title="Thống kê tần suất hư hỏng theo NCC:">
                <StackedBarChart data={mockVendorFailureData} unit="ca" />
              </ChartCard>
            </div>

            {/* CỘT 3: LỊCH BẢO TRÌ SẮP TỚI (CÁC MỤC "GẤP" HIỆN Ở ĐẦU) */}
            <div className="summary-card-wrapper">
              <div className="card-header-title">
                Lịch bảo trì sắp tới ({sortedMaintenanceTasks.length})
              </div>
              
              <div className="recent-tasks-list">
                {sortedMaintenanceTasks.map((task) => (
                  <div key={task.id} className={`task-item-row ${task.isUrgent ? 'urgent' : ''}`}>
                    <div className="task-item-left">
                      <span className="task-device-name">{task.name}</span>
                      <span className="task-date-info">Hạn: {task.deadline}</span>
                    </div>
                    <span className={`task-status-tag ${task.isUrgent ? 'tag-urgent' : ''}`}>
                      {task.tagText}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="chart-card">
      <h3 className="chart-title">{title}</h3>
      <div className="chart-wrapper">{children}</div>
    </div>
  );
}

function StackedBarChart({ data, unit = '' }) {
  const customTooltipFormatter = (value, name) => [
    `${value?.toLocaleString('vi-VN') || 0} ${unit}`.trim(),
    name
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: -5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="region" tick={{ fontSize: 10 }} interval={0} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip formatter={customTooltipFormatter} />
        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '2px' }} iconSize={10} />
        <Bar dataKey="Q1" stackId="a" fill="#3b82f6" name="Q1" />
        <Bar dataKey="Q2" stackId="a" fill="#10b981" name="Q2" />
        <Bar dataKey="Q3" stackId="a" fill="#f59e0b" name="Q3" />
        <Bar dataKey="Q4" stackId="a" fill="#ef4444" name="Q4" />
      </BarChart>
    </ResponsiveContainer>
  );
}