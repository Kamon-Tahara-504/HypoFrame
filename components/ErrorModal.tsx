"use client";

/**
 * 生成失敗時などに中央に表示するエラーモーダル。
 * オーバーレイクリックまたは閉じるボタンで dismiss。
 */
type ErrorModalProps = {
  message: string;
  onClose: () => void;
};

export default function ErrorModal({ message, onClose }: ErrorModalProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="error-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-red-200 dark:border-red-900/50 max-w-sm w-full overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="閉じる"
        >
          <span className="material-symbols-outlined text-[24px]">close</span>
        </button>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-red-500 text-2xl flex-shrink-0">
              error
            </span>
            <h2 id="error-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
              エラー
            </h2>
          </div>
          <p className="text-slate-700 dark:text-slate-300 mb-4">{message}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            URL を確認して、再度生成をお試しください。
          </p>
        </div>
      </div>
    </div>
  );
}
