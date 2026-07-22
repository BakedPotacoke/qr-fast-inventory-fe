import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowRight01Icon,
  Package01Icon,
  HistoryIcon,
  QrCodeIcon,
  Notification03Icon,
  HelpCircleIcon,
  Logout01Icon,
  UserEdit01Icon,
  Cancel01Icon,
  ViewIcon,
  ViewOffIcon,
  CheckmarkCircleIcon,
  AlertCircleIcon,
  Loading03Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';

// ===== ATURAN VALIDASI (sama seperti LoginRegister, + confirmPassword) =====
const PROFILE_RULES = {
  nama_lengkap: (val) => {
    if (!val.trim()) return 'Nama lengkap wajib diisi.';
    if (val.trim().length < 2) return 'Nama lengkap minimal 2 karakter.';
    return '';
  },
  email: (val) => {
    if (!val.trim()) return 'Email wajib diisi.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Format email tidak valid.';
    return '';
  },
  // Password bersifat opsional di form edit profil: hanya divalidasi jika diisi
  password: (val) => {
    if (!val) return '';
    if (val.length < 8) return 'Password minimal 8 karakter.';
    return '';
  },
  confirmPassword: (val, allValues) => {
    if (!allValues.password) return '';
    if (!val) return 'Konfirmasi password wajib diisi.';
    if (val !== allValues.password) return 'Password tidak cocok.';
    return '';
  },
};

function validateProfileForm(fields) {
  const errors = {};
  errors.nama_lengkap = PROFILE_RULES.nama_lengkap(fields.nama_lengkap);
  errors.email = PROFILE_RULES.email(fields.email);
  errors.password = PROFILE_RULES.password(fields.password);
  errors.confirmPassword = PROFILE_RULES.confirmPassword(fields.confirmPassword, fields);
  return errors;
}

function hasProfileErrors(errors) {
  return Object.values(errors).some((msg) => msg !== '');
}

// ===== MENU ITEM =====
function MenuItem({ icon, label, badge, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50 active:bg-slate-100"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e6f6f9] text-[#14a2ba]">
        {icon}
      </div>
      <span className="flex-1 truncate text-sm font-semibold text-slate-800">{label}</span>
      <div className="flex shrink-0 items-center gap-2">
        {badge && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
            {badge}
          </span>
        )}
        <span className="text-slate-300">
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2.5} />
        </span>
      </div>
    </button>
  );
}

