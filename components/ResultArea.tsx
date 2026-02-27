"use client";

/**
 * 結果エリア（05-ui-ux）。要約・仮説注意・仮説5段・提案文注意・提案文を表示。
 * フェーズ6: エクスポート・コピー・保存・再生成を追加。
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { HypothesisSegments, OutputFocus } from "@/types";
import { buildExportCsv, buildExportText, getExportFileName } from "@/lib/export";
import HypothesisSegmentsDisplay from "./HypothesisSegments";

const FOCUS_LABEL: Record<OutputFocus, string> = {
  summary: "事業要約",
  hypothesis: "仮説5段",
  letter: "提案文",
};

type ResultAreaProps = {
  summaryBusiness: string;
  hypothesisSegments: HypothesisSegments;
  letterDraft: string;
  /** 入力された会社名（表示・エクスポートファイル名用） */
  companyName?: string | null;
  /** 入力に使用した URL（CSV エクスポート用） */
  inputUrl: string;
  /** 渡すと仮説5段を編集可能に */
  onSegmentsChange?: (segments: HypothesisSegments) => void;
  /** 渡すと提案文を編集可能に */
  onLetterDraftChange?: (letterDraft: string) => void;
  /** フェーズ8: ログイン済みのとき true。未ログイン時は保存・再生成を出さずログイン案内を表示 */
  isLoggedIn?: boolean;
  /** run の ID。あるときのみ保存ボタン有効（ログイン時） */
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
  /** 出力のどこに焦点を当てたか。該当ブロックへスクロールしバッジを表示 */
  outputFocus?: OutputFocus | null;
  /** 業種・事業内容（1行）。未取得時は — 表示 */
  industry?: string | null;
  /** 従業員規模。未取得時は — 表示 */
  employeeScale?: string | null;
  /** 生成にかかった秒数。指定時は上段付近に「生成時間: XX秒」を表示 */
  generationElapsedSeconds?: number | null;
  /** 代表者名。未取得時は — 表示 */
  decisionMakerName?: string | null;
};

export default function ResultArea({
  summaryBusiness,
  hypothesisSegments,
  letterDraft,
  companyName,
  inputUrl,
  onSegmentsChange,
  onLetterDraftChange,
  isLoggedIn = false,
  runId,
  onSave,
  onRegenerate,
  hasRegeneratedOnce = false,
  saveError,
  onDismissSaveError,
  outputFocus,
  industry,
  employeeScale,
  generationElapsedSeconds,
  decisionMakerName,
}: ResultAreaProps) {
  const displayName = companyName?.trim() || "（会社名未入力）";
  const industryLabel = industry?.trim() || "—";
  const employeeLabel = employeeScale?.trim() || "—";
  const decisionMakerLabel = decisionMakerName?.trim() || "—";
  const [copyFeedback, setCopyFeedback] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const hypothesisRef = useRef<HTMLDivElement>(null);
  const letterRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!outputFocus) return;
    const el =
      outputFocus === "summary"
        ? summaryRef.current
        : outputFocus === "hypothesis"
          ? hypothesisRef.current
          : letterRef.current;
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [outputFocus]);

  const handleExport = useCallback(() => {
    const text = buildExportText(
      summaryBusiness,
      hypothesisSegments,
      letterDraft,
      industry,
      employeeScale
    );
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = getExportFileName(companyName ?? null);
    a.click();
    URL.revokeObjectURL(url);
  }, [summaryBusiness, hypothesisSegments, letterDraft, companyName, industry, employeeScale]);

  const handleCopy = useCallback(async () => {
    const text = buildExportText(
      summaryBusiness,
      hypothesisSegments,
      letterDraft,
      industry,
      employeeScale
    );
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      // clipboard 非対応時は何もしない
    }
  }, [summaryBusiness, hypothesisSegments, letterDraft, industry, employeeScale]);

  const handleExportCsv = useCallback(() => {
    const csv = buildExportCsv({
      companyName,
      inputUrl,
      industry,
      employeeScale,
      decisionMakerName,
      summaryBusiness,
      hypothesisSegments,
      letterDraft,
    });
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const baseName = getExportFileName(companyName ?? null).replace(/\.txt$/i, "");
    a.href = url;
    a.download = `${baseName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [
    companyName,
    inputUrl,
    industry,
    employeeScale,
    decisionMakerName,
    summaryBusiness,
    hypothesisSegments,
    letterDraft,
  ]);

  return (
    <div className="space-y-8">
      {/* 上段: 会社名・業種・従業員規模（左）｜注意文（右） */}
      <div ref={summaryRef} className="scroll-mt-4">
        {outputFocus === "summary" && (
          <p className="mb-2 text-xs font-medium text-primary">
            焦点: {FOCUS_LABEL.summary}
          </p>
        )}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-black text-primary mb-1">{displayName}</h3>
            <div className="text-sm text-slate-600 dark:text-slate-400 space-y-0.5">
              <p><span className="font-bold">業種:</span> {industryLabel}</p>
              <p><span className="font-bold">従業員規模:</span> {employeeLabel}</p>
              <p><span className="font-bold">代表者名:</span> {decisionMakerLabel}</p>
            </div>
            {generationElapsedSeconds != null && generationElapsedSeconds >= 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                生成時間: {generationElapsedSeconds}秒
              </p>
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

        {/* 下段: 事業展開文 */}
        <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
            事業展開文
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
            {summaryBusiness}
          </p>
        </div>
      </div>

      {/* 未ログイン時案内／run 未作成時案内（フェーズ8）。再生成ボタンは提案文下書きエリアに表示 */}
      <div className="flex flex-wrap items-center gap-3">
        {!isLoggedIn ? (
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span>
              登録すると保存・履歴再表示・再生成が使えます。編集・エクスポート・コピーはそのまま利用できます。
            </span>
            <Link href="/signup" className="text-primary hover:underline">
              新規登録
            </Link>
            <span className="text-slate-400">|</span>
            <Link href="/login" className="text-primary hover:underline">
              ログイン
            </Link>
          </div>
        ) : !runId ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            保存・再生成は現在利用できません。編集内容は画面内でのみ有効です。
          </p>
        ) : null}
      </div>

      {/* 仮説5段（onSegmentsChange ありなら編集可能） */}
      <div ref={hypothesisRef} className="scroll-mt-4">
        {outputFocus === "hypothesis" && (
          <p className="mb-2 text-xs font-medium text-primary">
            焦点: {FOCUS_LABEL.hypothesis}
          </p>
        )}
        <HypothesisSegmentsDisplay
          segments={hypothesisSegments}
          onSegmentsChange={onSegmentsChange}
        />
      </div>

      {/* 提案文ブロック（04 第6節の注意＋letterDraft）。他シートと同じカードスタイルでライト／ダーク対応 */}
      <section ref={letterRef} className="mt-12 scroll-mt-4">
        {outputFocus === "letter" && (
          <p className="mb-2 text-xs font-medium text-primary">
            焦点: {FOCUS_LABEL.letter}
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
              onClick={handleExportCsv}
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
              onClick={handleExport}
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
              onClick={handleCopy}
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
        </div>
      </div>
      </section>
    </div>
  );
}
