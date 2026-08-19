// components/Pagination.jsx
// Komponen pagination reusable yang dipakai oleh Inventaris, Transaksi, Laporan, dll.
// Props:
//   - pagination: { page, limit, total, totalPages } — dari response API
//   - onPageChange: (newPage: number) => void
//   - onLimitChange: (newLimit: number) => void (opsional)
//   - limitOptions: number[] (default: [15, 30, 50, 100, 150])
//   - showLimitSelector: boolean (default: true)

import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';

const DEFAULT_LIMIT_OPTIONS = [15, 30, 50, 100, 150];

// Hasilkan array nomor halaman dengan ellipsis.
// Contoh: [1, '...', 4, 5, 6, '...', 10]
const getPageNumbers = (current, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages = new Set([1, total, current]);
    if (current > 1) pages.add(current - 1);
    if (current < total) pages.add(current + 1);

    const sorted = [...pages].sort((a, b) => a - b);
    const result = [];

    for (let i = 0; i < sorted.length; i++) {
        if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('...');
        result.push(sorted[i]);
    }

    return result;
};

export default function Pagination({
    pagination,
    onPageChange,
    onLimitChange,
    limitOptions = DEFAULT_LIMIT_OPTIONS,
    showLimitSelector = true,
}) {
    if (!pagination || pagination.total === 0) return null;

    const { page = 1, limit = 15, total = 0, totalPages = 0 } = pagination;
    const from = total === 0 ? 0 : (page - 1) * limit + 1;
    const to = Math.min(page * limit, total);
    const pages = getPageNumbers(page, totalPages);

    return (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1">
            {/* Info jumlah record & Limit Selector */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                {showLimitSelector && onLimitChange && (
                    <div className="flex items-center gap-1.5">
                        <label htmlFor="pagination-limit-select" className="font-medium text-slate-600">
                            Baris per halaman:
                        </label>
                        <select
                            id="pagination-limit-select"
                            value={limit}
                            onChange={(e) => onLimitChange(Number(e.target.value))}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none transition focus:border-[#14a2ba] focus:ring-2 focus:ring-[#14a2ba]/20"
                        >
                            {limitOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                <p>
                    Menampilkan <span className="font-semibold text-slate-700">{from}–{to}</span> dari{' '}
                    <span className="font-semibold text-slate-700">{total}</span> data
                </p>
            </div>

            {/* Kontrol halaman */}
            {totalPages > 1 && (
                <div className="flex items-center gap-1">
                    {/* Tombol Prev */}
                    <button
                        type="button"
                        onClick={() => onPageChange(page - 1)}
                        disabled={page <= 1}
                        aria-label="Halaman sebelumnya"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-[#14a2ba] hover:text-[#14a2ba] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <HugeiconsIcon icon={ArrowLeft01Icon} size={14} strokeWidth={2.5} />
                    </button>

                    {/* Nomor halaman */}
                    {pages.map((p, i) =>
                        p === '...' ? (
                            <span key={`ellipsis-${i}`} className="px-1 text-xs text-slate-400">…</span>
                        ) : (
                            <button
                                key={p}
                                type="button"
                                onClick={() => onPageChange(p)}
                                aria-label={`Halaman ${p}`}
                                aria-current={p === page ? 'page' : undefined}
                                className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg border px-2 text-xs font-semibold transition ${
                                    p === page
                                        ? 'border-[#14a2ba] bg-[#14a2ba] text-white shadow-sm shadow-[#14a2ba]/30'
                                        : 'border-slate-200 text-slate-600 hover:border-[#14a2ba] hover:text-[#14a2ba]'
                                }`}
                            >
                                {p}
                            </button>
                        )
                    )}

                    {/* Tombol Next */}
                    <button
                        type="button"
                        onClick={() => onPageChange(page + 1)}
                        disabled={page >= totalPages}
                        aria-label="Halaman berikutnya"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-[#14a2ba] hover:text-[#14a2ba] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={2.5} />
                    </button>
                </div>
            )}
        </div>
    );
}