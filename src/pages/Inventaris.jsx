import { useState, useMemo, useEffect, useCallback } from 'react';
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
} from '@hugeicons/core-free-icons';
import GagalMuatData from '../components/GagalMuatData';
import { ListCardSkeleton, SkeletonList } from '../components/ListCardSkeleton';

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
    dotColor: '#16a34a',
    bgColor: '#f0fdf4',
    textColor: '#15803d',
    borderColor: '#bbf7d0',
  },
  dipinjam: {
    label: 'Sedang Dipinjam',
    dotColor: '#d97706',
    bgColor: '#fffbeb',
    textColor: '#b45309',
    borderColor: '#fde68a',
  },
  rusak: {
    label: 'Rusak',
    dotColor: '#dc2626',
    bgColor: '#fef2f2',
    textColor: '#b91c1c',
    borderColor: '#fecaca',
  },
  hilang: {
    label: 'Hilang',
    dotColor: '#64748b',
    bgColor: '#f8fafc',
    textColor: '#475569',
    borderColor: '#e2e8f0',
  },
};

const FALLBACK_STATUS = {
  label: 'Tidak diketahui',
  dotColor: '#94a3b8',
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

// ===== ITEM CARD (Versi Bersih untuk Pegawai) =====
function BarangCard({ item, onClick }) {
  const status = getStatusConfig(item.status);

  return (
    <button
      className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-left transition-all hover:border-slate-200 hover:shadow-sm active:scale-[0.99]"
      onClick={() => onClick(item)}
      type="button"
    >
      {/* Thumbnail */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
        {item.gambar ? (
          <img
            src={item.gambar.startsWith('http') ? item.gambar : `${import.meta.env.VITE_API_URL}${item.gambar}`}
            alt={item.nama}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-1 text-slate-400">
            <HugeiconsIcon icon={PackageIcon} size={22} strokeWidth={1.5} />
            <span className="max-w-full truncate text-[9px] font-medium">{item.kategori}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-slate-900">{item.nama}</p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
          <HugeiconsIcon icon={BarCode01Icon} size={12} strokeWidth={2} />
          {item.sku}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium"
            style={{
              background: status.bgColor,
              color: status.textColor,
              border: `1px solid ${status.borderColor}`,
            }}
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: status.dotColor }} />
            {status.label}
          </span>

          {item.status === 'dipinjam' && item.waktu_pinjam && (
            <span className="truncate text-[11px] text-slate-400">{item.waktu_pinjam}</span>
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
        <div className="relative mx-5 mt-5 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
          {item.gambar ? (
            <img
              src={item.gambar.startsWith('http') ? item.gambar : `${import.meta.env.VITE_API_URL}${item.gambar}`}
              alt={item.nama}
              className="block w-full object-contain"
              style={{ maxHeight: '70vh' }}
            />
          ) : (
            <div className="flex h-40 w-full flex-col items-center justify-center gap-2 text-slate-400">
              <HugeiconsIcon icon={PackageIcon} size={32} strokeWidth={1.5} />
              <span className="text-sm font-medium">{item.kategori}</span>
            </div>
          )}
        </div>

        {/* Header info */}
        <div className="mx-5 mt-5">
          <h2 className="text-xl font-bold leading-snug text-slate-900">{item.nama}</h2>
          <span
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
            style={{
              background: status.bgColor,
              color: status.textColor,
              border: `1px solid ${status.borderColor}`,
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: status.dotColor }} />
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
        <div className="mt-8 flex gap-3 px-5">
          <button
            type="button"
            onClick={onReset}
            className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl py-3 text-sm font-semibold text-white transition"
            style={{ backgroundColor: BRAND }}
          >
            Terapkan
          </button>
        </div>
      </div>
    </div>
  );
}
export default function Inventaris() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('semua');
  const [activeKategori, setActiveKategori] = useState('semua');
  const [sortBy, setSortBy] = useState('terbaru');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [kategoriOptions, setKategoriOptions] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [barangList, setBarangList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/items`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Gagal mengambil data inventaris');
      }
      const data = await response.json();

      const mappedItems = data.data.map(item => {
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
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

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

  const filters = [
    { key: 'semua', label: 'Semua', count: barangList.length },
    {
      key: 'tersedia',
      label: 'Tersedia',
      count: barangList.filter((b) => b.status === 'tersedia').length,
    },
    {
      key: 'dipinjam',
      label: 'Dipinjam',
      count: barangList.filter((b) => b.status === 'dipinjam').length,
    },
    {
      key: 'rusak',
      label: 'Rusak',
      count: barangList.filter((b) => b.status === 'rusak').length,
    },
    {
      key: 'hilang',
      label: 'Hilang',
      count: barangList.filter((b) => b.status === 'hilang').length,
    },
  ];

  const filteredBarang = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const result = barangList.filter((item) => {
      const matchSearch =
        item.nama.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query);
      const matchStatus =
        activeFilter === 'semua' || item.status === activeFilter;
      const matchKategori =
        activeKategori === 'semua' || item.kategori === activeKategori;
      return matchSearch && matchStatus && matchKategori;
    });

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'terlama':
          return a.id - b.id;
        case 'az':
          return a.nama.localeCompare(b.nama, 'id');
        case 'za':
          return b.nama.localeCompare(a.nama, 'id');
        case 'terbaru':
        default:
          return b.id - a.id;
      }
    });
  }, [searchQuery, activeFilter, activeKategori, sortBy, barangList]);

  const isFilterActive = activeKategori !== 'semua' || sortBy !== 'terbaru';

  const handleResetFilter = () => {
    setActiveKategori('semua');
    setSortBy('terbaru');
  };

  return (
    <div className="inv-font min-h-screen bg-white">
      <FontLoader />

      <div className="mx-auto w-full max-w-2xl px-4 pt-6 sm:px-6">
        {/* ===== HEADER ===== */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Inventaris</h1>
            <p className="mt-1 text-sm text-slate-500">{barangList.length} total barang terdaftar</p>
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
                onClick={() => setSearchQuery('')}
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
                onClick={() => setActiveFilter(f.key)}
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
            <GagalMuatData onRetry={fetchItems} />
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
        onKategoriChange={setActiveKategori}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onReset={handleResetFilter}
      />
    </div>
  );
}