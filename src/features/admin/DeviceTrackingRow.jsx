import React, { memo } from 'react';

const DeviceTrackingRow = memo(({
  item,
  index,
  startIndex,
  editingRowId,
  onSelectRow,
  onRowChange
}) => {
  const isEditing = editingRowId === item.id;

  return (
    <tr className={isEditing ? 'editing-row' : ''}>
      <td className="col-checkbox">
        <input
          type="checkbox"
          checked={item.selected}
          onChange={() => onSelectRow(item.id)}
        />
      </td>
      <td className="text-center">{startIndex + index + 1}</td>
      <td>
        {isEditing ? (
          <select
            className="table-input"
            value={item.actionType}
            onChange={(e) => onRowChange(item.id, 'actionType', e.target.value)}
          >
            <option value="Báo hư hỏng">Báo hư hỏng</option>
            <option value="Sửa chữa">Sửa chữa</option>
            <option value="Nghiệm thu">Nghiệm thu</option>
            <option value="Bảo trì định kỳ">Bảo trì định kỳ</option>
            <option value="Điều chuyển">Điều chuyển</option>
          </select>
        ) : (
          <span className={`badge-action action-${item.actionType?.toLowerCase().replace(/\s+/g, '-')}`}>
            {item.actionType}
          </span>
        )}
      </td>
      <td className="text-center">
        {isEditing ? (
          <input
            type="date"
            className="table-input text-center"
            value={item.transferDate}
            onChange={(e) => onRowChange(item.id, 'transferDate', e.target.value)}
          />
        ) : (
          item.transferDate
        )}
      </td>
      <td className="text-center">
        {isEditing ? (
          <input
            type="datetime-local"
            className="table-input text-center"
            value={item.eventTime}
            onChange={(e) => onRowChange(item.id, 'eventTime', e.target.value)}
          />
        ) : (
          item.eventTime
        )}
      </td>
      <td>
        {isEditing ? (
          <input
            type="text"
            className="table-input"
            value={item.maintenanceContent}
            onChange={(e) => onRowChange(item.id, 'maintenanceContent', e.target.value)}
            placeholder="Nhập nội dung bảo trì/sửa chữa..."
          />
        ) : (
          item.maintenanceContent
        )}
      </td>
      <td className="text-right">
        {isEditing ? (
          <input
            type="number"
            className="table-input text-right"
            value={item.cost}
            onChange={(e) => onRowChange(item.id, 'cost', Number(e.target.value))}
          />
        ) : (
          item.cost ? item.cost.toLocaleString('vi-VN') + ' đ' : '0 đ'
        )}
      </td>
      <td className="text-center">
        {isEditing ? (
          <input
            type="text"
            className="table-input"
            value={item.deviceStatus}
            onChange={(e) => onRowChange(item.id, 'deviceStatus', e.target.value)}
            placeholder="Trạng thái..."
          />
        ) : (
          item.deviceStatus
        )}
      </td>
    </tr>
  );
});

export default DeviceTrackingRow;