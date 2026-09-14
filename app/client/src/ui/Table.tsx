import React, { useState, useMemo } from "react";
import { useSort } from "../hooks/useSort";
import { usePagination } from "../hooks/usePagination";

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T], item: T, index: number) => React.ReactNode;
  className?: string;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  pageSize?: number;
  onRowClick?: (item: T) => void;
  rowKey?: keyof T;
  className?: string;
  emptyMessage?: string;
}

export function Table<T extends Record<string, any>>({
  data,
  columns,
  pageSize = 10,
  onRowClick,
  rowKey = "id",
  className = "",
  emptyMessage = "No data available",
}: TableProps<T>) {
  const { sortConfig, requestSort, getSortIcon } = useSort<T>();
  const { currentPage, totalPages, paginatedData, goToPage } = usePagination(
    data,
    pageSize,
  );

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return paginatedData;

    return [...paginatedData].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof T];
      const bValue = b[sortConfig.key as keyof T];

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [paginatedData, sortConfig]);

  return (
    <div className={`table-container ${className}`}>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={column.sortable ? "sortable" : ""}
                  onClick={() =>
                    column.sortable && requestSort(column.key as keyof T)
                  }
                  data-testid={`column-${String(column.key)}`}
                >
                  {column.label}
                  {column.sortable && (
                    <span className="sort-icon">
                      {getSortIcon(column.key as keyof T)}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="empty-cell">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((item, index) => (
                <tr
                  key={String(item[rowKey]) || index}
                  onClick={() => onRowClick?.(item)}
                  className={onRowClick ? "clickable-row" : ""}
                  data-testid={`row-${String(item[rowKey])}`}
                >
                  {columns.map((column) => (
                    <td key={String(column.key)} className={column.className}>
                      {column.render
                        ? column.render(
                            item[column.key as keyof T],
                            item,
                            index,
                          )
                        : String(item[column.key as keyof T])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <span className="pagination-info">
            Showing {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, data.length)} of {data.length}
          </span>
          <div className="pagination-controls">
            <button
              className="page-btn"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`page-btn ${page === currentPage ? "active" : ""}`}
                onClick={() => goToPage(page)}
                aria-label={`Page ${page}`}
                aria-current={page === currentPage ? "page" : undefined}
              >
                {page}
              </button>
            ))}
            <button
              className="page-btn"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
