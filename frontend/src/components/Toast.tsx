import React, { useState, useEffect, createContext, useContext, useCallback } from "react";
import "../css/toast.css";

interface ToastData {
  id: number;
  msg: string;
  type: "success" | "error" | "info";
}

interface ToastContextType {
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

let toastId = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((msg: string, type: "success" | "error" | "info" = "success") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="ktm-toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`ktm-toast ktm-toast-${t.type}`}>
            <span className="material-symbols-rounded ktm-toast-icon">
              {t.type === "success" ? "check_circle" : t.type === "error" ? "error" : "info"}
            </span>
            <span className="ktm-toast-msg">{t.msg}</span>
            <button className="ktm-toast-close" onClick={() => removeToast(t.id)}>
              <span className="material-symbols-rounded">close</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
