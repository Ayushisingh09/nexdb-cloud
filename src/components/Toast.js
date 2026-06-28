'use client';
import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

const ICONS = {
  success: <><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/></>,
  error: <><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></>,
  info: <><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></>,
};

const COLORS = {
  success: 'var(--success)',
  error: 'var(--error)',
  info: 'var(--info)',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message, opts = {}) => {
    const id = ++counter.current;
    const duration = opts.duration ?? 3500;
    setToasts(prev => [...prev, { id, message, type: opts.type || 'info', title: opts.title }]);
    if (duration > 0) setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2.5 w-full max-w-xs pointer-events-none">
        {toasts.map(t => (
          <div key={t.id}
            className="toast-in pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] shadow-2xl">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: COLORS[t.type] }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
              {ICONS[t.type]}
            </svg>
            <div className="flex-1 min-w-0">
              {t.title && <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight">{t.title}</p>}
              <p className={`${t.title ? 'text-xs mt-0.5' : 'text-sm'} text-[var(--text-secondary)] leading-snug`}>{t.message}</p>
            </div>
            <button onClick={() => dismiss(t.id)}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0 -mr-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  return ctx ? ctx.toast : () => {};
}
