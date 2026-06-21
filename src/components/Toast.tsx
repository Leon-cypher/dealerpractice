import { X, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';
import type { Toast, ToastType } from '../hooks/useToast';
import { cn } from '../utils/cn';

const ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const STYLES: Record<ToastType, string> = {
  success: 'bg-emerald-900/95 border-emerald-500/50 text-emerald-100',
  error:   'bg-red-900/95 border-red-500/50 text-red-100',
  info:    'bg-slate-800/95 border-white/20 text-white',
  warning: 'bg-yellow-900/95 border-yellow-500/50 text-yellow-100',
};

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none">
      {toasts.map(toast => {
        const Icon = ICONS[toast.type];
        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl pointer-events-auto',
              'animate-in slide-in-from-top-2 duration-300',
              STYLES[toast.type]
            )}
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
