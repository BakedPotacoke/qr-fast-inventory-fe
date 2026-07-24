import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Search01Icon,
  BarCode01Icon,
  Cancel01Icon,
  Add01Icon,
  Edit02Icon,
  Delete02Icon,
  ImageAdd02Icon,
  PackageIcon,
  UserIcon,
  Clock01Icon,
  Tag01Icon,
  CheckmarkCircle01Icon,
} from '@hugeicons/core-free-icons';

// ===== BRAND =====
// Warna utama aplikasi. Ganti di satu tempat ini jika brand color berubah.
const BRAND = '#14a2ba';
const BRAND_DARK = '#0e7f92';
const BRAND_SOFT = '#e6f6f9';

// Memuat font Plus Jakarta Sans dan menerapkannya ke seluruh halaman.
// Jika font ini sudah didaftarkan secara global (mis. di index.html),
// blok <style> ini aman untuk dihapus.
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

// Fallback aman kalau suatu saat ada nilai status yang belum terdaftar di STATUS_CONFIG
// (mis. data lama/korup) — mencegah halaman crash total, cukup tampil sebagai "Tidak diketahui".
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

// Status yang boleh diset manual lewat form Update Barang. "dipinjam" sengaja
// tidak dimasukkan karena status itu hanya boleh berubah lewat alur scan
// (supaya data di tabel transactions tetap konsisten dengan status barang).
const EDITABLE_STATUSES = ['tersedia', 'rusak', 'hilang'];

