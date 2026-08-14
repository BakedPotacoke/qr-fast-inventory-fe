import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  ArrowDown01Icon,
  MessageQuestionIcon,
} from '@hugeicons/core-free-icons';

// ===== DATA FAQ =====
const FAQ_DATA = [
  {
    category: 'Kamera & Izin',
    items: [
      {
        question: 'Aplikasi meminta izin kamera, apa yang harus saya lakukan?',
        answer:
          'Tap "Izinkan" atau "Allow" saat browser/aplikasi meminta akses kamera. Izin ini diperlukan agar QR Code bisa terbaca. Tanpa izin kamera, fitur scan tidak akan bisa digunakan.',
      },
      {
        question: 'Muncul pesan "Tidak dapat mengakses kamera" — apa yang harus dilakukan?',
        answer:
          'Buka Pengaturan browser (ikon gembok di address bar), temukan izin Kamera, ubah dari Blokir menjadi Izinkan, lalu refresh halaman dan coba scan lagi. Jika masih gagal, coba buka di browser lain (Chrome direkomendasikan).',
      },
      {
        question: 'Apakah ada tombol flash untuk membantu scan di tempat gelap?',
        answer:
          'Ya! Jika perangkat kamu mendukung, tombol flash (ikon petir) akan muncul di pojok kanan atas area kamera. Tap untuk menyalakan, tap lagi untuk mematikan. Tombol ini hanya muncul jika kamera perangkatmu mendukung fitur flash/torch.',
      },
    ],
  },
  {
    category: 'Scan & Peminjaman',
    items: [
      {
        question: 'QR Code sudah diarahkan tapi tidak terbaca, apa yang harus dilakukan?',
        answer:
          'Pastikan QR Code tidak buram, sobek, atau tertutup kotoran. Pastikan pencahayaan cukup — gunakan flash jika perlu. Pegang perangkat dengan stabil, jangan terlalu dekat atau jauh. Pastikan QR Code masuk ke dalam kotak bidik (area dengan garis sudut biru), dan coba bersihkan lensa kamera perangkatmu.',
      },
      {
        question: 'Muncul pesan "Gagal terhubung ke server." saat scan, apa artinya?',
        answer:
          'Koneksi internet kamu mungkin tidak stabil. Pastikan terhubung ke Wi-Fi kantor atau data seluler, tap "Scan Lagi" dan ulangi proses scan. Jika masih gagal, hubungi tim IT.',
      },
      {
        question: 'Saya scan barang tapi muncul pesan "Barang tidak tersedia"?',
        answer:
          'Bisa jadi barang tersebut sedang dipinjam orang lain, sedang dalam perbaikan, atau status barangnya belum diperbarui. Hubungi admin inventaris untuk informasi lebih lanjut.',
      },
      {
        question: 'Apakah saya bisa meminjam lebih dari satu barang sekaligus?',
        answer:
          'Ya, kamu bisa meminjam lebih dari satu barang. Cukup ulangi proses scan untuk setiap barang yang ingin dipinjam.',
      },
    ],
  },
  {
    category: 'Foto Bukti & Pengembalian',
    items: [
      {
        question: 'Apakah foto bukti wajib saat mengembalikan barang?',
        answer:
          'Ya, foto bukti wajib diisi saat pengembalian. Foto ini berfungsi sebagai dokumentasi kondisi barang saat dikembalikan dan akan tersimpan di sistem.',
      },
      {
        question: 'Apa itu "timestamp otomatis" pada foto?',
        answer:
          'Saat kamu mengambil foto bukti, sistem otomatis menambahkan tanggal dan jam di sudut foto. Ini berfungsi sebagai bukti waktu pengembalian yang valid dan tidak bisa dipalsukan.',
      },
      {
        question: 'Foto yang saya ambil salah, bisakah diganti?',
        answer:
          'Bisa! Setelah foto tampil di preview, tap tombol "Ganti foto" di bagian bawah gambar untuk mengambil foto baru.',
      },
      {
        question: 'Apa bedanya "Lapor Hilang" dan pengembalian kondisi rusak?',
        answer:
          'Lapor Hilang digunakan jika barang tidak ada/tidak ditemukan — diakses dari Beranda lewat ikon merah di kartu barang, tanpa perlu foto bukti. Pengembalian Rusak digunakan jika barang ada tapi ada kerusakan — diakses dari Scan QR dengan mencentang opsi "Rusak", dan foto bukti wajib disertakan.',
      },
    ],
  },
  {
    category: 'Riwayat & Data',
    items: [
      {
        question: 'Di mana saya bisa melihat barang yang sedang saya pinjam?',
        answer:
          'Buka halaman Beranda, lihat bagian "Sedang Kamu Pinjam". Semua barang yang aktif kamu pinjam akan tampil di sana.',
      },
      {
        question: 'Di mana saya bisa melihat riwayat peminjaman saya?',
        answer:
          'Buka halaman Beranda, lihat bagian "Terakhir Kamu Pinjam". Bagian ini menampilkan daftar barang yang sudah selesai dipinjam beserta tanggal pengembaliannya.',
      },
      {
        question: 'Saya sudah lapor barang hilang, apakah bisa dibatalkan?',
        answer:
          'Laporan yang sudah dikirim tidak bisa dibatalkan sendiri melalui aplikasi. Hubungi admin inventaris jika ada kesalahan pelaporan.',
      },
    ],
  },
  {
    category: 'Edit Profil',
    items: [
      {
        question: 'Di mana saya bisa menemukan fitur Edit Profil?',
        answer:
          'Buka halaman Profil, scroll ke bagian "Pengaturan", lalu tap menu "Edit Profil". Modal form akan muncul dari bawah layar.',
      },
      {
        question: 'Apakah saya harus mengisi semua field saat edit profil?',
        answer:
          'Tidak semuanya. Field Nama Lengkap dan Email wajib diisi. Field Password Baru bersifat opsional — kosongkan saja jika tidak ingin mengganti password.',
      },
      {
        question: 'Password baru saya minimal berapa karakter?',
        answer:
          'Minimal 8 karakter. Jika kurang dari itu, akan muncul pesan error "Password minimal 8 karakter." tepat di bawah kolom password, dan form tidak bisa disimpan.',
      },
      {
        question: 'Muncul pesan error "Password tidak cocok", apa artinya?',
        answer:
          'Isi kolom Konfirmasi Password tidak sama persis dengan kolom Password Baru. Periksa kembali kedua kolom — pastikan tidak ada typo, perbedaan huruf kapital, atau spasi tersembunyi. Gunakan ikon mata untuk membantu memeriksa.',
      },
      {
        question: 'Muncul banner merah saat menyimpan profil, apa penyebabnya?',
        answer:
          'Banner merah menandakan kesalahan dari server. Penyebab umum: email yang dimasukkan sudah digunakan akun lain, atau koneksi internet terputus saat data dikirim. Perbaiki isian yang bermasalah lalu coba tap "Simpan" lagi. Jika masih gagal, hubungi tim IT.',
      },
      {
        question: 'Apakah perubahan profil langsung terlihat setelah disimpan?',
        answer:
          'Ya. Setelah berhasil disimpan, banner "Profil berhasil diperbarui." akan muncul dan nama serta email di halaman Profil langsung diperbarui — tanpa perlu refresh atau logout terlebih dahulu.',
      },
    ],
  },
];

