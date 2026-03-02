"use client";

/**
 * 結果エリア（05-ui-ux）。要約・仮説注意・仮説5段・提案文注意・提案文を表示。
 * フェーズ6: エクスポート・コピー・保存・再生成を追加。
 * フェーズ12: Google スプレッドシート／ドキュメント出力を追加。
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { HypothesisSegments, OutputFocus } from "@/types";
import { buildExportCsv, buildExportText, getExportFileName } from "@/lib/export";
import { useGoogleExport } from "@/hooks/useGoogleExport";
import ResultSummaryBlock from "./ResultSummaryBlock";
import ResultHypothesisBlock from "./ResultHypothesisBlock";
import ResultLetterBlock from "./ResultLetterBlock";
import ResultActions from "./ResultActions";

type ResultAreaProps = {
  summaryBusiness: string;
  hypothesisSegments: HypothesisSegments;
  letterDraft: string;
  companyName?: string | null;
  inputUrl: string;
  onSegmentsChange?: (segments: HypothesisSegments) => void;
  onLetterDraftChange?: (letterDraft: string) => void;
  isLoggedIn?: boolean;
  runId?: string | null;
  onSave?: () => void;
  onRegenerate?: () => void;
  hasRegeneratedOnce?: boolean;
  saveError?: string | null;
  onDismissSaveError?: () => void;
  outputFocus?: OutputFocus | null;
  industry?: string | null;
  employeeScale?: string | null;
  generationElapsedSeconds?: number | null;
  irSummary?: string | null;
  decisionMakerName?: string | null;
  videoUrls?: string[] | null;
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
  irSummary,
  decisionMakerName,
  videoUrls,
}: ResultAreaProps) {
  const displayName = companyName?.trim() || "（会社名未入力）";
  const industryLabel = industry?.trim() || "—";
  const employeeLabel = employeeScale?.trim() || "—";
  const decisionMakerLabel = decisionMakerName?.trim() || "—";
  const [copyFeedback, setCopyFeedback] = useState(false);
  const copyFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const summaryRef = useRef<HTMLDivElement>(null);
  const hypothesisRef = useRef<HTMLDivElement>(null);
  const letterRef = useRef<HTMLElement>(null);

  useEffect(() => {
    return () => {
      if (copyFeedbackTimeoutRef.current) clearTimeout(copyFeedbackTimeoutRef.current);
    };
  }, []);

  const {
    googleLinked,
    googleExportError,
    exportingSheet,
    exportingDocs,
    handleGoogleLink,
    handleExportGoogleSheet: exportGoogleSheet,
    handleExportGoogleDocs: exportGoogleDocs,
    dismissGoogleExportError,
  } = useGoogleExport({ isLoggedIn, pathname });

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
      employeeScale,
      irSummary
    );
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = getExportFileName(companyName ?? null);
      a.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  }, [
    summaryBusiness,
    hypothesisSegments,
    letterDraft,
    companyName,
    industry,
    employeeScale,
    irSummary,
  ]);

  const handleCopy = useCallback(async () => {
    const text = buildExportText(
      summaryBusiness,
      hypothesisSegments,
      letterDraft,
      industry,
      employeeScale,
      irSummary
    );
    try {
      await navigator.clipboard.writeText(text);
      if (copyFeedbackTimeoutRef.current) clearTimeout(copyFeedbackTimeoutRef.current);
      setCopyFeedback(true);
      copyFeedbackTimeoutRef.current = setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      // clipboard 非対応時は何もしない
    }
  }, [
    summaryBusiness,
    hypothesisSegments,
    letterDraft,
    industry,
    employeeScale,
    irSummary,
  ]);

  const handleExportCsv = useCallback(() => {
    const csv = buildExportCsv({
      companyName,
      inputUrl,
      industry,
      employeeScale,
      decisionMakerName,
      irSummary,
      videoUrls,
      summaryBusiness,
      hypothesisSegments,
      letterDraft,
    });
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement("a");
      const baseName = getExportFileName(companyName ?? null).replace(/\.txt$/i, "");
      a.href = url;
      a.download = `${baseName}.csv`;
      a.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  }, [
    companyName,
    inputUrl,
    industry,
    employeeScale,
    decisionMakerName,
    irSummary,
    videoUrls,
    summaryBusiness,
    hypothesisSegments,
    letterDraft,
  ]);

  const handleExportGoogleSheet = useCallback(() => {
    exportGoogleSheet({
      companyName,
      inputUrl,
      industry,
      employeeScale,
      decisionMakerName,
      irSummary,
      videoUrls,
      summaryBusiness,
      hypothesisSegments,
      letterDraft,
    });
  }, [
    exportGoogleSheet,
    companyName,
    inputUrl,
    industry,
    employeeScale,
    decisionMakerName,
    irSummary,
    videoUrls,
    summaryBusiness,
    hypothesisSegments,
    letterDraft,
  ]);

  const handleExportGoogleDocs = useCallback(() => {
    exportGoogleDocs({ companyName: companyName ?? null, letterDraft });
  }, [exportGoogleDocs, companyName, letterDraft]);

  return (
    <div className="space-y-8">
      <ResultSummaryBlock
        ref={summaryRef}
        outputFocus={outputFocus}
        displayName={displayName}
        industryLabel={industryLabel}
        employeeLabel={employeeLabel}
        decisionMakerLabel={decisionMakerLabel}
        generationElapsedSeconds={generationElapsedSeconds}
        videoUrls={videoUrls}
        summaryBusiness={summaryBusiness}
        irSummary={irSummary}
      />

      <ResultHypothesisBlock
        ref={hypothesisRef}
        outputFocus={outputFocus}
        segments={hypothesisSegments}
        onSegmentsChange={onSegmentsChange}
      />

      <section ref={letterRef} className="scroll-mt-4">
        <ResultLetterBlock
          outputFocus={outputFocus}
          letterDraft={letterDraft}
          onLetterDraftChange={onLetterDraftChange}
          saveError={saveError}
          onDismissSaveError={onDismissSaveError}
        />
        <ResultActions
          isLoggedIn={isLoggedIn}
          runId={runId}
          onSave={onSave}
          onRegenerate={onRegenerate}
          hasRegeneratedOnce={hasRegeneratedOnce}
          onExportCsv={handleExportCsv}
          onExportTxt={handleExport}
          onCopy={handleCopy}
          copyFeedback={copyFeedback}
          googleLinked={googleLinked}
          onGoogleLink={handleGoogleLink}
          onExportGoogleSheet={handleExportGoogleSheet}
          onExportGoogleDocs={handleExportGoogleDocs}
          exportingSheet={exportingSheet}
          exportingDocs={exportingDocs}
          googleExportError={googleExportError}
          onDismissGoogleExportError={dismissGoogleExportError}
        />
      </section>
    </div>
  );
}
