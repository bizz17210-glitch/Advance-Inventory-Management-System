import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  infoText?: string;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  infoText,
  className = "",
}) => {
  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 2) pages.push("...");
      if (totalPages > 1) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className={`pagination ${className}`.trim()}>
      {infoText && (
        <div
          className="pagination-info"
          dangerouslySetInnerHTML={{ __html: infoText }}
        />
      )}
      <div className="pag-controls">
        <button
          className="pag-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <i className="fa-solid fa-chevron-left" style={{ fontSize: "9px" }} />
        </button>
        {renderPageNumbers().map((page, idx) =>
          page === "..." ? (
            <button key={`dots-${idx}`} className="pag-btn dots" disabled>
              …
            </button>
          ) : (
            <button
              key={page}
              className={`pag-btn ${currentPage === page ? "active" : ""}`}
              onClick={() => onPageChange(page as number)}
            >
              {page}
            </button>
          ),
        )}
        <button
          className="pag-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <i
            className="fa-solid fa-chevron-right"
            style={{ fontSize: "9px" }}
          />
        </button>
      </div>
    </div>
  );
};
