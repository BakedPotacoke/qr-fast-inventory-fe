import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, Search01Icon, Cancel01Icon } from '@hugeicons/core-free-icons';

// ===== DATA FAQ ADMIN (referensi: semua 4 file MD) =====
const FAQ_DATA = [

  // ─── INVENTARIS ───────────────────────────────────────────────
  {
    category: 'Inventaris: Tambah & Edit Barang',
    items: [
      {
        question: 'Bagaimana cara menambahkan barang baru ke dalam sistem inventaris?',
        answer:
          'Buka halaman Inventaris dari menu Admin Panel, lalu tap tombol "Tambah Barang" di pojok kanan atas. Isi field wajib: Nama Barang, SKU, Kategori, dan Status (default: Tersedia). Foto bersifat opsional. Tap "Simpan" — barang baru muncul di halaman pertama (urutan terbaru).',
      },
      {
        question: 'Bisakah SKU diisi lewat scan kamera, bukan manual?',
        answer:
          'Ya. Tap tombol "Scan" di samping kolom SKU untuk membuka scanner kamera. Arahkan ke QR Code atau barcode — hasil scan otomatis mengisi kolom SKU dan menutup scanner. Scanner mendukung QR Code, Code-39, Code-93, Code-128, EAN-8, EAN-13, UPC-A, UPC-E, ITF, Aztec, Data Matrix, dan PDF-417.',
      },
      {
        question: 'Apakah ada tombol flash di scanner SKU?',
        answer:
          'Ya, jika perangkat mendukung, tombol flash (ikon petir) muncul di pojok kanan atas area kamera scanner. Tap untuk menyalakan/mematikan.',
      },
      {
        question: 'SKU yang diketik huruf kecil — apakah otomatis diubah?',
        answer:
          'Ya. Sistem otomatis mengubah SKU menjadi HURUF KAPITAL saat disimpan, apapun yang diketik.',
      },
      {
        question: 'Apakah foto barang wajib diisi?',
        answer:
          'Tidak. Foto bersifat opsional — barang tetap bisa disimpan tanpa foto. Format yang diterima: JPG, PNG, WebP, dan GIF. Jika tidak ada foto, sistem menampilkan ikon barang generik di tabel.',
      },
      {
        question: 'Bagaimana cara mengubah data barang yang sudah ada?',
        answer:
          'Pada tabel inventaris, tap ikon pensil (✏️) di kolom Aksi baris barang yang ingin diubah. Modal Edit terbuka dengan data yang sudah terisi otomatis. Ubah field yang diperlukan (termasuk foto dan status), lalu tap "Simpan". Data di tabel langsung diperbarui tanpa berpindah halaman.',
      },
      {
        question: 'Bagaimana cara menghapus atau mengganti foto barang saat edit?',
        answer:
          'Di form Edit Barang, tap area foto untuk memilih gambar baru, atau tap teks "Hapus foto" (merah, di bawah preview) untuk menghapusnya. Perubahan berlaku saat "Simpan" ditekan.',
      },
      {
        question: 'Apakah status barang bisa diubah langsung dari form Edit?',
        answer:
          'Ya. Di form Edit Barang tersedia empat pilihan status: Tersedia, Dipinjam, Rusak, dan Hilang. Tap salah satu opsi (ditandai border biru) lalu simpan.',
      },
      {
        question: 'Muncul banner merah di form saat menyimpan barang — apa artinya?',
        answer:
          'Ada kesalahan dari server. Pesan errornya ditampilkan di dalam banner. Penyebab umum: koneksi internet bermasalah atau data tidak valid di sisi server. Periksa koneksi, perbaiki isian jika perlu, lalu coba "Simpan" lagi.',
      },
    ],
  },
  {
    category: 'Inventaris: Hapus Barang',
    items: [
      {
        question: 'Bagaimana cara menghapus satu barang?',
        answer:
          'Pastikan status barang bukan "Dipinjam", lalu tap ikon tempat sampah (🗑️) di kolom Aksi. Konfirmasi dengan tap "OK" pada dialog yang muncul. Jika halaman menjadi kosong setelah penghapusan, sistem otomatis berpindah ke halaman sebelumnya.',
      },
      {
        question: 'Mengapa ikon hapus pada barang tertentu berwarna abu-abu dan tidak bisa diklik?',
        answer:
          'Karena barang tersebut sedang berstatus "Dipinjam". Barang dalam peminjaman aktif tidak bisa dihapus untuk menjaga integritas data dan riwayat transaksi. Ikon hapus aktif kembali setelah barang dikembalikan dan statusnya berubah.',
      },
      {
        question: 'Bagaimana cara menghapus beberapa barang sekaligus (Bulk Delete)?',
        answer:
          'Centang checkbox di sisi kiri baris barang yang ingin dihapus, atau centang checkbox di baris header untuk memilih semua sekaligus (barang berstatus "Dipinjam" otomatis dikecualikan). Tap tombol "Hapus (N)" berwarna merah di pojok kanan atas, lalu tap "OK" untuk konfirmasi.',
      },
      {
        question: 'Mengapa checkbox barang tertentu tidak bisa dicentang?',
        answer:
          'Barang berstatus "Dipinjam" tidak bisa dipilih untuk dihapus. Checkbox tampak redup — jika dihover muncul tooltip "Barang sedang dipinjam tidak dapat dipilih".',
      },
      {
        question: 'Apakah "Pilih Semua" di header ikut memilih barang yang sedang dipinjam?',
        answer:
          'Tidak. Checkbox "Pilih Semua" hanya memilih barang yang boleh dihapus — barang berstatus "Dipinjam" otomatis dikecualikan.',
      },
      {
        question: 'Saya ingin menghapus barang yang sedang dipinjam — apa yang harus dilakukan?',
        answer:
          'Barang tidak bisa dihapus selama masih berstatus "Dipinjam". Pastikan barang sudah dikembalikan terlebih dahulu (statusnya berubah menjadi Tersedia, Rusak, atau Hilang), baru kemudian bisa dihapus.',
      },
      {
        question: 'Apakah penghapusan barang bisa dibatalkan setelah dikonfirmasi?',
        answer:
          'Tidak. Penghapusan bersifat permanen begitu "OK" ditekan pada dialog konfirmasi. Pastikan sudah yakin, terutama saat hapus massal.',
      },
      {
        question: 'Pilihan centang saya hilang saat ganti halaman atau filter — apakah normal?',
        answer:
          'Ya, disengaja. Pilihan direset otomatis setiap kali halaman, filter status, kategori, pencarian, atau urutan diubah — mencegah kesalahan menghapus barang yang tidak terlihat di layar.',
      },
    ],
  },
  {
    category: 'Inventaris: Filter, Pencarian & Tampilan',
    items: [
      {
        question: 'Bagaimana cara mencari barang di halaman Inventaris?',
        answer:
          'Gunakan kolom pencarian di toolbar — ketik nama barang atau kode SKU. Hasil diperbarui otomatis ~0,5 detik setelah berhenti mengetik. Tap ikon ✕ di sisi kanan untuk menghapus pencarian.',
      },
      {
        question: 'Bagaimana cara menyaring barang berdasarkan status?',
        answer:
          'Gunakan tab filter status di bawah toolbar: Semua, Tersedia, Dipinjam, Rusak, dan Hilang. Jumlah barang per status ditampilkan di dalam masing-masing tab.',
      },
      {
        question: 'Bagaimana cara menyaring barang berdasarkan kategori?',
        answer:
          'Gunakan dropdown Kategori (ikon label) di toolbar. Pilih "Semua Kategori" untuk menghapus filter ini.',
      },
      {
        question: 'Bagaimana cara mengurutkan daftar barang?',
        answer:
          'Gunakan dropdown Urutkan di toolbar. Tersedia: Terbaru Ditambahkan (default), Terlama Ditambahkan, Nama A-Z, dan Nama Z-A.',
      },
      {
        question: 'Berapa barang yang ditampilkan per halaman?',
        answer:
          'Halaman Inventaris menampilkan 15 barang per halaman. Navigasi antar halaman tersedia di bawah tabel.',
      },
      {
        question: 'Kartu statistik di atas tabel menampilkan apa saja?',
        answer:
          'Ada empat kartu: Total Barang (semua barang terdaftar), Tersedia, Dipinjam, dan Rusak/Hilang (gabungan). Angka mencerminkan data keseluruhan — bukan hanya halaman yang sedang ditampilkan.',
      },
    ],
  },

  // ─── TRANSAKSI ───────────────────────────────────────────────
  {
    category: 'Transaksi: Memahami Halaman',
    items: [
      {
        question: 'Apa saja informasi yang ditampilkan di halaman Kelola Transaksi?',
        answer:
          'Halaman ini menampilkan seluruh riwayat peminjaman barang oleh pegawai. Subjudul menampilkan ringkasan: "X barang sedang dipinjam dari total Y transaksi". Terdapat tiga kartu statistik: Total Transaksi, Sedang Dipinjam, dan Selesai — selalu diperbarui otomatis setiap kali ada perubahan status.',
      },
      {
        question: 'Apa saja kolom yang ada di tabel Transaksi?',
        answer:
          'Kolom tabel: No (nomor urut lintas halaman), Barang (nama + SKU), Peminjam, Kategori, Waktu Pinjam (DD Mon YYYY, HH:MM), Waktu Kembali (tampil "-" selama masih berstatus Dipinjam), dan Status (dropdown interaktif berwarna: kuning = Dipinjam, hijau = Selesai).',
      },
      {
        question: 'Kapan angka di kartu statistik Transaksi diperbarui?',
        answer:
          'Otomatis setiap kali ada perubahan status yang berhasil disimpan — tanpa perlu refresh halaman. Angka kartu mencerminkan data keseluruhan, bukan hanya halaman aktif tabel.',
      },
    ],
  },
  {
    category: 'Transaksi: Mengubah Status',
    items: [
      {
        question: 'Bagaimana cara mengubah status transaksi dari Dipinjam menjadi Selesai?',
        answer:
          'Langsung dari tabel — tap dropdown pada kolom Status di baris transaksi yang ingin diubah, pilih "Selesai", lalu konfirmasi pada dialog yang muncul. Tidak perlu membuka halaman lain.',
      },
      {
        question: 'Apakah saya bisa mengubah status dari Selesai kembali ke Dipinjam?',
        answer:
          'Ya. Dropdown status mendukung perubahan dua arah: Dipinjam ke Selesai maupun sebaliknya. Prosesnya sama — pilih dari dropdown, konfirmasi dialog.',
      },
      {
        question: 'Apa yang terjadi pada kolom "Waktu Kembali" saat status diubah?',
        answer:
          'Jika status diubah ke Selesai: kolom Waktu Kembali otomatis terisi dengan waktu saat perubahan dikonfirmasi. Jika status diubah kembali ke Dipinjam: kolom Waktu Kembali dikosongkan dan menampilkan "-".',
      },
      {
        question: 'Dropdown status pada suatu baris tidak bisa diklik sementara — mengapa?',
        answer:
          'Dropdown dinonaktifkan sementara selama sistem memproses perubahan status untuk baris tersebut (ditandai ikon berputar). Ini mencegah perubahan ganda yang bisa menyebabkan data tidak konsisten. Dropdown aktif kembali setelah proses selesai.',
      },
      {
        question: 'Muncul notifikasi merah setelah mencoba mengubah status — apa yang harus dilakukan?',
        answer:
          'Notifikasi merah menandakan kegagalan penyimpanan ke server — status transaksi tidak berubah. Periksa koneksi internet, pastikan sesi login masih aktif, lalu coba lagi. Jika masalah berlanjut, hubungi tim IT.',
      },
      {
        question: 'Apakah ada tombol refresh untuk memperbarui data tabel secara manual?',
        answer:
          'Tidak ada tombol refresh khusus dalam kondisi normal. Data diperbarui otomatis setiap kali filter, pencarian, atau urutan diubah. Jika tabel menampilkan error, tombol "Coba lagi" akan muncul di tengah tabel.',
      },
    ],
  },
  {
    category: 'Transaksi: Filter & Pencarian',
    items: [
      {
        question: 'Apa saja yang bisa dicari melalui kolom pencarian Transaksi?',
        answer:
          'Pencarian berjalan pada tiga field sekaligus: nama barang, nama peminjam, dan kode SKU. Hasil diperbarui otomatis ~0,5 detik setelah berhenti mengetik (debounce 500ms) — tidak perlu menekan Enter. Tap ✕ untuk menghapus pencarian.',
      },
      {
        question: 'Bagaimana cara memfilter transaksi berdasarkan status (Dipinjam/Selesai)?',
        answer:
          'Gunakan tiga tab di bawah toolbar: Semua, Dipinjam, dan Selesai. Angka di dalam tab menampilkan jumlah total per status secara global (lintas semua halaman), bukan hanya halaman aktif.',
      },
      {
        question: 'Bagaimana cara memfilter transaksi berdasarkan kategori barang?',
        answer:
          'Gunakan dropdown Kategori (ikon label) di toolbar. Pilih "Semua Kategori" untuk menghapus filter ini.',
      },
      {
        question: 'Bagaimana cara mengurutkan data transaksi?',
        answer:
          'Gunakan dropdown Urutkan di toolbar: Waktu Pinjam Terbaru (default), Waktu Pinjam Terlama, Nama Barang A-Z, dan Nama Barang Z-A.',
      },
      {
        question: 'Apakah halaman Transaksi punya filter rentang tanggal?',
        answer:
          'Tidak. Halaman Transaksi tidak memiliki filter rentang tanggal. Untuk menelusuri berdasarkan periode waktu, gunakan kombinasi filter status dan pencarian nama barang/peminjam, lalu urutkan berdasarkan Waktu Pinjam Terlama atau Terbaru.',
      },
      {
        question: 'Bagaimana cara melihat semua barang yang paling lama belum dikembalikan?',
        answer:
          'Tap tab "Dipinjam" untuk menyaring hanya transaksi aktif, lalu ubah dropdown Urutkan ke "Waktu Pinjam Terlama". Transaksi dengan peminjaman paling lama muncul di baris paling atas.',
      },
      {
        question: 'Tabel menampilkan "Tidak ada transaksi yang cocok" — apa penyebabnya?',
        answer:
          'Kombinasi filter aktif tidak menghasilkan data yang cocok. Coba hapus pencarian, ubah tab status ke "Semua", dan reset kategori ke "Semua Kategori" untuk menampilkan seluruh data kembali.',
      },
      {
        question: 'Berapa transaksi yang ditampilkan per halaman?',
        answer:
          'Tabel menampilkan 15 transaksi per halaman. Nomor urut di kolom "No" dihitung lintas halaman — halaman 2 dimulai dari nomor 16, halaman 3 dari nomor 31, dan seterusnya.',
      },
    ],
  },

  // ─── LAPORAN ─────────────────────────────────────────────────
  {
    category: 'Laporan: Memahami Data & Statistik',
    items: [
      {
        question: 'Apa saja informasi yang ditampilkan di halaman Laporan?',
        answer:
          'Halaman Laporan menampilkan rekap seluruh laporan kondisi barang yang dikirim pegawai saat mengembalikan atau melaporkan barang hilang. Kolom tabel: No, Peminjam, Barang (nama + SKU), Kategori, Kondisi (Baik/Rusak/Hilang), Keterangan, Bukti Foto, Waktu Pinjam, dan Waktu Kembali.',
      },
      {
        question: 'Apa fungsi kartu statistik di halaman Laporan?',
        answer:
          'Terdapat tiga kartu: Total Laporan (semua laporan tercatat), Laporan Bulan Ini (laporan masuk bulan berjalan), dan Kondisi Rusak/Hilang (gabungan laporan rusak dan hilang yang perlu perhatian admin). Angka mencerminkan data keseluruhan sistem.',
      },
      {
        question: 'Apa yang dimaksud dengan "Kondisi Rusak/Hilang" di kartu statistik?',
        answer:
          'Jumlah gabungan laporan dengan kondisi Rusak dan Hilang — barang-barang yang membutuhkan tindak lanjut dari admin (perbaikan, penggantian, atau penghapusan dari inventaris).',
      },
      {
        question: 'Angka di kartu statistik tidak sama dengan jumlah baris di tabel — mengapa?',
        answer:
          'Kartu statistik menampilkan data keseluruhan dari seluruh halaman, sedangkan tabel hanya menampilkan 15 laporan per halaman. Jika ada filter aktif, tabel hanya menampilkan subset data yang cocok, sementara kartu tetap menghitung semua data di sistem.',
      },
      {
        question: 'Berapa laporan yang ditampilkan per halaman?',
        answer:
          'Tabel menampilkan 15 laporan per halaman. Nomor urut di kolom "No" dihitung lintas halaman.',
      },
    ],
  },
  {
    category: 'Laporan: Filter & Pencarian',
    items: [
      {
        question: 'Apa saja yang bisa dicari melalui kolom pencarian Laporan?',
        answer:
          'Pencarian berjalan pada tiga field sekaligus: nama barang, nama peminjam, dan kategori. Hasil diperbarui otomatis ~0,5 detik setelah berhenti mengetik. Tap ✕ untuk menghapus pencarian.',
      },
      {
        question: 'Bagaimana cara memfilter laporan berdasarkan kondisi barang?',
        answer:
          'Gunakan empat tab di bawah toolbar: Semua, Baik, Rusak, dan Hilang. Angka di dalam tab menampilkan jumlah total per kondisi secara global — tidak berubah saat filter lain aktif.',
      },
      {
        question: 'Bagaimana cara memfilter laporan berdasarkan rentang tanggal?',
        answer:
          'Di sisi kanan toolbar terdapat dua input tanggal (ikon kalender). Tap input pertama untuk memilih tanggal mulai, tap input kedua untuk tanggal akhir. Keduanya bisa diisi sendiri-sendiri — misalnya hanya tanggal mulai untuk melihat laporan sejak tanggal tertentu hingga sekarang.',
      },
      {
        question: 'Saya ingin melihat laporan bulan lalu saja — bagaimana caranya?',
        answer:
          'Gunakan filter Rentang Tanggal. Isi input pertama dengan tanggal 1 bulan lalu, input kedua dengan tanggal terakhir bulan lalu. Tabel otomatis memuat ulang hanya laporan dalam rentang tersebut.',
      },
      {
        question: 'Apakah semua filter di halaman Laporan bisa dikombinasikan?',
        answer:
          'Ya. Filter kondisi, kategori, rentang tanggal, pencarian, dan urutan bisa aktif sekaligus. Ekspor CSV juga mengikuti semua kombinasi filter aktif saat tombol ditekan.',
      },
      {
        question: 'Bagaimana cara mereset semua filter ke kondisi awal?',
        answer:
          'Tidak ada tombol "reset semua" khusus. Lakukan manual: hapus teks pencarian (tap ✕), ubah tab kondisi ke "Semua", dropdown kategori ke "Semua Kategori", kosongkan kedua input tanggal, dan ubah urutan ke "Terbaru Dilaporkan".',
      },
      {
        question: 'Tabel menampilkan "Belum ada laporan yang cocok" padahal data ada di kartu statistik — mengapa?',
        answer:
          'Kombinasi filter aktif (pencarian, kondisi, kategori, atau rentang tanggal) tidak menghasilkan data yang cocok. Perlonggar salah satu filter atau hapus pencarian untuk melihat lebih banyak data.',
      },
      {
        question: 'Bagaimana cara mengurutkan daftar laporan?',
        answer:
          'Gunakan dropdown Urutkan di toolbar: Terbaru Dilaporkan (default), Terlama Dilaporkan, Nama Barang A-Z, dan Nama Barang Z-A.',
      },
    ],
  },
  {
    category: 'Laporan: Foto Bukti & Ekspor CSV',
    items: [
      {
        question: 'Bagaimana cara melihat foto bukti dalam ukuran penuh?',
        answer:
          'Pada kolom Bukti Foto, tap thumbnail kecil untuk membuka modal preview yang menampilkan foto dalam ukuran maksimal layar. Tutup dengan tap tombol ✕ di pojok kanan atas atau tap area gelap di luar foto.',
      },
      {
        question: 'Kolom Bukti Foto menampilkan ikon placeholder — apa artinya?',
        answer:
          'Artinya tidak ada foto yang diunggah untuk laporan tersebut. Untuk laporan Hilang, pegawai memang tidak diwajibkan mengunggah foto. Untuk laporan pengembalian (Baik/Rusak), foto seharusnya ada — admin bisa menindaklanjuti langsung ke pegawai.',
      },
      {
        question: 'Apakah foto bukti bisa diunduh dari halaman ini?',
        answer:
          'Saat ini belum tersedia tombol unduh foto. Tap thumbnail untuk melihat foto ukuran penuh, lalu gunakan fitur simpan gambar bawaan browser (klik kanan → "Simpan gambar sebagai...") untuk mengunduhnya secara manual.',
      },
      {
        question: 'Bagaimana cara mengekspor data laporan ke file CSV?',
        answer:
          'Terapkan filter yang diinginkan terlebih dahulu, lalu tap tombol "Ekspor CSV" (ikon unduh) di pojok kanan atas. File CSV langsung terunduh otomatis dengan nama laporan-barang-YYYY-MM-DD.csv. Ekspor mengambil semua data yang cocok dengan filter aktif — bukan hanya 15 baris di halaman aktif.',
      },
      {
        question: 'Kolom apa saja yang ada dalam file CSV hasil ekspor?',
        answer:
          'File CSV memiliki kolom: Peminjam, Barang, Kategori, Kondisi, Keterangan, Waktu Pinjam, dan Waktu Kembali. Kolom Bukti Foto tidak disertakan karena berupa file gambar, bukan teks.',
      },
      {
        question: 'Tombol "Ekspor CSV" berwarna abu-abu dan tidak bisa diklik — mengapa?',
        answer:
          'Ada dua kemungkinan: sedang dalam proses ekspor (tombol berubah jadi "Mengekspor..."), atau belum ada data laporan sama sekali di sistem (Total Laporan = 0). Tombol dinonaktifkan otomatis jika tidak ada data untuk diekspor.',
      },
      {
        question: 'File CSV sudah terunduh tapi karakter hurufnya rusak di Excel — apa solusinya?',
        answer:
          'Ini masalah encoding. File menggunakan UTF-8 dengan BOM. Jika masih rusak: buka Excel → menu Data → From Text/CSV → pilih file → pastikan encoding diatur ke UTF-8.',
      },
    ],
  },

  // ─── KELOLA PENGGUNA ─────────────────────────────────────────
  {
    category: 'Pengguna: Memahami Halaman',
    items: [
      {
        question: 'Apa fungsi halaman Kelola Pengguna?',
        answer:
          'Pusat manajemen akun seluruh pengguna sistem — Admin maupun Pegawai. Terdapat tiga kartu statistik: Total Pengguna, Admin, dan Pegawai. Angka diperbarui otomatis setiap kali ada penambahan, perubahan, atau penghapusan akun.',
      },
      {
        question: 'Apa perbedaan role Admin dan Pegawai?',
        answer:
          'Pegawai hanya dapat meminjam dan mengembalikan barang melalui fitur Scan QR. Admin memiliki akses penuh: mengelola inventaris, melihat semua transaksi dan laporan, mengelola pengguna, serta mengubah status transaksi.',
      },
      {
        question: 'Apa arti label "(Anda)" di samping nama pengguna?',
        answer:
          'Label tersebut menandakan baris itu adalah akun milik admin yang sedang login saat ini. Akun yang bertanda "(Anda)" tidak bisa dihapus.',
      },
      {
        question: 'Berapa pengguna yang ditampilkan per halaman?',
        answer:
          'Tabel menampilkan 15 pengguna per halaman. Nomor urut dihitung lintas halaman.',
      },
    ],
  },
  {
    category: 'Pengguna: Tambah & Edit Akun',
    items: [
      {
        question: 'Bagaimana cara menambahkan akun pengguna baru?',
        answer:
          'Tap tombol "Tambah Pengguna" (biru) di toolbar kanan atas tabel. Isi form: Nama Lengkap (min. 2 karakter), Email (format valid), Role (default: Pegawai), Password (min. 8 karakter), dan Konfirmasi Password. Tap "Simpan" — akun baru muncul di urutan teratas halaman pertama.',
      },
      {
        question: 'Apakah password bisa dilihat saat diketik?',
        answer:
          'Ya. Tap ikon mata (👁️) di sisi kanan kolom password untuk menampilkan atau menyembunyikan karakter. Berlaku untuk kolom Password maupun Konfirmasi Password.',
      },
      {
        question: 'Saya lupa mengisi Konfirmasi Password saat tambah pengguna — apakah form bisa disimpan?',
        answer:
          'Tidak. Saat mode Tambah, Konfirmasi Password wajib diisi dan harus sama persis dengan Password. Jika dikosongkan atau berbeda, pesan error muncul dan form tidak bisa disimpan.',
      },
      {
        question: 'Bagaimana cara mengubah data atau password pengguna yang sudah ada?',
        answer:
          'Tap ikon pensil (✏️) di kolom Aksi baris pengguna yang ingin diubah. Modal Edit terbuka dengan data yang sudah terisi otomatis (nama, email, role) — kolom password selalu kosong. Ubah field yang diperlukan, lalu tap "Simpan". Jika password tidak ingin diganti, biarkan kolom Password kosong.',
      },
      {
        question: 'Saat edit pengguna, apakah password lama akan terhapus jika kolom password dikosongkan?',
        answer:
          'Tidak. Jika kolom Password dikosongkan saat edit, password lama tidak berubah. Password hanya diperbarui jika kamu mengisi kolom Password dengan nilai baru dan mengonfirmasinya.',
      },
      {
        question: 'Kapan kolom Konfirmasi Password muncul saat mode Edit?',
        answer:
          'Kolom Konfirmasi Password hanya muncul jika kolom Password diisi. Jika Password dikosongkan, Konfirmasi Password tidak tampil sama sekali.',
      },
      {
        question: 'Apakah role pengguna bisa diubah dari Pegawai menjadi Admin (atau sebaliknya)?',
        answer:
          'Ya. Gunakan form Edit Pengguna → ubah dropdown Role ke nilai yang diinginkan → Simpan. Perubahan berlaku segera setelah disimpan.',
      },
      {
        question: 'Muncul banner merah di form saat menyimpan pengguna — apa artinya?',
        answer:
          'Ada kesalahan dari server. Penyebab paling umum adalah email yang dimasukkan sudah digunakan oleh akun lain di sistem. Periksa pesan errornya, perbaiki isian, lalu coba simpan lagi.',
      },
      {
        question: 'Setelah berhasil menambah pengguna, mengapa saya berpindah ke halaman pertama tabel?',
        answer:
          'Ini disengaja. Akun baru ditampilkan di urutan paling atas (diurutkan berdasarkan Terbaru Ditambahkan secara default), sehingga sistem otomatis memuat halaman pertama agar akun yang baru dibuat langsung terlihat.',
      },
    ],
  },
  {
    category: 'Pengguna: Hapus Akun',
    items: [
      {
        question: 'Bagaimana cara menghapus pengguna?',
        answer:
          'Tap ikon tempat sampah (🗑️) di kolom Aksi baris pengguna yang ingin dihapus. Modal konfirmasi muncul menampilkan nama dan email akun beserta peringatan permanen. Tap tombol "Hapus" (merah) untuk melanjutkan, atau "Batal" untuk membatalkan.',
      },
      {
        question: 'Mengapa ikon hapus pada akun saya sendiri berwarna abu-abu?',
        answer:
          'Admin tidak diizinkan menghapus akun miliknya sendiri untuk mencegah situasi di mana sistem tidak memiliki Admin aktif. Jika perlu menonaktifkan akunmu sendiri, minta Admin lain untuk melakukannya.',
      },
      {
        question: 'Apakah penghapusan pengguna bisa dibatalkan setelah dikonfirmasi?',
        answer:
          'Tidak. Penghapusan bersifat permanen begitu tombol "Hapus" di modal konfirmasi ditekan. Modal konfirmasi menampilkan nama dan email akun — pastikan sudah yakin sebelum melanjutkan.',
      },
      {
        question: 'Modal hapus menampilkan pesan error merah dan tidak tertutup — apa yang harus dilakukan?',
        answer:
          'Penghapusan gagal di sisi server. Modal sengaja tidak tertutup agar kamu bisa mencoba lagi tanpa membuka modal dari awal. Periksa koneksi internet, pastikan sesi login masih aktif, lalu tap "Hapus" sekali lagi. Jika terus gagal, hubungi tim IT.',
      },
      {
        question: 'Apakah data transaksi pengguna yang dihapus ikut terhapus?',
        answer:
          'Bergantung pada konfigurasi database di sisi server. Secara umum, riwayat transaksi dan laporan yang terkait dengan pengguna tetap tersimpan untuk keperluan audit meski akun sudah dihapus. Konfirmasikan dengan tim teknis jika dibutuhkan kepastian.',
      },
    ],
  },
  {
    category: 'Pengguna: Pencarian, Filter & Pengurutan',
    items: [
      {
        question: 'Apa saja yang bisa dicari melalui kolom pencarian Kelola Pengguna?',
        answer:
          'Pencarian berjalan pada dua field: nama lengkap dan email pengguna. Hasil diperbarui otomatis ~0,5 detik setelah berhenti mengetik.',
      },
      {
        question: 'Bagaimana cara menampilkan hanya pengguna dengan role tertentu?',
        answer:
          'Gunakan tab filter role di bawah toolbar: tap "Admin" untuk hanya menampilkan admin, "Pegawai" untuk hanya menampilkan pegawai, atau "Semua" untuk menampilkan semua. Angka di dalam tab menunjukkan jumlah total per role secara global.',
      },
      {
        question: 'Bagaimana cara mengurutkan daftar pengguna?',
        answer:
          'Gunakan dropdown Urutkan di toolbar: Terbaru Ditambahkan (default), Terlama Ditambahkan, Nama A-Z, dan Nama Z-A.',
      },
      {
        question: 'Bisakah filter role dan pencarian nama digunakan bersamaan?',
        answer:
          'Ya. Semua filter bisa dikombinasikan. Contoh: mencari nama "Budi" di tab "Admin" akan menampilkan hanya pengguna bernama Budi yang berole Admin.',
      },
    ],
  },
];

