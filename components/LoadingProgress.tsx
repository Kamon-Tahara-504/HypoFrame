"use client";

/**
 * ローディング表示（05-ui-ux 第5節）。生成中のみ表示。
 * スピナー＋「取得・要約・仮説生成中…」＋目標60秒・タイムアウト90秒の注釈。
 */
export default function LoadingProgress() {
  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <div
          className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"
          aria-hidden
        />
        <p className="text-slate-700 dark:text-slate-300 font-medium">
          取得・要約・仮説生成中…
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          目標60秒・タイムアウト90秒です。しばらくお待ちください。
        </p>
      </div>
    </section>
  );
}
