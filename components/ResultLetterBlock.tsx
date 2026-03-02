"use client";

import type { OutputFocus } from "@/types";

const FOCUS_LABEL_LETTER = "提案文";

type ResultLetterBlockProps = {
  outputFocus?: OutputFocus | null;
  letterDraft: string;
  onLetterDraftChange?: (letterDraft: string) => void;
  saveError?: string | null;
  onDismissSaveError?: () => void;
};

export default function ResultLetterBlock({
  outputFocus,
  letterDraft,
  onLetterDraftChange,
  saveError,
  onDismissSaveError,
}: ResultLetterBlockProps) {
  return (
    <div className="mt-12">
      {outputFocus === "letter" && (
        <p className="mb-2 text-xs font-medium text-primary">
          焦点: {FOCUS_LABEL_LETTER}
        </p>
      )}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 md:p-8 shadow-sm overflow-hidden">
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
        {onLetterDraftChange ? (
          <textarea
            value={letterDraft}
            onChange={(e) => onLetterDraftChange(e.target.value)}
            className="w-full min-h-[250px] p-4 md:p-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-sm leading-loose whitespace-pre-wrap break-words min-w-0 resize-y"
            rows={12}
          />
        ) : (
          <div className="w-full min-h-[250px] p-4 md:p-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-sm leading-loose whitespace-pre-wrap break-words min-w-0 overflow-hidden">
            {letterDraft}
          </div>
        )}
        {saveError && (
          <div className="mt-6 flex items-center justify-between gap-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 px-4 py-3">
            <p className="text-sm text-amber-800 dark:text-amber-200">{saveError}</p>
            {onDismissSaveError && (
              <button
                type="button"
                onClick={onDismissSaveError}
                className="shrink-0 p-1 rounded hover:bg-amber-200/50 dark:hover:bg-amber-800/50 text-amber-700 dark:text-amber-300"
                aria-label="閉じる"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
