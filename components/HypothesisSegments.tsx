"use client";

/**
 * 仮説5段の表示（05-ui-ux・04 第4節）。step-line 縦線・番号丸・ラベル・本文。
 * Phase 5 では表示のみ（編集はフェーズ6）。
 */
import type { HypothesisSegments } from "@/types";

/** 04 第4節のラベル（1=企業の現在状況整理 … 5=提案仮説） */
const SEGMENT_LABELS = [
  "企業の現在状況整理",
  "潜在課題の仮説",
  "課題の背景要因",
  "改善機会（介入ポイント）",
  "提案仮説",
] as const;

/** 各段の Material Symbols アイコン名 */
const SEGMENT_ICONS = [
  "visibility",
  "troubleshoot",
  "psychology",
  "target",
  "lightbulb",
] as const;

type HypothesisSegmentsProps = {
  /** 長さ5のタプル（API の hypothesisSegments） */
  segments: HypothesisSegments;
};

export default function HypothesisSegmentsDisplay({
  segments,
}: HypothesisSegmentsProps) {
  return (
    <div className="space-y-6 relative">
      {segments.map((text, i) => (
        <div key={i} className="step-container relative">
          <div className="flex gap-4">
            <div className="step-line relative z-10">
              <div className="w-10 h-10 rounded-full bg-blue-700 dark:bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                {i + 1}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-[22px] flex-shrink-0" aria-hidden>
                    {SEGMENT_ICONS[i]}
                  </span>
                  <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                    {SEGMENT_LABELS[i]}
                  </h4>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words min-w-0 overflow-hidden">
                  {text}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
