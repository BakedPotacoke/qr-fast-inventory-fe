import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Search01Icon,
    RefreshIcon,
    CheckmarkCircle02Icon,
    Alert02Icon,
    AlertCircleIcon,
    PackageIcon,
    InboxIcon,
    Loading03Icon,
    Calendar03Icon,
    FileDownloadIcon,
    Cancel01Icon,
    ImageNotFound01Icon,
    Tag01Icon,
    SortByDown01Icon,
} from '@hugeicons/core-free-icons';
import Pagination from '../../components/Pagination';
import StatCard from './components/StatCard';
import { useImageViewer } from '../../components/ImageViewer';
import { showToast } from '../../utils/alert';

const API_URL = `${import.meta.env.VITE_API_URL}/api/reports`;
// GET /api/reports/summary → { data: { total, bulan_ini, perlu_perhatian, breakdown: [{ jenis_laporan, jumlah }] } }
const SUMMARY_URL = `${API_URL}/summary`;
// GET /api/items/kategori → { data: string[] }
const CATEGORIES_URL = `${import.meta.env.VITE_API_URL}/api/items/kategori`;
const DEFAULT_PAGE_LIMIT = 15;

const SORT_OPTIONS = [
    { key: 'terbaru', label: 'Terbaru Dilaporkan' },
    { key: 'terlama', label: 'Terlama Dilaporkan' },
    { key: 'az', label: 'Nama Barang A-Z' },
    { key: 'za', label: 'Nama Barang Z-A' },
];

const formatTanggal = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

