import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  QrCode01Icon,
  ViewIcon,
  ViewOffIcon,
  CheckmarkCircleIcon,
  AlertCircleIcon,
  Loading03Icon,
} from '@hugeicons/core-free-icons';

// ===== ATURAN VALIDASI =====
const RULES = {
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
  password: (val) => {
    if (!val) return 'Password wajib diisi.';
    if (val.length < 8) return 'Password minimal 8 karakter.';
    return '';
  },
};

function validate(fields, mode) {
  const errors = {};
  if (mode === 'register') {
    errors.nama_lengkap = RULES.nama_lengkap(fields.nama_lengkap);
  }
  errors.email = RULES.email(fields.email);
  errors.password = RULES.password(fields.password);
  return errors;
}

function hasErrors(errors) {
  return Object.values(errors).some((msg) => msg !== '');
}

// Reticle sudut ala viewfinder pemindai QR — motif khas dipakai berulang
// di logo dan aksen latar, terinspirasi tiga pola finder pada kode QR asli.
function CornerBrackets({ size = 'w-4 h-4', color = 'border-[#14a2ba]', thickness = 'border-2' }) {
  return (
    <>
      <span className={`absolute -top-2 -left-2 ${size} ${thickness} ${color} border-r-0 border-b-0`} />
      <span className={`absolute -top-2 -right-2 ${size} ${thickness} ${color} border-l-0 border-b-0`} />
      <span className={`absolute -bottom-2 -left-2 ${size} ${thickness} ${color} border-r-0 border-t-0`} />
      <span className={`absolute -bottom-2 -right-2 ${size} ${thickness} ${color} border-l-0 border-t-0`} />
    </>
  );
}

function QRMark({ className = 'w-7 h-7' }) {
  return <HugeiconsIcon icon={QrCode01Icon} className={className} color="currentColor" strokeWidth={1.6} />;
}

