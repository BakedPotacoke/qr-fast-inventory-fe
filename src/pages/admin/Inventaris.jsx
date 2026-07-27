import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { HugeiconsIcon } from '@hugeicons/react';
import { BarCode01Icon, ImageAdd02Icon, Cancel01Icon, PackageIcon } from '@hugeicons/core-free-icons';

const STATUS_OPTIONS = ['tersedia', 'dipinjam', 'rusak', 'hilang'];

export default function InventarisAdmin() {
  const [barangList, setBarangList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State untuk Modal Form
  const [showForm, setShowForm] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);

  // State untuk Fitur Baru: Pencarian, Filter, dan Bulk Delete
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('semua');
  const [selectedForDelete, setSelectedForDelete] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/items`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Gagal mengambil data inventaris');
      const data = await response.json();

      const mappedItems = data.data.map((item) => ({
        ...item,
        nama: item.nama_barang,
        sku: item.qr_code,
        gambar: item.gambar_url,
      }));

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

  const handleOpenTambah = () => {
    setItemToEdit(null);
    setShowForm(true);
  };

  const handleOpenEdit = (item) => {
    setItemToEdit(item);
    setShowForm(true);
  };

  const handleSaved = (savedItem, isNew) => {
    if (isNew) {
      setBarangList((prev) => [savedItem, ...prev]);
    } else {
      setBarangList((prev) => prev.map((b) => (b.id === savedItem.id ? savedItem : b)));
    }
    setShowForm(false);
    setItemToEdit(null);
  };

  // 1. PENGAMANAN HAPUS SATU BARANG
  const handleDelete = async (item) => {
    if (item.status === 'dipinjam') {
      alert('Barang yang sedang dipinjam tidak dapat dihapus!');
      return;
    }
    if (!window.confirm(`Hapus "${item.nama}"?`)) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/items`, {
        method: 'DELETE',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: [item.id] }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Gagal menghapus barang');
      
      setBarangList((prev) => prev.filter((b) => b.id !== item.id));
      setSelectedForDelete((prev) => prev.filter((id) => id !== item.id));
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // Hapus Massal (Bulk Delete)
  const handleBulkDelete = async () => {
    if (selectedForDelete.length === 0) return;
    if (!window.confirm(`Yakin ingin menghapus ${selectedForDelete.length} barang terpilih?`)) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/items`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedForDelete }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Gagal menghapus barang secara massal');

      setBarangList((prev) => prev.filter((b) => !selectedForDelete.includes(b.id)));
      setSelectedForDelete([]);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle Pilihan Checkbox (Satu Baris)
  const handleToggleSelect = (id, status) => {
    if (status === 'dipinjam') return; // Proteksi tambahan
    setSelectedForDelete((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Kalkulasi Filter & Pencarian
  const filters = useMemo(() => [
    { key: 'semua', label: 'Semua', count: barangList.length },
    { key: 'tersedia', label: 'Tersedia', count: barangList.filter((b) => b.status === 'tersedia').length },
    { key: 'dipinjam', label: 'Dipinjam', count: barangList.filter((b) => b.status === 'dipinjam').length },
    { key: 'rusak', label: 'Rusak', count: barangList.filter((b) => b.status === 'rusak').length },
    { key: 'hilang', label: 'Hilang', count: barangList.filter((b) => b.status === 'hilang').length },
  ], [barangList]);

  const filteredBarang = useMemo(() => {
    return barangList.filter((item) => {
      const matchSearch =
        item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchFilter = activeFilter === 'semua' || item.status === activeFilter;
      return matchSearch && matchFilter;
    });
  }, [searchQuery, activeFilter, barangList]);

  // 2. PENGAMANAN SELECT ALL (Hanya pilih barang yang BUKAN berstatus dipinjam)
  const selectableBarang = useMemo(() => {
    return filteredBarang.filter((item) => item.status !== 'dipinjam');
  }, [filteredBarang]);

  const handleToggleSelectAll = (e) => {
    if (e.target.checked) {
      const allSelectableIds = selectableBarang.map((item) => item.id);
      setSelectedForDelete(allSelectableIds);
    } else {
      setSelectedForDelete([]);
    }
  };

  const isAllSelected =
    selectableBarang.length > 0 &&
    selectableBarang.every((item) => selectedForDelete.includes(item.id));

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Inventaris (Admin)</h1>
          <p className="text-xs text-slate-500">{barangList.length} total barang terdaftar</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedForDelete.length > 0 && (
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleBulkDelete}
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? 'Menghapus...' : `Hapus Terpilih (${selectedForDelete.length})`}
            </button>
          )}
          <button
            type="button"
            onClick={handleOpenTambah}
            className="rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            + Tambah Barang
          </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="mt-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Cari berdasarkan nama atau SKU barang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-slate-50 py-2 pl-3 pr-10 text-sm outline-none transition focus:border-teal-500 focus:bg-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
              aria-label="Hapus pencarian"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* TABS FILTER */}
      <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-2">
        {filters.map((f) => {
          const active = activeFilter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => {
                setActiveFilter(f.key);
                setSelectedForDelete([]); // Reset pilihan saat pindah tab
              }}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {f.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TABLE INVENTARIS */}
      <div className="mt-2 overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="w-10 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleToggleSelectAll}
                  disabled={selectableBarang.length === 0}
                  className="h-4 w-4 rounded border-slate-300 accent-teal-600 disabled:cursor-not-allowed disabled:opacity-40"
                  title={selectableBarang.length === 0 ? "Tidak ada barang yang bisa dipilih" : "Pilih semua barang yang dapat dihapus"}
                />
              </th>
              <th className="px-3 py-2.5 font-medium">Foto</th>
              <th className="px-3 py-2.5 font-medium">Nama</th>
              <th className="px-3 py-2.5 font-medium">SKU</th>
              <th className="px-3 py-2.5 font-medium">Kategori</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-slate-400">Memuat data...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-red-500">
                  {error}{' '}
                  <button type="button" className="underline" onClick={fetchItems}>Coba lagi</button>
                </td>
              </tr>
            ) : filteredBarang.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
                  Barang tidak ditemukan.
                </td>
              </tr>
            ) : (
              filteredBarang.map((item) => {
                const isChecked = selectedForDelete.includes(item.id);
                const isBorrowed = item.status === 'dipinjam';

                return (
                  <tr key={item.id} className={isChecked ? 'bg-teal-50/50' : 'hover:bg-slate-50/50'}>
                    <td className="px-3 py-2">
                      {/* 3. PENGAMANAN CHECKBOX TABEL */}
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isBorrowed}
                        onChange={() => handleToggleSelect(item.id, item.status)}
                        className="h-4 w-4 rounded border-slate-300 accent-teal-600 disabled:cursor-not-allowed disabled:opacity-30"
                        title={isBorrowed ? "Barang sedang dipinjam tidak dapat dipilih" : ""}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-slate-100">
                        {item.gambar ? (
                          <img
                            src={item.gambar.startsWith('http') ? item.gambar : `${import.meta.env.VITE_API_URL}${item.gambar}`}
                            alt={item.nama}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <HugeiconsIcon icon={PackageIcon} size={16} className="text-slate-400" strokeWidth={1.5} />
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-800">{item.nama}</td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-500">{item.sku}</td>
                    <td className="px-3 py-2 text-slate-500">{item.kategori}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                        item.status === 'tersedia' ? 'bg-emerald-100 text-emerald-800' :
                        item.status === 'dipinjam' ? 'bg-amber-100 text-amber-800' :
                        item.status === 'rusak' ? 'bg-red-100 text-red-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          className="font-medium text-teal-600 hover:underline"
                          onClick={() => handleOpenEdit(item)}
                        >
                          Edit
                        </button>
                        {/* 4. PENGAMANAN TOMBOL HAPUS TABEL */}
                        {isBorrowed ? (
                          <span
                            className="cursor-not-allowed font-medium text-slate-300"
                            title="Barang sedang dipinjam tidak dapat dihapus"
                          >
                            Hapus
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="font-medium text-red-500 hover:underline"
                            onClick={() => handleDelete(item)}
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <BarangFormModal
          item={itemToEdit}
          onClose={() => { setShowForm(false); setItemToEdit(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

// ===== SCANNER (QR & Barcode) UNTUK INPUT SKU =====
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

const SKU_SCANNER_ID = 'sku-scanner-viewport-admin';

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
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            if (hasDetectedRef.current) return;
            hasDetectedRef.current = true;
            onDetected(decodedText);
          },
          () => {}
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
          if (state === 2) scanner.stop().catch(() => {});
        } catch (_) {}
      }
    };
  }, [onDetected]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-md bg-white p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Scan QR / Barcode Barang</h3>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
            onClick={onClose}
            aria-label="Tutup"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="relative mt-3 aspect-square overflow-hidden rounded-md bg-black">
          <div id={SKU_SCANNER_ID} className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900 px-6 text-center text-white">
              <HugeiconsIcon icon={BarCode01Icon} size={28} strokeWidth={1.5} />
              <p className="text-sm text-slate-200">{cameraError}</p>
            </div>
          )}
        </div>

        <p className="mt-3 text-center text-xs text-slate-400">
          Arahkan kamera ke QR Code atau barcode. Hasil scan otomatis mengisi kolom SKU.
        </p>
      </div>
    </div>
  );
}

// ===== FORM MODAL (dipakai untuk Tambah maupun Edit) =====
function BarangFormModal({ item, onClose, onSaved }) {
  const isEdit = Boolean(item);
  const [form, setForm] = useState({
    nama: item?.nama || '',
    sku: item?.sku || '',
    kategori: item?.kategori || '',
    status: item?.status || 'tersedia',
  });
  const [gambarFile, setGambarFile] = useState(null);
  const [preview, setPreview] = useState(item?.gambar || null);
  const [removeGambar, setRemoveGambar] = useState(false);
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
    setRemoveGambar(false);
  };

  const handleRemoveImage = () => {
    setGambarFile(null);
    setPreview(null);
    setRemoveGambar(true);
  };

  const handleScanDetected = (decodedText) => {
    setForm((f) => ({ ...f, sku: decodedText }));
    setErrors((er) => ({ ...er, sku: '' }));
    setShowScanner(false);
  };

  const validate = () => {
    const errs = {};
    if (!form.nama.trim()) errs.nama = 'Nama wajib diisi';
    if (!form.sku.trim()) errs.sku = 'SKU wajib diisi';
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
      formData.append('status', form.status);

      if (gambarFile) {
        formData.append('gambar', gambarFile);
      } else if (isEdit && removeGambar) {
        formData.append('remove_gambar', 'true');
      }

      const url = isEdit
        ? `${import.meta.env.VITE_API_URL}/api/items/${item.id}`
        : `${import.meta.env.VITE_API_URL}/api/items`;

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Gagal menyimpan barang');

      const savedItem = {
        ...(isEdit ? item : {}),
        ...data.data,
        nama: data.data.nama_barang,
        sku: data.data.qr_code,
        gambar: data.data.gambar_url !== undefined ? data.data.gambar_url : item?.gambar,
      };

      onSaved(savedItem, !isEdit);
    } catch (err) {
      console.error(err);
      setErrors({ api: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-sm flex-col overflow-y-auto rounded-md bg-white p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-bold text-slate-900">
          {isEdit ? 'Edit Barang' : 'Tambah Barang'}
        </h2>

        <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmit} noValidate>
          {errors.api && <p className="text-sm text-red-500">{errors.api}</p>}

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Nama Barang</label>
            <input
              type="text"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              value={form.nama}
              onChange={handleChange('nama')}
            />
            {errors.nama && <span className="text-xs text-red-500">{errors.nama}</span>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">SKU</label>
            <div className="flex items-stretch gap-2">
              <input
                type="text"
                className="w-full flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                value={form.sku}
                onChange={handleChange('sku')}
              />
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="flex shrink-0 items-center gap-1.5 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-600 hover:border-teal-500 hover:text-teal-600"
              >
                <HugeiconsIcon icon={BarCode01Icon} size={16} strokeWidth={2} />
                Scan
              </button>
            </div>
            {errors.sku && <span className="text-xs text-red-500">{errors.sku}</span>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Kategori</label>
            <input
              type="text"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              value={form.kategori}
              onChange={handleChange('kategori')}
            />
            {errors.kategori && <span className="text-xs text-red-500">{errors.kategori}</span>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              value={form.status}
              onChange={handleChange('status')}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Foto Barang</label>
            <button
              type="button"
              className="flex h-32 w-full items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-slate-300 bg-slate-50 hover:border-teal-500"
              onClick={() => fileRef.current?.click()}
            >
              {preview ? (
                <img
                  src={preview.startsWith('http') || preview.startsWith('blob:') ? preview : `${import.meta.env.VITE_API_URL}${preview}`}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-slate-400">
                  <HugeiconsIcon icon={ImageAdd02Icon} size={22} strokeWidth={1.5} />
                  <span className="text-xs font-medium text-slate-500">Tap untuk pilih foto</span>
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
                className="mt-1.5 text-xs font-semibold text-red-500 hover:text-red-600"
                onClick={handleRemoveImage}
              >
                Hapus foto
              </button>
            )}
          </div>

          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-slate-300 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-md bg-teal-600 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>

      {showScanner && (
        <div onClick={(e) => e.stopPropagation()}>
          <SkuScannerModal onClose={() => setShowScanner(false)} onDetected={handleScanDetected} />
        </div>
      )}
    </div>
  );
}