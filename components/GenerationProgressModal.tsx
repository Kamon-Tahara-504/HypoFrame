"use client";

import { useEffect, useState } from "react";

/**
 * 生成中に画面右上に浮かべて表示する小さなポップアップ。
 * オーバーレイ・ぼかしなし。経過時間を表示。閉じるボタンはなし。
 */
export default function GenerationProgressModal() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    setElapsedSeconds(0);
    const start = Date.now();
    const id = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const isLongRunning = elapsedSeconds >= 60;
  const m = Math.floor(elapsedSeconds / 60);
  const s = elapsedSeconds % 60;
  const mmss = `${m}:${s.toString().padStart(2, "0")}`;

  return (
    <div
      className="absolute top-24 right-4 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="generation-progress-title"
      aria-describedby="generation-progress-elapsed"
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden px-4 py-3 flex flex-row items-center gap-3 min-w-[200px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0"
          aria-hidden
        />
        <div className="flex flex-col gap-0.5 min-w-0">
          <h2
            id="generation-progress-title"
            className="text-slate-700 dark:text-slate-300 font-medium text-sm leading-tight"
          >
            取得・要約・仮説生成中…
          </h2>
          <p
            id="generation-progress-elapsed"
            className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight leading-none"
            aria-label={`経過時間 ${elapsedSeconds}秒`}
            aria-live="polite"
          >
            {mmss}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isLongRunning
              ? "しばらくお待ちください。"
              : "目標60秒・タイムアウト90秒"}
          </p>
        </div>
      </div>
    </div>
  );
}
