"use client";

/**
 * トップページ（05-ui-ux）。1 画面で入力・ローディング・結果・エラーを切り替え。
 * 状態: idle → 生成ボタンで loading → POST /api/generate の結果で success または error。
 * フェーズ6: 編集用 state（hypothesisSegments, letterDraft）、runId、再生成1回。
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  GenerateResponse,
  HypothesisSegments,
  RunDetail,
} from "@/types";
import { fromSavedSearchCandidates } from "@/lib/search-candidates";
import { useAuth } from "@/hooks/useAuth";
import { useRunHistory } from "@/hooks/useRunHistory";
import { useSearchCandidates } from "@/hooks/useSearchCandidates";
import { useGeneration } from "@/hooks/useGeneration";
import Header from "@/components/Header";
import HistorySidebar from "@/components/HistorySidebar";
import SearchSidebar from "@/components/SearchSidebar";
import ChatInputSection from "@/components/ChatInputSection";
import ResultSkeleton from "@/components/ResultSkeleton";
import ResultArea from "@/components/ResultArea";
import ErrorModal from "@/components/ErrorModal";
import GenerationProgressModal from "@/components/GenerationProgressModal";

const NEW_CHAT_QUERY = "new";
const SKELETON_QUERY = "skeleton";

export default function HomePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inputUrls, setInputUrls] = useState<string[]>([]);

  const {
    runId,
    setRunId,
    selectedRunId,
    setSelectedRunId,
    hasRegeneratedOnce,
    setHasRegeneratedOnce,
  } = useRunHistory(user);

  const {
    searchQuery,
    setSearchQuery,
    searchLoading,
    searchError,
    setSearchError,
    candidates,
    setCandidates,
    selectionValidationMessage,
    handleSearchSubmit,
    toggleCandidateSelected,
    handleExportCandidatesCsv,
    maxSelectedCandidates,
  } = useSearchCandidates(runId, setInputUrls);

  const generation = useGeneration({
    user,
    runId,
    setRunId,
    setSelectedRunId,
    hasRegeneratedOnce,
    setHasRegeneratedOnce,
    searchQuery,
    candidates,
    inputUrls,
  });

  const { handleGenerate, handleRegenerate, handleSave } = generation;

  const loadingRunIdRef = useRef<string | null>(null);

  /** 新しいチャットへ：入力画面に戻す。ホーム／新しいチャットボタンと共通 */
  const handleNewChat = useCallback(() => {
    generation.resetGenerationId?.();
    generation.setStatus("idle");
    generation.setLoadingReason(null);
    generation.setResult(null);
    generation.setCompanyName("");
    generation.setIrSummary(null);
    generation.setDecisionMakerName(null);
    generation.setErrorMessage("");
    setInputUrls([]);
    generation.setHypothesisSegments(null);
    generation.setLetterDraft("");
    setRunId(null);
    setHasRegeneratedOnce(false);
    generation.setSaveError(null);
    setSelectedRunId(null);
    generation.setOutputFocus(null);
    generation.setGenerationStartedAt(null);
    generation.setGenerationElapsedSeconds(null);
    setSearchQuery("");
    setSearchError(null);
    setCandidates([]);
  }, [
    generation,
    setRunId,
    setHasRegeneratedOnce,
    setSelectedRunId,
    setSearchQuery,
    setSearchError,
    setCandidates,
  ]);

  const handleNewChatRef = useRef(handleNewChat);
  handleNewChatRef.current = handleNewChat;

  /** 履歴からチャット削除したとき。削除した run が選択中なら新チャットに切り替える */
  const handleRunDeleted = useCallback(
    (deletedRunId: string) => {
      if (runId === deletedRunId || selectedRunId === deletedRunId) {
        handleNewChat();
        router.push("/", { scroll: false });
      }
    },
    [runId, selectedRunId, handleNewChat, router]
  );

  useEffect(() => {
    if (searchParams.get(NEW_CHAT_QUERY) !== "1") return;
    handleNewChatRef.current();
    router.replace("/", { scroll: false });
  }, [searchParams, router]);

  /** 履歴 run を読み込み、結果エリア state を復元する */
  const handleSelectRun = useCallback(
    async (id: string) => {
      if (!user) return;
      loadingRunIdRef.current = id;
      generation.setLoadingReason("run");
      generation.setStatus("loading");
      generation.setErrorMessage("");
      generation.setSaveError(null);
      try {
        const res = await fetch(`/api/runs/${id}`);
        const data = (await res.json()) as { run?: RunDetail; error?: string };
        if (!res.ok || !data.run) {
          loadingRunIdRef.current = null;
          generation.setLoadingReason(null);
          generation.setErrorMessage(
            data.error ?? "履歴の読み込みに失敗しました。"
          );
          generation.setStatus("idle");
          generation.setShowErrorModal(true);
          return;
        }
        const run = data.run;
        if (run.id !== loadingRunIdRef.current) return;
        const segments: HypothesisSegments = [
          run.hypothesisSegment1,
          run.hypothesisSegment2,
          run.hypothesisSegment3,
          run.hypothesisSegment4,
          run.hypothesisSegment5,
        ];
        generation.setCompanyName(run.companyName ?? "");
        setInputUrls(run.inputUrl?.trim() ? [run.inputUrl] : []);
        generation.setResult({
          summaryBusiness: run.summaryBusiness,
          irSummary: run.irSummary ?? null,
          decisionMakerName: run.decisionMakerName ?? null,
          industry: run.industry ?? null,
          employeeScale: run.employeeScale ?? null,
          hypothesisSegments: segments,
          letterDraft: run.letterDraft,
        } as GenerateResponse);
        generation.setHypothesisSegments(segments);
        generation.setLetterDraft(run.letterDraft);
        generation.setIrSummary(run.irSummary ?? null);
        generation.setDecisionMakerName(run.decisionMakerName ?? null);
        setRunId(run.id);
        setSelectedRunId(run.id);
        setHasRegeneratedOnce(run.regeneratedCount >= 1);
        generation.setOutputFocus(null);
        generation.setGenerationElapsedSeconds(null);
        setSearchQuery(run.searchQuery ?? "");
        setCandidates(fromSavedSearchCandidates(run.searchCandidates));
        generation.setLoadingReason(null);
        generation.setStatus("success");
      } catch {
        loadingRunIdRef.current = null;
        generation.setLoadingReason(null);
        generation.setErrorMessage(
          "履歴の読み込みに失敗しました。しばらく経ってから再試行してください。"
        );
        generation.setStatus("idle");
        generation.setShowErrorModal(true);
      }
    },
    [
      user,
      generation,
      setRunId,
      setSelectedRunId,
      setHasRegeneratedOnce,
      setSearchQuery,
      setCandidates,
    ]
  );

  return (
    <div className="h-screen overflow-hidden flex flex-col md:flex-row">
      <HistorySidebar
        user={user}
        loading={loading}
        selectedRunId={selectedRunId}
        onSelectRun={handleSelectRun}
        onNewChat={handleNewChat}
        onSignOut={signOut}
        onRunDeleted={handleRunDeleted}
        onRunTitleChange={(editedRunId, newTitle) => {
          if (editedRunId === runId) generation.setCompanyName(newTitle);
        }}
      />
      <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden relative">
        <Header />
        <GenerationProgressModal
          visible={
            generation.status === "loading" &&
            generation.loadingReason === "generate"
          }
        />
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col">
          <main className="max-w-5xl w-full mx-auto px-6 py-10 space-y-8">
            {searchParams.get(SKELETON_QUERY) !== "1" &&
              generation.status === "idle" && (
              <ChatInputSection
                onSubmit={handleGenerate}
                disabled={false}
                urls={inputUrls}
                onUrlsChange={setInputUrls}
                onClear={() => setInputUrls([])}
              />
            )}
            {searchParams.get(SKELETON_QUERY) === "1" && (
              <ResultSkeleton isLoadingRun />
            )}
            {searchParams.get(SKELETON_QUERY) !== "1" &&
              generation.status === "loading" &&
              generation.loadingReason === "generate" && <ResultSkeleton />}
            {searchParams.get(SKELETON_QUERY) !== "1" &&
              generation.status === "loading" &&
              generation.loadingReason === "run" && (
                <ResultSkeleton isLoadingRun />
              )}
            {searchParams.get(SKELETON_QUERY) !== "1" &&
              generation.status === "success" &&
              generation.result &&
              generation.hypothesisSegments !== null && (
                <ResultArea
                  summaryBusiness={generation.result.summaryBusiness}
                  hypothesisSegments={generation.hypothesisSegments}
                  letterDraft={generation.letterDraft}
                  companyName={generation.companyName || null}
                  inputUrl={inputUrls[0] ?? ""}
                  industry={generation.result.industry ?? null}
                  employeeScale={generation.result.employeeScale ?? null}
                  generationElapsedSeconds={generation.generationElapsedSeconds}
                  irSummary={generation.irSummary}
                  decisionMakerName={generation.decisionMakerName}
                  videoUrls={generation.result.videoUrls ?? null}
                  onSegmentsChange={generation.setHypothesisSegments}
                  onLetterDraftChange={generation.setLetterDraft}
                  isLoggedIn={!!user}
                  runId={runId}
                  onSave={handleSave}
                  onRegenerate={handleRegenerate}
                  hasRegeneratedOnce={hasRegeneratedOnce}
                  saveError={generation.saveError}
                  onDismissSaveError={() => generation.setSaveError(null)}
                  outputFocus={generation.outputFocus}
                />
              )}
          </main>
        </div>
      </div>
      <SearchSidebar
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        searchLoading={searchLoading}
        searchError={searchError}
        candidates={candidates}
        onToggleCandidateSelected={toggleCandidateSelected}
        onExportCsv={handleExportCandidatesCsv}
        selectionValidationMessage={selectionValidationMessage}
        maxSelectedCandidates={maxSelectedCandidates}
      />
      {generation.showErrorModal && generation.errorMessage && (
        <ErrorModal
          message={generation.errorMessage}
          onClose={() => {
            generation.setShowErrorModal(false);
            generation.setErrorMessage("");
          }}
        />
      )}
    </div>
  );
}
