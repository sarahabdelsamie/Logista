const Pagination = ({ page, pages, total, limit, onPageChange }) => {
  if (pages <= 1) return null;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const pageNums = Array.from({ length: pages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-[#E2E8F0]">
      <p className="text-xs text-[#64748B]">
        Showing <span className="font-semibold text-[#1E293B]">{start}</span> to{' '}
        <span className="font-semibold text-[#1E293B]">{end}</span> of{' '}
        <span className="font-semibold text-[#1E293B]">{total}</span> entries
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-2 py-1 rounded text-sm text-[#64748B] hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ‹
        </button>
        {pageNums.map((n) => (
          <button
            key={n}
            onClick={() => onPageChange(n)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              n === page ? 'bg-[#1D4ED8] text-white' : 'text-[#64748B] hover:bg-gray-100'
            }`}
          >
            {n}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === pages}
          className="px-2 py-1 rounded text-sm text-[#64748B] hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ›
        </button>
      </div>
    </div>
  );
};

export default Pagination;
