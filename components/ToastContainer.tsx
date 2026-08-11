'use client';

import React, { useEffect } from 'react';
import { PartyPopper, Sun, Bell } from 'lucide-react';
import { AppNotification } from '@/types/notification';

interface ToastContainerProps {
  toasts: AppNotification[];
  isDark?: boolean;
  onDismiss: (id: string) => void;
}

export default function ToastContainer({ toasts, isDark = false, onDismiss }: ToastContainerProps) {
  useEffect(() => {
    if (toasts.length === 0) return;

    // Set auto-dismiss timer for the oldest toast
    const newestToast = toasts[0];
    const timer = setTimeout(() => {
      onDismiss(newestToast.id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col gap-3 max-w-sm w-full px-4 pointer-events-none">
      {toasts.map((toast) => {
        const isCompletion = toast.type === 'completion';
        const isSummary = toast.type === 'summary';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto backdrop-blur-2xl backdrop-saturate-150 border shadow-2xl rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] relative group overflow-hidden ${
              isDark
                ? 'bg-black/50 border-white/15 text-gray-100 shadow-[0_12px_32px_rgba(0,0,0,0.5)]'
                : 'bg-white/40 border-white/60 text-gray-900 shadow-[0_12px_32px_rgba(0,0,0,0.1)]'
            }`}
          >
            {/* Pastel accent side border */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-2.5 ${
                toast.taskColor || (isCompletion ? 'bg-[#A5D6A7]' : isSummary ? 'bg-[#90CAF9]' : 'bg-[#FFE082]')
              }`}
            />

            <div className="pl-3 pr-6 flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  {isCompletion ? (
                    <PartyPopper
                      className={`w-5 h-5 flex-shrink-0 ${
                        isDark ? 'text-emerald-400' : 'text-emerald-600'
                      }`}
                    />
                  ) : isSummary ? (
                    <Sun
                      className={`w-5 h-5 flex-shrink-0 ${
                        isDark ? 'text-blue-400' : 'text-blue-600'
                      }`}
                    />
                  ) : (
                    <Bell
                      className={`w-5 h-5 flex-shrink-0 ${
                        isDark ? 'text-indigo-400' : 'text-indigo-600'
                      }`}
                    />
                  )}
                  <h4
                    className={`text-base font-bold tracking-tight leading-tight ${
                      isDark ? 'text-gray-100' : 'text-gray-900'
                    }`}
                  >
                    {toast.title}
                  </h4>
                </div>
                <p
                  className={`text-xs mt-1 font-medium leading-relaxed ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  {toast.message}
                </p>
                <span
                  className={`text-[10px] mt-2 block ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  {toast.timestamp}
                </span>
              </div>

              {/* Close Dismiss Button */}
              <button
                onClick={() => onDismiss(toast.id)}
                className={`transition-colors p-1 rounded-full ${
                  isDark
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-white/10'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-black/5'
                }`}
                aria-label="Dismiss toast"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
