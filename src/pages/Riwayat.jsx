import { useState, useMemo, useEffect, useCallback } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Cancel01Icon,
  HistoryIcon,
  UserIcon,
  Calendar03Icon,
  BarCode01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Search01Icon,
  CheckmarkCircle01Icon,
} from '@hugeicons/core-free-icons';
import GagalMuatData from '../components/GagalMuatData';
import { TransactionCardSkeleton, SkeletonList } from '../components/ListCardSkeleton';
import Pagination from '../components/Pagination';

// ===== BRAND =====
const BRAND = '#14a2ba';
const BRAND_SOFT = '#e6f6f9';

// ===== ICON: FILTER (inline SVG, tidak bergantung pada paket ikon eksternal) =====
function FilterIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="8" cy="6" r="2" fill="white" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="12" r="2" fill="white" stroke="currentColor" strokeWidth="2" />
      <circle cx="10" cy="18" r="2" fill="white" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

// ===== OPSI URUTAN =====
const SORT_OPTIONS = [
  { key: 'terbaru', label: 'Waktu Pinjam Terbaru' },
  { key: 'terlama', label: 'Waktu Pinjam Terlama' },
  { key: 'az', label: 'Nama Barang A-Z' },
  { key: 'za', label: 'Nama Barang Z-A' },
];

// ===== STATUS CONFIG =====
// "dipinjam" dipetakan ke warna brand (#14a2ba) karena itu status aktif/utama,
// "selesai" tetap hijau sebagai warna semantik universal untuk selesai/berhasil.
const STATUS_CONFIG = {
  dipinjam: {
    label: 'Sedang Dipinjam',
    dot: 'bg-[#14a2ba]',
    badge: 'bg-[#e6f6f9] text-[#0d7e91] border-[#b9e6ec]',
    iconWrap: 'bg-[#e6f6f9] text-[#14a2ba]',
    icon: ArrowDown01Icon,
    accent: '#d97706',
    accentWeight: 700,
  },
  selesai: {
    label: 'Selesai',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconWrap: 'bg-emerald-50 text-emerald-600',
    icon: ArrowUp01Icon,
    accent: '#0f172a',
    accentWeight: 600,
  },
};

// ===== TRANSACTION CARD =====
function TransaksiCard({ item, onClick, isAdmin }) {
  const status = STATUS_CONFIG[item.status];

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className="w-full rounded-3xl border border-slate-100 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#14a2ba]/30 hover:shadow-md active:translate-y-0 sm:p-5"
    >
      {/* Top row: icon + nama + status badge */}
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${status.iconWrap}`}>
          <HugeiconsIcon icon={status.icon} size={20} strokeWidth={2} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900 sm:text-base">{item.nama_barang}</p>
          <p className="truncate text-xs text-slate-400">{item.sku}</p>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${status.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
      </div>

      {/* Divider */}
      <div className="my-4 h-px w-full bg-slate-100" />

      {/* Info grid */}
      <div className={`grid gap-x-4 gap-y-3 ${isAdmin ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'}`}>
        {isAdmin && (
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">Peminjam</span>
            <span className="text-sm font-semibold text-slate-700">{item.peminjam}</span>
          </div>
        )}
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">Waktu Pinjam</span>
          <span className="text-sm font-semibold text-slate-700">{item.waktu_pinjam}</span>
        </div>
        <div className={`flex flex-col gap-0.5 ${isAdmin ? 'col-span-2 sm:col-span-1' : ''}`}>
          <span className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">Pengembalian</span>
          <span
            className="text-sm font-bold"
            style={{ color: status.accent, fontWeight: status.accentWeight }}
          >
            {item.waktu_kembali_label}
          </span>
        </div>
      </div>
    </button>
  );
}

