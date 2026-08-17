import { useState, useMemo, useEffect } from 'react';
import { deviceApi, maintenanceApi } from '../../../services/api';

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

// Initialize empty task lists (will be populated by API)
const INITIAL_TODAY_TASKS = [];
const INITIAL_UNASSIGNED_TASKS = [];
const INITIAL_ASSIGNED_TASKS = [];

export const useTechnicianDashboard = () => {
  const [unreadCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [activeNavMenu, setActiveNavMenu] = useState('home'); // 'home' | 'schedule' | 'unassigned' | 'assigned'

  // Dữ liệu Công việc (Khởi tạo từ API)
  const [todayTasks, setTodayTasks] = useState(INITIAL_TODAY_TASKS);
  const [unassignedTasks, setUnassignedTasks] = useState(INITIAL_UNASSIGNED_TASKS);
  const [assignedTasks, setAssignedTasks] = useState(INITIAL_ASSIGNED_TASKS);

  // Fetch tasks from API on mount
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        // Fetch unassigned tasks
        const unassignedRes = await maintenanceApi.getRequests({ status: 'UNASSIGNED' });
        const unassignedData = (unassignedRes.data || []).map(d => formatDeviceToTask(d, 'Chưa phân công'));
        setUnassignedTasks(unassignedData);

        // Fetch assigned tasks
        const assignedRes = await maintenanceApi.getRequests({ status: 'IN_PROGRESS' });
        const assignedData = (assignedRes.data || []).slice(0, 2).map(d => formatDeviceToTask(d, 'Đang sửa chữa'));
        setAssignedTasks(assignedData);

        // Fetch today's high priority tasks
        const todayRes = await maintenanceApi.getRequests({ priority: 'HIGH' });
        const todayData = (todayRes.data || []).slice(0, 3).map(d => formatDeviceToTask(d, 'Chờ xử lý'));
        setTodayTasks(todayData);
      } catch (error) {
        console.error('Failed to fetch technician tasks:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

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