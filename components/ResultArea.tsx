"use client";

/**
 * 結果エリア（05-ui-ux）。要約・仮説注意・仮説5段・提案文注意・提案文を表示。
 * Phase 5 では表示のみ。Export/Copy/Regenerate はフェーズ6で実装。
 */
import type { GenerateResponse } from "@/types";
import HypothesisSegmentsDisplay from "./HypothesisSegments";

type ResultAreaProps = {
  /** POST /api/generate の成功レスポンス */
  data: GenerateResponse;
  /** 入力された会社名（表示用。空なら「会社名未入力」） */
  companyName?: string | null;
};

export default function ResultArea({ data, companyName }: ResultAreaProps) {
  const displayName = companyName?.trim() || "（会社名未入力）";

  return (
    <div className="space-y-8">
      {/* 事業要約ブロック（会社名＋summaryBusiness） */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-primary mb-1">{displayName}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            {data.summaryBusiness}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-primary/10 flex items-center gap-2 shrink-0">
          <span className="material-symbols-outlined text-amber-500 fill-amber-500 text-[20px]">
            info
          </span>
          <p className="text-[12px] leading-tight text-slate-500 dark:text-slate-400 font-medium">
            以下は、公表されている情報に基づく仮説です。
            <br />
            実務では必ずご自身で確認してください。
          </p>
        </div>
      </div>

      {/* 仮説5段（04 第4節の順・表示のみ） */}
      <HypothesisSegmentsDisplay segments={data.hypothesisSegments} />

      {/* 提案文ブロック（04 第6節の注意＋letterDraft）。他シートと同じカードスタイルでライト／ダーク対応 */}
      <section className="mt-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 md:p-8 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-primary text-[28px]">
            assignment
          </span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">提案文下書き</h3>
        </div>
        <div className="mb-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-lg">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">info</span>
            提案文は仮説に基づく下書きです。
          </p>
        </div>
        <div className="w-full min-h-[250px] p-4 md:p-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-sm leading-loose whitespace-pre-wrap break-words min-w-0 overflow-hidden">
          {data.letterDraft}
        </div>
        {/* Phase 5: Export / Copy / Regenerate は未実装 */}
      </section>
    </div>
  );
}
