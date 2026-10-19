import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X, HelpCircle, Loader2 } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void | Promise<void>;
}

interface ToastContextValue {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  };
  confirmModal: (options: ConfirmOptions) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    options: null,
    isLoading: false
  });

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);

    setTimeout(() => {
      removeToast(id);
    }, 3800);
  }, [removeToast]);

  const toast = {
    success: (msg: string) => addToast('success', msg),
    error: (msg: string) => addToast('error', msg),
    info: (msg: string) => addToast('info', msg),
  };

  const confirmModal = useCallback((options: ConfirmOptions) => {
    setConfirmState({
      isOpen: true,
      options,
      isLoading: false
    });
  }, []);

  const handleCloseConfirm = () => {
    if (confirmState.isLoading) return;
    setConfirmState({ isOpen: false, options: null, isLoading: false });
  };

  const handleConfirmAction = async () => {
    if (!confirmState.options) return;
    try {
      setConfirmState(prev => ({ ...prev, isLoading: true }));
      await confirmState.options.onConfirm();
      setConfirmState({ isOpen: false, options: null, isLoading: false });
    } catch (err) {
      console.error('Error during confirm action:', err);
      setConfirmState(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <ToastContext.Provider value={{ toast, confirmModal }}>
      {children}

      {/* TOAST CONTAINER */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '420px',
          pointerEvents: 'none'
        }}
      >
        {toasts.map(t => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const bg = isSuccess ? '#ecfdf5' : isError ? '#fef2f2' : '#eff6ff';
          const border = isSuccess ? '#10b981' : isError ? '#ef4444' : '#3b82f6';
          const textColor = isSuccess ? '#065f46' : isError ? '#991b1b' : '#1e40af';

          return (
            <div
              key={t.id}
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: bg,
                color: textColor,
                borderLeft: `4px solid ${border}`,
                borderRadius: '8px',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)',
                fontSize: '14px',
                fontWeight: 500,
                lineHeight: 1.4,
                animation: 'slideInRight 0.25s ease-out',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ flexShrink: 0 }}>
                {isSuccess && <CheckCircle2 size={20} color="#10b981" />}
                {isError && <AlertCircle size={20} color="#ef4444" />}
                {!isSuccess && !isError && <Info size={20} color="#3b82f6" />}
              </div>
              <div style={{ flex: 1 }}>{t.message}</div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: textColor,
                  opacity: 0.6,
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'opacity 0.15s'
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {/* CONFIRM MODAL OVERLAY */}
      {confirmState.isOpen && confirmState.options && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 99998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={handleCloseConfirm}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              animation: 'modalFadeIn 0.2s ease-out'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  backgroundColor: confirmState.options.isDestructive ? '#fee2e2' : '#e0f2fe'
                }}
              >
                {confirmState.options.isDestructive ? (
                  <AlertCircle size={22} color="#dc2626" />
                ) : (
                  <HelpCircle size={22} color="#0284c7" />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    margin: '0 0 8px 0',
                    fontSize: '17px',
                    fontWeight: 600,
                    color: '#0f172a'
                  }}
                >
                  {confirmState.options.title || 'Xác nhận thao tác'}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: '14px',
                    color: '#475569',
                    lineHeight: 1.5
                  }}
                >
                  {confirmState.options.message}
                </p>
              </div>
            </div>

            <div
              style={{
                marginTop: '24px',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}
            >
              <button
                type="button"
                onClick={handleCloseConfirm}
                disabled={confirmState.isLoading}
                style={{
                  padding: '9px 18px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: confirmState.isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {confirmState.options.cancelText || 'Hủy'}
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={confirmState.isLoading}
                style={{
                  padding: '9px 18px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: confirmState.options.isDestructive ? '#dc2626' : '#2563eb',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: confirmState.isLoading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {confirmState.isLoading && <Loader2 size={16} className="animate-spin" />}
                {confirmState.options.confirmText || (confirmState.options.isDestructive ? 'Xác nhận xóa' : 'Đồng ý')}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
