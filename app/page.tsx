"use client";

/**
 * トップページ（05-ui-ux）。1 画面で入力・ローディング・結果・エラーを切り替え。
 * 状態: idle → 生成ボタンで loading → POST /api/generate の結果で success または error。
 * フェーズ6: 編集用 state（hypothesisSegments, letterDraft）、runId、再生成1回。
 */
import { useState } from "react";
import type { ApiErrorBody, GenerateResponse, HypothesisSegments, RunInsert } from "@/types";
import Header from "@/components/Header";
import InputArea from "@/components/InputArea";
import LoadingProgress from "@/components/LoadingProgress";
import ResultArea from "@/components/ResultArea";
import ErrorDisplay from "@/components/ErrorDisplay";

type Status = "idle" | "loading" | "success" | "error";

export default function Home() {
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

  /** 生成実行: POST /api/generate を呼び、成功時は result と編集用 state に保存 */
  async function handleGenerate(url: string, companyNameInput?: string) {
    setStatus("loading");
    setErrorMessage("");
    setCompanyName(companyNameInput ?? "");
    setInputUrl(url);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          companyName: companyNameInput || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const gen = data as GenerateResponse;
        setResult(gen);
        setHypothesisSegments([...gen.hypothesisSegments]);
        setLetterDraft(gen.letterDraft);
        setStatus("success");
        // run を DB に保存して runId を取得
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
          if (runRes.ok && runData?.id) setRunId(runData.id);
        } catch {
          // run 保存失敗時も結果表示は続行
        }
      } else {
        const body = data as ApiErrorBody;
        setErrorMessage(body.error ?? "エラーが発生しました");
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
      const data = await res.json();
      if (!res.ok) {
        const body = data as ApiErrorBody;
        setErrorMessage(body.error ?? "エラーが発生しました");
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
      await fetch(`/api/runs/${runId}`, {
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
    } catch {
      setErrorMessage("ネットワークエラーが発生しました。しばらく経ってから再試行してください。");
      setStatus("error");
    }
  }

  /** 編集内容を PATCH /api/runs/[id] で保存 */
  async function handleSave() {
    if (!runId || hypothesisSegments === null) return;
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
    } catch {
      // 保存失敗時は要望に応じてトースト等を追加可能
    }
  }

  // --- レイアウト: ヘッダー＋メイン（入力・ローディング／結果／エラー） ---
  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <InputArea
          onSubmit={handleGenerate}
          disabled={status === "loading"}
        />
        {status === "loading" && <LoadingProgress />}
        {status === "success" && result && hypothesisSegments !== null && (
          <ResultArea
            summaryBusiness={result.summaryBusiness}
            hypothesisSegments={hypothesisSegments}
            letterDraft={letterDraft}
            companyName={companyName || null}
            onSegmentsChange={setHypothesisSegments}
            onLetterDraftChange={setLetterDraft}
            runId={runId}
            onSave={handleSave}
            onRegenerate={handleRegenerate}
            hasRegeneratedOnce={hasRegeneratedOnce}
          />
        )}
        {status === "error" && (
          <ErrorDisplay
            message={errorMessage}
            onRetry={() => setStatus("idle")}
          />
        )}
      </main>
      <footer className="mt-20 border-t border-slate-200 dark:border-slate-800 py-10 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} HypoFrame. 営業仮説の構造化ツール
        </p>
      </footer>
    </>
  );
}