// ===== EDIT PROFILE MODAL =====
function EditProfileModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    nama_lengkap: user?.nama_lengkap || '',
    email: user?.email || '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Validasi real-time setiap kali field berubah, sama seperti LoginRegister
  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextForm = { ...form, [name]: value };
    setForm(nextForm);
    setTouched((prev) => ({ ...prev, [name]: true }));

    const fieldError = PROFILE_RULES[name] ? PROFILE_RULES[name](value, nextForm) : '';
    setErrors((prev) => {
      const next = { ...prev, [name]: fieldError };
      // Saat password berubah, konfirmasi password perlu divalidasi ulang juga
      if (name === 'password') {
        next.confirmPassword = PROFILE_RULES.confirmPassword(nextForm.confirmPassword, nextForm);
      }
      return next;
    });
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Tandai semua field sebagai touched agar semua pesan error muncul
    setTouched({ nama_lengkap: true, email: true, password: true, confirmPassword: true });

    const allErrors = validateProfileForm(form);
    setErrors(allErrors);
    if (hasProfileErrors(allErrors)) return;

    setLoading(true);
    setServerError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nama_lengkap: form.nama_lengkap.trim(),
          email: form.email,
          ...(form.password ? { password: form.password } : {}),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setServerError(result.message || 'Gagal memperbarui profil.');
        setLoading(false);
        return;
      }

      setSuccess('Profil berhasil diperbarui.');
      onSaved(result.data);
    } catch (err) {
      console.error('Update profile error:', err);
      setServerError('Terjadi kesalahan, coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const fieldError = (name) => (touched[name] && errors[name] ? errors[name] : '');
  const isInvalid = (name) => !!(touched[name] && errors[name]);

  const inputBase =
    'w-full rounded-xl border px-4 py-2.5 text-sm text-slate-800 outline-none transition-colors focus:ring-2';
  const inputState = (name) =>
    isInvalid(name)
      ? 'border-red-300 bg-red-50 placeholder-red-300 focus:border-red-500 focus:ring-red-500/20'
      : 'border-slate-200 placeholder-slate-400 focus:border-[#14a2ba] focus:ring-[#14a2ba]/20';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl [font-family:'Plus_Jakarta_Sans',_sans-serif]">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Edit Profil</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Banners, sama seperti LoginRegister */}
        {success && (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-[#14a2ba]/30 bg-[#14a2ba]/10 p-3 text-xs text-[#0b6577]">
            <HugeiconsIcon icon={CheckmarkCircleIcon} size={18} strokeWidth={2} className="shrink-0" />
            <p>{success}</p>
          </div>
        )}
        {serverError && (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            <HugeiconsIcon icon={AlertCircleIcon} size={18} strokeWidth={2} className="shrink-0" />
            <p>{serverError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Nama Lengkap */}
          <div>
            <label htmlFor="nama_lengkap" className="mb-1.5 block text-xs font-semibold text-slate-500">
              Nama Lengkap
            </label>
            <input
              id="nama_lengkap"
              type="text"
              name="nama_lengkap"
              value={form.nama_lengkap}
              onChange={handleChange}
              autoComplete="name"
              className={`${inputBase} ${inputState('nama_lengkap')}`}
              placeholder="Nama lengkap"
            />
            {fieldError('nama_lengkap') && (
              <p className="mt-1.5 text-xs font-medium text-red-600">{fieldError('nama_lengkap')}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-slate-500">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              className={`${inputBase} ${inputState('email')}`}
              placeholder="Email"
            />
            {fieldError('email') && (
              <p className="mt-1.5 text-xs font-medium text-red-600">{fieldError('email')}</p>
            )}
          </div>

          {/* Password baru */}
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-slate-500">
              Password Baru <span className="font-normal text-slate-400">(opsional)</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                className={`${inputBase} pr-10 ${inputState('password')}`}
                placeholder="Kosongkan jika tidak ingin ganti"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                <HugeiconsIcon icon={showPassword ? ViewOffIcon : ViewIcon} size={17} strokeWidth={2} />
              </button>
            </div>
            {fieldError('password') && (
              <p className="mt-1.5 text-xs font-medium text-red-600">{fieldError('password')}</p>
            )}
          </div>

          {/* Konfirmasi password, hanya muncul jika isi password */}
          {form.password && (
            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-semibold text-slate-500">
                Konfirmasi Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                className={`${inputBase} ${inputState('confirmPassword')}`}
                placeholder="Ulangi password baru"
              />
              {fieldError('confirmPassword') && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{fieldError('confirmPassword')}</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-2xl bg-[#14a2ba] py-3 text-sm font-bold text-white transition-colors hover:bg-[#0f8ba0] disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <HugeiconsIcon icon={Loading03Icon} size={16} strokeWidth={2} className="animate-spin" />
                  Menyimpan...
                </span>
              ) : (
                'Simpan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== MAIN COMPONENT =====
export default function Profil({ user, onLogout, onUpdateUser }) {
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const inisial = user?.nama_lengkap?.charAt(0).toUpperCase() || 'U';
  const nama = user?.nama_lengkap || 'Pengguna';
  const email = user?.email || '-';

  const handleSaved = (updatedUser) => {
    setShowEditModal(false);
    onUpdateUser?.(updatedUser);
  };

  return (
    <div className="min-h-screen bg-white [font-family:'Plus_Jakarta_Sans',_sans-serif] antialiased">
      <div className="mx-auto w-full max-w-2xl lg:max-w-3xl">
        {/* ===== HERO HEADER ===== */}
        <div className="flex flex-col items-center bg-[#14a2ba] px-6 pt-10 pb-16 text-center sm:pt-14 sm:pb-20">
          {/* Avatar */}
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/25 bg-white text-2xl font-bold text-[#14a2ba] shadow-sm sm:h-24 sm:w-24 sm:text-3xl">
            {inisial}
          </div>

          {/* Name & Email */}
          <h1 className="mt-4 text-lg font-bold text-white sm:text-xl">{nama}</h1>
          <p className="mt-0.5 text-sm text-white/75">{email}</p>
        </div>

        {/* ===== BODY ===== */}
        <div className="-mt-10 rounded-t-3xl bg-white px-4 pt-6 pb-10 sm:-mt-12 sm:px-6 lg:px-8">

          {/* --- AKTIVITAS --- */}
          <p className="mb-2 px-1 text-xs font-bold tracking-wide text-slate-400 uppercase">Aktivitas</p>
          <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
            <MenuItem
              icon={<HugeiconsIcon icon={Package01Icon} size={18} strokeWidth={2} />}
              label="Inventaris Barang"
              onClick={() => navigate('/inventaris')}
            />
            <MenuItem
              icon={<HugeiconsIcon icon={HistoryIcon} size={18} strokeWidth={2} />}
              label="Riwayat Transaksi"
              onClick={() => navigate('/riwayat')}
            />
            <MenuItem
              icon={<HugeiconsIcon icon={QrCodeIcon} size={18} strokeWidth={2} />}
              label="Scan QR Code"
              onClick={() => navigate('/scan')}
            />
          </div>

          {/* --- ADMINISTRASI (khusus admin) --- */}
          {user?.role === 'admin' && (
            <>
              <p className="mt-8 mb-2 px-1 text-xs font-bold tracking-wide text-slate-400 uppercase">
                Administrasi
              </p>
              <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
                <MenuItem
                  icon={<HugeiconsIcon icon={UserGroupIcon} size={18} strokeWidth={2} />}
                  label="Kelola Pengguna"
                  onClick={() => navigate('/usermanagement')}
                />
              </div>
            </>
          )}

          {/* --- PENGATURAN --- */}
          <p className="mt-8 mb-2 px-1 text-xs font-bold tracking-wide text-slate-400 uppercase">Pengaturan</p>
          <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
            <MenuItem
              icon={<HugeiconsIcon icon={UserEdit01Icon} size={18} strokeWidth={2} />}
              label="Edit Profil"
              onClick={() => setShowEditModal(true)}
            />
            <MenuItem
              icon={<HugeiconsIcon icon={Notification03Icon} size={18} strokeWidth={2} />}
              label="Notifikasi"
              badge="Aktif"
              onClick={() => {}}
            />
            <MenuItem
              icon={<HugeiconsIcon icon={HelpCircleIcon} size={18} strokeWidth={2} />}
              label="Bantuan & FAQ"
              onClick={() => {}}
            />
          </div>

          {/* --- LOGOUT BUTTON --- */}
          <button
            type="button"
            onClick={onLogout}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 py-3.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-100 active:bg-red-100"
          >
            <HugeiconsIcon icon={Logout01Icon} size={18} strokeWidth={2.25} />
            Keluar
          </button>

          <div className="h-4" />
        </div>
      </div>

      {showEditModal && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}