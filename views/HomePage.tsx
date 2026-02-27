"use client";

/**
 * トップページ（05-ui-ux）。1 画面で入力・ローディング・結果・エラーを切り替え。
 * 状態: idle → 生成ボタンで loading → POST /api/generate の結果で success または error。
 * フェーズ6: 編集用 state（hypothesisSegments, letterDraft）、runId、再生成1回。
 */
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type React from "react";
import type {
  ApiErrorBody,
  GenerateResponse,
  HypothesisSegments,
  RunDetail,
  RunInsert,
  CompanyCandidate,
} from "@/types";
import { buildExportCsvBatch } from "@/lib/export";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import HistorySidebar from "@/components/HistorySidebar";
import ChatInputSection from "@/components/ChatInputSection";
import type { OutputFocus } from "@/types";
import ResultSkeleton from "@/components/ResultSkeleton";
import ResultArea from "@/components/ResultArea";
import ErrorDisplay from "@/components/ErrorDisplay";

type Status = "idle" | "loading" | "success" | "error";
/** loading の理由: 新規/再生成なら ResultSkeleton、履歴読み込みなら簡易表示 */
type LoadingReason = "generate" | "run" | null;

/** res.json() 失敗時に status から表示するフォールバック文言（API の ERROR_MESSAGES と揃える） */
const FALLBACK_ERROR_BY_STATUS: Partial<Record<number, string>> = {
  408: "取得できませんでした。URLをご確認のうえ、しばらく経ってから再試行してください。",
  502: "仮説の生成に失敗しました。しばらく経ってから再試行してください。",
};

const NEW_CHAT_QUERY = "new";

