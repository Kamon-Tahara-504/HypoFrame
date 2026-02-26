"use client";

/**
 * 結果エリア（05-ui-ux）。要約・仮説注意・仮説5段・提案文注意・提案文を表示。
 * フェーズ6: エクスポート・コピー・保存・再生成を追加。
 */
import { useCallback, useState } from "react";
import type { HypothesisSegments } from "@/types";
import { buildExportText, getExportFileName } from "@/lib/export";
import HypothesisSegmentsDisplay from "./HypothesisSegments";

type ResultAreaProps = {
  summaryBusiness: string;
  hypothesisSegments: HypothesisSegments;
  letterDraft: string;
  /** 入力された会社名（表示・エクスポートファイル名用） */
  companyName?: string | null;
  /** 渡すと仮説5段を編集可能に */
  onSegmentsChange?: (segments: HypothesisSegments) => void;
  /** 渡すと提案文を編集可能に */
  onLetterDraftChange?: (letterDraft: string) => void;
  /** run の ID。あるときのみ保存ボタン有効 */
  runId?: string | null;
  /** 保存ボタン押下時（PATCH は親で実行） */
  onSave?: () => void;
  /** 再生成（1 回のみ）。親で loading にする想定 */
  onRegenerate?: () => void;
  /** true のとき再生成ボタン非表示・「2回目以降は編集のみです」を表示 */
  hasRegeneratedOnce?: boolean;
  /** 保存失敗時に表示するメッセージ（バナー表示） */
  saveError?: string | null;
  /** 保存失敗バナーを閉じる */
  onDismissSaveError?: () => void;
};

export default function ResultArea({
  summaryBusiness,
  hypothesisSegments,
  letterDraft,
  companyName,
  onSegmentsChange,
  onLetterDraftChange,
  runId,
  onSave,
  onRegenerate,
  hasRegeneratedOnce = false,
  saveError,
  onDismissSaveError,
}: ResultAreaProps) {
  const displayName = companyName?.trim() || "（会社名未入力）";
  const [copyFeedback, setCopyFeedback] = useState(false);

  const handleExport = useCallback(() => {
    const text = buildExportText(summaryBusiness, hypothesisSegments, letterDraft);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = getExportFileName(companyName ?? null);
    a.click();
    URL.revokeObjectURL(url);
  }, [summaryBusiness, hypothesisSegments, letterDraft, companyName]);

  const handleCopy = useCallback(async () => {
    const text = buildExportText(summaryBusiness, hypothesisSegments, letterDraft);
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      // clipboard 非対応時は何もしない
    }
  }, [summaryBusiness, hypothesisSegments, letterDraft]);

  return (
    <div className="space-y-8">
      {/* 事業要約ブロック（会社名＋summaryBusiness） */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-primary mb-1">{displayName}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            {summaryBusiness}
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

      {/* 再生成（1回のみ）／編集のみ案内／run 未作成時案内 */}
      <div className="flex flex-wrap items-center gap-3">
        {runId ? (
          <>
            {!hasRegeneratedOnce && onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">refresh</span>
                再生成
              </button>
            )}
            {hasRegeneratedOnce && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                2回目以降は編集のみです。
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            保存・再生成は現在利用できません。編集内容は画面内でのみ有効です。
          </p>
        )}
      </div>

      {/* 仮説5段（onSegmentsChange ありなら編集可能） */}
      <HypothesisSegmentsDisplay
        segments={hypothesisSegments}
        onSegmentsChange={onSegmentsChange}
      />

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
        <div className="mt-6 flex flex-wrap gap-3">
          {runId && onSave && (
            <button
              type="button"
              onClick={onSave}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-primary text-white hover:bg-primary/90 border border-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">save</span>
              保存
            </button>
          )}
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            エクスポート
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">content_copy</span>
            {copyFeedback ? "コピーしました" : "コピー"}
          </button>
        </div>
      </section>
    </div>
  );
}
