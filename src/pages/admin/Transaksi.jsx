import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Search01Icon,
    RefreshIcon,
    CheckmarkCircle02Icon,
    Alert02Icon,
    PackageIcon,
    InboxIcon,
    Loading03Icon,
    Clock01Icon,
    Tag01Icon,
    SortByDown01Icon,
    Cancel01Icon,
    Calendar03Icon,
} from '@hugeicons/core-free-icons';
import Pagination from '../../components/Pagination';
import { showToast, showConfirm } from '../../utils/alert';

const API_URL      = `${import.meta.env.VITE_API_URL}/api/transactions`;
// GET /api/transactions/summary → { data: { total, dipinjam, selesai } }
const SUMMARY_URL  = `${API_URL}/summary`;
// GET /api/items/kategori → { data: string[] }
const CATEGORIES_URL = `${import.meta.env.VITE_API_URL}/api/items/kategori`;
const DEFAULT_PAGE_LIMIT = 15;

const STATUS_OPTIONS = [
    { value: 'dipinjam', label: 'Dipinjam' },
    { value: 'selesai',  label: 'Selesai'  },
];

const SORT_OPTIONS = [
    { key: 'terbaru', label: 'Waktu Pinjam Terbaru' },
    { key: 'terlama', label: 'Waktu Pinjam Terlama' },
    { key: 'az',      label: 'Nama Barang A-Z'      },
    { key: 'za',      label: 'Nama Barang Z-A'      },
];

const formatTanggal = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

const statusStyles = (status) =>
    status === 'dipinjam'
        ? 'bg-amber-50 text-amber-700 ring-amber-200'
        : 'bg-emerald-50 text-emerald-700 ring-emerald-200';