// ===== DETAIL MODAL =====
function DetailModal({ item, onClose, isAdmin }) {
  if (!item) return null;
  const status = STATUS_CONFIG[item.status];

  const allRows = [
    { icon: BarCode01Icon, label: 'Stock Keeping Unit', value: item.sku },
    { icon: UserIcon, label: 'Peminjam', value: item.peminjam, adminOnly: true },
    { icon: Calendar03Icon, label: 'Waktu Pinjam', value: item.waktu_pinjam },
    {
      icon: Calendar03Icon,
      label: 'Waktu Pengembalian',
      value: item.waktu_kembali_label,
      color: status.accent,
    },
  ];
  const rows = allRows.filter((r) => !r.adminOnly || isAdmin);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle (mobile only) */}
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200 sm:hidden" />

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute top-5 right-5 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={2.5} />
        </button>

        {/* Icon + header */}
        <div className="flex items-center gap-4">
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${status.iconWrap}`}>
            <HugeiconsIcon icon={status.icon} size={26} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-slate-900">{item.nama_barang}</h2>
            <span
              className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${status.badge}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>
        </div>

        <div className="my-5 h-px w-full bg-slate-100" />

        {/* Details */}
        <div className="flex flex-col gap-4">
          {rows.map((row) => (
            <div key={row.label} className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-[#14a2ba]">
                <HugeiconsIcon icon={row.icon} size={18} strokeWidth={2} />
              </div>
              <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
                <span className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">{row.label}</span>
                <span
                  className="text-sm font-semibold text-slate-800"
                  style={row.color ? { color: row.color } : undefined}
                >
                  {row.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== BOTTOM SHEET: FILTER & URUTKAN =====
function FilterSortSheet({
  open,
  onClose,
  kategoriOptions,
  activeKategori,
  onKategoriChange,
  sortBy,
  onSortChange,
  tanggalMulai,
  onTanggalMulaiChange,
  tanggalAkhir,
  onTanggalAkhirChange,
  onReset,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[85vh] w-full flex-col overflow-y-auto rounded-t-3xl bg-white pb-6 sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-slate-200 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="text-lg font-bold text-slate-900">Filter & Urutkan</h2>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
            onClick={onClose}
            type="button"
            aria-label="Tutup"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Urutkan */}
        <div className="mt-5 px-5">
          <p className="mb-3 text-sm font-semibold text-slate-700">Urutkan</p>
          <div className="flex flex-col gap-2">
            {SORT_OPTIONS.map((opt) => {
              const active = sortBy === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => onSortChange(opt.key)}
                  className="flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition"
                  style={
                    active
                      ? { borderColor: BRAND, background: BRAND_SOFT, color: BRAND }
                      : { borderColor: '#e2e8f0', background: '#fff', color: '#334155' }
                  }
                >
                  {opt.label}
                  {active && <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} strokeWidth={2} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Kategori */}
        <div className="mt-6 px-5">
          <p className="mb-3 text-sm font-semibold text-slate-700">Kategori</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onKategoriChange('semua')}
              className="rounded-full border px-4 py-2 text-sm font-medium transition"
              style={
                activeKategori === 'semua'
                  ? { backgroundColor: BRAND, color: '#fff', borderColor: BRAND }
                  : { backgroundColor: '#f8fafc', color: '#475569', borderColor: '#e2e8f0' }
              }
            >
              Semua Kategori
            </button>
            {kategoriOptions.map((k) => {
              const active = activeKategori === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => onKategoriChange(k)}
                  className="rounded-full border px-4 py-2 text-sm font-medium transition"
                  style={
                    active
                      ? { backgroundColor: BRAND, color: '#fff', borderColor: BRAND }
                      : { backgroundColor: '#f8fafc', color: '#475569', borderColor: '#e2e8f0' }
                  }
                >
                  {k}
                </button>
              );
            })}
          </div>
        </div>

        {/* Rentang Tanggal */}
        <div className="mt-6 px-5">
          <p className="mb-3 text-sm font-semibold text-slate-700">Tanggal Transaksi Peminjaman</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <HugeiconsIcon icon={Calendar03Icon} size={16} strokeWidth={2} className="shrink-0 text-slate-400" />
              <input
                type="date"
                value={tanggalMulai}
                onChange={(e) => onTanggalMulaiChange(e.target.value)}
                className="flex-1 bg-transparent text-sm text-slate-600 outline-none"
                aria-label="Tanggal pinjam mulai"
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <HugeiconsIcon icon={Calendar03Icon} size={16} strokeWidth={2} className="shrink-0 text-slate-400" />
              <input
                type="date"
                value={tanggalAkhir}
                onChange={(e) => onTanggalAkhirChange(e.target.value)}
                className="flex-1 bg-transparent text-sm text-slate-600 outline-none"
                aria-label="Tanggal pinjam akhir"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 px-5">
          <button
            type="button"
            onClick={onReset}
            className="w-full rounded-2xl py-3 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: BRAND }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== MAIN COMPONENT =====
export default function Riwayat({ user }) {
  const [activeFilter, setActiveFilter]                 = useState('semua');
  const [selectedItem, setSelectedItem]                 = useState(null);

  const [transaksiList, setTransaksiList]               = useState([]);
  const [pagination, setPagination]                     = useState(null);
  const [currentPage, setCurrentPage]                   = useState(1);
  const [loading, setLoading]                           = useState(true);
  const [error, setError]                               = useState(null);

  const [activeMonthIndex, setActiveMonthIndex]         = useState(0);

  // Filter & Search states
  const [searchQuery, setSearchQuery]                   = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activeKategori, setActiveKategori]             = useState('semua');
  const [sortBy, setSortBy]                             = useState('terbaru');
  const [filterSheetOpen, setFilterSheetOpen]           = useState(false);
  const [kategoriOptions, setKategoriOptions]           = useState([]);
  const [summary, setSummary]                           = useState({ total: 0, dipinjam: 0, selesai: 0 });
  const [tanggalMulai, setTanggalMulai]                 = useState('');
  const [tanggalAkhir, setTanggalAkhir]                 = useState('');

  const isAdmin = user?.role === 'admin';

  const formatTanggal = (isoString) => {
    if (!isoString) return null;
    const dateObj = new Date(isoString);
    return dateObj
      .toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
      .replace(',', ' ·');
  };

  // Debounce input search (500 ms) sebelum mengubah debouncedSearchQuery
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const buildUrl = useCallback((page) => {
    const params = new URLSearchParams({ page, limit: 15 });
    if (activeFilter !== 'semua') params.set('status', activeFilter);
    if (activeKategori !== 'semua') params.set('kategori', activeKategori);
    if (debouncedSearchQuery && debouncedSearchQuery.trim()) params.set('search', debouncedSearchQuery.trim());
    if (sortBy && sortBy !== 'terbaru') params.set('sortBy', sortBy);
    if (tanggalMulai && tanggalMulai.trim()) params.set('tanggal_mulai', tanggalMulai.trim());
    if (tanggalAkhir && tanggalAkhir.trim()) params.set('tanggal_akhir', tanggalAkhir.trim());

    const endpoint = isAdmin
      ? `${import.meta.env.VITE_API_URL}/api/transactions`
      : `${import.meta.env.VITE_API_URL}/api/transactions/me`;

    return `${endpoint}?${params.toString()}`;
  }, [activeFilter, activeKategori, debouncedSearchQuery, sortBy, tanggalMulai, tanggalAkhir, isAdmin]);

  const fetchRiwayat = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildUrl(page), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Gagal mengambil riwayat transaksi');
      }

      const data = await response.json();

      const formattedData = (data.data || []).map((item) => ({
        ...item,
        raw_waktu_pinjam: item.waktu_pinjam,
        waktu_pinjam: formatTanggal(item.waktu_pinjam),
        waktu_kembali_label: item.status === 'dipinjam' ? '-' : formatTanggal(item.waktu_kembali),
      }));

      setTransaksiList(formattedData);
      setPagination(data.pagination || null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  // Fetch summary total per status (global & terfilter)
  const fetchSummary = useCallback(async ({ kategori, search: q, tanggal_mulai: tm, tanggal_akhir: ta } = {}) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (kategori && kategori !== 'semua') params.set('kategori', kategori);
      if (q        && q.trim())             params.set('search',        q.trim());
      if (tm       && tm.trim())            params.set('tanggal_mulai', tm.trim());
      if (ta       && ta.trim())            params.set('tanggal_akhir', ta.trim());

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/transactions/summary?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.data) {
        setSummary({
          total:             data.data.total || 0,
          dipinjam:          data.data.dipinjam || 0,
          selesai:           data.data.selesai || 0,
          filtered_total:    data.data.filtered_total    ?? data.data.total    ?? 0,
          filtered_dipinjam: data.data.filtered_dipinjam ?? data.data.dipinjam ?? 0,
          filtered_selesai:  data.data.filtered_selesai  ?? data.data.selesai  ?? 0,
        });
      }
    } catch {
      // non-critical
    }
  }, []);

  // Fetch daftar kategori unik untuk filter
  useEffect(() => {
    const fetchKategori = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/items/kategori`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const body = await res.json();
        setKategoriOptions(body.data || []);
      } catch (err) {
        console.error('Gagal mengambil kategori:', err);
      }
    };
    fetchKategori();
  }, []);

  useEffect(() => {
    fetchRiwayat(currentPage);
  }, [currentPage, activeFilter, activeKategori, debouncedSearchQuery, fetchRiwayat]);

  // Fetch summary terfilter saat activeKategori, debouncedSearchQuery, atau tanggal berubah
  useEffect(() => {
    fetchSummary({
      kategori:      activeKategori,
      search:        debouncedSearchQuery,
      tanggal_mulai: tanggalMulai,
      tanggal_akhir: tanggalAkhir,
    });
  }, [activeKategori, debouncedSearchQuery, tanggalMulai, tanggalAkhir, fetchSummary]);

  const handleFilterChange = (key) => {
    setActiveFilter(key);
    setCurrentPage(1);
  };

  const handleKategoriChange = (kategori) => {
    setActiveKategori(kategori);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const monthData = useMemo(() => {
    const monthsMap = new Map();
    transaksiList.forEach((item) => {
      if (!item.raw_waktu_pinjam) return;
      const d = new Date(item.raw_waktu_pinjam);
      const monthStr = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthsMap.has(sortKey)) {
        monthsMap.set(sortKey, monthStr);
      }
    });
    const sortedKeys = Array.from(monthsMap.keys()).sort().reverse();
    return sortedKeys.map((key) => ({
      key,
      label: monthsMap.get(key),
    }));
  }, [transaksiList]);

  useEffect(() => {
    if (activeMonthIndex >= monthData.length && monthData.length > 0) {
      setActiveMonthIndex(0);
    }
  }, [monthData, activeMonthIndex]);

  const activeMonthKey = monthData[activeMonthIndex]?.key;

  const filters = [
    { key: 'semua', label: 'Semua', count: summary.filtered_total ?? summary.total },
    { key: 'dipinjam', label: 'Sedang Dipinjam', count: summary.filtered_dipinjam ?? summary.dipinjam },
    { key: 'selesai', label: 'Selesai', count: summary.filtered_selesai ?? summary.selesai },
  ];

  const filteredData = useMemo(() => {
    const result = transaksiList.filter((item) => {
      let matchMonth = true;
      if (activeMonthKey && item.raw_waktu_pinjam) {
        const d = new Date(item.raw_waktu_pinjam);
        const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        matchMonth = sortKey === activeMonthKey;
      }
      return matchMonth;
    });

    return result;
  }, [transaksiList, activeMonthKey]);

  const isFilterActive = activeKategori !== 'semua' || sortBy !== 'terbaru' || !!tanggalMulai || !!tanggalAkhir;

  const handleResetFilter = () => {
    setActiveKategori('semua');
    setSortBy('terbaru');
    setTanggalMulai('');
    setTanggalAkhir('');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-white [font-family:'Plus_Jakarta_Sans',_sans-serif] antialiased">
      <div className="mx-auto w-full max-w-2xl px-4 pb-10 sm:px-6 lg:max-w-3xl lg:px-8">
        {/* ===== HEADER ===== */}
        <div className="pt-6 pb-5 sm:pt-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {isAdmin ? 'Riwayat Transaksi' : 'Riwayat Peminjaman Saya'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isAdmin
              ? 'Riwayat peminjaman & pengembalian alat kerja'
              : 'Riwayat peminjaman & pengembalian barang Anda'}
          </p>
        </div>

        {/* ===== SEARCH BAR + TOMBOL FILTER ===== */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
              <HugeiconsIcon icon={Search01Icon} size={17} strokeWidth={2} />
            </span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#14a2ba] focus:bg-white focus:ring-2 focus:ring-[#14a2ba]/15"
              type="text"
              placeholder={isAdmin ? 'Cari nama barang, SKU, atau peminjam...' : 'Cari nama atau SKU barang...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-slate-600"
                onClick={() => { setSearchQuery(''); setDebouncedSearchQuery(''); setCurrentPage(1); }}
                type="button"
                aria-label="Hapus pencarian"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Tombol Filter & Urutkan */}
          <button
            type="button"
            onClick={() => setFilterSheetOpen(true)}
            className="relative flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-slate-300 hover:bg-white"
            aria-label="Buka filter dan urutan"
          >
            <FilterIcon size={18} />
            {isFilterActive && (
              <span
                className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white"
                style={{ backgroundColor: BRAND }}
              />
            )}
          </button>
        </div>

        {/* ===== FILTER TABS ===== */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filters.map((f) => {
            const active = activeFilter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => handleFilterChange(f.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
                  active ? 'bg-[#14a2ba] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                    active ? 'bg-white/20 text-white' : 'bg-white text-slate-500'
                  }`}
                >
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ===== MONTH NAVIGATION ===== */}
        {monthData.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
              {monthData[activeMonthIndex].label}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={activeMonthIndex === monthData.length - 1}
                onClick={() => setActiveMonthIndex((i) => i + 1)}
                aria-label="Bulan sebelumnya"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-[#14a2ba]/40 hover:text-[#14a2ba] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                disabled={activeMonthIndex === 0}
                onClick={() => setActiveMonthIndex((i) => i - 1)}
                aria-label="Bulan berikutnya"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-[#14a2ba]/40 hover:text-[#14a2ba] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500"
              >
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}

        {/* ===== TRANSACTION LIST ===== */}
        <div className="mt-4 flex flex-col gap-3">
          {loading ? (
            <SkeletonList count={4}>
              <TransactionCardSkeleton columns={isAdmin ? 3 : 2} />
            </SkeletonList>
          ) : error ? (
            <GagalMuatData onRetry={() => fetchRiwayat(currentPage)} />
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <HugeiconsIcon icon={HistoryIcon} size={24} strokeWidth={2} />
              </div>
              <p className="text-sm font-bold text-slate-700">Tidak ada riwayat transaksi</p>
              <span className="text-xs text-slate-400">Coba ubah kata kunci, filter, atau periode bulan</span>
            </div>
          ) : (
            filteredData.map((item) => (
              <TransaksiCard key={item.id} item={item} onClick={setSelectedItem} isAdmin={isAdmin} />
            ))
          )}

          {/* ===== PAGINATION ===== */}
          {!loading && !error && (
            <Pagination pagination={pagination} onPageChange={handlePageChange} />
          )}

          <div className="h-16" />
        </div>
      </div>

      {/* ===== DETAIL MODAL ===== */}
      {selectedItem && <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} isAdmin={isAdmin} />}

      {/* ===== FILTER & URUTKAN SHEET ===== */}
      <FilterSortSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        kategoriOptions={kategoriOptions}
        activeKategori={activeKategori}
        onKategoriChange={handleKategoriChange}
        sortBy={sortBy}
        onSortChange={(val) => { setSortBy(val); setCurrentPage(1); }}
        tanggalMulai={tanggalMulai}
        onTanggalMulaiChange={(val) => { setTanggalMulai(val); setCurrentPage(1); }}
        tanggalAkhir={tanggalAkhir}
        onTanggalAkhirChange={(val) => { setTanggalAkhir(val); setCurrentPage(1); }}
        onReset={handleResetFilter}
      />
    </div>
  );
}