export default function HomePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("idle");
  const [loadingReason, setLoadingReason] = useState<LoadingReason>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [irSummary, setIrSummary] = useState<string | null>(null);
  const [decisionMakerName, setDecisionMakerName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  /** 最後に生成に使った URL（POST /api/runs と再生成で使用） */
  const [inputUrl, setInputUrl] = useState("");
  /** 編集用。生成成功時・再生成時に result で初期化 */
  const [hypothesisSegments, setHypothesisSegments] = useState<HypothesisSegments | null>(null);
  const [letterDraft, setLetterDraft] = useState<string>("");
  /** 生成成功時に POST /api/runs で取得。PATCH 保存・再生成時の更新に使用 */
  const [runId, setRunId] = useState<string | null>(null);
  /** 再生成は 1 回のみ。true で再生成ボタン無効化・案内表示 */
  const [hasRegeneratedOnce, setHasRegeneratedOnce] = useState(false);
  /** 保存失敗時のメッセージ（ResultArea でバナー表示） */
  const [saveError, setSaveError] = useState<string | null>(null);
  /** サイドバーで現在選択中の履歴 run */
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  /** 出力のどこに焦点を当てるか（テンプレート選択時。結果表示でスクロール等に使用） */
  const [outputFocus, setOutputFocus] = useState<OutputFocus | null>(null);
  /** 生成開始時刻（loading 開始時）。成功時に経過秒数を算出して ResultArea に渡す */
  const [generationStartedAt, setGenerationStartedAt] = useState<number | null>(null);
  /** 直近の生成にかかった秒数（success 時にセット、ResultArea に表示） */
  const [generationElapsedSeconds, setGenerationElapsedSeconds] = useState<number | null>(null);
  /** フェーズ11: 企業検索クエリ */
  const [searchQuery, setSearchQuery] = useState("");
  /** フェーズ11: 検索中フラグ */
  const [searchLoading, setSearchLoading] = useState(false);
  /** フェーズ11: 検索エラー文言 */
  const [searchError, setSearchError] = useState<string | null>(null);
  /** フェーズ11: 企業候補（検索結果＋生成結果） */
  const [candidates, setCandidates] = useState<CompanyCandidate[]>([]);

  useEffect(() => {
    if (!user) {
      setRunId(null);
      setSelectedRunId(null);
      setHasRegeneratedOnce(false);
    }
  }, [user]);

  /** 新しいチャットへ：入力画面に戻す。ホーム／新しいチャットボタンと共通 */
  const handleNewChat = useCallback(() => {
    setStatus("idle");
    setLoadingReason(null);
    setResult(null);
    setCompanyName("");
    setIrSummary(null);
    setDecisionMakerName(null);
    setErrorMessage("");
    setInputUrl("");
    setHypothesisSegments(null);
    setLetterDraft("");
    setRunId(null);
    setHasRegeneratedOnce(false);
    setSaveError(null);
    setSelectedRunId(null);
    setOutputFocus(null);
    setGenerationStartedAt(null);
    setGenerationElapsedSeconds(null);
  }, []);

  /** URL が ?new=1 のとき新チャットにリセットしクエリを外す */
  useEffect(() => {
    if (searchParams.get(NEW_CHAT_QUERY) !== "1") return;
    handleNewChat();
    router.replace("/", { scroll: false });
  }, [searchParams, router, handleNewChat]);

  /** フェーズ11: 企業検索実行。Google Custom Search API の結果から候補リストを構築する。 */
  const handleSearchSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = searchQuery.trim();
      if (!trimmed) return;

      setSearchLoading(true);
      setSearchError(null);
      setCandidates([]);

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        let data: unknown;
        try {
          data = await res.json();
        } catch {
          setSearchError(
            "検索結果の取得に失敗しました。しばらく経ってから再試行してください。"
          );
          setSearchLoading(false);
          return;
        }

        if (!res.ok) {
          const body = data as { error?: string } | null;
          setSearchError(
            body?.error ??
              "検索に失敗しました。条件や設定を確認のうえ、しばらく経ってから再試行してください。"
          );
          setSearchLoading(false);
          return;
        }

        const body = data as {
          items?: { title?: string; link?: string; snippet?: string }[];
        };
        const items = body.items ?? [];
        const nextCandidates: CompanyCandidate[] = items
          .filter((item) => (item.link ?? "").trim())
          .map((item, index) => {
            const link = (item.link ?? "").trim();
            const id = `${link || "item"}-${index}`;
            return {
              id,
              title: (item.title ?? "").trim() || link,
              link,
              snippet: (item.snippet ?? "").trim(),
              selected: false,
              status: "idle",
              result: null,
              errorMessage: null,
            };
          });

        setCandidates(nextCandidates);
      } catch {
        setSearchError(
          "検索に失敗しました。ネットワーク状況を確認のうえ、しばらく経ってから再試行してください。"
        );
      } finally {
        setSearchLoading(false);
      }
    },
    [searchQuery]
  );

  /** フェーズ11: 候補の選択トグル */
  const toggleCandidateSelected = useCallback((id: string) => {
    setCandidates((prev) =>
      prev.map((candidate) =>
        candidate.id === id ? { ...candidate, selected: !candidate.selected } : candidate
      )
    );
  }, []);

  /** フェーズ11: リスト用に /api/generate を呼び出す共通関数（画面全体の status は変更しない） */
  async function callGenerateForUrlForList(
    url: string
  ): Promise<{ ok: true; data: GenerateResponse } | { ok: false; error: string }> {
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      let data: unknown;
      try {
        data = await res.json();
      } catch {
        return {
          ok: false,
          error:
            FALLBACK_ERROR_BY_STATUS[res.status] ??
            "エラーが発生しました。しばらく経ってから再試行してください。",
        };
      }
      if (!res.ok) {
        const body = data as ApiErrorBody | null;
        return {
          ok: false,
          error: body?.error ?? "エラーが発生しました。しばらく経ってから再試行してください。",
        };
      }
      return { ok: true, data: data as GenerateResponse };
    } catch {
      return {
        ok: false,
        error:
          "ネットワークエラーが発生しました。しばらく経ってから再試行してください。",
      };
    }
  }

  /** フェーズ11: 単一候補に対して仮説生成を実行 */
  const handleGenerateForCandidate = useCallback(
    async (candidateId: string) => {
      const target = candidates.find((c) => c.id === candidateId);
      if (!target) return;

      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId
            ? { ...c, status: "loading", errorMessage: null }
            : c
        )
      );

      const result = await callGenerateForUrlForList(target.link);

      if (result.ok) {
        setCandidates((prev) =>
          prev.map((c) =>
            c.id === candidateId
              ? { ...c, status: "success", result: result.data, errorMessage: null }
              : c
          )
        );
      } else {
        setCandidates((prev) =>
          prev.map((c) =>
            c.id === candidateId
              ? { ...c, status: "error", errorMessage: result.error }
              : c
          )
        );
      }
    },
    [candidates]
  );

  /** フェーズ11: 選択されている候補すべてに対して順次仮説生成を実行 */
  const handleGenerateForSelected = useCallback(async () => {
    const ids = candidates.filter((c) => c.selected).map((c) => c.id);
    for (const id of ids) {
      // 順次実行して負荷とタイムアウトを抑える
      // eslint-disable-next-line no-await-in-loop
      await handleGenerateForCandidate(id);
    }
  }, [candidates, handleGenerateForCandidate]);

  /** フェーズ11: 候補一覧を CSV として一括ダウンロード */
  const handleExportCandidatesCsv = useCallback(() => {
    const successful = candidates.filter(
      (c) => c.status === "success" && c.result
    );
    if (successful.length === 0) return;

    const csv = buildExportCsvBatch(
      successful.map((candidate) => {
        const result = candidate.result!;
        return {
          companyName: candidate.title,
          inputUrl: candidate.link,
          industry: result.industry ?? null,
          employeeScale: result.employeeScale ?? null,
          decisionMakerName: result.decisionMakerName ?? null,
          irSummary: result.irSummary ?? null,
          summaryBusiness: result.summaryBusiness,
          hypothesisSegments: result.hypothesisSegments,
          letterDraft: result.letterDraft,
        };
      })
    );

    if (!csv) return;

    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "企業リスト_仮説生成.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [candidates]);

  /** 生成実行: POST /api/generate を呼び、成功時は result と編集用 state に保存 */
  async function handleGenerate(url: string, companyNameInput?: string, focus?: OutputFocus) {
    const startedAt = Date.now();
    setLoadingReason("generate");
    setStatus("loading");
    setErrorMessage("");
    setGenerationStartedAt(startedAt);
    setGenerationElapsedSeconds(null);
    setCompanyName(companyNameInput ?? "");
    setInputUrl(url);
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
        setStatus("error");
        return;
      }

      if (res.ok) {
        const gen = data as GenerateResponse;
        setGenerationElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
        setResult(gen);
        setHypothesisSegments([...gen.hypothesisSegments]);
        setLetterDraft(gen.letterDraft);
        setIrSummary(gen.irSummary ?? null);
        setDecisionMakerName(gen.decisionMakerName ?? null);
        setLoadingReason(null);
        setStatus("success");
        // フェーズ8: ログイン時のみ run を DB に保存して runId を取得
        if (user) {
          const runBody: RunInsert = {
            inputUrl: url,
            companyName: companyNameInput ?? null,
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
              setSaveError("結果の保存に失敗しました。画面の内容はそのままご利用いただけます。");
            }
          } catch {
            setSaveError("結果の保存に失敗しました。画面の内容はそのままご利用いただけます。");
          }
        }
      } else {
        const body = data as ApiErrorBody | null;
        setLoadingReason(null);
        setErrorMessage(body?.error ?? "エラーが発生しました");
        setGenerationStartedAt(null);
        setGenerationElapsedSeconds(null);
        setStatus("error");
      }
    } catch {
      setLoadingReason(null);
      setErrorMessage("ネットワークエラーが発生しました。しばらく経ってから再試行してください。");
      setGenerationStartedAt(null);
      setGenerationElapsedSeconds(null);
      setStatus("error");
    }
  }

  /** 再生成: 同じ URL・会社名で再度生成し、run を PATCH で更新。1 回のみ */
  async function handleRegenerate() {
    if (!runId || hasRegeneratedOnce || !inputUrl) return;
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
          url: inputUrl,
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
        setStatus("error");
        return;
      }
      if (!res.ok) {
        const body = data as ApiErrorBody | null;
        setLoadingReason(null);
        setErrorMessage(body?.error ?? "エラーが発生しました");
        setStatus("error");
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
      // 既存 run を新内容で PATCH
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
          setSaveError("再生成した内容の保存に失敗しました。しばらく経ってから再度お試しください。");
        }
      } catch {
        setSaveError("再生成した内容の保存に失敗しました。しばらく経ってから再度お試しください。");
      }
    } catch {
      setLoadingReason(null);
      setErrorMessage("ネットワークエラーが発生しました。しばらく経ってから再試行してください。");
      setStatus("error");
    }
  }

  /** 編集内容を PATCH /api/runs/[id] で保存 */
  async function handleSave() {
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
  }

  /** 履歴 run を読み込み、結果エリア state を復元する */
  async function handleSelectRun(id: string) {
    if (!user) return;
    setLoadingReason("run");
    setStatus("loading");
    setErrorMessage("");
    setSaveError(null);
    try {
      const res = await fetch(`/api/runs/${id}`);
      const data = (await res.json()) as { run?: RunDetail; error?: string };
      if (!res.ok || !data.run) {
        setLoadingReason(null);
        setErrorMessage(data.error ?? "履歴の読み込みに失敗しました。");
        setStatus("error");
        return;
      }
      const run = data.run;
      const segments: HypothesisSegments = [
        run.hypothesisSegment1,
        run.hypothesisSegment2,
        run.hypothesisSegment3,
        run.hypothesisSegment4,
        run.hypothesisSegment5,
      ];
      setCompanyName(run.companyName ?? "");
      setInputUrl(run.inputUrl);
      setResult({
        summaryBusiness: run.summaryBusiness,
        irSummary: run.irSummary ?? null,
        decisionMakerName: run.decisionMakerName ?? null,
        industry: run.industry ?? null,
        employeeScale: run.employeeScale ?? null,
        hypothesisSegments: segments,
        letterDraft: run.letterDraft,
      });
      setHypothesisSegments(segments);
      setLetterDraft(run.letterDraft);
      setIrSummary(run.irSummary ?? null);
      setDecisionMakerName(run.decisionMakerName ?? null);
      setRunId(run.id);
      setSelectedRunId(run.id);
      setHasRegeneratedOnce(run.regeneratedCount >= 1);
      setOutputFocus(null);
      setGenerationElapsedSeconds(null);
      setLoadingReason(null);
      setStatus("success");
    } catch {
      setLoadingReason(null);
      setErrorMessage("履歴の読み込みに失敗しました。しばらく経ってから再試行してください。");
      setStatus("error");
    }
  }

  // --- レイアウト: ビューポート高固定でサイドバーは固定、右側メインのみスクロール ---
  return (
    <div className="h-screen overflow-hidden flex flex-col md:flex-row">
      <HistorySidebar
        user={user}
        loading={loading}
        selectedRunId={selectedRunId}
        onSelectRun={handleSelectRun}
        onNewChat={handleNewChat}
        onSignOut={signOut}
      />
      <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col">
          <main className="max-w-5xl w-full mx-auto px-6 py-10 space-y-8">
            {/* フェーズ11: 企業検索セクション */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  企業を検索してリスト化
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  業界名・地域・キーワードなどを含めて検索し、候補となる企業サイトの一覧を作成します。
                </p>
              </div>
              <form
                onSubmit={handleSearchSubmit}
                className="flex flex-col md:flex-row gap-3 items-stretch md:items-center"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  placeholder="例: SaaS  東京  BtoB  など"
                />
                <button
                  type="submit"
                  disabled={searchLoading}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {searchLoading ? "検索中..." : "企業を検索"}
                </button>
              </form>
              {searchError && (
                <p className="text-sm text-red-500 dark:text-red-400">{searchError}</p>
              )}
              {candidates.length > 0 && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      検索結果から、仮説生成に使いたい企業を選択し、「選択した企業で生成」を押してください。
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleGenerateForSelected}
                        disabled={
                          searchLoading || candidates.every((c) => !c.selected)
                        }
                        className="inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-semibold border border-primary/40 text-primary bg-primary/5 hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        選択した企業で生成
                      </button>
                      <button
                        type="button"
                        onClick={handleExportCandidatesCsv}
                        disabled={candidates.every(
                          (c) => c.status !== "success" || !c.result
                        )}
                        className="inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-semibold border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-100 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        一覧をCSVでダウンロード
                      </button>
                    </div>
                  </div>
                  <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                    {candidates.map((candidate) => (
                      <li key={candidate.id} className="py-3 flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={candidate.selected}
                          onChange={() => toggleCandidateSelected(candidate.id)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/60"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {candidate.title}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 break-all">
                            {candidate.link}
                          </p>
                          {candidate.snippet && (
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                              {candidate.snippet}
                            </p>
                          )}
                          {candidate.status === "error" && candidate.errorMessage && (
                            <p className="mt-1 text-xs text-red-500 dark:text-red-400 line-clamp-2">
                              {candidate.errorMessage}
                            </p>
                          )}
                        </div>
                        <div className="ml-3 flex flex-col items-end gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleGenerateForCandidate(candidate.id)}
                            disabled={candidate.status === "loading"}
                            className="inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-semibold border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-100 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                          >
                            {candidate.status === "idle" && "生成"}
                            {candidate.status === "loading" && "生成中"}
                            {candidate.status === "success" && "再生成"}
                            {candidate.status === "error" && "再試行"}
                          </button>
                          {candidate.status === "success" && (
                            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                              生成済み
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
            {status === "idle" && (
              <ChatInputSection onSubmit={handleGenerate} disabled={false} />
            )}
            {status === "loading" && loadingReason === "generate" && <ResultSkeleton />}
            {status === "loading" && loadingReason === "run" && (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-8">
                チャットを読み込み中...
              </p>
            )}
            {status === "success" && result && hypothesisSegments !== null && (
              <ResultArea
                summaryBusiness={result.summaryBusiness}
                hypothesisSegments={hypothesisSegments}
                letterDraft={letterDraft}
                companyName={companyName || null}
                inputUrl={inputUrl}
                industry={result.industry ?? null}
                employeeScale={result.employeeScale ?? null}
                generationElapsedSeconds={generationElapsedSeconds}
                irSummary={irSummary}
                decisionMakerName={decisionMakerName}
                onSegmentsChange={setHypothesisSegments}
                onLetterDraftChange={setLetterDraft}
                isLoggedIn={!!user}
                runId={runId}
                onSave={handleSave}
                onRegenerate={handleRegenerate}
                hasRegeneratedOnce={hasRegeneratedOnce}
                saveError={saveError}
                onDismissSaveError={() => setSaveError(null)}
                outputFocus={outputFocus}
              />
            )}
            {status === "error" && (
              <ErrorDisplay
                message={errorMessage}
                onRetry={() => {
                  setOutputFocus(null);
                  setGenerationStartedAt(null);
                  setGenerationElapsedSeconds(null);
                  setStatus("idle");
                }}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
