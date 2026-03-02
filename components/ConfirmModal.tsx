"use client";

import { useEffect, useRef } from "react";

/**
 * 削除確認など、確認用モーダル。ErrorModal と同じレイアウト・スタイル。
 * オーバーレイクリックまたは閉じるボタンでキャンセル、確認ボタンで onConfirm。
 * 表示時にフォーカスをモーダル内に移し、Escape で閉じる。
 */
type ConfirmModalProps = {
  title: string;
  message: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => void;
  /** true のとき確認ボタンを赤系（削除など）にする */
  danger?: boolean;
};

export default function ConfirmModal({
  title,
  message,
  confirmLabel,
  onClose,
  onConfirm,
  danger = false,
}: ConfirmModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-sm w-full overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="閉じる"
        >
          <span className="material-symbols-outlined text-[24px]">close</span>
        </button>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <span
              className={`material-symbols-outlined text-2xl flex-shrink-0 ${
                danger ? "text-red-500" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {danger ? "delete" : "help"}
            </span>
            <h2
              id="confirm-modal-title"
              className="text-lg font-bold text-slate-900 dark:text-white"
            >
              {title}
            </h2>
          </div>
          <p className="text-slate-700 dark:text-slate-300 mb-6">{message}</p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                danger
                  ? "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500"
                  : "bg-primary text-white hover:bg-primary/90"
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
