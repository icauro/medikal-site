"use client";

import { useState, useCallback, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

// Global toast state management
let toastId = 0;
let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

export const showToast = (message: string, type: ToastType = 'info', duration: number = 3000) => {
  const id = `toast-${++toastId}`;
  const newToast: Toast = { id, message, type, duration };
  toasts = [...toasts, newToast];
  
  toastListeners.forEach(listener => listener([...toasts]));
  
  if (duration > 0) {
    setTimeout(() => {
      toasts = toasts.filter(t => t.id !== id);
      toastListeners.forEach(listener => listener([...toasts]));
    }, duration);
  }
  
  return id;
};

export const removeToast = (id: string) => {
  toasts = toasts.filter(t => t.id !== id);
  toastListeners.forEach(listener => listener([...toasts]));
};

/**
 * Hook to use toast notifications
 */
export const useToast = () => {
  const [toastList, setToastList] = useState<Toast[]>([]);

  useEffect(() => {
    toastListeners.push(setToastList);
    setToastList([...toasts]);
    
    return () => {
      toastListeners = toastListeners.filter(listener => listener !== setToastList);
    };
  }, []);

  return {
    success: useCallback((msg: string) => showToast(msg, 'success', 3000), []),
    error: useCallback((msg: string) => showToast(msg, 'error', 4000), []),
    warning: useCallback((msg: string) => showToast(msg, 'warning', 3500), []),
    info: useCallback((msg: string) => showToast(msg, 'info', 3000), []),
  };
};

/**
 * Toast Container Component - Add to your main layout
 */
export function ToastContainer() {
  const [toastList, setToastList] = useState<Toast[]>([]);

  useEffect(() => {
    toastListeners.push(setToastList);
    setToastList([...toasts]);
    
    return () => {
      toastListeners = toastListeners.filter(listener => listener !== setToastList);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] space-y-2 pointer-events-none">
      {toastList.map(toast => (
        <div
          key={toast.id}
          className={`
            px-4 py-3 rounded-lg shadow-lg pointer-events-auto animate-in fade-in slide-in-from-right-full duration-300
            ${
              toast.type === 'success' ? 'bg-emerald-600 text-white' :
              toast.type === 'error' ? 'bg-red-600 text-white' :
              toast.type === 'warning' ? 'bg-amber-600 text-white' :
              'bg-blue-600 text-white'
            }
          `}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">
              {toast.type === 'success' ? '✓' :
               toast.type === 'error' ? '✕' :
               toast.type === 'warning' ? '⚠' :
               'ℹ'}
            </span>
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Confirmation Dialog Component
 */
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-sm w-full">
        <div className="p-6 border-b border-zinc-800">
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>
        
        <div className="p-6">
          <p className="text-zinc-300 text-sm">{message}</p>
        </div>
        
        <div className="p-6 border-t border-zinc-800 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50
              ${isDangerous 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'}
            `}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
