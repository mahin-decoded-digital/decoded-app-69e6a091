import { useState } from 'react';

export interface ToastState {
  title: string;
  description: string;
  variant: 'default' | 'destructive';
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (next: ToastState) => {
    setToast(next);
    window.setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  return { toast, showToast, clearToast: () => setToast(null) };
};
