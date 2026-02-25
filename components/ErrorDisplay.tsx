"use client";

/**
 * エラー表示（05-ui-ux 第7節）。失敗時のみ表示。
 * API の error 文言と再試行案内。onRetry で「もう一度試す」を実行可能。
 */
type ErrorDisplayProps = {
  /** 表示するエラーメッセージ（API の error またはネットワークエラー文言） */
  message: string;
  /** 指定時は「もう一度試す」ボタンで呼ばれる（親で status を idle に戻す等） */
  onRetry?: () => void;
};

export default function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-red-200 dark:border-red-900/50 overflow-hidden">
      <div className="p-6 md:p-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-red-500 text-2xl">
            error
          </span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            エラー
          </h2>
        </div>
        <p className="text-slate-700 dark:text-slate-300 mb-4">{message}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          URL を確認して、再度生成をお試しください。
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-bold transition-all"
          >
            もう一度試す
          </button>
        )}
      </div>
    </section>
  );
}