// ===== ITEM CARD =====
function BarangCard({ item, onClick, isEditMode, isSelected, onToggleSelect }) {
  const status = getStatusConfig(item.status);
  const isBorrowed = item.status === 'dipinjam';

  const handleClick = () => {
    if (isEditMode) {
      if (!isBorrowed) onToggleSelect(item.id);
    } else {
      onClick(item);
    }
  };

  return (
    <button
      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all active:scale-[0.99] ${isSelected
          ? 'ring-2'
          : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
        } ${isEditMode && isBorrowed ? 'opacity-50' : ''}`}
      style={
        isSelected
          ? { borderColor: BRAND, backgroundColor: BRAND_SOFT, boxShadow: `0 0 0 1px ${BRAND}` }
          : undefined
      }
      onClick={handleClick}
      type="button"
    >
      {/* Checkbox (hanya di mode edit) */}
      {isEditMode && (
        <div className="flex shrink-0 items-center justify-center pl-0.5">
          <input
            type="checkbox"
            checked={isSelected}
            readOnly
            disabled={isBorrowed}
            className="h-5 w-5 rounded-md border-2 border-slate-300 accent-[#14a2ba] disabled:opacity-40"
          />
        </div>
      )}

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

        {/* Thumbnail large — tinggi mengikuti rasio asli gambar */}
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

// Kelas input & label yang dipakai berulang di form Tambah/Update
const fieldLabelClass = 'mb-1.5 block text-xs font-semibold text-slate-600';
const fieldInputClass =
  'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:ring-2';

function getInputClass(hasError) {
  return `${fieldInputClass} ${hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-slate-200 focus:border-[#14a2ba] focus:ring-[#14a2ba]/15'
    }`;
}

// ===== SCANNER (QR & Barcode) UNTUK INPUT SKU =====
// Jangan batasi hanya format QR — aktifkan semua format QR & barcode yang
// didukung html5-qrcode. Ref: https://github.com/mebjas/html5-qrcode#scanning-only-specific-formats
const ALL_SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.AZTEC,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
  Html5QrcodeSupportedFormats.MAXICODE,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.PDF_417,
  Html5QrcodeSupportedFormats.RSS_14,
  Html5QrcodeSupportedFormats.RSS_EXPANDED,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
];

const SKU_SCANNER_ID = 'sku-scanner-viewport';

// Modal kecil untuk scan QR/Barcode lalu auto-fill ke input SKU manual.
function SkuScannerModal({ onClose, onDetected }) {
  const scannerRef = useRef(null);
  const hasDetectedRef = useRef(false);
  const [cameraError, setCameraError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      if (cancelled) return;
      const scanner = new Html5Qrcode(SKU_SCANNER_ID, {
        formatsToSupport: ALL_SUPPORTED_FORMATS,
        verbose: false,
      });
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            if (hasDetectedRef.current) return;
            hasDetectedRef.current = true;
            onDetected(decodedText);
          },
          () => { /* abaikan hasil scan gagal per-frame */ }
        );
      } catch (err) {
        setCameraError('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.');
        console.error(err);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      const scanner = scannerRef.current;
      if (scanner) {
        try {
          const state = scanner.getState();
          if (state === 2) {
            scanner.stop().catch(() => { });
          }
        } catch (_) { /* scanner belum siap / sudah berhenti */ }
      }
    };
  }, [onDetected]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-3xl bg-white p-5 sm:max-w-sm sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Scan QR / Barcode Barang</h3>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            onClick={onClose}
            aria-label="Tutup"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="relative mt-4 aspect-square overflow-hidden rounded-2xl bg-black">
          <div
            id={SKU_SCANNER_ID}
            className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
          />
          {!cameraError && (
            <div className="pointer-events-none absolute inset-6">
              <span className="absolute left-0 top-0 h-7 w-7 rounded-tl-xl border-l-4 border-t-4 border-[#14a2ba]" />
              <span className="absolute right-0 top-0 h-7 w-7 rounded-tr-xl border-r-4 border-t-4 border-[#14a2ba]" />
              <span className="absolute bottom-0 left-0 h-7 w-7 rounded-bl-xl border-b-4 border-l-4 border-[#14a2ba]" />
              <span className="absolute bottom-0 right-0 h-7 w-7 rounded-br-xl border-b-4 border-r-4 border-[#14a2ba]" />
            </div>
          )}
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900 px-6 text-center text-white">
              <HugeiconsIcon icon={BarCode01Icon} size={32} strokeWidth={1.5} />
              <p className="text-sm text-slate-200">{cameraError}</p>
            </div>
          )}
        </div>

        <p className="mt-3 text-center text-xs text-slate-400">
          Arahkan kamera ke QR Code atau barcode pada barang. Hasil scan akan otomatis mengisi kolom SKU.
        </p>
      </div>
    </div>
  );
}

// ===== TAMBAH BARANG MODAL (Admin Only) =====
function TambahModal({ onClose, onSave }) {
  const [form, setForm] = useState({ nama: '', sku: '', kategori: '' });
  const [gambarFile, setGambarFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const fileRef = useRef();

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: '' }));
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setGambarFile(file);
    setPreview(URL.createObjectURL(file));
  };

  // Auto-fill kolom SKU dari hasil scan QR/Barcode
  const handleScanDetected = (decodedText) => {
    setForm((f) => ({ ...f, sku: decodedText }));
    setErrors((er) => ({ ...er, sku: '' }));
    setShowScanner(false);
  };

  const validate = () => {
    const errs = {};
    if (!form.nama.trim()) errs.nama = 'Nama barang wajib diisi';
    if (!form.sku.trim()) errs.sku = 'ID / SKU wajib diisi';
    if (!form.kategori.trim()) errs.kategori = 'Kategori wajib diisi';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('nama_barang', form.nama.trim());
      // Baik hasil scan maupun input manual disimpan di form.sku,
      // sehingga payload yang dikirim ke backend selalu memakai field `qr_code`.
      formData.append('qr_code', form.sku.trim().toUpperCase());
      formData.append('kategori', form.kategori.trim());
      if (gambarFile) {
        formData.append('gambar', gambarFile);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData, // FormData doesn't need Content-Type header, fetch sets it with boundary
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Gagal menambahkan barang');
      }

      // Format data untuk disesuaikan dengan key lokal (nama, sku, gambar)
      const newItem = {
        ...data.data,
        nama: data.data.nama_barang,
        sku: data.data.qr_code,
        gambar: data.data.gambar_url,
      };

      onSave(newItem);
      onClose();
    } catch (err) {
      console.error(err);
      setErrors({ api: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full flex-col overflow-y-auto rounded-t-3xl bg-white sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">Tambah Barang Baru</h2>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            onClick={onClose}
            type="button"
            aria-label="Tutup"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={2.5} />
          </button>
        </div>

        <form className="flex flex-col gap-4 px-5 py-5" onSubmit={handleSubmit} noValidate>
          {errors.api && (
            <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
              {errors.api}
            </div>
          )}

          {/* Nama Barang */}
          <div>
            <label className={fieldLabelClass} htmlFor="tb-nama">Nama Barang</label>
            <input
              id="tb-nama"
              className={getInputClass(errors.nama)}
              type="text"
              placeholder="cth. Kamera Canon EOS R6"
              value={form.nama}
              onChange={handleChange('nama')}
              autoComplete="off"
            />
            {errors.nama && <span className="mt-1 block text-xs text-red-500">{errors.nama}</span>}
          </div>

          {/* SKU */}
          <div>
            <label className={fieldLabelClass} htmlFor="tb-sku">Stock Keeping Unit</label>
            <div className="flex items-stretch gap-2">
              <input
                id="tb-sku"
                className={`flex-1 ${getInputClass(errors.sku)}`}
                type="text"
                placeholder="cth. CAM-CR6-015 (ketik manual atau scan)"
                value={form.sku}
                onChange={handleChange('sku')}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 text-sm font-semibold text-slate-600 transition hover:border-[#14a2ba] hover:text-[#14a2ba]"
              >
                <HugeiconsIcon icon={BarCode01Icon} size={16} strokeWidth={2} />
                Scan
              </button>
            </div>
            {errors.sku && <span className="mt-1 block text-xs text-red-500">{errors.sku}</span>}
          </div>

          {/* Kategori */}
          <div>
            <label className={fieldLabelClass} htmlFor="tb-kategori">Kategori</label>
            <input
              id="tb-kategori"
              className={getInputClass(errors.kategori)}
              type="text"
              placeholder="cth. Kamera, Laptop, Audio"
              value={form.kategori}
              onChange={handleChange('kategori')}
              autoComplete="off"
            />
            {errors.kategori && <span className="mt-1 block text-xs text-red-500">{errors.kategori}</span>}
          </div>

          {/* Gambar */}
          <div>
            <label className={fieldLabelClass}>Foto Barang</label>
            <button
              className="flex h-40 w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition hover:border-[#14a2ba] hover:bg-[#14a2ba]/5"
              type="button"
              onClick={() => fileRef.current?.click()}
            >
              {preview ? (
                <img src={preview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <HugeiconsIcon icon={ImageAdd02Icon} size={26} strokeWidth={1.5} />
                  <span className="text-sm font-medium text-slate-500">Tap untuk pilih foto</span>
                  <span className="text-xs text-slate-400">JPG, PNG, WebP · Maks 5MB</span>
                </div>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFile}
            />
            {preview && (
              <button
                className="mt-2 text-xs font-semibold text-red-500 hover:text-red-600"
                type="button"
                onClick={() => { setGambarFile(null); setPreview(null); }}
              >
                Hapus foto
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="mt-2 flex gap-3">
            <button
              className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              type="button"
              onClick={onClose}
            >
              Batal
            </button>
            <button
              className="flex-1 rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-50"
              style={{ backgroundColor: BRAND }}
              type="submit"
              disabled={saving}
            >
              {saving ? 'Menyimpan...' : 'Simpan Barang'}
            </button>
          </div>
        </form>
      </div>

      {showScanner && (
        <div onClick={(e) => e.stopPropagation()}>
          <SkuScannerModal
            onClose={() => setShowScanner(false)}
            onDetected={handleScanDetected}
          />
        </div>
      )}
    </div>
  );
}

// ===== UPDATE BARANG MODAL =====
function UpdateModal({ item, onClose, onSave }) {
  const [form, setForm] = useState({ nama: item.nama, sku: item.sku, kategori: item.kategori, status: item.status });
  const [gambarFile, setGambarFile] = useState(null);
  const [preview, setPreview] = useState(item.gambar || null);
  const [removeGambar, setRemoveGambar] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const fileRef = useRef();

  // Auto-fill kolom SKU dari hasil scan QR/Barcode
  const handleScanDetected = (decodedText) => {
    setForm((f) => ({ ...f, sku: decodedText }));
    setErrors((er) => ({ ...er, sku: '' }));
    setShowScanner(false);
  };

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: '' }));
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setGambarFile(file);
    setPreview(URL.createObjectURL(file));
    setRemoveGambar(false);
  };

  const handleRemoveImage = () => {
    setGambarFile(null);
    setPreview(null);
    setRemoveGambar(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.nama.trim()) errs.nama = 'Nama barang wajib diisi';
    if (!form.sku.trim()) errs.sku = 'ID / SKU wajib diisi';
    if (!form.kategori.trim()) errs.kategori = 'Kategori wajib diisi';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('nama_barang', form.nama.trim());
      formData.append('qr_code', form.sku.trim().toUpperCase());
      formData.append('kategori', form.kategori.trim());

      // Status hanya dikirim kalau barang tidak sedang dipinjam — mencegah
      // perubahan tidak sengaja pada barang yang statusnya dikontrol via scan.
      if (item.status !== 'dipinjam') {
        formData.append('status', form.status);
      }

      if (gambarFile) {
        formData.append('gambar', gambarFile);
      } else if (removeGambar) {
        formData.append('remove_gambar', 'true');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengupdate barang');
      }

      const updatedItem = {
        ...item,
        nama: data.data.nama_barang || item.nama,
        sku: data.data.qr_code || item.sku,
        kategori: data.data.kategori || item.kategori,
        status: data.data.status || item.status,
      };

      if (data.data.gambar_url !== undefined) {
        updatedItem.gambar = data.data.gambar_url;
      }

      onSave(updatedItem);
    } catch (err) {
      console.error(err);
      setErrors({ api: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full flex-col overflow-y-auto rounded-t-3xl bg-white sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">Update Data Barang</h2>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            onClick={onClose}
            aria-label="Tutup"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={2.5} />
          </button>
        </div>

        <form className="flex flex-col gap-4 px-5 py-5" onSubmit={handleSubmit} noValidate>
          {errors.api && (
            <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
              {errors.api}
            </div>
          )}

          <div>
            <label className={fieldLabelClass}>Nama Barang</label>
            <input
              className={getInputClass(errors.nama)}
              type="text"
              value={form.nama}
              onChange={handleChange('nama')}
              autoComplete="off"
            />
            {errors.nama && <span className="mt-1 block text-xs text-red-500">{errors.nama}</span>}
          </div>

          <div>
            <label className={fieldLabelClass}>Stock Keeping Unit</label>
            <div className="flex items-stretch gap-2">
              <input
                className={`flex-1 ${getInputClass(errors.sku)}`}
                type="text"
                value={form.sku}
                onChange={handleChange('sku')}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 text-sm font-semibold text-slate-600 transition hover:border-[#14a2ba] hover:text-[#14a2ba]"
              >
                <HugeiconsIcon icon={BarCode01Icon} size={16} strokeWidth={2} />
                Scan
              </button>
            </div>
            {errors.sku && <span className="mt-1 block text-xs text-red-500">{errors.sku}</span>}
          </div>

          <div>
            <label className={fieldLabelClass}>Kategori</label>
            <input
              className={getInputClass(errors.kategori)}
              type="text"
              value={form.kategori}
              onChange={handleChange('kategori')}
              autoComplete="off"
            />
            {errors.kategori && <span className="mt-1 block text-xs text-red-500">{errors.kategori}</span>}
          </div>

          <div>
            <label className={fieldLabelClass}>Status Barang</label>
            {item.status === 'dipinjam' ? (
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-500">
                Barang sedang dipinjam. Status hanya bisa diubah lewat proses scan pengembalian.
              </p>
            ) : (
              <select
                className={getInputClass(false)}
                value={form.status}
                onChange={handleChange('status')}
              >
                {EDITABLE_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className={fieldLabelClass}>Foto Barang</label>
            <button
              type="button"
              className="flex h-40 w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition hover:border-[#14a2ba] hover:bg-[#14a2ba]/5"
              onClick={() => fileRef.current?.click()}
            >
              {preview ? (
                <img
                  src={preview.startsWith('http') || preview.startsWith('blob:') ? preview : `${import.meta.env.VITE_API_URL}${preview}`}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <HugeiconsIcon icon={ImageAdd02Icon} size={26} strokeWidth={1.5} />
                  <span className="text-sm font-medium text-slate-500">Tap untuk pilih foto</span>
                  <span className="text-xs text-slate-400">JPG, PNG, WebP · Maks 5MB</span>
                </div>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFile}
            />
            {preview && (
              <button
                type="button"
                className="mt-2 text-xs font-semibold text-red-500 hover:text-red-600"
                onClick={handleRemoveImage}
              >
                Hapus foto
              </button>
            )}
          </div>

          <div className="mt-2 flex gap-3">
            <button
              type="button"
              className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              onClick={onClose}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-50"
              style={{ backgroundColor: BRAND }}
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>

      {showScanner && (
        <div onClick={(e) => e.stopPropagation()}>
          <SkuScannerModal
            onClose={() => setShowScanner(false)}
            onDetected={handleScanDetected}
          />
        </div>
      )}
    </div>
  );
}

// ===== MAIN COMPONENT =====
export default function Inventaris({ user }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('semua');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showTambah, setShowTambah] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [barangList, setBarangList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State untuk mode edit dan bulk delete
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = user?.role === 'admin';

  const handleToggleSelect = (id) => {
    setSelectedForDelete(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedForDelete.length === 0) return;

    // Konfirmasi (opsional, tapi baik untuk UX)
    if (!window.confirm(`Yakin ingin menghapus ${selectedForDelete.length} barang?`)) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/items`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: selectedForDelete })
      });

      if (!response.ok) {
        throw new Error('Gagal menghapus barang');
      }

      // Hapus dari state lokal
      setBarangList(prev => prev.filter(b => !selectedForDelete.includes(b.id)));
      setSelectedForDelete([]);
      setIsEditMode(false);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

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

      // Remapping backend keys to frontend local keys
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

  const handleTambahSave = (newItem) => {
    setBarangList((prev) => [newItem, ...prev]);
  };

  const handleUpdateSave = (updatedItem) => {
    setBarangList((prev) => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    setItemToEdit(null);
    setIsEditMode(false);
    setSelectedForDelete([]);
  };

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
    return barangList.filter((item) => {
      const matchSearch =
        item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchFilter =
        activeFilter === 'semua' || item.status === activeFilter;
      return matchSearch && matchFilter;
    });
  }, [searchQuery, activeFilter, barangList]);

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

          {isAdmin && (
            <div className="flex shrink-0 items-center gap-2">
              {isEditMode ? (
                <>
                  <button
                    className="rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    type="button"
                    onClick={() => {
                      setIsEditMode(false);
                      setSelectedForDelete([]);
                    }}
                  >
                    Batal
                  </button>
                  <button
                    className="flex items-center gap-1.5 rounded-xl bg-red-500 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    type="button"
                    disabled={selectedForDelete.length === 0 || isDeleting}
                    onClick={handleBulkDelete}
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={15} strokeWidth={2.25} />
                    Hapus ({selectedForDelete.length})
                  </button>
                  <button
                    className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed"
                    type="button"
                    style={{
                      backgroundColor: selectedForDelete.length === 1 ? BRAND : '#e5e7eb',
                      color: selectedForDelete.length === 1 ? '#fff' : '#9ca3af',
                    }}
                    disabled={selectedForDelete.length !== 1}
                    onClick={() => {
                      const id = selectedForDelete[0];
                      const item = barangList.find((b) => b.id === id);
                      if (item) setItemToEdit(item);
                    }}
                  >
                    <HugeiconsIcon icon={Edit02Icon} size={15} strokeWidth={2.25} />
                    Edit
                  </button>
                </>
              ) : (
                <button
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  type="button"
                  onClick={() => setIsEditMode(true)}
                >
                  <HugeiconsIcon icon={Edit02Icon} size={15} strokeWidth={2.25} />
                  Pilih
                </button>
              )}
            </div>
          )}
        </div>

        {/* ===== SEARCH BAR ===== */}
        <div className="mt-5">
          <div className="relative">
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
            <>
              <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            </>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 py-14 text-center">
              <p className="text-sm text-slate-500">{error}</p>
              <button
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition"
                style={{ backgroundColor: BRAND }}
                onClick={fetchItems}
                type="button"
              >
                Coba lagi
              </button>
            </div>
          ) : filteredBarang.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <HugeiconsIcon icon={PackageIcon} size={26} strokeWidth={1.5} />
              </div>
              <p className="text-sm font-semibold text-slate-700">Tidak ada barang ditemukan</p>
              <span className="text-xs text-slate-400">Coba ubah kata kunci</span>
            </div>
          ) : (
            filteredBarang.map((item) => (
              <BarangCard
                key={item.id}
                item={item}
                onClick={setSelectedItem}
                isEditMode={isEditMode}
                isSelected={selectedForDelete.includes(item.id)}
                onToggleSelect={handleToggleSelect}
              />
            ))
          )}
          {/* Spacer for bottom nav */}
          <div className="h-20" />
        </div>
      </div>

      {/* ===== DETAIL MODAL ===== */}
      {selectedItem && (
        <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}

      {/* ===== TAMBAH MODAL (admin only) ===== */}
      {showTambah && (
        <TambahModal onClose={() => setShowTambah(false)} onSave={handleTambahSave} />
      )}

      {/* ===== UPDATE MODAL (admin only) ===== */}
      {itemToEdit && (
        <UpdateModal item={itemToEdit} onClose={() => setItemToEdit(null)} onSave={handleUpdateSave} />
      )}

      {/* ===== FLOATING ACTION BUTTON ===== */}
      {isAdmin && !isEditMode && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-20 flex justify-center">
          <div className="flex w-full max-w-2xl justify-end px-6">
            <button
              className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition hover:brightness-95 active:scale-95"
              style={{ backgroundColor: BRAND, boxShadow: `0 10px 25px -5px ${BRAND}66` }}
              onClick={() => setShowTambah(true)}
              type="button"
              aria-label="Tambah Barang"
            >
              <HugeiconsIcon icon={Add01Icon} size={24} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}