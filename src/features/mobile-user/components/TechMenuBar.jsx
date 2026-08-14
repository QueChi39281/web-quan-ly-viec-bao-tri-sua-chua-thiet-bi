// src/components/TechMenuBar.jsx
import React, { useState } from 'react';
import './TechMenuBar.css';

export default function TechMenuBar({
  activeNavMenu,
  setActiveNavMenu,
  goToSchedule,
  goToUnassignedTasks,
  goToAssignedTasks,
}) {
  const [showTaskSubmenu, setShowTaskSubmenu] = useState(false);

  const toggleTaskMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowTaskSubmenu((prev) => !prev);
    if (setActiveNavMenu) setActiveNavMenu('tasks');
  };

  return (
    <div className="tech-menu-container">
      {/* THANH MENU CHÍNH */}
      <div className="tech-menu-bar">
        {/* Nút 1: Xem lịch làm việc */}
        <button
          type="button"
          className={`tech-menu-item ${activeNavMenu === 'schedule' ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            if (setActiveNavMenu) setActiveNavMenu('schedule');
            setShowTaskSubmenu(false);
            if (goToSchedule) goToSchedule();
          }}
        >
          XEM LỊCH LÀM VIỆC
        </button>

        {/* Nút 2: Danh sách công việc */}
        <button
          type="button"
          className={`tech-menu-item ${activeNavMenu === 'tasks' ? 'active' : ''}`}
          onClick={toggleTaskMenu}
        >
          DANH SÁCH CÔNG VIỆC {showTaskSubmenu ? '▴' : '▾'}
        </button>
      </div>

      {/* SUBMENU ĐỔI SANG MÀU XANH NỔI BẬT & CẮT SẠCH MẢNG TRẮNG BÊN TRÁI */}
      {showTaskSubmenu && (
        <div className="tech-submenu-list">
          <div
            className="tech-submenu-item"
            onClick={(e) => {
              e.stopPropagation();
              setShowTaskSubmenu(false);
              if (goToUnassignedTasks) goToUnassignedTasks();
            }}
          >
            Danh sách công việc chưa nhận
          </div>
          <div
            className="tech-submenu-item"
            onClick={(e) => {
              e.stopPropagation();
              setShowTaskSubmenu(false);
              if (goToAssignedTasks) goToAssignedTasks();
            }}
          >
            Danh sách công việc đã nhận
          </div>
        </div>
      )}
    </div>
  );
} 