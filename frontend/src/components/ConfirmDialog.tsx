import React, { useCallback, useEffect, useState } from "react";
import "../css/confirm-dialog.css";

interface DialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: "default" | "danger";
}

type PendingDialog =
  | (DialogOptions & { kind: "confirm"; resolve: (value: boolean) => void })
  | (DialogOptions & { kind: "alert"; resolve: (value: void) => void });

let openConfirm: ((options: DialogOptions) => Promise<boolean>) | null = null;
let openAlert: ((options: DialogOptions) => Promise<void>) | null = null;

/**
 * Promise-based replacement for window.confirm(). Renders a centered
 * overlay dialog instead of the native browser prompt. Works from plain
 * (non-component) modules too, as long as <ConfirmDialogProvider> is
 * mounted somewhere in the tree (it's mounted once in App.tsx).
 */
export function confirmDialog(
  message: string,
  options: Omit<DialogOptions, "message"> = {},
): Promise<boolean> {
  if (openConfirm) return openConfirm({ message, ...options });
  // Fallback in the unlikely case the provider hasn't mounted yet.
  return Promise.resolve(window.confirm(message));
}

/**
 * Promise-based replacement for window.alert(). Renders a centered
 * overlay dialog with a single acknowledgement button.
 */
export function alertDialog(
  message: string,
  options: Omit<DialogOptions, "message"> = {},
): Promise<void> {
  if (openAlert) return openAlert({ message, ...options });
  window.alert(message);
  return Promise.resolve();
}

export const ConfirmDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pending, setPending] = useState<PendingDialog | null>(null);

  const requestConfirm = useCallback((options: DialogOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, kind: "confirm", resolve });
    });
  }, []);

  const requestAlert = useCallback((options: DialogOptions) => {
    return new Promise<void>((resolve) => {
      setPending({ ...options, kind: "alert", resolve });
    });
  }, []);

  useEffect(() => {
    openConfirm = requestConfirm;
    openAlert = requestAlert;
    return () => {
      openConfirm = null;
      openAlert = null;
    };
  }, [requestConfirm, requestAlert]);

  const close = useCallback(
    (value: boolean) => {
      if (!pending) return;
      if (pending.kind === "confirm") pending.resolve(value);
      else pending.resolve();
      setPending(null);
    },
    [pending],
  );

  useEffect(() => {
    if (!pending) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
      if (e.key === "Enter") close(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pending, close]);

  return (
    <>
      {children}
      {pending && (
        <div
          className="confirm-dialog-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close(false);
          }}
        >
          <div
            className="confirm-dialog-box"
            role={pending.kind === "confirm" ? "alertdialog" : "alert"}
            aria-modal="true"
            aria-labelledby="confirm-dialog-message"
          >
            {pending.title && <h3 className="confirm-dialog-title">{pending.title}</h3>}
            <p id="confirm-dialog-message" className="confirm-dialog-message">
              {pending.message}
            </p>
            <div className="confirm-dialog-actions">
              {pending.kind === "confirm" && (
                <button
                  type="button"
                  className="confirm-dialog-btn confirm-dialog-btn-cancel"
                  onClick={() => close(false)}
                >
                  {pending.cancelText || "Cancel"}
                </button>
              )}
              <button
                type="button"
                className={`confirm-dialog-btn confirm-dialog-btn-confirm ${
                  pending.tone === "danger" ? "is-danger" : ""
                }`}
                onClick={() => close(true)}
                autoFocus
              >
                {pending.confirmText || (pending.kind === "alert" ? "OK" : "Confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
