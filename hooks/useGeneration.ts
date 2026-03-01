"use client";

import { useCallback, useState } from "react";
import type {
  ApiErrorBody,
  CompanyCandidate,
  GenerateResponse,
  HypothesisSegments,
  RunInsert,
} from "@/types";
import { toSavedSearchCandidates } from "@/lib/search-candidates";

type Status = "idle" | "loading" | "success" | "error";
type LoadingReason = "generate" | "run" | null;

const FALLBACK_ERROR_BY_STATUS: Partial<Record<number, string>> = {
  408: "取得できませんでした。URLをご確認のうえ、しばらく経ってから再試行してください。",
  502: "仮説の生成に失敗しました。しばらく経ってから再試行してください。",
};

type UseGenerationOptions = {
  user: { id: string } | null;
  runId: string | null;
  setRunId: (id: string | null) => void;
  setSelectedRunId: (id: string | null) => void;
  hasRegeneratedOnce: boolean;
  setHasRegeneratedOnce: (v: boolean) => void;
  searchQuery: string;
  candidates: CompanyCandidate[];
  inputUrls: string[];
};

/**
 * 生成実行・再生成・保存・結果表示まわりの state とハンドラを管理する。
 */
export function useGeneration(options: UseGenerationOptions) {
  const {
    user,
    runId,
    setRunId,
    setSelectedRunId,
    hasRegeneratedOnce,
    setHasRegeneratedOnce,
    searchQuery,
    candidates,
    inputUrls,
  } = options;

  const [status, setStatus] = useState<Status>("idle");
  const [loadingReason, setLoadingReason] = useState<LoadingReason>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [irSummary, setIrSummary] = useState<string | null>(null);
  const [decisionMakerName, setDecisionMakerName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [hypothesisSegments, setHypothesisSegments] = useState<HypothesisSegments | null>(null);
  const [letterDraft, setLetterDraft] = useState("");
  const [outputFocus, setOutputFocus] = useState<"summary" | "hypothesis" | "letter" | null>(null);
  const [generationStartedAt, setGenerationStartedAt] = useState<number | null>(null);
  const [generationElapsedSeconds, setGenerationElapsedSeconds] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleGenerate = useCallback(
    async (
      url: string,
      companyNameInput?: string,
      focus?: "summary" | "hypothesis" | "letter"
    ) => {
      const startedAt = Date.now();
      setLoadingReason("generate");
      setStatus("loading");
      setErrorMessage("");
      setGenerationStartedAt(startedAt);
      setGenerationElapsedSeconds(null);
      setCompanyName(companyNameInput ?? "");
      setOutputFocus(focus ?? null);

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url,
            companyName: companyNameInput || undefined,
            outputFocus: focus ?? undefined,
          }),
        });

        let data: unknown;
        try {
          data = await res.json();
        } catch {
          setLoadingReason(null);
          setErrorMessage(
            FALLBACK_ERROR_BY_STATUS[res.status] ??
              "エラーが発生しました。しばらく経ってから再試行してください。"
          );
          setStatus("idle");
          setShowErrorModal(true);
          return;
        }

        if (res.ok) {
          const gen = data as GenerateResponse;
          const effectiveCompanyName =
            (companyNameInput?.trim()) || (gen.companyName ?? null);
          setGenerationElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
          setResult(gen);
          setCompanyName(effectiveCompanyName ?? "");
          setHypothesisSegments([...gen.hypothesisSegments]);
          setLetterDraft(gen.letterDraft);
          setIrSummary(gen.irSummary ?? null);
          setDecisionMakerName(gen.decisionMakerName ?? null);
          setLoadingReason(null);
          setStatus("success");
          if (user) {
            const runBody: RunInsert = {
              inputUrl: url,
              companyName: effectiveCompanyName ?? null,
              summaryBusiness: gen.summaryBusiness,
              irSummary: gen.irSummary ?? null,
              decisionMakerName: gen.decisionMakerName ?? null,
              industry: gen.industry ?? null,
              employeeScale: gen.employeeScale ?? null,
              hypothesisSegment1: gen.hypothesisSegments[0],
              hypothesisSegment2: gen.hypothesisSegments[1],
              hypothesisSegment3: gen.hypothesisSegments[2],
              hypothesisSegment4: gen.hypothesisSegments[3],
              hypothesisSegment5: gen.hypothesisSegments[4],
              letterDraft: gen.letterDraft,
              regeneratedCount: 0,
              searchQuery: searchQuery.trim() || null,
              searchCandidates:
                candidates.length > 0 ? toSavedSearchCandidates(candidates) : null,
            };
            try {
              const runRes = await fetch("/api/runs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(runBody),
              });
              const runData = await runRes.json();
              if (runRes.ok && runData?.id) {
                setRunId(runData.id);
                setSelectedRunId(runData.id);
              } else {
                setSaveError(
                  "結果の保存に失敗しました。画面の内容はそのままご利用いただけます。"
                );
              }
            } catch {
              setSaveError(
                "結果の保存に失敗しました。画面の内容はそのままご利用いただけます。"
              );
            }
          }
        } else {
          const body = data as ApiErrorBody | null;
          setLoadingReason(null);
          setErrorMessage(body?.error ?? "エラーが発生しました");
          setGenerationStartedAt(null);
          setGenerationElapsedSeconds(null);
          setStatus("idle");
          setShowErrorModal(true);
        }
      } catch {
        setLoadingReason(null);
        setErrorMessage(
          "ネットワークエラーが発生しました。しばらく経ってから再試行してください。"
        );
        setGenerationStartedAt(null);
        setGenerationElapsedSeconds(null);
        setStatus("idle");
        setShowErrorModal(true);
      }
    },
    [
      user,
      searchQuery,
      candidates,
      setRunId,
      setSelectedRunId,
    ]
  );

  const handleRegenerate = useCallback(async () => {
    if (!runId || hasRegeneratedOnce || !inputUrls[0]) return;
    const startedAt = Date.now();
    setLoadingReason("generate");
    setStatus("loading");
    setErrorMessage("");
    setGenerationStartedAt(startedAt);
    setGenerationElapsedSeconds(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: inputUrls[0],
          companyName: companyName || undefined,
        }),
      });
      let data: unknown;
      try {
        data = await res.json();
      } catch {
        setLoadingReason(null);
        setErrorMessage(
          FALLBACK_ERROR_BY_STATUS[res.status] ??
            "エラーが発生しました。しばらく経ってから再試行してください。"
        );
        setShowErrorModal(true);
        return;
      }
      if (!res.ok) {
        const body = data as ApiErrorBody | null;
        setLoadingReason(null);
        setErrorMessage(body?.error ?? "エラーが発生しました");
        setShowErrorModal(true);
        return;
      }
      const gen = data as GenerateResponse;
      setGenerationElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
      setResult(gen);
      setHypothesisSegments([...gen.hypothesisSegments]);
      setLetterDraft(gen.letterDraft);
      setIrSummary(gen.irSummary ?? null);
      setDecisionMakerName(gen.decisionMakerName ?? null);
      setLoadingReason(null);
      setStatus("success");
      setHasRegeneratedOnce(true);
      try {
        const patchRes = await fetch(`/api/runs/${runId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hypothesisSegment1: gen.hypothesisSegments[0],
            hypothesisSegment2: gen.hypothesisSegments[1],
            hypothesisSegment3: gen.hypothesisSegments[2],
            hypothesisSegment4: gen.hypothesisSegments[3],
            hypothesisSegment5: gen.hypothesisSegments[4],
            letterDraft: gen.letterDraft,
            irSummary: gen.irSummary ?? null,
            decisionMakerName: gen.decisionMakerName ?? null,
          }),
        });
        if (!patchRes.ok) {
          setSaveError(
            "再生成した内容の保存に失敗しました。しばらく経ってから再度お試しください。"
          );
        }
      } catch {
        setSaveError(
          "再生成した内容の保存に失敗しました。しばらく経ってから再度お試しください。"
        );
      }
    } catch {
      setLoadingReason(null);
      setErrorMessage(
        "ネットワークエラーが発生しました。しばらく経ってから再試行してください。"
      );
      setStatus("success");
      setShowErrorModal(true);
    }
  }, [
    runId,
    hasRegeneratedOnce,
    inputUrls,
    companyName,
    setHasRegeneratedOnce,
  ]);

  const handleSave = useCallback(async () => {
    if (!runId || hypothesisSegments === null) return;
    setSaveError(null);
    try {
      const res = await fetch(`/api/runs/${runId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hypothesisSegment1: hypothesisSegments[0],
          hypothesisSegment2: hypothesisSegments[1],
          hypothesisSegment3: hypothesisSegments[2],
          hypothesisSegment4: hypothesisSegments[3],
          hypothesisSegment5: hypothesisSegments[4],
          letterDraft,
          irSummary,
          decisionMakerName,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveError(null);
    } catch {
      setSaveError("保存に失敗しました。しばらく経ってから再度お試しください。");
    }
  }, [runId, hypothesisSegments, letterDraft, irSummary, decisionMakerName]);

  return {
    status,
    setStatus,
    loadingReason,
    setLoadingReason,
    result,
    setResult,
    companyName,
    setCompanyName,
    irSummary,
    setIrSummary,
    decisionMakerName,
    setDecisionMakerName,
    errorMessage,
    setErrorMessage,
    showErrorModal,
    setShowErrorModal,
    hypothesisSegments,
    setHypothesisSegments,
    letterDraft,
    setLetterDraft,
    outputFocus,
    setOutputFocus,
    generationStartedAt,
    setGenerationStartedAt,
    generationElapsedSeconds,
    setGenerationElapsedSeconds,
    saveError,
    setSaveError,
    handleGenerate,
    handleRegenerate,
    handleSave,
  };
}
