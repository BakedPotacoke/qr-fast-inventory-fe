import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
// html5-qrcode TIDAK diimpor di sini lagi.
// Library ini (~300KB) akan di-import secara dinamis di dalam startScanner()
// sehingga hanya diunduh dan di-parse saat kamera benar-benar diaktifkan,
// bukan saat halaman /scan pertama kali dirender.
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
  CancelCircleIcon,
  Camera01Icon,
  Alert01Icon,
  Tick01Icon,
  FlashlightIcon,
  FlashlightOffIcon,
} from "@hugeicons/core-free-icons";

const SCANNER_ID = "qrfast-scanner-viewport";

// ===== Utility: overlay timestamp ke foto via Canvas =====
async function overlayTimestampToBlob(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      // Timestamp teks
      const now = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const ts = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      const fontSize = Math.max(14, Math.round(canvas.width * 0.025));
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";

      // Shadow supaya terbaca di background apapun
      const padding = Math.round(fontSize * 0.6);
      const x = canvas.width - padding;
      const y = canvas.height - padding;

      ctx.shadowColor = "rgba(0,0,0,0.85)";
      ctx.shadowBlur = 6;
      ctx.fillStyle = "#ffffff";
      ctx.fillText(ts, x, y);
      ctx.shadowBlur = 0;

      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob gagal"));
        },
        "image/jpeg",
        0.92
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ===== MODAL FORM PENGEMBALIAN BARANG =====
function PengembalianFormModal({ confirmState, onCancel, onSubmit, submitting, submitError }) {
  const [isRusak, setIsRusak] = useState(false);
  const [keterangan, setKeterangan] = useState("");
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const fotoInputRef = useRef(null);

  // Bersihkan object URL saat komponen unmount
  useEffect(() => {
    return () => {
      if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    };
  }, [fotoPreview]);

  const handleFotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fotoFile) return;
    if (isRusak && !keterangan.trim()) return;
    onSubmit({
      kondisi: isRusak ? "rusak" : "baik",
      keterangan: isRusak ? keterangan.trim() : "",
      fotoFile,
    });
  };

  const canSubmit = fotoFile && (!isRusak || keterangan.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="w-full max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-white sm:max-w-sm sm:rounded-3xl">
        {/* Header */}
        <div className="sticky top-0 z-10 rounded-t-3xl bg-white px-6 pt-5 pb-3 sm:rounded-3xl">
          <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-bold text-slate-900 leading-tight">
                {confirmState.barang?.nama_barang}
              </p>
              {confirmState.durasi_pinjam && (
                <p className="text-xs text-slate-400 mt-0.5">Dipinjam selama {confirmState.durasi_pinjam}</p>
              )}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#14a2ba]/10 text-[#14a2ba] flex-shrink-0 ml-3">
              <HugeiconsIcon icon={Alert01Icon} size={20} strokeWidth={1.5} />
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-500">Isi form berikut untuk menyelesaikan pengembalian.</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-2 space-y-5">

          {/* ── Error banner ── */}
          {submitError && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-3.5 py-2.5 text-center text-sm text-red-600">
              {submitError}
            </div>
          )}

          {/* ── Checkbox kondisi rusak ── */}
          <label
            htmlFor="checkbox-rusak"
            className={`flex items-start gap-3 rounded-2xl border-2 p-4 cursor-pointer transition-colors ${
              isRusak
                ? "border-red-400 bg-red-50"
                : "border-slate-200 bg-slate-50 hover:border-slate-300"
            }`}
          >
            <div className="relative mt-0.5 flex-shrink-0">
              <input
                id="checkbox-rusak"
                type="checkbox"
                className="sr-only"
                checked={isRusak}
                onChange={(e) => {
                  setIsRusak(e.target.checked);
                  if (!e.target.checked) setKeterangan("");
                }}
                disabled={submitting}
              />
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors ${
                  isRusak
                    ? "border-red-500 bg-red-500"
                    : "border-slate-300 bg-white"
                }`}
              >
                {isRusak && (
                  <HugeiconsIcon icon={Tick01Icon} size={12} strokeWidth={2.5} color="white" />
                )}
              </div>
            </div>
            <div>
              <p className={`text-sm font-semibold ${isRusak ? "text-red-700" : "text-slate-700"}`}>
                Barang dalam kondisi rusak
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Centang jika ada kerusakan pada barang ini
              </p>
            </div>
          </label>

          {/* ── Textarea keterangan (muncul hanya jika rusak) ── */}
          {isRusak && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600" htmlFor="keterangan-rusak">
                Keterangan kerusakan <span className="text-red-500">*</span>
              </label>
              <textarea
                id="keterangan-rusak"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100 disabled:opacity-60"
                rows={3}
                placeholder="cth. Layar retak di bagian pojok kanan bawah"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                autoFocus
                disabled={submitting}
              />
            </div>
          )}

          {/* ── Input foto bukti ── */}
          <div>
            <p className="mb-1.5 text-xs font-semibold text-slate-600">
              Foto bukti kondisi barang <span className="text-red-500">*</span>
            </p>

            {/* Hidden file input — membuka kamera */}
            <input
              ref={fotoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              id="input-foto-bukti"
              onChange={handleFotoChange}
              disabled={submitting}
            />

            {fotoPreview ? (
              /* Preview foto setelah diambil */
              <div className="relative overflow-hidden rounded-2xl bg-slate-100">
                <img
                  src={fotoPreview}
                  alt="Preview foto bukti"
                  className="w-full max-h-48 object-cover"
                />
                {/* Badge timestamp overlay info */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <span className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                    Timestamp otomatis akan ditambahkan
                  </span>
                  <button
                    type="button"
                    onClick={() => fotoInputRef.current?.click()}
                    disabled={submitting}
                    className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-slate-700 shadow-sm backdrop-blur-sm hover:bg-white disabled:opacity-50"
                  >
                    Ganti foto
                  </button>
                </div>
              </div>
            ) : (
              /* Tombol ambil foto */
              <button
                type="button"
                onClick={() => fotoInputRef.current?.click()}
                disabled={submitting}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 py-7 text-slate-500 transition-colors hover:border-[#14a2ba] hover:bg-[#14a2ba]/5 hover:text-[#14a2ba] disabled:opacity-50"
              >
                <HugeiconsIcon icon={Camera01Icon} size={28} strokeWidth={1.5} />
                <span className="text-sm font-semibold">Ambil Foto</span>
                <span className="text-xs text-slate-400">Kamera akan terbuka untuk preview</span>
              </button>
            )}
          </div>

          {/* ── Tombol aksi ── */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting || !canSubmit}
              className={`flex-1 rounded-full py-3.5 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                isRusak
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-[#14a2ba] hover:bg-[#0f8298]"
              }`}
            >
              {submitting
                ? "Memproses..."
                : isRusak
                ? "Kirim & Tandai Rusak"
                : "Selesaikan Pengembalian"}
            </button>
          </div>

          {/* ── Link batal ── */}
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="mt-1 w-full text-center text-xs font-semibold text-slate-400 transition-colors hover:text-slate-600 disabled:opacity-50"
          >
            Batal, scan ulang
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Scan() {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);
  const [confirmError, setConfirmError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const scannerRef = useRef(null);
  const isScanningRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) {
          await scannerRef.current.stop();
        }
      } catch (_) {}
    }
    setTorchOn(false);
    setTorchSupported(false);
  }, []);

  // Nyala/matikan flash kamera belakang saat scan berlangsung.
  const toggleTorch = useCallback(async () => {
    if (!scannerRef.current || !torchSupported) return;
    const nextState = !torchOn;
    try {
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState }],
      });
      setTorchOn(nextState);
    } catch (err) {
      console.error("Gagal mengaktifkan flash:", err);
    }
  }, [torchOn, torchSupported]);

  const startScanner = useCallback(async () => {
    if (!scannerRef.current) {
      // -----------------------------------------------------------------------
      // DYNAMIC IMPORT — html5-qrcode (~300KB) hanya diunduh & di-parse di sini,
      // saat kamera pertama kali diinisialisasi. Karena berada di dalam
      // if (!scannerRef.current), import() hanya dipanggil sekali per sesi;
      // kunjungan berikutnya ke /scan langsung pakai instance yang sudah ada di ref.
      // -----------------------------------------------------------------------
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");

      // Daftar format dibangun di sini (setelah import) karena
      // Html5QrcodeSupportedFormats sudah tidak tersedia di module scope.
      // Ref: https://github.com/mebjas/html5-qrcode#scanning-only-specific-formats
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

      scannerRef.current = new Html5Qrcode(SCANNER_ID, {
        formatsToSupport: ALL_SUPPORTED_FORMATS,
        verbose: false,
      });
    }

    try {
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decodedText) => {
          if (isScanningRef.current) return;
          isScanningRef.current = true;
          await stopScanner();
          setIsProcessing(true);
          try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/scan`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ qr_code: decodedText }),
            });
            const data = await res.json();

            if (res.ok && data.status === "konfirmasi_kembali") {
              setConfirmState({
                transaction_id: data.transaction_id,
                barang: data.barang,
                durasi_pinjam: data.durasi_pinjam,
              });
            } else {
              setScanResult({ success: res.ok, message: data.message, status: data.status });
            }
          } catch {
            setScanResult({ success: false, message: "Gagal terhubung ke server.", status: "error" });
          } finally {
            setIsProcessing(false);
          }
        },
        () => {}
      );

      // Cek dukungan flash pada kamera yang sedang aktif.
      try {
        const capabilities = scannerRef.current.getRunningTrackCapabilities();
        setTorchSupported(!!capabilities?.torch);
      } catch (_) {
        setTorchSupported(false);
      }
    } catch (err) {
      setCameraError("Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.");
      console.error(err);
    }
  }, [stopScanner]);

  useEffect(() => {
    const timer = setTimeout(() => { startScanner(); }, 300);
    return () => {
      clearTimeout(timer);
      stopScanner();
      isScanningRef.current = false;
    };
  }, []);

  const handleScanAgain = async () => {
    setScanResult(null);
    setConfirmState(null);
    setConfirmError(null);
    isScanningRef.current = false;
    await startScanner();
  };

  const handleBack = async () => {
    await stopScanner();
    navigate('/');
  };

  const handleCancelConfirm = async () => {
    await handleScanAgain();
  };

  const handleSubmitKondisi = async ({ kondisi, keterangan, fotoFile }) => {
    setConfirmSubmitting(true);
    setConfirmError(null);
    try {
      // 1. Overlay timestamp ke foto via Canvas
      let fotoBlob;
      try {
        fotoBlob = await overlayTimestampToBlob(fotoFile);
      } catch {
        setConfirmError("Gagal memproses foto. Coba ambil foto ulang.");
        return;
      }

      // 2. Kirim sebagai multipart/form-data
      const formData = new FormData();
      formData.append("transaction_id", confirmState.transaction_id);
      formData.append("kondisi", kondisi);
      formData.append("keterangan", keterangan);
      formData.append("foto", fotoBlob, `bukti_${Date.now()}.jpg`);

      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/scan/confirm-return`, {
        method: "POST",
        headers: {
          // Jangan set Content-Type manual — browser otomatis set multipart boundary
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setConfirmError(data.message || "Gagal mengonfirmasi pengembalian.");
        return;
      }

      setConfirmState(null);
      setScanResult({ success: true, message: data.message, status: data.status });
    } catch {
      setConfirmError("Gagal terhubung ke server.");
    } finally {
      setConfirmSubmitting(false);
    }
  };

  const isSuccess = scanResult?.success;
  const isRusak = scanResult?.status === "kembali_rusak";

  return (
    <div className="font-jakarta flex min-h-screen w-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Kembali"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={2} />
        </button>
        <h1 className="text-base font-semibold text-slate-900">Scan QR Barang</h1>
        <div className="w-9" />
      </div>

      {/* Camera viewport */}
      <div className="relative mx-4 aspect-square overflow-hidden rounded-3xl bg-black">
        <div id={SCANNER_ID} className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />

        {!cameraError && (
          <div className="pointer-events-none absolute inset-6">
            <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-2xl border-l-4 border-t-4 border-[#14a2ba]" />
            <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-2xl border-r-4 border-t-4 border-[#14a2ba]" />
            <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-2xl border-b-4 border-l-4 border-[#14a2ba]" />
            <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-2xl border-b-4 border-r-4 border-[#14a2ba]" />
          </div>
        )}

        {!cameraError && torchSupported && (
          <button
            type="button"
            onClick={toggleTorch}
            aria-label={torchOn ? "Matikan flash" : "Nyalakan flash"}
            className={`absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm transition-colors ${
              torchOn
                ? "bg-[#14a2ba] text-white"
                : "bg-black/45 text-white hover:bg-black/60"
            }`}
          >
            <HugeiconsIcon
              icon={torchOn ? FlashlightIcon : FlashlightOffIcon}
              size={18}
              strokeWidth={2}
            />
          </button>
        )}

        {isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 text-white backdrop-blur-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
            <span className="text-sm font-medium">Memproses...</span>
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900 px-6 text-center text-white">
            <HugeiconsIcon icon={Camera01Icon} size={40} strokeWidth={1.5} />
            <p className="text-sm text-slate-200">{cameraError}</p>
          </div>
        )}
      </div>

      {!cameraError && (
        <div className="mt-4 flex items-center justify-center gap-2 px-4 text-center text-sm text-slate-500">
          <HugeiconsIcon icon={Camera01Icon} size={18} strokeWidth={2} />
          <p>Arahkan kamera ke QR Code pada barang</p>
        </div>
      )}

      {/* Form Pengembalian Barang */}
      {confirmState && (
        <PengembalianFormModal
          confirmState={confirmState}
          onCancel={handleCancelConfirm}
          onSubmit={handleSubmitKondisi}
          submitting={confirmSubmitting}
          submitError={confirmError}
        />
      )}

      {/* Result Bottom Sheet */}
      {scanResult && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full rounded-t-3xl bg-white p-6 text-center sm:max-w-sm sm:rounded-3xl">
            <div
              className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
                !isSuccess
                  ? "bg-red-50 text-red-500"
                  : isRusak
                  ? "bg-orange-50 text-orange-500"
                  : "bg-[#14a2ba]/10 text-[#14a2ba]"
              }`}
            >
              <HugeiconsIcon
                icon={isSuccess ? (isRusak ? Alert01Icon : CheckmarkCircle02Icon) : CancelCircleIcon}
                size={44}
                strokeWidth={1.5}
              />
            </div>
            <p className="mt-4 text-lg font-bold text-slate-900">
              {isSuccess
                ? scanResult.status === "pinjam"
                  ? "Berhasil Dipinjam!"
                  : isRusak
                  ? "Dikembalikan (Rusak)"
                  : "Berhasil Dikembalikan!"
                : "Scan Gagal"}
            </p>
            <p className="mt-1 text-sm text-slate-500">{scanResult.message}</p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleScanAgain}
                className="flex-1 rounded-full border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Scan Lagi
              </button>
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 rounded-full bg-[#14a2ba] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0f8298]"
              >
                Kembali
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}