// ===== SEARCH HOOK =====
function useSearch(data, query) {
  return useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.question.toLowerCase().includes(q) ||
            item.answer.toLowerCase().includes(q)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [data, query]);
}

// ===== FAQ ITEM =====
function FaqItem({ question, answer, index }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.4) }}
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
            <div className="px-4 pb-4 pt-0">
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
      transition={{ duration: 0.3, delay: categoryIndex * 0.06 }}
      className="mb-8"
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
            index={categoryIndex * 4 + i}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ===== MAIN COMPONENT =====
export default function AdminFaq() {
  const [searchQuery, setSearchQuery] = useState('');
  const filtered = useSearch(FAQ_DATA, searchQuery);

  const totalQ = FAQ_DATA.reduce((acc, s) => acc + s.items.length, 0);
  const filteredQ = filtered.reduce((acc, s) => acc + s.items.length, 0);

  return (
    <div>
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">FAQ Admin</h1>
        <p className="mt-1 text-sm text-slate-500">
          Panduan lengkap pengelolaan inventaris, transaksi, laporan, serta manajemen akun pengguna
        </p>
      </div>

      {/* SEARCH BAR */}
      <div className="mt-4 relative">
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          <HugeiconsIcon icon={Search01Icon} size={16} className="text-slate-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Cari dari ${totalQ} pertanyaan...`}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm text-slate-700 placeholder-slate-400 shadow-sm outline-none focus:border-[#14a2ba]/50 focus:ring-2 focus:ring-[#14a2ba]/20 transition-all duration-200"
        />
        <AnimatePresence>
          {searchQuery && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={14} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* KONTEN FAQ */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 pt-6 pb-6 shadow-sm sm:px-6">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-slate-500">Tidak ada pertanyaan yang cocok dengan "{searchQuery}"</p>
            <p className="mt-1 text-xs text-slate-400">Coba kata kunci lain</p>
          </div>
        ) : (
          <>
            {searchQuery && (
              <p className="mb-4 text-xs text-slate-400">
                Menampilkan {filteredQ} dari {totalQ} pertanyaan
              </p>
            )}
            {filtered.map((section, i) => (
              <FaqCategory
                key={i}
                category={section.category}
                items={section.items}
                categoryIndex={i}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}