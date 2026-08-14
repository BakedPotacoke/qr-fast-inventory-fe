import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  PackageIcon,
  QrCode01Icon,
  ArrowRight01Icon,
  Alert01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Wrench01Icon,
  SearchRemoveIcon,
} from '@hugeicons/core-free-icons';
import headerBg from '../assets/header-bg.webp';
import GagalMuatData from '../components/GagalMuatData';
import { InlineCardSkeleton, SkeletonList } from '../components/ListCardSkeleton';

// ===== HELPER =====
function getSapaan() {
  const jam = new Date().getHours();
  if (jam >= 5 && jam < 12) return 'Selamat pagi';
  if (jam >= 12 && jam < 15) return 'Selamat siang';
  if (jam >= 15 && jam < 19) return 'Selamat sore';
  return 'Selamat malam';
}

function AvatarIcon({ nama }) {
  return (
    <div className="w-11 h-11 rounded-full bg-[#14a2ba] text-white flex items-center justify-center font-semibold text-base shrink-0">
      {nama?.charAt(0).toUpperCase() || 'U'}
    </div>
  );
}

function formatTanggalKembali(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ===== INVENTARIS STAT CARD =====
function InventarisStatCard({ icon, bgClass, value, label }) {
  return (
    <div className={`inventaris-card flex items-center justify-between gap-3 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-white ${bgClass}`}>
      <div className="min-w-0">
        <p className="inv-number text-xl sm:text-2xl font-bold leading-none">{value}</p>
        <p className="inv-label text-xs sm:text-sm font-medium text-white/85 mt-1.5">{label}</p>
      </div>
      <HugeiconsIcon icon={icon} size={29} color="#ffffff" strokeWidth={1.6} className="shrink-0" />
    </div>
  );
}

// ===== ICONS (Hugeicons — stroke) =====
const IconBox = () => <HugeiconsIcon icon={PackageIcon} size={22} color="currentColor" strokeWidth={1.8} />;
const IconQR = () => <HugeiconsIcon icon={QrCode01Icon} size={24} color="currentColor" strokeWidth={1.8} />;
const IconArrow = () => <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="currentColor" strokeWidth={2.2} />;

// ===== MODAL LAPOR BARANG HILANG =====
function LaporHilangModal({ item, onClose, onSuccess }) {
  const [keterangan, setKeterangan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!keterangan.trim()) {
      setError('Keterangan wajib diisi.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/items/${item.id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jenis_laporan: 'hilang', keterangan: keterangan.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal mengirim laporan.');
      }
      onSuccess(item.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={submitting ? undefined : onClose}
    >
      <div
        className="w-full rounded-t-3xl bg-white p-6 sm:max-w-sm sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
            <HugeiconsIcon icon={Alert01Icon} size={24} strokeWidth={1.8} />
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Tutup"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2.5} />
          </button>
        </div>

        <p className="mt-3 text-base font-bold text-slate-900">Laporkan Barang Hilang</p>
        <p className="mt-1 text-sm text-slate-500">
          Kamu akan melaporkan <span className="font-semibold text-slate-700">{item.nama_barang}</span> sebagai hilang.
        </p>

        <form className="mt-4" onSubmit={handleSubmit} noValidate>
          <label className="mb-1.5 block text-xs font-semibold text-slate-600" htmlFor="keterangan-hilang">
            Keterangan
          </label>
          <textarea
            id="keterangan-hilang"
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
            rows={3}
            placeholder="cth. Tertinggal di ruang rapat lantai 3, sudah dicari tapi tidak ketemu"
            value={keterangan}
            onChange={(e) => { setKeterangan(e.target.value); if (error) setError(null); }}
            disabled={submitting}
            autoFocus
          />
          {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-full border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-full bg-red-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Mengirim...' : 'Kirim Laporan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== MAIN COMPONENT =====
export default function Beranda({ user }) {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    pinjaman: [],
    riwayat: [],
    inventaris: { totalBarang: 0, tersedia: 0, sedangDipinjam: 0, jumlahRusak: 0, jumlahHilang: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [itemToReport, setItemToReport] = useState(null);
  const [reportedNotice, setReportedNotice] = useState(null);

  const sapaan = getSapaan();

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Gagal mengambil data dashboard');
      }
      const data = await response.json();
      // Fallback defensif: kalau backend mengembalikan bentuk yang tidak terduga,
      // jangan sampai field jadi undefined dan bikin .length meledak saat render.
      setDashboardData({
        pinjaman: data.pinjaman ?? [],
        riwayat: data.riwayat ?? [],
        inventaris: data.inventaris ?? { totalBarang: 0, tersedia: 0, sedangDipinjam: 0, jumlahRusak: 0, jumlahHilang: 0 },
      });
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleReportSuccess = (reportedItemId) => {
    // Barang yang dilaporkan hilang tidak lagi "sedang dipinjam", hapus dari daftar lokal
    setDashboardData((prev) => ({
      ...prev,
      pinjaman: prev.pinjaman.filter((p) => p.id !== reportedItemId),
    }));
    setItemToReport(null);
    setReportedNotice('Laporan berhasil dikirim. Terima kasih sudah melapor.');
    setTimeout(() => setReportedNotice(null), 4000);
    // Sinkronkan ulang ringkasan inventaris (jumlahHilang, tersedia, dsb.)
    fetchDashboardData();
  };

  return (
    <>
      {/* ===== HEADER (banner ilustrasi) ===== */}
      <div className="main-header relative h-28 overflow-hidden mb-4 sm:mb-5">
        <img
          src={headerBg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: '80% 45%' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-black/10" />

        <div className="relative z-10 flex h-full flex-col justify-end px-4 sm:px-5 py-3 sm:py-4">
          <div className="main-header-user flex items-center gap-3">
            <div className="rounded-full ring-2 ring-white/50">
              <AvatarIcon nama={user.nama_lengkap} />
            </div>
            <div>
              <p className="main-greeting text-sm sm:text-base font-semibold text-white">{sapaan},</p>
              <p className="main-username text-sm sm:text-base font-semibold text-white">{user.nama_lengkap}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== BODY CONTENT ===== */}
      <div className="main-body px-4 sm:px-5 space-y-5 sm:space-y-6">

        {/* Notifikasi setelah lapor berhasil */}
        {reportedNotice && (
          <div className="report-success-toast animate-in fade-in slide-in-from-top-4 duration-300 flex items-center gap-2 rounded-lg sm:rounded-xl bg-emerald-50 border border-emerald-200 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-emerald-700">
            {reportedNotice}
          </div>
        )}

      {/* Ringkasan Inventaris */}
        <section className="main-section">
          <div className="section-header flex items-center justify-between mb-2.5 sm:mb-3">
            <h2 className="section-title text-sm sm:text-base font-semibold text-slate-900">Ringkasan Inventaris</h2>
            <button
              className="section-link text-xs font-semibold text-[#14a2ba] hover:text-[#0d8194] transition-colors duration-200"
              type="button"
              onClick={() => navigate('/inventaris')}
            >
              Lihat semua
            </button>
          </div>

          {/* Hero card: Total Barang + breakdown bar */}
          <div className="inventaris-hero relative overflow-hidden rounded-lg sm:rounded-2xl bg-[#14a2ba] text-white p-4 sm:p-5 mb-3 sm:mb-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] sm:text-xs font-medium text-white/70 uppercase tracking-wide">Total Barang</span>
                <p className="inv-number text-2xl sm:text-3xl font-bold mt-1">{dashboardData.inventaris.totalBarang}</p>
              </div>
              <HugeiconsIcon icon={PackageIcon} size={33} color="currentColor" strokeWidth={1.6} className="shrink-0" />
            </div>

            {!loading && dashboardData.inventaris.totalBarang > 0 && (
              <>
                <div className="mt-4 flex h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                  <div className="h-full bg-emerald-300" style={{ width: `${(dashboardData.inventaris.tersedia / dashboardData.inventaris.totalBarang) * 100}%` }} />
                  <div className="h-full bg-blue-300" style={{ width: `${(dashboardData.inventaris.sedangDipinjam / dashboardData.inventaris.totalBarang) * 100}%` }} />
                  <div className="h-full bg-amber-300" style={{ width: `${(dashboardData.inventaris.jumlahRusak / dashboardData.inventaris.totalBarang) * 100}%` }} />
                  <div className="h-full bg-red-300" style={{ width: `${(dashboardData.inventaris.jumlahHilang / dashboardData.inventaris.totalBarang) * 100}%` }} />
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-[11px] text-white/75">
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />Tersedia</span>
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-blue-300" />Dipinjam</span>
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-300" />Rusak</span>
                  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-red-300" />Hilang</span>
                </div>
              </>
            )}
          </div>

          {/* Grid detail: Tersedia, Dipinjam, Rusak, Hilang */}
          <div className="inventaris-grid grid grid-cols-2 gap-3 sm:gap-4">
            <InventarisStatCard
              icon={CheckmarkCircle02Icon}
              bgClass="bg-emerald-500"
              value={dashboardData.inventaris.tersedia}
              label="Tersedia"
            />
            <InventarisStatCard
              icon={PackageIcon}
              bgClass="bg-blue-500"
              value={dashboardData.inventaris.sedangDipinjam}
              label="Dipinjam"
            />
            <InventarisStatCard
              icon={Wrench01Icon}
              bgClass="bg-amber-500"
              value={dashboardData.inventaris.jumlahRusak}
              label="Rusak"
            />
            <InventarisStatCard
              icon={SearchRemoveIcon}
              bgClass="bg-red-500"
              value={dashboardData.inventaris.jumlahHilang}
              label="Hilang"
            />
          </div>
        </section>

        {/* Scan QR Banner */}
        <button
          className="scan-banner w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-2xl bg-[#14a2ba] text-white shadow-sm hover:bg-[#0d8194] transition-all duration-200 active:scale-[0.99] hover:shadow-md"
          type="button"
          onClick={() => navigate('/scan')}
        >
          <div className="scan-banner-icon w-10 sm:w-11 h-10 sm:h-11 rounded-lg sm:rounded-xl bg-white/15 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
            <IconQR />
          </div>
          <div className="scan-banner-text flex-1 text-left">
            <span className="scan-banner-title block text-xs sm:text-sm font-semibold">Scan QR Code Barang</span>
            <span className="scan-banner-sub block text-xs text-white/80 mt-0.5">Pinjam atau kembalikan alat dengan satu scan</span>
          </div>
          <IconArrow />
        </button>

        {/* Sedang Kamu Pinjam */}
        <section className="main-section">
          <div className="section-header flex items-center justify-between mb-2.5 sm:mb-3">
            <h2 className="section-title text-sm sm:text-base font-semibold text-slate-900">Sedang Kamu Pinjam</h2>
          </div>

          <div className="pinjaman-list space-y-2 sm:space-y-3">
            {loading ? (
              <SkeletonList
                count={2}
                containerClassName="space-y-2 sm:space-y-3"
              >
                <InlineCardSkeleton
                  thumbnailSize={48}
                  lines={2}
                  actions={[
                    { width: 32, height: 32, borderRadius: 8 },
                    { width: 130, height: 32, borderRadius: 8 },
                  ]}
                  className="rounded-lg sm:rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-xs"
                />
              </SkeletonList>
            ) : error ? (
              <GagalMuatData onRetry={fetchDashboardData} />
            ) : dashboardData.pinjaman.length === 0 ? (
              <p className="pinjaman-empty text-xs sm:text-sm text-slate-500 text-center p-4 sm:p-5 rounded-lg sm:rounded-xl">
                Kamu tidak sedang meminjam barang apapun.
              </p>
            ) : (
              dashboardData.pinjaman.map((item) => (
                <div
                  className="pinjaman-card flex items-center justify-between gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white border border-slate-200 shadow-xs hover:shadow-sm transition-shadow duration-200"
                  key={item.id}
                >
                  <div className="pinjaman-info flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="pinjaman-img w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center overflow-hidden shrink-0 transition-transform duration-200">
                      {item.gambar
                        ? <img className="w-full h-full object-cover" src={item.gambar.startsWith('http') ? item.gambar : `${import.meta.env.VITE_API_URL}${item.gambar}`} alt={item.nama_barang} />
                        : <IconBox />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="pinjaman-nama text-xs sm:text-sm font-semibold text-slate-900 truncate">{item.nama_barang}</p>
                      <p className="pinjaman-kode text-xs text-slate-500 truncate">{item.kategori}</p>
                    </div>
                  </div>
                  <div className="pinjaman-actions flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <button
                      className="report-lost-btn flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg text-red-500 bg-red-50 hover:bg-red-100 transition-colors duration-200 active:scale-95"
                      type="button"
                      onClick={() => setItemToReport(item)}
                      aria-label={`Laporkan ${item.nama_barang} hilang`}
                      title="Laporkan hilang"
                    >
                      <HugeiconsIcon icon={Alert01Icon} size={17} strokeWidth={2} />
                    </button>
                    <button
                      className="scan-return-btn inline-flex items-center gap-1 sm:gap-1.5 text-xs font-semibold text-[#14a2ba] bg-[#14a2ba]/10 hover:bg-[#14a2ba]/20 px-2.5 sm:px-3 py-2 rounded-lg transition-colors duration-200 active:scale-95"
                      type="button"
                      onClick={() => navigate('/scan')}
                    >
                      <IconQR />
                      <span className="hidden sm:inline">Scan Pengembalian</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Terakhir Kamu Pinjam */}
        <section className="main-section">
          <div className="section-header flex items-center justify-between mb-2.5 sm:mb-3">
            <h2 className="section-title text-sm sm:text-base font-semibold text-slate-900">Terakhir Kamu Pinjam</h2>
          </div>

          <div className="riwayat-list space-y-2 sm:space-y-3">
            {loading ? (
              <SkeletonList
                count={2}
                containerClassName="space-y-2 sm:space-y-3"
              >
                <InlineCardSkeleton
                  thumbnailSize={48}
                  lines={2}
                  className="rounded-lg sm:rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-xs"
                />
              </SkeletonList>
            ) : error ? (
              <GagalMuatData onRetry={fetchDashboardData} />
            ) : dashboardData.riwayat.length === 0 ? (
              <p className="riwayat-empty text-xs sm:text-sm text-slate-500 text-center p-4 sm:p-5 rounded-lg sm:rounded-xl">
                Kamu belum pernah meminjam barang apapun.
              </p>
            ) : (
              dashboardData.riwayat.map((item) => (
                <div
                  className="riwayat-card relative flex items-center gap-3 p-3 sm:p-4 pr-16 sm:pr-20 rounded-lg sm:rounded-xl bg-white border border-slate-200 shadow-xs hover:shadow-sm transition-shadow duration-200"
                  key={item.transaction_id}
                >
                  <span className="riwayat-tanggal absolute top-2.5 right-3 sm:top-3 sm:right-4 text-[11px] sm:text-xs text-slate-400">
                    {formatTanggalKembali(item.waktu_kembali)}
                  </span>
                  <div className="riwayat-info flex flex-1 items-center gap-2 sm:gap-3 min-w-0">
                    <div className="riwayat-img w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center overflow-hidden shrink-0 transition-transform duration-200">
                      {item.gambar
                        ? <img className="w-full h-full object-cover" src={item.gambar.startsWith('http') ? item.gambar : `${import.meta.env.VITE_API_URL}${item.gambar}`} alt={item.nama_barang} />
                        : <IconBox />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="riwayat-nama text-xs sm:text-sm font-semibold text-slate-900 truncate">{item.nama_barang}</p>
                      <p className="riwayat-kode text-xs text-slate-500 truncate">{item.kategori}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Spacer for bottom nav */}
        <div style={{ height: '80px' }} />
      </div>

      {/* ===== MODAL LAPOR HILANG ===== */}
      {itemToReport && (
        <LaporHilangModal
          item={itemToReport}
          onClose={() => setItemToReport(null)}
          onSuccess={handleReportSuccess}
        />
      )}
    </>
  );
}