export default function Transaksi() {
    // ── Data halaman aktif ────────────────────────────────────────────────────
    const [transactions, setTransactions] = useState([]);
    const [pagination,   setPagination]   = useState(null);
    const [currentPage,  setCurrentPage]  = useState(1);
    const [pageLimit,    setPageLimit]    = useState(DEFAULT_PAGE_LIMIT);

    // ── Statistik global — dari endpoint ringkasan, bukan data halaman aktif ─
    const [summary, setSummary] = useState({ total: 0, dipinjam: 0, selesai: 0 });

    // ── UI state ──────────────────────────────────────────────────────────────
    const [isLoading,      setIsLoading]      = useState(true);
    const [error,          setError]          = useState(null);
    const [statusFilter,   setStatusFilter]   = useState('semua');
    const [activeKategori, setActiveKategori] = useState('semua');
    const [sortBy,         setSortBy]         = useState('terbaru');
    const [search,         setSearch]         = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [processingId,   setProcessingId]   = useState(null);
    const [tanggalMulai,   setTanggalMulai]   = useState('');
    const [tanggalAkhir,   setTanggalAkhir]   = useState('');

    // Daftar kategori dari endpoint khusus — tidak dikumpulkan dari data halaman
    const [kategoriOptions, setKategoriOptions] = useState([]);

    const authHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
    };

    // ── Fetch ringkasan terfilter ─────────────────────────────────────────────
    // Dipanggil saat filter/search/tanggal berubah & setelah perubahan status lewat handleStatusChange
    // agar stat cards & tab counts selalu akurat sesuai filter aktif.
    const fetchSummary = useCallback(async ({ kategori, search: q, tanggal_mulai: tm, tanggal_akhir: ta } = {}) => {
        try {
            const params = new URLSearchParams();
            if (kategori && kategori !== 'semua') params.set('kategori', kategori);
            if (q        && q.trim())             params.set('search',        q.trim());
            if (tm       && tm.trim())            params.set('tanggal_mulai', tm.trim());
            if (ta       && ta.trim())            params.set('tanggal_akhir', ta.trim());

            const res  = await fetch(`${SUMMARY_URL}?${params}`, { headers: authHeaders() });
            const body = await res.json();
            if (res.ok) setSummary(body.data || { total: 0, dipinjam: 0, selesai: 0 });
        } catch {
            // Statistik tidak kritis — gagal diam-diam
        }
    }, []);

    // ── Fetch daftar kategori unik ────────────────────────────────────────────
    // Dipanggil sekali saat mount. Tidak perlu di-reset saat filter berubah.
    const fetchKategori = useCallback(async () => {
        try {
            const res  = await fetch(CATEGORIES_URL, { headers: authHeaders() });
            const body = await res.json();
            if (res.ok) setKategoriOptions(body.data || []);
        } catch {
            // Kategori tidak kritis — gagal diam-diam
        }
    }, []);

    // ── Fetch data halaman aktif ──────────────────────────────────────────────
    // Semua filter (status, kategori, search) dikirim sebagai query string ke server.
    // Client hanya bertanggung jawab untuk sorting data yang sudah dikembalikan.
    const fetchTransactions = useCallback(async ({ page, limit, status, kategori, search: q, sortBy: s, tanggal_mulai: tm, tanggal_akhir: ta }) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ page, limit: limit || pageLimit });
            if (status   && status   !== 'semua') params.set('status',        status);
            if (kategori && kategori !== 'semua') params.set('kategori',      kategori);
            if (q        && q.trim())             params.set('search',        q.trim());
            if (tm       && tm.trim())            params.set('tanggal_mulai', tm.trim());
            if (ta       && ta.trim())            params.set('tanggal_akhir', ta.trim());
            params.set('sortBy', s || 'terbaru');

            const res  = await fetch(`${API_URL}?${params}`, { headers: authHeaders() });
            const body = await res.json();
            if (!res.ok) throw new Error(body.message || 'Gagal memuat data transaksi.');
            setTransactions(body.data       || []);
            setPagination(body.pagination   || null);
        } catch (err) {
            setError(err.message || 'Terjadi kesalahan saat memuat data.');
        } finally {
            setIsLoading(false);
        }
    }, [pageLimit]); // stabil — parameter filter diterima lewat argumen, bukan closure

    // Debounce input search (500 ms) sebelum mengubah debouncedSearch
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Fetch data saat currentPage, pageLimit, statusFilter, activeKategori, debouncedSearch, tanggal, atau sortBy berubah
    useEffect(() => {
        fetchTransactions({
            page:          currentPage,
            limit:         pageLimit,
            status:        statusFilter,
            kategori:      activeKategori,
            search:        debouncedSearch,
            sortBy,
            tanggal_mulai: tanggalMulai,
            tanggal_akhir: tanggalAkhir,
        });
    }, [currentPage, pageLimit, statusFilter, activeKategori, debouncedSearch, sortBy, tanggalMulai, tanggalAkhir, fetchTransactions]);

    // Fetch ringkasan saat activeKategori, debouncedSearch, atau filter tanggal berubah
    useEffect(() => {
        fetchSummary({
            kategori:      activeKategori,
            search:        debouncedSearch,
            tanggal_mulai: tanggalMulai,
            tanggal_akhir: tanggalAkhir,
        });
    }, [activeKategori, debouncedSearch, tanggalMulai, tanggalAkhir, fetchSummary]);

    // Fetch daftar kategori sekali saat mount
    useEffect(() => {
        fetchKategori();
    }, [fetchKategori]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleLimitChange = (newLimit) => {
        setPageLimit(newLimit);
        setCurrentPage(1);
    };

    const handleStatusChange = async (transaction, newStatus) => {
        if (newStatus === transaction.status) return;
        const label     = STATUS_OPTIONS.find((s) => s.value === newStatus)?.label || newStatus;
        const confirmed = await showConfirm({
            title: 'Ubah Status Transaksi?',
            text: `Ubah status "${transaction.nama_barang}" (peminjam: ${transaction.peminjam}) menjadi "${label}"?`,
            confirmButtonText: 'Ya, Ubah',
        });
        if (!confirmed) return;

        setProcessingId(transaction.id);
        try {
            const res  = await fetch(`${API_URL}/${transaction.id}/status`, {
                method:  'PATCH',
                headers: authHeaders(),
                body:    JSON.stringify({ status: newStatus }),
            });
            const body = await res.json();
            if (!res.ok) throw new Error(body.message || 'Gagal memperbarui status.');

            // Optimistic update baris tanpa refetch seluruh halaman
            setTransactions((prev) =>
                prev.map((t) =>
                    t.id === transaction.id
                        ? {
                            ...t,
                            status:       newStatus,
                            waktu_kembali: newStatus === 'selesai'
                                ? (body.data?.waktu_kembali ?? new Date().toISOString())
                                : null,
                          }
                        : t
                )
            );

            // Refresh ringkasan agar stat cards & tab counts tetap akurat
            fetchSummary({
                kategori:      activeKategori,
                search:        debouncedSearch,
                tanggal_mulai: tanggalMulai,
                tanggal_akhir: tanggalAkhir,
            });
            showToast.success(body.message || 'Status transaksi berhasil diperbarui.');
        } catch (err) {
            showToast.error(err.message || 'Gagal memperbarui status.');
        } finally {
            setProcessingId(null);
        }
    };

    // ── Sort sudah dilakukan server-side — langsung pakai transactions ────────
    const filtered = transactions;

    // ── Statistik dari API ringkasan global ───────────────────────────────────
    // Stat cards menampilkan total global lintas filter — tidak berubah saat filter diterapkan
    const stats = [
        { key: 'total',    label: 'Total Transaksi',  value: summary.total,    icon: PackageIcon,          iconWrap: 'bg-[#14a2ba]/10 text-[#14a2ba] ring-[#14a2ba]/30' },
        { key: 'dipinjam', label: 'Sedang Dipinjam',  value: summary.dipinjam, icon: Clock01Icon,           iconWrap: 'bg-amber-50 text-amber-700 ring-amber-200'           },
        { key: 'selesai',  label: 'Selesai',          value: summary.selesai,  icon: CheckmarkCircle02Icon, iconWrap: 'bg-emerald-50 text-emerald-700 ring-emerald-200'     },
    ];

    // Tab filter status — jumlah menyesuaikan dengan filter kategori, search, dan tanggal aktif
    const statusFilters = useMemo(() => [
        { key: 'semua',    label: 'Semua',    count: summary.filtered_total    ?? summary.total    },
        { key: 'dipinjam', label: 'Dipinjam', count: summary.filtered_dipinjam ?? summary.dipinjam },
        { key: 'selesai',  label: 'Selesai',  count: summary.filtered_selesai  ?? summary.selesai  },
    ], [summary]);

    // Reset ke halaman 1 saat filter berubah
    const handleStatusFilterChange = (key) => { setStatusFilter(key);   setCurrentPage(1); };
    const handleSearchChange       = (e)   => { setSearch(e.target.value); }; // page reset handled by debounce effect

    return (
        <div>
            {/* HEADER */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Kelola Transaksi</h1>
                <p className="mt-1 text-sm text-slate-500">
                    {summary.dipinjam} barang sedang dipinjam dari total {summary.total} transaksi
                </p>
            </div>



            {/* STAT CARDS */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {stats.map((s) => (
                    <div key={s.key} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ring-1 ${s.iconWrap}`}>
                            <HugeiconsIcon icon={s.icon} size={20} strokeWidth={1.5} />
                        </div>
                        <div>
                            <p className="text-2xl font-semibold leading-none text-slate-800">{s.value}</p>
                            <p className="mt-1 text-xs text-slate-500">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* TOOLBAR */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Search */}
                    <div className="relative min-w-[220px] flex-1">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                            <HugeiconsIcon icon={Search01Icon} size={17} strokeWidth={2} />
                        </span>
                        <input
                            type="text"
                            value={search}
                            onChange={handleSearchChange}
                            placeholder="Cari ID transaksi, nama barang, peminjam, atau SKU..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#14a2ba] focus:bg-white focus:ring-4 focus:ring-[#14a2ba]/10"
                        />
                        {search && (
                            <button type="button" onClick={() => { setSearch(''); setDebouncedSearch(''); setCurrentPage(1); }} className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600" aria-label="Hapus pencarian">
                                <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2.5} />
                            </button>
                        )}
                    </div>

                    {/* Filter Kategori */}
                    <div className="relative shrink-0">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                            <HugeiconsIcon icon={Tag01Icon} size={15} strokeWidth={2} />
                        </span>
                        <select
                            value={activeKategori}
                            onChange={(e) => { setActiveKategori(e.target.value); setCurrentPage(1); }}
                            className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-8 text-sm text-slate-700 outline-none transition focus:border-[#14a2ba] focus:bg-white focus:ring-4 focus:ring-[#14a2ba]/10"
                            aria-label="Filter kategori"
                        >
                            <option value="semua">Semua Kategori</option>
                            {kategoriOptions.map((k) => <option key={k} value={k}>{k}</option>)}
                        </select>
                    </div>

                    {/* Urutkan */}
                    <div className="relative shrink-0">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                            <HugeiconsIcon icon={SortByDown01Icon} size={15} strokeWidth={2} />
                        </span>
                        <select
                            value={sortBy}
                            onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                            className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-8 text-sm text-slate-700 outline-none transition focus:border-[#14a2ba] focus:bg-white focus:ring-4 focus:ring-[#14a2ba]/10"
                            aria-label="Urutkan"
                        >
                            {SORT_OPTIONS.map((opt) => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                        </select>
                    </div>

                    {/* Rentang Tanggal Pinjam */}
                    <div className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                        <HugeiconsIcon icon={Calendar03Icon} size={16} strokeWidth={2} className="shrink-0 text-slate-400" />
                        <input
                            type="date"
                            value={tanggalMulai}
                            onChange={(e) => { setTanggalMulai(e.target.value); setCurrentPage(1); }}
                            className="bg-transparent text-sm text-slate-600 outline-none"
                            aria-label="Tanggal pinjam mulai"
                        />
                        <span className="text-sm text-slate-400">-</span>
                        <input
                            type="date"
                            value={tanggalAkhir}
                            onChange={(e) => { setTanggalAkhir(e.target.value); setCurrentPage(1); }}
                            className="bg-transparent text-sm text-slate-600 outline-none"
                            aria-label="Tanggal pinjam akhir"
                        />
                    </div>

                    {/* Limit Baris Per Halaman */}
                    <div className="relative shrink-0">
                        <select
                            value={pageLimit}
                            onChange={(e) => handleLimitChange(Number(e.target.value))}
                            className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 pr-8 text-sm font-medium text-slate-700 outline-none transition focus:border-[#14a2ba] focus:bg-white focus:ring-4 focus:ring-[#14a2ba]/10"
                            aria-label="Jumlah baris per halaman"
                        >
                            {[15, 30, 50, 100, 150].map((opt) => (
                                <option key={opt} value={opt}>{opt} baris / hal</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* TABS FILTER STATUS */}
                <div className="mt-3 flex items-center gap-2 overflow-x-auto pt-0.5 pb-0.5">
                    {statusFilters.map((opt) => {
                        const active = statusFilter === opt.key;
                        return (
                            <button
                                key={opt.key}
                                type="button"
                                onClick={() => handleStatusFilterChange(opt.key)}
                                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${active ? 'bg-[#14a2ba] text-white shadow-sm shadow-[#14a2ba]/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                {opt.label}
                                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                    {opt.count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* TABLE */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {isLoading ? (
                    <div className="flex flex-col items-center gap-2 p-14 text-slate-400">
                        <HugeiconsIcon icon={Loading03Icon} size={22} strokeWidth={2} className="animate-spin text-[#14a2ba]" />
                        <span className="text-sm">Memuat data transaksi...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center gap-2 p-14 text-center">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-500">
                            <HugeiconsIcon icon={Alert02Icon} size={20} strokeWidth={1.75} />
                        </div>
                        <p className="text-sm text-red-500">{error}</p>
                        <button
                            onClick={() => fetchTransactions({ page: currentPage, status: statusFilter, kategori: activeKategori, search })}
                            className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-[#14a2ba] hover:text-[#14a2ba]"
                        >
                            <HugeiconsIcon icon={RefreshIcon} size={14} strokeWidth={2} />
                            Coba lagi
                        </button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 p-14 text-center text-slate-400">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                            <HugeiconsIcon icon={InboxIcon} size={20} strokeWidth={1.75} />
                        </div>
                        <p className="text-sm">Tidak ada transaksi yang cocok dengan pencarian atau filter ini.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/80 text-slate-500">
                                <tr>
                                    <th className="w-12 px-4 py-3 text-xs font-semibold uppercase tracking-wide">No</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">ID Transaksi</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Barang</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Peminjam</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Kategori</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Waktu Pinjam</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Waktu Kembali</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((t, index) => {
                                    const rowNumber = pagination
                                        ? (pagination.page - 1) * pagination.limit + index + 1
                                        : index + 1;
                                    return (
                                        <tr key={t.id} className="transition-colors hover:bg-slate-50/70">
                                            <td className="px-4 py-2.5 text-slate-500">{rowNumber}</td>
                                            <td className="px-4 py-2.5">
                                                <span className="inline-flex items-center font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                                                    #{t.id}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <div className="font-medium text-slate-800">{t.nama_barang}</div>
                                                <div className="font-mono text-xs text-slate-400">{t.sku}</div>
                                            </td>
                                            <td className="px-4 py-2.5 text-slate-600">{t.peminjam}</td>
                                            <td className="px-4 py-2.5 text-slate-600">{t.kategori}</td>
                                            <td className="px-4 py-2.5 text-slate-600">{formatTanggal(t.waktu_pinjam)}</td>
                                            <td className="px-4 py-2.5 text-slate-600">{formatTanggal(t.waktu_kembali)}</td>
                                            <td className="px-4 py-2.5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex items-center rounded-full py-1 px-2.5 text-xs font-semibold ring-1 ring-inset ${statusStyles(t.status)}`}>
                                                        <select
                                                            value={t.status}
                                                            disabled={processingId === t.id}
                                                            onChange={(e) => handleStatusChange(t, e.target.value)}
                                                            className="cursor-pointer border-0 bg-transparent text-xs font-semibold capitalize focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                        </select>
                                                    </span>
                                                    {processingId === t.id && (
                                                        <HugeiconsIcon icon={Loading03Icon} size={14} color="currentColor" strokeWidth={1.5} className="animate-spin text-[#14a2ba]" />
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* PAGINATION */}
            {!isLoading && !error && (
                <Pagination
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    onLimitChange={handleLimitChange}
                />
            )}
        </div>
    );
}