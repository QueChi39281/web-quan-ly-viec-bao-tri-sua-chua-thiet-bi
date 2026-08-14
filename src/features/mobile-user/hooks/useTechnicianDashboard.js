import { useState, useMemo, useEffect } from 'react';
import { MOCK_PHONE_DEVICES, MOCK_OFFICE_DEVICES, MOCK_ALL_DEVICES } from '../../../constants/mockDataTech';

// Map Mock Data thiết bị thành cấu trúc Task của kỹ thuật viên
const formatDeviceToTask = (device, overrideStatus = null) => ({
  id: device.id,
  deviceId: device.deviceId,
  deviceName: device.deviceName,
  category: device.category,
  specifications: device.specifications,
  department: device.department,
  assignedTo: device.assignedTo,
  status: overrideStatus || device.status,
  priority: device.priority || 'NORMAL',
  createdAt: device.installedDate ? `${device.installedDate}T08:00:00` : new Date().toISOString(),
  location: device.location,
  notes: device.notes,
  price: device.price,
  serialNumber: device.serialNumber
});

// Khởi tạo các danh sách công việc từ Mock Data Thiết Bị
const INITIAL_TODAY_TASKS = MOCK_PHONE_DEVICES
  .filter(d => d.priority === 'HIGH' || d.status === 'Chờ xử lý')
  .slice(0, 3)
  .map(d => formatDeviceToTask(d, 'Chờ xử lý'));

const INITIAL_UNASSIGNED_TASKS = MOCK_ALL_DEVICES
  .filter(d => d.status === 'Chờ xử lý' || d.status === 'Chưa phân công')
  .map(d => formatDeviceToTask(d, 'Chưa phân công'));

const INITIAL_ASSIGNED_TASKS = MOCK_OFFICE_DEVICES
  .filter(d => d.status === 'Đang sửa chữa' || d.status === 'Đang sử dụng')
  .slice(0, 2)
  .map(d => formatDeviceToTask(d, 'Đang sửa chữa'));

export const useTechnicianDashboard = () => {
  const [unreadCount] = useState(3);
  const [loading] = useState(false);
  const [activeNavMenu, setActiveNavMenu] = useState('home'); // 'home' | 'schedule' | 'unassigned' | 'assigned'

  // Dữ liệu Công việc (Khởi tạo từ mock data thiết bị)
  const [todayTasks] = useState(INITIAL_TODAY_TASKS);
  const [unassignedTasks, setUnassignedTasks] = useState(INITIAL_UNASSIGNED_TASKS);
  const [assignedTasks, setAssignedTasks] = useState(INITIAL_ASSIGNED_TASKS);

  // Bộ lọc & Sắp xếp cho bảng
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Tự động đưa về trang 1 khi thay đổi từ khóa, bộ lọc hoặc menu điều hướng
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, priorityFilter, sortBy, activeNavMenu]);

  // Xử lý chuyển View
  const goToHome = () => { setActiveNavMenu('home'); setCurrentPage(1); };
  const goToSchedule = () => { setActiveNavMenu('schedule'); };
  const goToUnassignedTasks = () => { setActiveNavMenu('unassigned'); setCurrentPage(1); };
  const goToAssignedTasks = () => { setActiveNavMenu('assigned'); setCurrentPage(1); };
  const goToDeviceDetail = (id) => alert(`Chuyển tới chi tiết thiết bị mã: ${id}`);

  // Hàm dùng chung cho Lọc & Sắp xếp
  const filterAndSortTasks = (taskList) => {
    return taskList
      .filter((item) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          item.deviceId.toLowerCase().includes(term) ||
          item.location.toLowerCase().includes(term) ||
          (item.deviceName && item.deviceName.toLowerCase().includes(term)) ||
          (item.department && item.department.toLowerCase().includes(term)) ||
          (item.category && item.category.toLowerCase().includes(term));

        const matchesPriority = priorityFilter === 'ALL' || item.priority === priorityFilter;
        return matchesSearch && matchesPriority;
      })
      .sort((a, b) => {
        if (sortBy === 'NEWEST') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === 'OLDEST') return new Date(a.createdAt) - new Date(b.createdAt);
        return 0;
      });
  };

  // Danh sách đã lọc cho Công việc chưa nhận
  const filteredUnassignedTasks = useMemo(() => {
    return filterAndSortTasks(unassignedTasks);
  }, [unassignedTasks, searchTerm, priorityFilter, sortBy]);

  // Danh sách đã lọc cho Công việc đã nhận
  const filteredAssignedTasks = useMemo(() => {
    return filterAndSortTasks(assignedTasks);
  }, [assignedTasks, searchTerm, priorityFilter, sortBy]);

  // Xác định danh sách hiện tại theo activeNavMenu để tính phân trang
  const currentActiveList = useMemo(() => {
    if (activeNavMenu === 'assigned') return filteredAssignedTasks;
    return filteredUnassignedTasks;
  }, [activeNavMenu, filteredUnassignedTasks, filteredAssignedTasks]);

  // Tính toán tổng số trang
  const totalPages = Math.ceil(currentActiveList.length / itemsPerPage) || 1;

  // Phân trang danh sách chưa nhận
  const paginatedUnassignedTasks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUnassignedTasks.slice(start, start + itemsPerPage);
  }, [filteredUnassignedTasks, currentPage]);

  // Phân trang danh sách đã nhận
  const paginatedAssignedTasks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAssignedTasks.slice(start, start + itemsPerPage);
  }, [filteredAssignedTasks, currentPage]);

  // Xử lý Nhận công việc
  const handleAcceptTask = (task) => {
    // 1. Xóa khỏi Unassigned
    setUnassignedTasks((prev) => prev.filter((t) => t.id !== task.id));

    // 2. Thêm vào Assigned
    const newTask = {
      ...task,
      status: 'Đã tiếp nhận',
      acceptedAt: new Date().toISOString()
    };
    setAssignedTasks((prev) => [newTask, ...prev]);

    alert(`Đã nhận thành công thiết bị: ${task.deviceName} (${task.deviceId})`);
    goToAssignedTasks(); // Chuyển sang danh sách đã nhận
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return {
    unreadCount,
    todayTasks,
    unassignedTasks,
    assignedTasks,
    loading,
    currentPage,
    totalPages,
    activeNavMenu,
    searchTerm,
    priorityFilter,
    sortBy,
    paginatedUnassignedTasks,
    paginatedAssignedTasks,
    setActiveNavMenu,
    setSearchTerm,
    setPriorityFilter,
    setSortBy,
    handlePageChange,
    goToHome,
    goToSchedule,
    goToUnassignedTasks,
    goToAssignedTasks,
    goToDeviceDetail,
    handleAcceptTask,
  };
};