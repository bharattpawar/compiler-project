// utils/toast.ts
import { toast } from 'react-hot-toast';

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      duration: 1000,
    });
  },

  error: (message: string) => {
    toast.error(message, {
      duration: 1000,
    });
  },

  loading: (message: string) => {
    return toast.loading(message);
  },

  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  },
};

// Utility functions to replace console logs
export const logError = (message: string) => {
  showToast.error(message);
};