const KONDISI_STYLE = {
    baik: { label: 'Baik', icon: CheckmarkCircle02Icon, className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    rusak: { label: 'Rusak', icon: AlertCircleIcon, className: 'bg-amber-50 text-amber-700 ring-amber-200' },
    hilang: { label: 'Hilang', icon: Alert02Icon, className: 'bg-red-50 text-red-700 ring-red-200' },
};

// Buat & unduh file CSV dari array data laporan
const exportToCsv = (rows) => {
    const header = ['ID Laporan', 'Peminjam', 'Barang', 'Kategori', 'Kondisi', 'Keterangan', 'Waktu Pinjam', 'Waktu Kembali'];
    const body = rows.map((r) => [
        `#${r.id}`,
        r.peminjam, r.nama_barang, r.kategori,
        KONDISI_STYLE[r.jenis_laporan]?.label ?? r.jenis_laporan,
        r.keterangan,
        formatTanggal(r.waktu_pinjam), formatTanggal(r.waktu_kembali),
    ]);
    const csv = [header, ...body]
        .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\n');
    const fileName = `laporan-barang-${new Date().toISOString().slice(0, 10)}.csv`;

    // Android WebView: kirim via interface langsung (blob URL tidak bisa didownload)
    if (window.Android && typeof window.Android.downloadBase64 === 'function') {
        const b64 = btoa(unescape(encodeURIComponent('\uFEFF' + csv)));
        window.Android.downloadBase64('data:text/csv;base64,' + b64, fileName);
        return;
    }

    // Fallback: browser normal
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
};

export default function Laporan() {
    // ── Data halaman aktif (dipaginasi) ──────────────────────────────────────
    const [reports, setReports] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageLimit, setPageLimit] = useState(DEFAULT_PAGE_LIMIT);

    // ── Statistik & metadata global — bukan dari data halaman aktif ──────────
    // summary     → { total, bulan_ini, perlu_perhatian }
    // kondisiBreakdown → { baik, rusak, hilang } untuk tab filter counts
    const [summary, setSummary] = useState({ total: 0, bulan_ini: 0, perlu_perhatian: 0 });
    const [kondisiBreakdown, setKondisiBreakdown] = useState({ baik: 0, rusak: 0, hilang: 0 });

    // Daftar kategori dari endpoint khusus — tidak diekstrak dari data halaman
    const [kategoriOptions, setKategoriOptions] = useState([]);

    // ── UI state ─────────────────────────────────────────────────────────────
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [activeKondisi, setActiveKondisi] = useState('semua');
    const [activeKategori, setActiveKategori] = useState('semua');
    const [sortBy, setSortBy] = useState('terbaru');
    const { openViewer } = useImageViewer();
    const [tanggalMulai, setTanggalMulai] = useState('');
    const [tanggalAkhir, setTanggalAkhir] = useState('');

    const authHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
    };

    // ── Fetch ringkasan & breakdown kondisi global / terfilter ────────────────
    // Menyuplai stat cards dan jumlah per kondisi di tab filter — menyesuaikan dengan filter aktif.
    const fetchSummary = useCallback(async ({ kategori, search: q, tanggal_mulai: tm, tanggal_akhir: ta } = {}) => {
        try {
            const params = new URLSearchParams();
            if (kategori && kategori !== 'semua') params.set('kategori', kategori);
            if (q && q.trim()) params.set('search', q.trim());
            if (tm && tm.trim()) params.set('tanggal_mulai', tm.trim());
            if (ta && ta.trim()) params.set('tanggal_akhir', ta.trim());

            const res = await fetch(`${SUMMARY_URL}?${params}`, { headers: authHeaders() });
            const body = await res.json();
            if (!res.ok) return;

            const d = body.data || {};
            setSummary({
                total: d.total ?? 0,
                bulan_ini: d.bulan_ini ?? 0,
                perlu_perhatian: d.perlu_perhatian ?? 0,
            });

            // breakdown: [{ jenis_laporan: 'baik', jumlah: 50 }, ...]
            const map = {};
            (d.breakdown || []).forEach(({ jenis_laporan, jumlah }) => {
                map[jenis_laporan] = Number(jumlah);
            });
            setKondisiBreakdown({ baik: 0, rusak: 0, hilang: 0, ...map });
        } catch {
            // Statistik tidak kritis — gagal diam-diam
        }
    }, []);

    // ── Fetch daftar kategori unik ────────────────────────────────────────────
    // Dipanggil sekali saat mount. Tidak perlu di-reset saat filter berubah.
    const fetchKategori = useCallback(async () => {
        try {
            const res = await fetch(CATEGORIES_URL, { headers: authHeaders() });
            const body = await res.json();
            if (res.ok) setKategoriOptions(body.data || []);
        } catch {
            // Kategori tidak kritis — gagal diam-diam
        }
    }, []);

    // ── Fetch data halaman aktif ──────────────────────────────────────────────
    // Filter jenis_laporan, kategori, search, dan tanggal (mulai & akhir) dikirim sebagai query string ke server.
    // Client hanya bertanggung jawab untuk sorting data halaman aktif.
    const fetchReports = useCallback(async ({ page, limit, jenis_laporan, kategori, search: q, tanggal_mulai: tm, tanggal_akhir: ta, sortBy: s }) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ page, limit: limit || pageLimit });
            if (jenis_laporan && jenis_laporan !== 'semua') params.set('jenis_laporan', jenis_laporan);
            if (kategori && kategori !== 'semua') params.set('kategori', kategori);
            if (q && q.trim()) params.set('search', q.trim());
            if (tm && tm.trim()) params.set('tanggal_mulai', tm.trim());
            if (ta && ta.trim()) params.set('tanggal_akhir', ta.trim());
            params.set('sortBy', s || 'terbaru');

            const res = await fetch(`${API_URL}?${params}`, { headers: authHeaders() });
            const body = await res.json();
            if (!res.ok) throw new Error(body.message || 'Gagal memuat data laporan.');
            setReports(body.data || []);
            setPagination(body.pagination || null);
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

    // Fetch data saat currentPage, pageLimit, activeKondisi, activeKategori, debouncedSearch, filter tanggal, atau sortBy berubah
    useEffect(() => {
        fetchReports({
            page: currentPage,
            limit: pageLimit,
            jenis_laporan: activeKondisi,
            kategori: activeKategori,
            search: debouncedSearch,
            tanggal_mulai: tanggalMulai,
            tanggal_akhir: tanggalAkhir,
            sortBy,
        });
    }, [currentPage, pageLimit, activeKondisi, activeKategori, debouncedSearch, tanggalMulai, tanggalAkhir, sortBy, fetchReports]);

    // Fetch breakdown ringkasan saat activeKategori, debouncedSearch, atau filter tanggal berubah
    useEffect(() => {
        fetchSummary({
            kategori: activeKategori,
            search: debouncedSearch,
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

    // Ekspor CSV: ambil semua data dari server dengan filter server-side aktif (termasuk filter tanggal).
    const handleExportCsv = async () => {
        setIsExporting(true);
        try {
            const params = new URLSearchParams({ all: 'true' });
            if (activeKondisi !== 'semua') params.set('jenis_laporan', activeKondisi);
            if (activeKategori !== 'semua') params.set('kategori', activeKategori);
            if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
            if (tanggalMulai.trim()) params.set('tanggal_mulai', tanggalMulai.trim());
            if (tanggalAkhir.trim()) params.set('tanggal_akhir', tanggalAkhir.trim());
            params.set('sortBy', sortBy);

            const res = await fetch(`${API_URL}?${params}`, { headers: authHeaders() });
            const body = await res.json();
            if (!res.ok) throw new Error(body.message || 'Gagal mengambil data untuk ekspor.');
            exportToCsv(body.data || []);
            showToast.success('Data laporan berhasil diekspor.');
        } catch (err) {
            showToast.error(err.message || 'Gagal mengekspor data.');
        } finally {
            setIsExporting(false);
        }
    };

    // ── Sort sudah dilakukan server-side — langsung pakai reports ─────────────
    const filtered = reports;

    // ── Statistik dari API ringkasan global ───────────────────────────────────
    const stats = [
        { key: 'total', label: 'Total Laporan', value: summary.total, icon: PackageIcon, tone: 'primary' },
        { key: 'bulan-ini', label: 'Laporan Bulan Ini', value: summary.bulan_ini, icon: Calendar03Icon, tone: 'amber' },
        { key: 'perlu-perhatian', label: 'Kondisi Rusak/Hilang', value: summary.perlu_perhatian, icon: AlertCircleIcon, tone: 'red' },
    ];

    const totalFiltered = useMemo(() => {
        return kondisiBreakdown.baik + kondisiBreakdown.rusak + kondisiBreakdown.hilang;
    }, [kondisiBreakdown]);

    // Tab filter kondisi — jumlah dari breakdown kondisi yang telah difilter
    const kondisiFilters = useMemo(() => [
        { key: 'semua', label: 'Semua', count: totalFiltered },
        { key: 'baik', label: 'Baik', count: kondisiBreakdown.baik },
        { key: 'rusak', label: 'Rusak', count: kondisiBreakdown.rusak },
        { key: 'hilang', label: 'Hilang', count: kondisiBreakdown.hilang },
    ], [totalFiltered, kondisiBreakdown]);

    // Reset ke halaman 1 saat filter berubah
    const handleKondisiChange = (key) => { setActiveKondisi(key); setCurrentPage(1); };
    const handleKategoriChange = (e) => { setActiveKategori(e.target.value); setCurrentPage(1); };
    const handleSearchChange = (e) => { setSearch(e.target.value); }; // page reset handled by debounce effect

    return (
        <div>
            {/* HEADER & ACTIONS */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Laporan Barang</h1>
                    <p className="mt-1 text-sm text-slate-500">Rekap seluruh laporan kondisi barang dari pegawai</p>
                </div>
                <button
                    type="button"
                    onClick={handleExportCsv}
                    disabled={isExporting || summary.total === 0}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#14a2ba] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#14a2ba]/25 transition hover:bg-[#0f8298] active:scale-[0.98] disabled:opacity-50"
                >
                    <HugeiconsIcon icon={isExporting ? Loading03Icon : FileDownloadIcon} size={16} strokeWidth={2} className={isExporting ? 'animate-spin' : ''} />
                    {isExporting ? 'Mengekspor...' : 'Ekspor CSV'}
                </button>
            </div>

            {/* STAT CARDS */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {stats.map((s) => (
                    <StatCard key={s.key} {...s} />
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
                            placeholder="Cari ID laporan, nama barang, peminjam, atau kategori..."
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
                            onChange={handleKategoriChange}
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
                        <input type="date" value={tanggalMulai} onChange={(e) => { setTanggalMulai(e.target.value); setCurrentPage(1); }} className="bg-transparent text-sm text-slate-600 outline-none" aria-label="Tanggal pinjam mulai" />
                        <span className="text-sm text-slate-400">-</span>
                        <input type="date" value={tanggalAkhir} onChange={(e) => { setTanggalAkhir(e.target.value); setCurrentPage(1); }} className="bg-transparent text-sm text-slate-600 outline-none" aria-label="Tanggal pinjam akhir" />
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

                {/* TABS FILTER KONDISI */}
                <div className="mt-3 flex items-center gap-2 overflow-x-auto pt-0.5 pb-0.5">
                    {kondisiFilters.map((f) => {
                        const active = activeKondisi === f.key;
                        return (
                            <button
                                key={f.key}
                                type="button"
                                onClick={() => handleKondisiChange(f.key)}
                                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${active ? 'bg-[#14a2ba] text-white shadow-sm shadow-[#14a2ba]/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                {f.label}
                                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                    {f.count}
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
                        <span className="text-sm">Memuat data laporan...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center gap-2 p-14 text-center">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-500">
                            <HugeiconsIcon icon={Alert02Icon} size={20} strokeWidth={1.75} />
                        </div>
                        <p className="text-sm text-red-500">{error}</p>
                        <button
                            onClick={() => fetchReports({ page: currentPage, jenis_laporan: activeKondisi, kategori: activeKategori, search })}
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
                        <p className="text-sm">Belum ada laporan yang cocok dengan pencarian atau filter ini.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/80 text-slate-500">
                                <tr>
                                    <th className="w-12 px-4 py-3 text-xs font-semibold uppercase tracking-wide">No</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">ID Laporan</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Peminjam</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Barang</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Kategori</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Kondisi</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Keterangan</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Bukti Foto</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Waktu Pinjam</th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Waktu Kembali</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((r, index) => {
                                    const kondisi = KONDISI_STYLE[r.jenis_laporan] ?? {
                                        label: r.jenis_laporan ?? '-', icon: AlertCircleIcon,
                                        className: 'bg-slate-100 text-slate-600 ring-slate-200',
                                    };
                                    const rowNumber = pagination
                                        ? (pagination.page - 1) * pagination.limit + index + 1
                                        : index + 1;
                                    return (
                                        <tr key={r.id} className="transition-colors hover:bg-slate-50/70">
                                            <td className="px-4 py-2.5 text-slate-500">{rowNumber}</td>
                                            <td className="px-4 py-2.5">
                                                <span className="inline-flex items-center font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                                                    #{r.id}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 font-medium text-slate-800">{r.peminjam || '-'}</td>
                                            <td className="px-4 py-2.5">
                                                <div className="font-medium text-slate-800">{r.nama_barang || '-'}</div>
                                                <div className="font-mono text-xs text-slate-400">{r.qr_code}</div>
                                            </td>
                                            <td className="px-4 py-2.5 text-slate-600">{r.kategori || '-'}</td>
                                            <td className="px-4 py-2.5">
                                                <span className={`inline-flex items-center rounded-full py-1 px-3 text-xs font-semibold ring-1 ring-inset ${kondisi.className}`}>
                                                    {kondisi.label}
                                                </span>
                                            </td>
                                            <td className="max-w-[220px] px-4 py-2.5 text-slate-600">
                                                <span className="line-clamp-2">{r.keterangan || '-'}</span>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                {r.foto_url ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const src = r.foto_url.startsWith('http') || r.foto_url.startsWith('blob:')
                                                                ? r.foto_url
                                                                : `${import.meta.env.VITE_API_URL}${r.foto_url}`;
                                                            openViewer(src);
                                                        }}
                                                        className="group relative block h-12 w-12 overflow-hidden rounded-lg border border-slate-200 transition hover:border-[#14a2ba]"
                                                        aria-label="Lihat bukti foto"
                                                        title="Klik untuk lihat gambar penuh"
                                                    >
                                                        <img
                                                            src={
                                                                r.foto_url.startsWith('http') || r.foto_url.startsWith('blob:')
                                                                    ? r.foto_url
                                                                    : `${import.meta.env.VITE_API_URL}${r.foto_url}`
                                                            }
                                                            alt={`Bukti laporan ${r.nama_barang ?? ''}`}
                                                            className="h-full w-full object-cover transition group-hover:scale-105"
                                                        />
                                                    </button>
                                                ) : (
                                                    <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-slate-200 text-slate-300">
                                                        <HugeiconsIcon icon={ImageNotFound01Icon} size={18} strokeWidth={1.5} />
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5 text-slate-600">{formatTanggal(r.waktu_pinjam)}</td>
                                            <td className="px-4 py-2.5 text-slate-600">{formatTanggal(r.waktu_kembali)}</td>
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