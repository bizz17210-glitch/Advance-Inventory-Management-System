import React from "react";

interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  className?: string;
  width?: string;
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  onSort?: (key: keyof T) => void;
  sortKey?: keyof T;
  sortDirection?: "asc" | "desc";
  onRowClick?: (row: T, index: number) => void;
  selectable?: boolean;
  selectedRows?: number[];
  onSelectionChange?: (selectedIds: number[]) => void;
  className?: string;
  emptyMessage?: string;
}

export function Table<T extends { id?: number | string }>({
  data,
  columns,
  onSort,
  sortKey,
  sortDirection = "asc",
  onRowClick,
  selectable,
  selectedRows = [],
  onSelectionChange,
  className = "",
  emptyMessage = "No data available",
}: TableProps<T>) {
  const handleSort = (key: keyof T) => {
    if (onSort) onSort(key);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSelectionChange && selectable) {
      if (e.target.checked) {
        onSelectionChange(data.map((_, idx) => idx));
      } else {
        onSelectionChange([]);
      }
    }
  };

  const handleSelectRow = (index: number) => {
    if (onSelectionChange) {
      if (selectedRows.includes(index)) {
        onSelectionChange(selectedRows.filter((i) => i !== index));
      } else {
        onSelectionChange([...selectedRows, index]);
      }
    }
  };

  return (
    <div className={`table-wrap ${className}`.trim()}>
      <table className="data-table">
        <thead>
          <tr>
            {selectable && (
              <th style={{ width: "32px" }}>
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    data.length > 0 && selectedRows.length === data.length
                  }
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={col.sortable ? "sortable" : ""}
                style={{ width: col.width }}
                onClick={() => col.sortable && handleSort(col.key as keyof T)}
              >
                {col.label}
                {col.sortable && sortKey === col.key && (
                  <i
                    className={`fa-solid fa-sort-${
                      sortDirection === "asc" ? "up" : "down"
                    } sort-icon`}
                  />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="empty-cell"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={row.id || index}
                onClick={() => onRowClick?.(row, index)}
                className={onRowClick ? "clickable" : ""}
              >
                {selectable && (
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="row-checkbox"
                      checked={selectedRows.includes(index)}
                      onChange={() => handleSelectRow(index)}
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={String(col.key)} className={col.className}>
                    {col.render
                      ? col.render(row[col.key as keyof T], row, index)
                      : String(row[col.key as keyof T] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
