import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
  CancelCircleIcon,
  Camera01Icon,
} from "@hugeicons/core-free-icons";

const SCANNER_ID = "qrfast-scanner-viewport";

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

export default function Scan() {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const scannerRef = useRef(null);
  const isScanningRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) {
          await scannerRef.current.stop();
        }
      } catch (_) { }
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (!scannerRef.current) {
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
            setScanResult({ success: res.ok, message: data.message, status: data.status });
          } catch {
            setScanResult({ success: false, message: "Gagal terhubung ke server.", status: "error" });
          } finally {
            setIsProcessing(false);
          }
        },
        () => { }
      );
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
    isScanningRef.current = false;
    await startScanner();
  };

  const handleBack = async () => {
    await stopScanner();
    navigate('/');
  };

  const isSuccess = scanResult?.success;

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

      {/* Result Bottom Sheet */}
      {scanResult && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full rounded-t-3xl bg-white p-6 text-center sm:max-w-sm sm:rounded-3xl">
            <div
              className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
                isSuccess ? "bg-[#14a2ba]/10 text-[#14a2ba]" : "bg-red-50 text-red-500"
              }`}
            >
              <HugeiconsIcon icon={isSuccess ? CheckmarkCircle02Icon : CancelCircleIcon} size={44} strokeWidth={1.5} />
            </div>
            <p className="mt-4 text-lg font-bold text-slate-900">
              {isSuccess
                ? scanResult.status === "pinjam" ? "Berhasil Dipinjam!" : "Berhasil Dikembalikan!"
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