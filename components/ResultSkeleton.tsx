"use client";

/**
 * 結果画面（ResultArea）と同じ構成のスケルトン。生成中・チャット読み込み中に表示。
 * 上段カード・事業展開・仮説5段（番号丸＋縦線）・提案文のレイアウトを実表示に合わせる。
 * 生成中の進捗・経過時間は GenerationProgressModal で表示する。
 */
type ResultSkeletonProps = {
  /** true: チャット読み込み中。false/未指定: 生成中（モーダルが別で表示される） */
  isLoadingRun?: boolean;
};

export default function ResultSkeleton({ isLoadingRun = false }: ResultSkeletonProps) {
  return (
    <div className="space-y-8">
      {/* 上段＋事業展開（実表示と同様に一まとまり） */}
      <div className="scroll-mt-4">
        {/* 上段: 会社名・チップ3つ（左）｜注意文（右） */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
          <div className="min-w-0 flex-1">
            <div className="h-7 w-56 bg-slate-300 dark:bg-slate-600 rounded mb-3" />
            <div className="flex flex-wrap items-center gap-2">
              <div className="h-8 w-24 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="h-8 w-28 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="h-8 w-20 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-primary/10 flex items-center gap-2 shrink-0 h-14 w-56">
            <div className="flex-1 space-y-1">
              <div className="h-3 w-full bg-slate-200 dark:bg-slate-600 rounded" />
              <div className="h-3 w-full bg-slate-200 dark:bg-slate-600 rounded" style={{ width: "85%" }} />
            </div>
          </div>
        </div>

        {/* 事業展開（上段の直下 mt-6） */}
        <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm animate-pulse">
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
      </div>

      {/* 仮説5段（step-line / step-container で番号丸＋縦線＋カード） */}
      <div className="space-y-6 relative">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="step-container relative">
            <div className="flex gap-4">
              <div className="step-line relative z-10">
                <div className="w-10 h-10 rounded-full bg-slate-400 dark:bg-slate-500 animate-pulse flex items-center justify-center font-bold flex-shrink-0 text-white text-sm">
                  {i}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm overflow-hidden animate-pulse">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="size-[22px] rounded bg-slate-300 dark:bg-slate-600 flex-shrink-0" />
                    <div className="h-5 w-36 bg-slate-200 dark:bg-slate-700 rounded" />
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg min-h-[120px] space-y-2">
                    <div className="h-3 w-full bg-slate-200 dark:bg-slate-600 rounded" />
                    <div className="h-3 w-full bg-slate-200 dark:bg-slate-600 rounded" />
                    <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-600 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 提案文ブロック（実表示と同様: アイコン28px＋見出し、注意風、min-h-[250px]） */}
      <section className="mt-12">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 md:p-8 shadow-sm overflow-hidden animate-pulse">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-7 h-7 rounded bg-slate-300 dark:bg-slate-600 flex-shrink-0" />
            <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
          <div className="mb-4 h-12 w-full bg-slate-100 dark:bg-slate-800 rounded-lg" />
          <div className="min-h-[250px] p-4 md:p-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg space-y-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="h-3 bg-slate-200 dark:bg-slate-600 rounded"
                style={{ width: i === 8 ? "75%" : "100%" }}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
