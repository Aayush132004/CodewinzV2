import React, { useRef } from 'react';

const Pagination = ({ option }) => {
  const isCooldown = useRef(false);

  const nextPage = () => {
    if (isCooldown.current || option.page >= option.totalPage) return;
    isCooldown.current = true;
    option.setPage((prev) => (prev + 1 > option.totalPage ? option.totalPage : prev + 1));
    setTimeout(() => (isCooldown.current = false), 200); // 200ms debounce
  };

  const prevPage = () => {
    if (isCooldown.current || option.page <= 1) return;
    isCooldown.current = true;
    option.setPage((prev) => (prev > 1 ? prev - 1 : 1));
    setTimeout(() => (isCooldown.current = false), 200); // 200ms debounce
  };

  return (
    <div className="join shadow-md rounded-lg overflow-hidden border border-slate-700 bg-slate-800">
      <button
        onClick={prevPage}
        disabled={option.page === 1}
        className="join-item btn btn-sm bg-slate-700 text-white hover:bg-slate-600 border-none rounded-none"
      >
        ←
      </button>
      <button
        className="join-item btn btn-sm bg-slate-900 text-white border-x border-slate-700 hover:text-white rounded-none cursor-default"
      >
        Page {option.page}
      </button>
      <button
        onClick={nextPage}
        disabled={option.page === option.totalPage}
        className="join-item btn btn-sm bg-slate-700 text-white hover:bg-slate-600 border-none rounded-none"
      >
        →
      </button>
    </div>
  );
};

export default Pagination;
