"use client";

type ResultActionsProps = {
  isLoggedIn: boolean;
  runId?: string | null;
  onSave?: () => void;
  onRegenerate?: () => void;
  hasRegeneratedOnce: boolean;
  onExportCsv: () => void;
  onExportTxt: () => void;
  onCopy: () => void;
  copyFeedback: boolean;
  googleLinked: boolean | null;
  onGoogleLink: () => void;
  onExportGoogleSheet: () => void;
  onExportGoogleDocs: () => void;
  exportingSheet: boolean;
  exportingDocs: boolean;
  googleExportError: string | null;
  onDismissGoogleExportError: () => void;
};

export default function ResultActions({
  isLoggedIn,
  runId,
  onSave,
  onRegenerate,
  hasRegeneratedOnce,
  onExportCsv,
  onExportTxt,
  onCopy,
  copyFeedback,
  googleLinked,
  onGoogleLink,
  onExportGoogleSheet,
  onExportGoogleDocs,
  exportingSheet,
  exportingDocs,
  googleExportError,
  onDismissGoogleExportError,
}: ResultActionsProps) {
  return (
    <>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        {isLoggedIn && runId && onSave && (
          <div className="group relative">
            <button
              type="button"
              onClick={onSave}
              title="保存"
              aria-label="保存"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-primary hover:opacity-80 transition-opacity"
            >
              <span className="material-symbols-outlined text-[22px]">save</span>
            </button>
            <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-800 dark:bg-slate-700 text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              保存
            </span>
          </div>
        )}
        {isLoggedIn && runId && !hasRegeneratedOnce && onRegenerate && (
          <div className="group relative">
            <button
              type="button"
              onClick={onRegenerate}
              title="再生成"
              aria-label="再生成"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-amber-600 dark:text-amber-400 hover:opacity-80 transition-opacity"
            >
              <span className="material-symbols-outlined text-[22px]">refresh</span>
            </button>
            <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-800 dark:bg-slate-700 text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              再生成
            </span>
          </div>
        )}
        {isLoggedIn && runId && hasRegeneratedOnce && (
          <p className="text-xs text-slate-500 dark:text-slate-400 px-2 py-1">
            2回目以降は編集のみです。
          </p>
        )}
        <div className="group relative">
          <button
            type="button"
            onClick={onExportCsv}
            title="CSV エクスポート"
            aria-label="CSV エクスポート"
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-600 dark:text-slate-300 hover:opacity-80 transition-opacity"
          >
            <span className="material-symbols-outlined text-[22px]">table</span>
          </button>
          <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-800 dark:bg-slate-700 text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            CSV エクスポート
          </span>
        </div>
        <div className="group relative">
          <button
            type="button"
            onClick={onExportTxt}
            title="エクスポート"
            aria-label="エクスポート"
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-600 dark:text-slate-300 hover:opacity-80 transition-opacity"
          >
            <span className="material-symbols-outlined text-[22px]">download</span>
          </button>
          <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-800 dark:bg-slate-700 text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            エクスポート
          </span>
        </div>
        <div className="group relative">
          <button
            type="button"
            onClick={onCopy}
            title={copyFeedback ? "コピーしました" : "コピー"}
            aria-label="コピー"
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-600 dark:text-slate-300 hover:opacity-80 transition-opacity"
          >
            <span className="material-symbols-outlined text-[22px]">content_copy</span>
          </button>
          <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-800 dark:bg-slate-700 text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {copyFeedback ? "コピーしました" : "コピー"}
          </span>
        </div>
        {isLoggedIn && googleLinked === false && (
          <div className="group relative">
            <button
              type="button"
              onClick={onGoogleLink}
              title="Google と連携"
              aria-label="Google と連携"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-600 dark:text-slate-300 hover:opacity-80 transition-opacity"
            >
              <span className="material-symbols-outlined text-[22px]">link</span>
            </button>
            <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-800 dark:bg-slate-700 text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              Google と連携
            </span>
          </div>
        )}
        {isLoggedIn && googleLinked === true && (
          <>
            <div className="group relative">
              <button
                type="button"
                onClick={onExportGoogleSheet}
                disabled={exportingSheet}
                title="Google スプレッドシートに出力"
                aria-label="Google スプレッドシートに出力"
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-600 dark:text-slate-300 hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[22px]">table_chart</span>
              </button>
              <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-800 dark:bg-slate-700 text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                Google スプレッドシートに出力
              </span>
            </div>
            <div className="group relative">
              <button
                type="button"
                onClick={onExportGoogleDocs}
                disabled={exportingDocs}
                title="Google ドキュメントに出力（手紙）"
                aria-label="Google ドキュメントに出力（手紙）"
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-600 dark:text-slate-300 hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[22px]">description</span>
              </button>
              <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-800 dark:bg-slate-700 text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                Google ドキュメントに出力（手紙）
              </span>
            </div>
          </>
        )}
      </div>
      {googleExportError && (
        <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 px-4 py-2">
          <p className="text-sm text-amber-800 dark:text-amber-200">{googleExportError}</p>
          <button
            type="button"
            onClick={onDismissGoogleExportError}
            className="shrink-0 p-1 rounded hover:bg-amber-200/50 dark:hover:bg-amber-800/50 text-amber-700 dark:text-amber-300"
            aria-label="閉じる"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
      )}
    </>
  );
}
