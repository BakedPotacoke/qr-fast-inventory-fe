import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  build: {
    rollupOptions: {
      output: {
        // -----------------------------------------------------------------------
        // manualChunks: memisahkan vendor library dari kode aplikasi.
        //
        // Manfaat:
        //  1. CACHING — vendor chunks berubah jauh lebih jarang daripada kode
        //     aplikasi. Browser meng-cache vendor-react, vendor-icons, dst. secara
        //     terpisah; deploy baru tidak membatalkan cache library yang tidak berubah.
        //  2. PARALEL LOADING — beberapa chunk bisa diunduh bersamaan (HTTP/2).
        //  3. DEDUPLICATION — library yang dipakai >1 halaman lazy-load tidak
        //     di-bundle ulang di setiap chunk halaman.
        //
        // Catatan:
        //  - html5-qrcode TIDAK perlu dicantumkan di sini karena sudah di-import
        //    secara dinamis di dalam Scan.jsx → Vite otomatis membuat chunk-nya
        //    sendiri dan tidak akan pernah diunduh kecuali /scan dibuka.
        //  - recharts hanya dipakai di halaman admin (Dashboard & Laporan).
        //    Karena kedua halaman itu lazy-loaded, recharts juga tidak akan diunduh
        //    oleh user biasa (non-admin).
        // -----------------------------------------------------------------------
        manualChunks: {
          // Core React — paling kecil perubahannya, cache-nya paling panjang
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],

          // Chart library — cukup besar (~400KB), hanya dipakai halaman admin
          'vendor-charts': ['recharts'],

          // Icon packages — dipakai di hampir semua halaman, lebih baik jadi
          // satu chunk shared daripada duplikat di tiap chunk halaman
          'vendor-icons': [
            'lucide-react',
            '@hugeicons/react',
            '@hugeicons/core-free-icons',
          ],

          // UI utilities yang ringan tapi dipakai lintas halaman
          'vendor-ui': ['sweetalert2', 'react-loading-skeleton'],
        },
      },
    },
  },
})