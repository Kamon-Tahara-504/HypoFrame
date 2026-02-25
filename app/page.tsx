"use client";

/**
 * トップページ（05-ui-ux）。1 画面で入力・ローディング・結果・エラーを切り替え。
 * 状態: idle → 生成ボタンで loading → POST /api/generate の結果で success または error。
 */
import { useState } from "react";
import type { ApiErrorBody, GenerateResponse } from "@/types";
import Header from "@/components/Header";
import InputArea from "@/components/InputArea";
import LoadingProgress from "@/components/LoadingProgress";
import ResultArea from "@/components/ResultArea";
import ErrorDisplay from "@/components/ErrorDisplay";

type Status = "idle" | "loading" | "success" | "error";

export default function Home() {
  // --- 状態（idle / loading / success / error） ---
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  /** 生成実行: POST /api/generate を呼び、成功時は result に保存、失敗時は errorMessage に API の error を設定 */
  async function handleGenerate(url: string, companyNameInput?: string) {
    setStatus("loading");
    setErrorMessage("");
    setCompanyName(companyNameInput ?? "");

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
        setResult(data as GenerateResponse);
        setStatus("success");
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
        {status === "success" && result && (
          <ResultArea data={result} companyName={companyName || null} />
        )}
        {status === "error" && (
          <ErrorDisplay
            message={errorMessage}
            onRetry={() => setStatus("idle")}
          />
        )}
      </main>
    </>
  );
}