export default function LoginRegister({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ nama_lengkap: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');

  // State baru untuk UX: Toggle lihat password
  const [showPassword, setShowPassword] = useState(false);

  // Fungsi handleChange dioptimalkan (tanpa useCallback yang tidak perlu)
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));

    // Hitung ulang error secara real-time
    const fieldError = RULES[name] ? RULES[name](value) : '';
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
    setServerError('');
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setForm({ nama_lengkap: '', email: '', password: '' });
    setErrors({});
    setTouched({});
    setServerError('');
    setSuccess('');
    setShowPassword(false); // Reset toggle password
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Tandai semua field sebagai touched
    const allTouched = { nama_lengkap: true, email: true, password: true };
    setTouched(allTouched);

    const allErrors = validate(form, mode);
    setErrors(allErrors);
    if (hasErrors(allErrors)) return;

    setLoading(true);
    setServerError('');

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : { nama_lengkap: form.nama_lengkap.trim(), email: form.email, password: form.password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.message || 'Terjadi kesalahan.');
        return;
      }

      if (mode === 'register') {
        setSuccess('Registrasi berhasil! Silakan login.');
        switchMode('login');
      } else {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (onLoginSuccess) onLoginSuccess(data.user);
      }
    } catch {
      setServerError('Tidak dapat terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  const fieldError = (name) => (touched[name] && errors[name] ? errors[name] : '');
  const isInvalid = (name) => !!(touched[name] && errors[name]);

  // Kalkulasi kekuatan password
  const getPasswordStrength = () => {
    const len = form.password.length;
    if (len === 0) return { label: '', color: 'bg-slate-200', width: '0%' };
    if (len < 8) return { label: 'Terlalu pendek', color: 'bg-red-500', width: '33%' };
    if (len < 12) return { label: 'Cukup', color: 'bg-[#14a2ba]/60', width: '66%' };
    return { label: 'Kuat', color: 'bg-[#14a2ba]', width: '100%' };
  };
  const pwdStrength = getPasswordStrength();

  const inputBase =
    'block w-full px-4 py-3 rounded-lg border text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0';
  const inputState = (name) =>
    isInvalid(name)
      ? 'border-red-300 bg-red-50 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
      : 'border-slate-200 bg-slate-50 placeholder-slate-400 focus:border-[#14a2ba] focus:ring-[#14a2ba] focus:bg-white';

  return (
  <div
    className="min-h-screen w-full flex flex-col lg:flex-row bg-white"
    style={{ fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui" }}
  >
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
      @keyframes qr-scan {
        0% { transform: translateY(-8%); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translateY(108%); opacity: 0; }
      }
      .qr-scan-line { animation: qr-scan 5s linear infinite; }
      .font-display, .font-mono-tag {
        font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui;
      }
    `}</style>

      {/* ===== PANEL MEREK (desktop only) ===== */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[38%] relative flex-col justify-between overflow-hidden bg-[#12181C] text-white px-12 py-14">
        {/* Pola titik latar */}
        <div
          className="absolute inset-0 opacity-[0.25] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        {/* Garis pindai bergerak */}
        <div className="absolute inset-x-0 top-0 h-1/2 overflow-hidden pointer-events-none motion-safe:qr-scan-line-wrap">
          <div className="qr-scan-line absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-[#14a2ba]/70 to-transparent" />
        </div>
        {/* Bracket dekoratif besar, samar, di sudut panel */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 opacity-[0.15] pointer-events-none">
          <CornerBrackets size="w-40 h-40" thickness="border-4" color="border-white" />
        </div>

        <div className="relative flex items-center gap-3">
          <div className="relative w-12 h-12 flex items-center justify-center rounded-lg bg-[#1B2329] text-[#14a2ba]">
            <QRMark className="w-7 h-7" />
            <CornerBrackets size="w-3 h-3" thickness="border-2" color="border-[#14a2ba]" />
          </div>
          <span className="font-display font-semibold text-lg tracking-tight">QRFast</span>
        </div>

        <p className="relative font-mono-tag text-[11px] text-[#6B7570]">
          © {new Date().getFullYear()} QRFast — Inventory OS
        </p>
      </div>

      {/* ===== BILAH ATAS RINGKAS (mobile & tablet) ===== */}
      <div className="lg:hidden flex items-center gap-3 bg-[#12181C] text-white px-6 py-5">
        <div className="relative w-9 h-9 flex items-center justify-center rounded-md bg-[#1B2329] text-[#14a2ba] shrink-0">
          <QRMark className="w-5 h-5" />
        </div>
        <div>
          <p className="font-display font-semibold text-sm leading-none">QRFast</p>
          <p className="font-mono-tag text-[10px] text-[#8A948E] mt-1">Sistem Inventaris QR</p>
        </div>
      </div>

      {/* ===== PANEL FORMULIR ===== */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 lg:py-16 bg-white">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
              {mode === 'login' ? 'Masuk' : 'Buat akun baru'}
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              {mode === 'login' ? 'Masuk ke sistem inventaris QRFast Anda.' : 'Daftar sebagai pengguna baru QRFast.'}
            </p>
          </div>

          {/* Tab Toggle (Aksesibel) */}
          <div className="flex p-1 bg-slate-100 rounded-lg mb-6 sm:mb-8" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={`relative flex-1 py-2.5 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#14a2ba] focus:ring-offset-1 ${
                mode === 'login' ? 'bg-white text-[#12181C] shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
              onClick={() => switchMode('login')}
            >
              Masuk
              {mode === 'login' && <span className="absolute top-1 right-1.5 w-1 h-1 rounded-full bg-[#14a2ba]" />}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              className={`relative flex-1 py-2.5 text-sm font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#14a2ba] focus:ring-offset-1 ${
                mode === 'register' ? 'bg-white text-[#12181C] shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
              onClick={() => switchMode('register')}
            >
              Daftar
              {mode === 'register' && <span className="absolute top-1 right-1.5 w-1 h-1 rounded-full bg-[#14a2ba]" />}
            </button>
          </div>

          {/* Banners */}
          {success && (
            <div className="flex items-center gap-3 p-4 mb-6 text-sm text-[#0b6577] bg-[#14a2ba]/10 rounded-lg border border-[#14a2ba]/30">
              <HugeiconsIcon icon={CheckmarkCircleIcon} className="w-5 h-5 flex-shrink-0" color="currentColor" strokeWidth={2} />
              <p>{success}</p>
            </div>
          )}
          {serverError && (
            <div className="flex items-center gap-3 p-4 mb-6 text-sm text-red-800 bg-red-50 rounded-lg border border-red-200">
              <HugeiconsIcon icon={AlertCircleIcon} className="w-5 h-5 flex-shrink-0" color="currentColor" strokeWidth={2} />
              <p>{serverError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {mode === 'register' && (
              <div>
                <label htmlFor="nama_lengkap" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  id="nama_lengkap"
                  type="text"
                  name="nama_lengkap"
                  placeholder="Nama Lengkap"
                  value={form.nama_lengkap}
                  onChange={handleChange}
                  autoComplete="name"
                  className={`${inputBase} ${inputState('nama_lengkap')}`}
                />
                {fieldError('nama_lengkap') && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">{fieldError('nama_lengkap')}</p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Alamat Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                className={`${inputBase} ${inputState('email')}`}
              />
              {fieldError('email') && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">{fieldError('email')}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                {mode === 'login' && (
                  <a href="#lupa-password" className="text-xs font-semibold text-[#14a2ba] hover:text-[#0d8194]">
                    Lupa password?
                  </a>
                )}
              </div>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className={`${inputBase} pr-12 ${inputState('password')}`}
                />
                {/* Tombol Toggle Show/Hide Password */}
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  <HugeiconsIcon
                    icon={showPassword ? ViewOffIcon : ViewIcon}
                    className="h-5 w-5"
                    color="currentColor"
                    strokeWidth={1.8}
                  />
                </button>
              </div>

              {fieldError('password') && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">{fieldError('password')}</p>
              )}

              {/* Password strength bar */}
              {mode === 'register' && form.password.length > 0 && (
                <div className="mt-3">
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ease-out ${pwdStrength.color}`}
                      style={{ width: pwdStrength.width }}
                    />
                  </div>
                  <div className="flex justify-end mt-1.5">
                    <span className="font-mono-tag text-[11px] text-slate-500">{pwdStrength.label}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Tombol submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 rounded-lg text-sm font-semibold text-white bg-[#14a2ba] hover:bg-[#0d8194] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#14a2ba] disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <HugeiconsIcon icon={Loading03Icon} className="animate-spin h-5 w-5" color="currentColor" strokeWidth={2} />
                    Memproses...
                  </span>
                ) : (
                  mode === 'login' ? 'Masuk' : 'Daftar sekarang'
                )}
              </button>
            </div>
          </form>

          {/* Footer/Switch Area */}
          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600">
              {mode === 'login' ? 'Belum punya akun QRFast?' : 'Sudah punya akun QRFast?'}{' '}
              <button
                type="button"
                onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                className="font-semibold text-[#14a2ba] hover:text-[#0d8194] focus:outline-none focus:underline"
              >
                {mode === 'login' ? 'Daftar di sini' : 'Masuk sekarang'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}