// ===== FAQ ITEM =====
function FaqItem({ question, answer, index }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06 }}
      className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
        isOpen
          ? 'border-[#14a2ba]/30 bg-[#e6f6f9]/50 shadow-sm'
          : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50'
      }`}
    >
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-start gap-3 px-4 py-4 text-left"
      >
        {/* Arrow toggle */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
            isOpen ? 'bg-[#14a2ba] text-white' : 'bg-slate-100 text-slate-400'
          }`}
        >
          <HugeiconsIcon icon={ArrowDown01Icon} size={12} strokeWidth={2.5} />
        </motion.div>

        <span
          className={`flex-1 text-sm font-semibold leading-snug transition-colors duration-200 ${
            isOpen ? 'text-[#0b6577]' : 'text-slate-700'
          }`}
        >
          {question}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1, transition: { duration: 0.22, ease: 'easeOut' } }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.18, ease: 'easeIn' } }}
          >
            <div className="px-4 pb-4 pt-0 pl-13">
              <div className="ml-9 border-l-2 border-[#14a2ba]/20 pl-4">
                <p className="text-sm leading-relaxed text-slate-500">{answer}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ===== CATEGORY SECTION =====
function FaqCategory({ category, items, categoryIndex }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: categoryIndex * 0.1 }}
      className="mt-2 mb-6"
    >
      <p className="mb-3 px-1 text-xs font-bold uppercase tracking-wide text-slate-400">
        {category}
      </p>
      <div className="space-y-2">
        {items.map((item, i) => (
          <FaqItem
            key={i}
            question={item.question}
            answer={item.answer}
            index={categoryIndex * 3 + i}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ===== MAIN COMPONENT =====
export default function Faq() {
  const navigate = useNavigate(); // back button

  return (
    <div className="min-h-screen bg-white [font-family:'Plus_Jakarta_Sans',_sans-serif] antialiased">
      <div className="mx-auto w-full max-w-2xl lg:max-w-3xl">

        {/* ===== HERO HEADER ===== */}
        <div className="relative flex flex-col items-center bg-[#14a2ba] px-6 pt-10 pb-16 mb-6 text-center sm:pt-14 sm:pb-20">
          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute left-4 top-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 sm:left-6 sm:top-14"
            aria-label="Kembali"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={2.25} />
          </button>

          {/* Icon */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/25 bg-white text-[#14a2ba] shadow-sm sm:h-20 sm:w-20">
            <HugeiconsIcon icon={MessageQuestionIcon} size={28} strokeWidth={1.75} />
          </div>

          <h1 className="mt-4 text-lg font-bold text-white sm:text-xl">Bantuan & FAQ</h1>
          <p className="mt-1 max-w-xs text-sm text-white/75 leading-relaxed">
            Temukan jawaban atas pertanyaan yang sering diajukan seputar penggunaan aplikasi ini.
          </p>
        </div>

        {/* ===== BODY ===== */}
        <div className="-mt-10 rounded-t-3xl bg-white px-4 pt-10 pb-10 sm:-mt-12 sm:pt-12 sm:px-6 lg:px-8">

          {/* --- FAQ LIST --- */}
          {FAQ_DATA.map((section, i) => (
            <FaqCategory
              key={i}
              category={section.category}
              items={section.items}
              categoryIndex={i}
            />
          ))}

          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}