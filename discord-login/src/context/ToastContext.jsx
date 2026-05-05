import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info, Loader2 } from 'lucide-react';

const ToastContext = createContext();

// Component chính quản lý hệ thống thông báo
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Hàm gọi thông báo: duration mặc định 3s
  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Container: Cố định nằm trên cùng, chính giữa màn hình (top-center) */}
      <div className="fixed top-4 md:top-8 left-1/2 -translate-x-1/2 z-[1000] flex flex-col gap-3 w-[92%] max-w-[380px] pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Component con: Từng mẩu thông báo lẻ
const ToastItem = ({ message, type, duration, onClose }) => {
  const configs = {
    success: { 
      icon: <CheckCircle2 size={20} />, 
      bg: 'bg-[#23a55a]', 
      border: 'border-[#1a7a42]',
      progress: 'bg-[#1a7a42]' 
    },
    error: { 
      icon: <AlertCircle size={20} />, 
      bg: 'bg-[#f23f43]', 
      border: 'border-[#a12d2f]',
      progress: 'bg-[#a12d2f]'
    },
    info: { 
      icon: <Info size={20} />, 
      bg: 'bg-[#5865f2]', 
      border: 'border-[#4752c4]',
      progress: 'bg-[#4752c4]'
    },
    loading: { 
      icon: <Loader2 size={20} className="animate-spin" />, 
      bg: 'bg-[#4e5058]', 
      border: 'border-[#3f4147]',
      progress: 'bg-[#3f4147]'
    },
  };

  const config = configs[type] || configs.success;

  return (
    <div className={`
      relative overflow-hidden ${config.bg} ${config.border} border text-white 
      p-4 rounded-lg shadow-2xl flex items-start justify-between gap-3 pointer-events-auto
      animate-in fade-in slide-in-from-top-4 duration-300
    `}>
      <div className="flex items-center gap-3">
        <span className="shrink-0 mt-0.5">{config.icon}</span>
        <span className="text-[14px] font-semibold leading-tight">{message}</span>
      </div>
      
      <button 
        onClick={onClose} 
        className="hover:bg-black/10 p-1 rounded-full transition-colors shrink-0"
      >
        <X size={16} />
      </button>

      {/* Thanh tiến trình chạy ngầm (Progress Bar) */}
      {type !== 'loading' && (
        <div 
          className={`absolute bottom-0 left-0 h-1 ${config.progress} opacity-40`}
          style={{ 
            animation: `shrinkWidth ${duration}ms linear forwards`,
            width: '100%'
          }}
        />
      )}

      {/* Inline style cho keyframe */}
      <style>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

// Hook để sử dụng nhanh
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast phải được đặt trong ToastProvider');
  }
  return context;
};