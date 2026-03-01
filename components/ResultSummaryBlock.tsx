"use client";

import { forwardRef } from "react";
import type { OutputFocus } from "@/types";

const FOCUS_LABEL_SUMMARY = "事業要約";

type ResultSummaryBlockProps = {
  outputFocus?: OutputFocus | null;
  displayName: string;
  industryLabel: string;
  employeeLabel: string;
  decisionMakerLabel: string;
  generationElapsedSeconds?: number | null;
  videoUrls?: string[] | null;
  summaryBusiness: string;
  irSummary?: string | null;
};

const ResultSummaryBlock = forwardRef<HTMLDivElement, ResultSummaryBlockProps>(
  (
    {
      outputFocus,
      displayName,
      industryLabel,
      employeeLabel,
      decisionMakerLabel,
      generationElapsedSeconds,
      videoUrls,
      summaryBusiness,
      irSummary,
    },
    ref
  ) => (
    <div ref={ref} className="scroll-mt-4">
      {outputFocus === "summary" && (
        <p className="mb-2 text-xs font-medium text-primary">
          焦点: {FOCUS_LABEL_SUMMARY}
        </p>
      )}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-black text-primary mb-3">{displayName}</h3>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-slate-200/80 dark:bg-slate-700/80 border border-slate-300/50 dark:border-slate-600/50 px-3 py-1.5 text-sm">
              <span className="text-slate-500 dark:text-slate-400 mr-1.5 font-medium">業種</span>
              <span className="text-slate-700 dark:text-slate-200 font-medium">{industryLabel}</span>
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-200/80 dark:bg-slate-700/80 border border-slate-300/50 dark:border-slate-600/50 px-3 py-1.5 text-sm">
              <span className="text-slate-500 dark:text-slate-400 mr-1.5 font-medium">従業員規模</span>
              <span className="text-slate-700 dark:text-slate-200 font-medium">{employeeLabel}</span>
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-200/80 dark:bg-slate-700/80 border border-slate-300/50 dark:border-slate-600/50 px-3 py-1.5 text-sm">
              <span className="text-slate-500 dark:text-slate-400 mr-1.5 font-medium">代表者名</span>
              <span className="text-slate-700 dark:text-slate-200 font-medium">{decisionMakerLabel}</span>
            </span>
          </div>
          {generationElapsedSeconds != null && generationElapsedSeconds >= 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              生成時間: {generationElapsedSeconds}秒
            </p>
          )}
          {videoUrls && videoUrls.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0">
                動画URL
              </span>
              {videoUrls.slice(0, 5).map((href, i) => (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline truncate max-w-[200px] md:max-w-[280px]"
                >
                  {href}
                </a>
              ))}
            </div>
          )}
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

      <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
          事業展開
        </h4>
        <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
          {summaryBusiness}
        </p>
      </div>
      {irSummary != null && (() => {
        const s = irSummary.trim();
        if (!s || s.toLowerCase() === "null") return null;
        return (
          <div className="mt-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
              IR要約
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
              {s}
            </p>
          </div>
        );
      })()}
    </div>
  )
);

ResultSummaryBlock.displayName = "ResultSummaryBlock";

export default ResultSummaryBlock;
