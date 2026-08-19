import { useState, useEffect, useCallback } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Search01Icon,
  BarCode01Icon,
  Cancel01Icon,
  PackageIcon,
  UserIcon,
  Clock01Icon,
  Tag01Icon,
  CheckmarkCircle01Icon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons';
import GagalMuatData from '../components/GagalMuatData';
import { ListCardSkeleton, SkeletonList } from '../components/ListCardSkeleton';
import Pagination from '../components/Pagination';
import { useImageViewer } from '../components/ImageViewer';

// ===== BRAND =====
const BRAND = '#14a2ba';
const BRAND_SOFT = '#e6f6f9';

function FontLoader() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
      .inv-font { font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }
    `}</style>
  );
}

// ===== STATUS CONFIG =====
const STATUS_CONFIG = {
  tersedia: {
    label: 'Tersedia',
    bgColor: '#f0fdf4',
    textColor: '#15803d',
    borderColor: '#bbf7d0',
  },
  dipinjam: {
    label: 'Sedang Dipinjam',
    bgColor: '#fffbeb',
    textColor: '#b45309',
    borderColor: '#fde68a',
  },
  rusak: {
    label: 'Rusak',
    bgColor: '#fef2f2',
    textColor: '#b91c1c',
    borderColor: '#fecaca',
  },
  hilang: {
    label: 'Hilang',
    bgColor: '#f8fafc',
    textColor: '#475569',
    borderColor: '#e2e8f0',
  },
};

const FALLBACK_STATUS = {
  label: 'Tidak diketahui',
  bgColor: '#f1f5f9',
  textColor: '#475569',
  borderColor: '#e2e8f0',
};

function getStatusConfig(status) {
  return STATUS_CONFIG[status] || FALLBACK_STATUS;
}

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
  { key: 'terbaru', label: 'Terbaru Ditambahkan' },
  { key: 'terlama', label: 'Terlama Ditambahkan' },
  { key: 'az', label: 'Nama A-Z' },
  { key: 'za', label: 'Nama Z-A' },
];

// ===== ITEM CARD (Versi Modern & Interactive) =====
function BarangCard({ item, onClick }) {
  const status = getStatusConfig(item.status);
  const { openViewer } = useImageViewer();

  const handleThumbnailClick = (e) => {
    if (item.gambar) {
      e.stopPropagation();
      const imgUrl = item.gambar.startsWith('http') ? item.gambar : `${import.meta.env.VITE_API_URL}${item.gambar}`;
      openViewer(imgUrl);
    }
  };

  return (
    <button
      className="group relative flex w-full items-center gap-3.5 rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-3 sm:p-4 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#14a2ba]/30 hover:shadow-md active:translate-y-0 active:scale-[0.99]"
      onClick={() => onClick(item)}
      type="button"
    >
      {/* Thumbnail */}
      <div
        className="group/thumb relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl sm:rounded-2xl bg-slate-100 ring-1 ring-slate-900/5 transition-all hover:ring-[#14a2ba]/40"
        onClick={handleThumbnailClick}
        title={item.gambar ? 'Klik untuk memperbesar gambar' : undefined}
      >
        {item.gambar ? (
          <>
            <img
              src={item.gambar.startsWith('http') ? item.gambar : `${import.meta.env.VITE_API_URL}${item.gambar}`}
              alt={item.nama}
              className="h-full w-full object-cover transition-transform duration-300 group-hover/thumb:scale-110"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity duration-200 group-hover/thumb:opacity-100">
              <HugeiconsIcon icon={Search01Icon} size={16} className="text-white drop-shadow-md" strokeWidth={2.5} />
            </div>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-slate-50 text-slate-400">
            <HugeiconsIcon icon={PackageIcon} size={24} strokeWidth={1.5} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm sm:text-base font-bold text-slate-900 transition-colors group-hover:text-[#14a2ba]">
            {item.nama}
          </p>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all duration-200 group-hover:bg-[#e6f6f9] group-hover:text-[#14a2ba] group-hover:translate-x-0.5">
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={2.5} />
          </div>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-500">
            <HugeiconsIcon icon={BarCode01Icon} size={11} strokeWidth={2} className="text-slate-400" />
            {item.sku}
          </span>
          {item.kategori && (
            <span className="inline-flex items-center rounded-md bg-slate-100/70 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
              {item.kategori}
            </span>
          )}
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
            style={{
              background: status.bgColor,
              color: status.textColor,
              border: `1px solid ${status.borderColor}`,
            }}
          >
            {status.label}
          </span>

          {item.status === 'dipinjam' && item.waktu_pinjam && (
            <span className="truncate text-[11px] font-medium text-slate-400">
              {item.waktu_pinjam}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ===== DETAIL MODAL =====
function DetailModal({ item, onClose }) {
  if (!item) return null;
  const status = getStatusConfig(item.status);
  const { openViewer } = useImageViewer();

  const imgUrl = item.gambar
    ? (item.gambar.startsWith('http') ? item.gambar : `${import.meta.env.VITE_API_URL}${item.gambar}`)
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full flex-col overflow-y-auto rounded-t-3xl bg-white pb-6 sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-slate-200 sm:hidden" />

        {/* Close button */}
        <button
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-md transition hover:bg-slate-100"
          onClick={onClose}
          type="button"
          aria-label="Tutup"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={2.5} />
        </button>

        {/* Thumbnail large */}
        <div
          className={`group relative mx-5 mt-5 shrink-0 overflow-hidden rounded-2xl bg-slate-100 ${imgUrl ? 'cursor-pointer' : ''}`}
          onClick={() => imgUrl && openViewer(imgUrl)}
        >
          {item.gambar ? (
            <>
              <img
                src={imgUrl}
                alt={item.nama}
                className="block w-full object-contain transition-transform duration-300 group-hover:scale-105"
                style={{ maxHeight: '70vh' }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <span className="rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-xs">
                  Klik untuk memperbesar
                </span>
              </div>
            </>
          ) : (
            <div className="flex h-40 w-full flex-col items-center justify-center gap-2 text-slate-400">
              <HugeiconsIcon icon={PackageIcon} size={32} strokeWidth={1.5} />
            </div>
          )}
        </div>

        {/* Header info */}
        <div className="mx-5 mt-5">
          <h2 className="text-xl font-bold leading-snug text-slate-900">{item.nama}</h2>
          <span
            className="mt-2 inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium"
            style={{
              background: status.bgColor,
              color: status.textColor,
              border: `1px solid ${status.borderColor}`,
            }}
          >
            {status.label}
          </span>
        </div>

        {/* Divider */}
        <div className="mx-5 my-5 h-px bg-slate-100" />

        {/* Detail rows */}
        <div className="mx-5 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: BRAND_SOFT, color: BRAND }}
            >
              <HugeiconsIcon icon={BarCode01Icon} size={18} strokeWidth={2} />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="text-xs text-slate-400">Stock Keeping Unit</span>
              <span className="truncate text-sm font-semibold text-slate-800">{item.sku}</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: BRAND_SOFT, color: BRAND }}
            >
              <HugeiconsIcon icon={Tag01Icon} size={18} strokeWidth={2} />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="text-xs text-slate-400">Kategori</span>
              <span className="truncate text-sm font-semibold text-slate-800">{item.kategori}</span>
            </div>
          </div>

          {item.status === 'dipinjam' && (
            <>
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: BRAND_SOFT, color: BRAND }}
                >
                  <HugeiconsIcon icon={UserIcon} size={18} strokeWidth={2} />
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="text-xs text-slate-400">Nama Peminjam</span>
                  <span className="truncate text-sm font-semibold text-slate-800">{item.peminjam || '—'}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: BRAND_SOFT, color: BRAND }}
                >
                  <HugeiconsIcon icon={Clock01Icon} size={18} strokeWidth={2} />
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="text-xs text-slate-400">Dipinjam Sejak</span>
                  <span className="truncate text-sm font-semibold text-slate-800">{item.waktu_pinjam || '—'}</span>
                </div>
              </div>
            </>
          )}

          {item.status === 'tersedia' && (
            <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} strokeWidth={2} />
              <p>Barang ini tersedia dan siap untuk dipinjam.</p>
            </div>
          )}
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
export default function Inventaris() {
  const [searchQuery, setSearchQuery]                   = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activeFilter, setActiveFilter]                 = useState('semua');
  const [activeKategori, setActiveKategori]             = useState('semua');
  const [sortBy, setSortBy]                             = useState('terbaru');
  const [filterSheetOpen, setFilterSheetOpen]           = useState(false);
  const [kategoriOptions, setKategoriOptions]           = useState([]);
  const [selectedItem, setSelectedItem]                 = useState(null);
  const [barangList, setBarangList]                     = useState([]);
  const [pagination, setPagination]                     = useState(null);
  const [currentPage, setCurrentPage]                   = useState(1);
  const [pageLimit, setPageLimit]                       = useState(15);
  const [globalSummary, setGlobalSummary]             = useState({ total: 0, tersedia: 0, dipinjam: 0, rusak: 0, hilang: 0 });
  const [filteredSummary, setFilteredSummary]         = useState({ total: 0, tersedia: 0, dipinjam: 0, rusak: 0, hilang: 0 });

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Debounce input search (500 ms) sebelum mengubah debouncedSearchQuery
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const buildUrl = useCallback((page) => {
    const params = new URLSearchParams({ page, limit: pageLimit });
    if (activeFilter !== 'semua') params.set('status', activeFilter);
    if (activeKategori !== 'semua') params.set('kategori', activeKategori);
    if (debouncedSearchQuery && debouncedSearchQuery.trim()) params.set('search', debouncedSearchQuery.trim());
    params.set('sortBy', sortBy);
    return `${import.meta.env.VITE_API_URL}/api/items?${params.toString()}`;
  }, [activeFilter, activeKategori, debouncedSearchQuery, sortBy, pageLimit]);

  const fetchItems = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildUrl(page), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Gagal mengambil data inventaris');
      }
      const data = await response.json();

      const mappedItems = (data.data || []).map(item => {
        let formattedDate = null;
        if (item.waktu_pinjam) {
          const dateObj = new Date(item.waktu_pinjam);
          formattedDate = dateObj.toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          });
        }

        return {
          ...item,
          nama: item.nama_barang,
          sku: item.qr_code,
          gambar: item.gambar_url,
          waktu_pinjam: formattedDate
        };
      });

      setBarangList(mappedItems);
      setPagination(data.pagination || null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  // Fetch global summary counts (unfiltered)
  const fetchGlobalSummary = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const statuses = ['tersedia', 'dipinjam', 'rusak', 'hilang'];
      const baseUrl = `${import.meta.env.VITE_API_URL}/api/items`;

      const [totalRes, ...statusRes] = await Promise.all([
        fetch(`${baseUrl}?page=1&limit=1`, { headers }),
        ...statuses.map((s) => fetch(`${baseUrl}?page=1&limit=1&status=${s}`, { headers })),
      ]);

      const [totalBody, ...statusBodies] = await Promise.all([
        totalRes.json(),
        ...statusRes.map((r) => r.json()),
      ]);

      setGlobalSummary({
        total: totalBody.pagination?.total ?? 0,
        tersedia: statusBodies[0].pagination?.total ?? 0,
        dipinjam: statusBodies[1].pagination?.total ?? 0,
        rusak: statusBodies[2].pagination?.total ?? 0,
        hilang: statusBodies[3].pagination?.total ?? 0,
      });
    } catch {
      // summary non-critical
    }
  }, []);

  // Fetch summary counts terfilter untuk tabs status filter (terfilter sesuai kategori & search)
  const fetchFilteredSummary = useCallback(async ({ kategori, search: q } = {}) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const statuses = ['tersedia', 'dipinjam', 'rusak', 'hilang'];
      const baseUrl = `${import.meta.env.VITE_API_URL}/api/items`;

      const buildSummaryParams = (status) => {
        const params = new URLSearchParams({ page: 1, limit: 1 });
        if (status   && status   !== 'semua') params.set('status',   status);
        if (kategori && kategori !== 'semua') params.set('kategori', kategori);
        if (q        && q.trim())             params.set('search',   q.trim());
        return params.toString();
      };

      const [totalRes, ...statusRes] = await Promise.all([
        fetch(`${baseUrl}?${buildSummaryParams()}`, { headers }),
        ...statuses.map((s) => fetch(`${baseUrl}?${buildSummaryParams(s)}`, { headers })),
      ]);

      const [totalBody, ...statusBodies] = await Promise.all([
        totalRes.json(),
        ...statusRes.map((r) => r.json()),
      ]);

      setFilteredSummary({
        total: totalBody.pagination?.total ?? 0,
        tersedia: statusBodies[0].pagination?.total ?? 0,
        dipinjam: statusBodies[1].pagination?.total ?? 0,
        rusak: statusBodies[2].pagination?.total ?? 0,
        hilang: statusBodies[3].pagination?.total ?? 0,
      });
    } catch {
      // summary non-critical
    }
  }, []);

  useEffect(() => {
    fetchItems(currentPage);
  }, [currentPage, activeFilter, activeKategori, debouncedSearchQuery, sortBy, pageLimit, fetchItems]);

  useEffect(() => {
    fetchGlobalSummary();
  }, [fetchGlobalSummary]);

  useEffect(() => {
    fetchFilteredSummary({
      kategori: activeKategori,
      search:   debouncedSearchQuery,
    });
  }, [activeKategori, debouncedSearchQuery, fetchFilteredSummary]);

  // Ambil daftar kategori unik sekali saja untuk isi dropdown filter
  useEffect(() => {
    const fetchKategori = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/items/kategori`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return;
        const data = await response.json();
        setKategoriOptions(data.data || []);
      } catch (err) {
        console.error('Gagal mengambil daftar kategori:', err);
      }
    };
    fetchKategori();
  }, []);

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

  const handleLimitChange = (newLimit) => {
    setPageLimit(newLimit);
    setCurrentPage(1);
  };

  const filters = [
    { key: 'semua', label: 'Semua', count: filteredSummary.total },
    { key: 'tersedia', label: 'Tersedia', count: filteredSummary.tersedia },
    { key: 'dipinjam', label: 'Sedang Dipinjam', count: filteredSummary.dipinjam },
    { key: 'rusak', label: 'Rusak', count: filteredSummary.rusak },
    { key: 'hilang', label: 'Hilang', count: filteredSummary.hilang },
  ];

  // ── Sort sudah dilakukan server-side — langsung pakai barangList ─────────
  const filteredBarang = barangList;

  const isFilterActive = activeKategori !== 'semua' || sortBy !== 'terbaru';

  const handleResetFilter = () => {
    setActiveKategori('semua');
    setSortBy('terbaru');
    setCurrentPage(1);
  };

  return (
    <div className="inv-font min-h-screen bg-white">
      <FontLoader />

      <div className="mx-auto w-full max-w-2xl px-4 pt-6 sm:px-6">
        {/* ===== HEADER ===== */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Inventaris</h1>
            <p className="mt-1 text-sm text-slate-500">{globalSummary.total} total barang terdaftar</p>
          </div>
        </div>

        {/* ===== SEARCH BAR + FILTER KATEGORI ===== */}
        <div className="mt-5 flex items-center gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
              <HugeiconsIcon icon={Search01Icon} size={17} strokeWidth={2} />
            </span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#14a2ba] focus:bg-white focus:ring-2 focus:ring-[#14a2ba]/15"
              type="text"
              placeholder="Cari nama atau SKU barang..."
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
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
          {filters.map((f) => {
            const active = activeFilter === f.key;
            return (
              <button
                key={f.key}
                className="flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition"
                style={
                  active
                    ? { backgroundColor: BRAND, color: '#fff' }
                    : { backgroundColor: '#f1f5f9', color: '#475569' }
                }
                onClick={() => handleFilterChange(f.key)}
                type="button"
              >
                {f.label}
                <span
                  className="rounded-full px-1.5 py-0.5 text-[11px] font-bold"
                  style={
                    active
                      ? { backgroundColor: 'rgba(255,255,255,0.25)', color: '#fff' }
                      : { backgroundColor: '#e2e8f0', color: '#64748b' }
                  }
                >
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ===== ITEM LIST ===== */}
        <div className="mt-5 flex flex-col gap-3">
          {loading ? (
            <SkeletonList count={6}>
              <ListCardSkeleton thumbnailSize={64} thumbnailShape="square" lines={2} showBadge />
            </SkeletonList>
          ) : error ? (
            <GagalMuatData onRetry={() => fetchItems(currentPage)} />
          ) : filteredBarang.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <HugeiconsIcon icon={PackageIcon} size={26} strokeWidth={1.5} />
              </div>
              <p className="text-sm font-semibold text-slate-700">Tidak ada barang ditemukan</p>
              <span className="text-xs text-slate-400">Coba ubah kata kunci atau filter</span>
            </div>
          ) : (
            filteredBarang.map((item) => (
              <BarangCard
                key={item.id}
                item={item}
                onClick={setSelectedItem}
              />
            ))
          )}

          {/* ===== PAGINATION ===== */}
          {!loading && !error && (
            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
            />
          )}

          <div className="h-20" />
        </div>
      </div>

      {/* ===== DETAIL MODAL ===== */}
      {selectedItem && (
        <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}

      {/* ===== FILTER & URUTKAN SHEET ===== */}
      <FilterSortSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        kategoriOptions={kategoriOptions}
        activeKategori={activeKategori}
        onKategoriChange={handleKategoriChange}
        sortBy={sortBy}
        onSortChange={(val) => { setSortBy(val); setCurrentPage(1); }}
        onReset={handleResetFilter}
      />
    </div>
  );
}