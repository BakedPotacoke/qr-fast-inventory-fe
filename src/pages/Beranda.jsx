import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  PackageIcon,
  QrCode01Icon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons';

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

// ===== ICONS (Hugeicons — stroke) =====
const IconBox = () => <HugeiconsIcon icon={PackageIcon} size={22} color="currentColor" strokeWidth={1.8} />;
const IconQR = () => <HugeiconsIcon icon={QrCode01Icon} size={24} color="currentColor" strokeWidth={1.8} />;
const IconArrow = () => <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="currentColor" strokeWidth={2.2} />;

// ===== MAIN COMPONENT =====
export default function Beranda({ user }) {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({ pinjaman: [], inventaris: { totalBarang: 0, sedangDipinjam: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sapaan = getSapaan();

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/dashboard/summary', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Gagal mengambil data dashboard');
      }
      const data = await response.json();
      setDashboardData(data);
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

  return (
    <>
      {/* ===== HEADER ===== */}
      <div className="main-header px-5 pt-6 pb-4">
        <div className="main-header-top flex items-center justify-between">
          <div className="main-header-user flex items-center gap-3">
            <AvatarIcon nama={user.nama_lengkap} />
            <div>
              <p className="main-greeting text-xs text-slate-500">{sapaan},</p>
              <p className="main-username text-base font-semibold text-slate-900">{user.nama_lengkap}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== BODY CONTENT ===== */}
      <div className="main-body px-5 space-y-6">

        {/* Scan QR Banner */}
        <button
          className="scan-banner w-full flex items-center gap-4 p-4 rounded-2xl bg-[#14a2ba] text-white shadow-sm hover:bg-[#0d8194] transition-colors active:scale-[0.99]"
          type="button"
          onClick={() => navigate('/scan')}
        >
          <div className="scan-banner-icon w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <IconQR />
          </div>
          <div className="scan-banner-text flex-1 text-left">
            <span className="scan-banner-title block text-sm font-semibold">Scan QR Code Barang</span>
            <span className="scan-banner-sub block text-xs text-white/80 mt-0.5">Pinjam atau kembalikan alat dengan satu scan</span>
          </div>
          <IconArrow />
        </button>

        {/* Sedang Kamu Pinjam */}
        <section className="main-section">
          <div className="section-header flex items-center justify-between mb-3">
            <h2 className="section-title text-base font-semibold text-slate-900">Sedang Kamu Pinjam</h2>
          </div>

          <div className="pinjaman-list space-y-3">
            {loading ? (
              <div className="loading-skeleton-card h-20 w-full rounded-xl bg-slate-100 animate-pulse" />
            ) : error ? (
              <div className="error-state flex flex-col items-center gap-2 p-5 rounded-xl bg-red-50 border border-red-200 text-center">
                <p className="error-text text-sm text-red-700">Gagal memuat data</p>
                <button
                  className="error-retry-btn text-xs font-semibold text-red-700 bg-white border border-red-300 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                  onClick={fetchDashboardData}
                  type="button"
                >
                  Coba lagi
                </button>
              </div>
            ) : dashboardData.pinjaman.length === 0 ? (
                            <p className="pinjaman-empty text-sm text-slate-500 text-center p-5 rounded-xl">
                Kamu tidak sedang meminjam barang apapun.
              </p>
            ) : (
              dashboardData.pinjaman.map((item) => (
                <div
                  className="pinjaman-card flex items-center justify-between gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm"
                  key={item.id}
                >
                  <div className="pinjaman-info flex items-center gap-3 min-w-0">
                    <div className="pinjaman-img w-12 h-12 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center overflow-hidden shrink-0">
                      {item.gambar
                        ? <img className="w-full h-full object-cover" src={item.gambar.startsWith('http') ? item.gambar : `http://localhost:5000${item.gambar}`} alt={item.nama_barang} />
                        : <IconBox />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="pinjaman-nama text-sm font-semibold text-slate-900 truncate">{item.nama_barang}</p>
                      <p className="pinjaman-kode text-xs text-slate-500 truncate">{item.kode} {item.kategori}</p>
                      <span className="pinjaman-status inline-flex items-center gap-1.5 text-xs text-[#0b6577] mt-1">
                        <span className="status-dot w-1.5 h-1.5 rounded-full bg-[#14a2ba]" /> {item.status}
                      </span>
                    </div>
                  </div>
                  <button
                    className="scan-return-btn inline-flex items-center gap-1.5 text-xs font-semibold text-[#14a2ba] bg-[#14a2ba]/10 hover:bg-[#14a2ba]/20 px-3 py-2 rounded-lg transition-colors shrink-0"
                    type="button"
                    onClick={() => navigate('/scan')}
                  >
                    <IconQR />
                    <span className="hidden sm:inline">Scan Pengembalian</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Ringkasan Inventaris */}
        <section className="main-section">
          <div className="section-header flex items-center justify-between mb-3">
            <h2 className="section-title text-base font-semibold text-slate-900">Ringkasan Inventaris</h2>
            <button
              className="section-link text-xs font-semibold text-[#14a2ba] hover:text-[#0d8194]"
              type="button"
              onClick={() => navigate('/inventaris')}
            >
              Lihat semua
            </button>
          </div>

          <div className="inventaris-grid grid grid-cols-2 gap-4">
            <div className="inventaris-card dark bg-[#12181C] text-white rounded-xl p-5 flex flex-col gap-1">
              {loading
                ? <span className="loading-skeleton-text h-7 w-10 rounded bg-white/15 animate-pulse" />
                : <span className="inv-number text-2xl font-semibold">{dashboardData.inventaris.totalBarang}</span>
              }
              <span className="inv-label text-xs text-white/70">Total Barang</span>
            </div>
            <div className="inventaris-card teal bg-[#14a2ba]/10 border border-[#14a2ba]/30 text-[#0b6577] rounded-xl p-5 flex flex-col gap-1">
              {loading
                ? <span className="loading-skeleton-text h-7 w-10 rounded bg-[#14a2ba]/20 animate-pulse" />
                : <span className="inv-number text-2xl font-semibold text-[#0b6577]">{dashboardData.inventaris.sedangDipinjam}</span>
              }
              <span className="inv-label text-xs text-[#0b6577]/70">Sedang Dipinjam</span>
            </div>
          </div>
        </section>

        {/* Spacer for bottom nav */}
        <div style={{ height: '80px' }} />
      </div>
    </>
  );
}