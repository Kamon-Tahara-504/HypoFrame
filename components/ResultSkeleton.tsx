"use client";

import { useEffect, useState } from "react";

/**
 * 結果画面（ResultArea）と同じ構成のスケルトン。生成中に表示し、完了後に実コンテンツへスムーズに切り替える。
 * 上段カード・仮説5段風・提案文風のプレースホルダを animate-pulse で表示。
 */
export default function ResultSkeleton() {
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

  return (
    <div className="space-y-8">
      {/* 進捗メッセージ（スケルトン上） */}
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {isLongRunning
          ? "時間がかかっています。しばらくお待ちください。"
          : "取得・要約・仮説生成中… 目標60秒・タイムアウト90秒です。"}
      </p>

      {/* 上段: 会社名・メタ風（左）｜注意文風ボックス（右） */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-6 w-48 bg-slate-300 dark:bg-slate-600 rounded" />
          <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
        <div className="h-14 w-56 bg-white dark:bg-slate-800 rounded-lg border border-primary/10 shrink-0" />
      </div>

      {/* 事業展開文風 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm animate-pulse">
        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>

      {/* 仮説5段風カード × 5 */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm animate-pulse"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-full bg-slate-300 dark:bg-slate-600" />
            <div className="h-5 w-36 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
      ))}

      {/* 提案文風ブロック */}
      <section className="mt-12">
        <div className="flex items-center gap-3 mb-6 animate-pulse">
          <div className="size-7 rounded bg-slate-300 dark:bg-slate-600" />
          <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 md:p-8 shadow-sm animate-pulse">
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-3 bg-slate-200 dark:bg-slate-700 rounded"
                style={{ width: i === 6 ? "75%" : "100%" }}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
