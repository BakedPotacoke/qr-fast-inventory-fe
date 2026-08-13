/**
 * ImageViewer — global lightbox via yet-another-react-lightbox (yarl)
 * Slider/navigation dinonaktifkan — selalu single image.
 *
 * Install:  npm install yet-another-react-lightbox
 *
 * Setup:
 *   Sudah di-wrap di App.jsx dengan <ImageViewerProvider>.
 *
 * Usage:
 *   const { openViewer } = useImageViewer();
 *   openViewer('https://example.com/photo.jpg');
 */
import { createContext, useContext, useState, useCallback } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

const ImageViewerCtx = createContext(null);

export function ImageViewerProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [src, setSrc]   = useState('');

  const openViewer  = useCallback((imageSrc) => { setSrc(imageSrc); setOpen(true); }, []);
  const closeViewer = useCallback(() => setOpen(false), []);

  return (
    <ImageViewerCtx.Provider value={{ openViewer, closeViewer }}>
      {children}
      <Lightbox
        open={open}
        close={closeViewer}
        slides={[{ src }]}
        controller={{ closeOnBackdropClick: true }}
        // Sembunyikan tombol prev/next — tidak relevan untuk single image
        render={{ buttonPrev: () => null, buttonNext: () => null }}
        styles={{ container: { backgroundColor: 'rgba(15,18,25,0.92)' } }}
      />
    </ImageViewerCtx.Provider>
  );
}

export function useImageViewer() {
  const ctx = useContext(ImageViewerCtx);
  if (!ctx) throw new Error('useImageViewer must be used within <ImageViewerProvider>');
  return ctx;
}