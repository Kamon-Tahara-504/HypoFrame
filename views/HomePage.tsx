"use client";

/**
 * トップページ（05-ui-ux）。1 画面で入力・ローディング・結果・エラーを切り替え。
 * 状態: idle → 生成ボタンで loading → POST /api/generate の結果で success または error。
 * フェーズ6: 編集用 state（hypothesisSegments, letterDraft）、runId、再生成1回。
 */
import { useEffect, useState } from "react";
import type {
  ApiErrorBody,
  GenerateResponse,
  HypothesisSegments,
  RunDetail,
  RunInsert,
} from "@/types";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import HistorySidebar from "@/components/HistorySidebar";
import ChatInputSection from "@/components/ChatInputSection";
import type { OutputFocus } from "@/types";
import LoadingProgress from "@/components/LoadingProgress";
import ResultArea from "@/components/ResultArea";
import ErrorDisplay from "@/components/ErrorDisplay";

type Status = "idle" | "loading" | "success" | "error";

/** res.json() 失敗時に status から表示するフォールバック文言（API の ERROR_MESSAGES と揃える） */
const FALLBACK_ERROR_BY_STATUS: Partial<Record<number, string>> = {
  408: "取得できませんでした。URLをご確認のうえ、しばらく経ってから再試行してください。",
  502: "仮説の生成に失敗しました。しばらく経ってから再試行してください。",
};

export default function HomePage() {
  const { user, loading, signOut } = useAuth();
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [companyName, setCompanyName] = useState("");
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

  useEffect(() => {
    if (!user) {
      setRunId(null);
      setSelectedRunId(null);
      setHasRegeneratedOnce(false);
    }
  }, [user]);

  /** 生成実行: POST /api/generate を呼び、成功時は result と編集用 state に保存 */
  async function handleGenerate(url: string, companyNameInput?: string, focus?: OutputFocus) {
    setStatus("loading");
    setErrorMessage("");
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
        setErrorMessage(
          FALLBACK_ERROR_BY_STATUS[res.status] ??
            "エラーが発生しました。しばらく経ってから再試行してください。"
        );
        setStatus("error");
        return;
      }

      if (res.ok) {
        const gen = data as GenerateResponse;
        setResult(gen);
        setHypothesisSegments([...gen.hypothesisSegments]);
        setLetterDraft(gen.letterDraft);
        setStatus("success");
        // フェーズ8: ログイン時のみ run を DB に保存して runId を取得
        if (user) {
          const runBody: RunInsert = {
            inputUrl: url,
            companyName: companyNameInput ?? null,
            summaryBusiness: gen.summaryBusiness,
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
        setErrorMessage(body?.error ?? "エラーが発生しました");
        setStatus("error");
      }
    } catch {
      setErrorMessage("ネットワークエラーが発生しました。しばらく経ってから再試行してください。");
      setStatus("error");
    }
  }

  /** 再生成: 同じ URL・会社名で再度生成し、run を PATCH で更新。1 回のみ */
  async function handleRegenerate() {
    if (!runId || hasRegeneratedOnce || !inputUrl) return;
    setStatus("loading");
    setErrorMessage("");
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
        setErrorMessage(
          FALLBACK_ERROR_BY_STATUS[res.status] ??
            "エラーが発生しました。しばらく経ってから再試行してください。"
        );
        setStatus("error");
        return;
      }
      if (!res.ok) {
        const body = data as ApiErrorBody | null;
        setErrorMessage(body?.error ?? "エラーが発生しました");
        setStatus("error");
        return;
      }
      const gen = data as GenerateResponse;
      setResult(gen);
      setHypothesisSegments([...gen.hypothesisSegments]);
      setLetterDraft(gen.letterDraft);
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
          }),
        });
        if (!patchRes.ok) {
          setSaveError("再生成した内容の保存に失敗しました。しばらく経ってから再度お試しください。");
        }
      } catch {
        setSaveError("再生成した内容の保存に失敗しました。しばらく経ってから再度お試しください。");
      }
    } catch {
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
    setStatus("loading");
    setErrorMessage("");
    setSaveError(null);
    try {
      const res = await fetch(`/api/runs/${id}`);
      const data = (await res.json()) as { run?: RunDetail; error?: string };
      if (!res.ok || !data.run) {
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
        hypothesisSegments: segments,
        letterDraft: run.letterDraft,
      });
      setHypothesisSegments(segments);
      setLetterDraft(run.letterDraft);
      setRunId(run.id);
      setSelectedRunId(run.id);
      setHasRegeneratedOnce(run.regeneratedCount >= 1);
      setOutputFocus(null);
      setStatus("success");
    } catch {
      setErrorMessage("履歴の読み込みに失敗しました。しばらく経ってから再試行してください。");
      setStatus("error");
    }
  }

  // --- レイアウト: ヘッダー＋メイン（入力・ローディング／結果／エラー） ---
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="md:flex flex-1">
        <HistorySidebar
          user={user}
          loading={loading}
          selectedRunId={selectedRunId}
          onSelectRun={handleSelectRun}
          onSignOut={signOut}
        />
        <div className="flex-1 min-w-0 flex flex-col">
          <main className="max-w-5xl w-full mx-auto px-6 py-10 space-y-8 flex-1">
            {status === "idle" && (
              <ChatInputSection onSubmit={handleGenerate} disabled={false} />
            )}
            {status === "loading" && <LoadingProgress />}
            {status === "success" && result && hypothesisSegments !== null && (
              <ResultArea
                summaryBusiness={result.summaryBusiness}
                hypothesisSegments={hypothesisSegments}
                letterDraft={letterDraft}
                companyName={companyName || null}
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
                  setStatus("idle");
                }}
              />
            )}
          </main>
          <footer className="border-t border-slate-200 dark:border-slate-800 py-10 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              © {new Date().getFullYear()} HypoFrame. 営業仮説の構造化ツール
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
