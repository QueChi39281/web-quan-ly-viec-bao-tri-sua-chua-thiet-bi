import React, { memo } from 'react';

const AssetListRow = memo(({
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
          <input
            type="text"
            className="table-input"
            value={item.assetName}
            onChange={(e) => onRowChange(item.id, 'assetName', e.target.value)}
            placeholder="Nhập tên thiết bị..."
          />
        ) : (
          item.assetName
        )}
      </td>
      <td className="text-center">
        {isEditing ? (
          <input
            type="text"
            className="table-input text-center"
            value={item.assetCode}
            onChange={(e) => onRowChange(item.id, 'assetCode', e.target.value)}
            placeholder="Mã TB..."
          />
        ) : (
          item.assetCode
        )}
      </td>
      <td>
        {isEditing ? (
          <input
            type="text"
            className="table-input"
            value={item.supplier}
            onChange={(e) => onRowChange(item.id, 'supplier', e.target.value)}
            placeholder="Nhập nhà cung cấp..."
          />
        ) : (
          item.supplier
        )}
      </td>
      <td>
        {isEditing ? (
          <input
            type="text"
            className="table-input"
            value={item.location}
            onChange={(e) => onRowChange(item.id, 'location', e.target.value)}
            placeholder="Nhập vị trí TB..."
          />
        ) : (
          item.location
        )}
      </td>
      <td>
        {isEditing ? (
          <input
            type="text"
            className="table-input"
            value={item.info}
            onChange={(e) => onRowChange(item.id, 'info', e.target.value)}
            placeholder="Nhập thông tin thiết bị..."
          />
        ) : (
          item.info
        )}
      </td>
    </tr>
  );
});

export default AssetListRow;