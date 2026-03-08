import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

let idCounter = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = idCounter++;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter(x => x.id !== id));
    }, duration);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((t) => t.filter(x => x.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ minWidth: 200, padding: 10, borderRadius: 6, background: t.type === 'error' ? 'rgba(220,53,69,0.95)' : t.type === 'success' ? 'rgba(40,167,69,0.95)' : 'rgba(33,37,41,0.95)', color: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.addToast;
}
