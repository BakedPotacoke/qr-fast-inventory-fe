import { useState, useMemo, useEffect, useCallback } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Cancel01Icon,
  HistoryIcon,
  UserIcon,
  Clock01Icon,
  Calendar03Icon,
  BarCode01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Alert01Icon,
} from '@hugeicons/core-free-icons';

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
function TransaksiCard({ item, onClick }) {
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
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">Peminjam</span>
          <span className="text-sm font-semibold text-slate-700">{item.peminjam}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">Waktu Pinjam</span>
          <span className="text-sm font-semibold text-slate-700">{item.waktu_pinjam}</span>
        </div>
        <div className="col-span-2 flex flex-col gap-0.5 sm:col-span-1">
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
function DetailModal({ item, onClose }) {
  if (!item) return null;
  const status = STATUS_CONFIG[item.status];

  const rows = [
    { icon: BarCode01Icon, label: 'Stock Keeping Unit', value: item.sku },
    { icon: UserIcon, label: 'Peminjam', value: item.peminjam },
    { icon: Clock01Icon, label: 'Waktu Pinjam', value: item.waktu_pinjam },
    {
      icon: Calendar03Icon,
      label: 'Waktu Pengembalian',
      value: item.waktu_kembali_label,
      color: status.accent,
    },
  ];

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

// ===== MAIN COMPONENT =====
export default function Riwayat({ user }) {
  const [activeFilter, setActiveFilter] = useState('semua');
  const [toggleMyOnly, setToggleMyOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [transaksiList, setTransaksiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeMonthIndex, setActiveMonthIndex] = useState(0);

  const currentUserId = user?.id;
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

  const fetchRiwayat = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/transactions', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Gagal mengambil riwayat transaksi');
      }

      const data = await response.json();

      const formattedData = data.data.map((item) => ({
        ...item,
        raw_waktu_pinjam: item.waktu_pinjam,
        waktu_pinjam: formatTanggal(item.waktu_pinjam),
        waktu_kembali_label: item.status === 'dipinjam' ? '-' : formatTanggal(item.waktu_kembali),
      }));

      setTransaksiList(formattedData);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRiwayat();
  }, [fetchRiwayat]);

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
    { key: 'semua', label: 'Semua', count: transaksiList.length },
    {
      key: 'dipinjam',
      label: 'Sedang Dipinjam',
      count: transaksiList.filter((r) => r.status === 'dipinjam').length,
    },
    {
      key: 'selesai',
      label: 'Selesai',
      count: transaksiList.filter((r) => r.status === 'selesai').length,
    },
  ];

  const filteredData = useMemo(() => {
    return transaksiList.filter((item) => {
      const matchFilter = activeFilter === 'semua' || item.status === activeFilter;
      const matchUser = !toggleMyOnly || item.user_id === currentUserId;

      let matchMonth = true;
      if (activeMonthKey && item.raw_waktu_pinjam) {
        const d = new Date(item.raw_waktu_pinjam);
        const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        matchMonth = sortKey === activeMonthKey;
      }

      return matchFilter && matchUser && matchMonth;
    });
  }, [activeFilter, toggleMyOnly, currentUserId, transaksiList, isAdmin, activeMonthKey]);

  return (
    <div className="min-h-screen bg-white [font-family:'Plus_Jakarta_Sans',_sans-serif] antialiased">
      <div className="mx-auto w-full max-w-2xl px-4 pb-10 sm:px-6 lg:max-w-3xl lg:px-8">
        {/* ===== HEADER ===== */}
        <div className="pt-6 pb-5 sm:pt-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Riwayat Transaksi</h1>
          <p className="mt-1 text-sm text-slate-500">Riwayat peminjaman &amp; pengembalian alat kerja</p>
        </div>

        {/* ===== TOGGLE BAR ===== */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3.5">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="text-sm font-semibold">
              {toggleMyOnly ? 'Transaksi saya' : 'Semua transaksi'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setToggleMyOnly((v) => !v)}
            aria-label="Toggle tampilkan transaksi saya"
            role="switch"
            aria-checked={toggleMyOnly}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
              toggleMyOnly ? 'bg-[#14a2ba]' : 'bg-slate-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                toggleMyOnly ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
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
                onClick={() => setActiveFilter(f.key)}
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
            <>
              <div className="h-[140px] animate-pulse rounded-3xl bg-slate-100" />
              <div className="h-[140px] animate-pulse rounded-3xl bg-slate-100" />
            </>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-red-100 bg-red-50 px-6 py-10 text-center">
              <HugeiconsIcon icon={Alert01Icon} size={28} strokeWidth={2} className="text-red-500" />
              <p className="text-sm font-medium text-red-600">{error}</p>
              <button
                type="button"
                onClick={fetchRiwayat}
                className="mt-1 rounded-full bg-[#14a2ba] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0f7e91]"
              >
                Coba lagi
              </button>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <HugeiconsIcon icon={HistoryIcon} size={24} strokeWidth={2} />
              </div>
              <p className="text-sm font-bold text-slate-700">Tidak ada riwayat transaksi</p>
              <span className="text-xs text-slate-400">Coba ubah filter atau toggle</span>
            </div>
          ) : (
            filteredData.map((item) => (
              <TransaksiCard key={item.id} item={item} onClick={setSelectedItem} />
            ))
          )}
          <div className="h-16" />
        </div>
      </div>

      {/* ===== DETAIL MODAL ===== */}
      {selectedItem && <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
    </div>
  );
}