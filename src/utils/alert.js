import Swal from 'sweetalert2';

// Toast styling & config (top-right, auto dismiss)
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  },
  customClass: {
    popup: 'rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 text-sm font-medium',
  },
});

export const showToast = {
  success: (title) => Toast.fire({ icon: 'success', title: title || 'Berhasil!' }),
  error: (title) => Toast.fire({ icon: 'error', title: title || 'Terjadi kesalahan!' }),
  info: (title) => Toast.fire({ icon: 'info', title: title || 'Informasi' }),
  warning: (title) => Toast.fire({ icon: 'warning', title: title || 'Peringatan!' }),
};

export const showConfirm = async ({
  title = 'Apakah Anda yakin?',
  text = 'Tindakan ini tidak dapat dibatalkan.',
  confirmButtonText = 'Ya, Lanjutkan',
  cancelButtonText = 'Batal',
  icon = 'warning',
  confirmButtonColor = '#4f46e5', // indigo-600
  cancelButtonColor = '#64748b',  // slate-500
} = {}) => {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonColor,
    cancelButtonColor,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    customClass: {
      popup: 'rounded-2xl shadow-2xl dark:bg-slate-900 dark:text-white',
      title: 'text-lg font-bold text-slate-800 dark:text-white',
      htmlContainer: 'text-sm text-slate-600 dark:text-slate-300',
      confirmButton: 'px-5 py-2.5 rounded-xl font-medium text-sm shadow-md',
      cancelButton: 'px-5 py-2.5 rounded-xl font-medium text-sm',
    },
  });

  return result.isConfirmed;
};

export const showAlert = ({
  title = 'Pemberitahuan',
  text = '',
  icon = 'info',
  confirmButtonText = 'OK',
  confirmButtonColor = '#4f46e5',
} = {}) => {
  return Swal.fire({
    title,
    text,
    icon,
    confirmButtonColor,
    confirmButtonText,
    customClass: {
      popup: 'rounded-2xl shadow-2xl dark:bg-slate-900 dark:text-white',
      title: 'text-lg font-bold text-slate-800 dark:text-white',
      htmlContainer: 'text-sm text-slate-600 dark:text-slate-300',
      confirmButton: 'px-5 py-2.5 rounded-xl font-medium text-sm shadow-md',
    },
  });
};

export default {
  showToast,
  showConfirm,
  showAlert,
};
