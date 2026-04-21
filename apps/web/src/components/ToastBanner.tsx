import { CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToastState } from '@/hooks/use-toast';

interface ToastBannerProps {
  toast: ToastState | null;
}

export const ToastBanner = ({ toast }: ToastBannerProps) => {
  if (!toast) {
    return null;
  }

  const isError = toast.variant === 'destructive';

  return (
    <div
      className={cn(
        'fixed right-4 top-4 z-50 flex w-full max-w-sm items-start gap-3 rounded-lg border bg-card p-4 shadow-lg',
        isError ? 'border-destructive/40' : 'border-primary/20',
      )}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
      ) : (
        <CheckCircle className="mt-0.5 h-5 w-5 text-primary" />
      )}
      <div>
        <p className="font-semibold text-foreground">{toast.title}</p>
        <p className="text-sm text-muted-foreground">{toast.description}</p>
      </div>
    </div>
  );
};
