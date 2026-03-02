import React from "react";

/** 画面全体のローディング表示（Suspense の fallback 用） */
export default function LoadingFallback() {
  return (
    <div
      className="min-h-screen flex items-center justify-center text-slate-500"
      role="status"
      aria-live="polite"
    >
      読み込み中...
    </div>
  );
}

