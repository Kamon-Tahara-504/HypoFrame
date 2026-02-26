"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { RunListItem } from "@/types";

type HistorySidebarProps = {
  user: User | null;
  loading: boolean;
  selectedRunId: string | null;
  onSelectRun: (runId: string) => void;
  onSignOut: () => void | Promise<void>;
};

export default function HistorySidebar({
  user,
  loading,
  selectedRunId,
  onSelectRun,
  onSignOut,
}: HistorySidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showContent, setShowContent] = useState(true);
  const [runs, setRuns] = useState<RunListItem[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (collapsed) {
      setShowContent(false);
      return;
    }
    const timer = setTimeout(() => setShowContent(true), 180);
    return () => clearTimeout(timer);
  }, [collapsed]);

  useEffect(() => {
    if (!user) {
      setRuns([]);
      setError(null);
      return;
    }

    let active = true;
    async function fetchRuns() {
      setFetching(true);
      setError(null);
      try {
        const res = await fetch("/api/runs?limit=30", { cache: "no-store" });
        const data = (await res.json()) as { runs?: RunListItem[]; error?: string };
        if (!res.ok) {
          throw new Error(data.error ?? "履歴の取得に失敗しました。");
        }
        if (!active) return;
        setRuns(data.runs ?? []);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "履歴の取得に失敗しました。");
      } finally {
        if (active) setFetching(false);
      }
    }

    fetchRuns();
    return () => {
      active = false;
    };
  }, [user]);

  return (
    <aside
      className={`hidden md:flex md:flex-col border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md transition-all duration-300 shrink-0 ${
        collapsed ? "w-16" : "w-72"
      }`}
    >
      <div className="w-full h-full min-h-0 p-4 flex flex-col gap-3">
        <div
          className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}
        >
          {showContent && (
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">履歴チャット</p>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            className={`h-12 w-12 flex-shrink-0 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${collapsed ? "" : "ml-auto"}`}
            aria-label={collapsed ? "サイドバーを展開" : "サイドバーを折りたたむ"}
          >
            <span className="material-symbols-outlined text-2xl text-slate-600 dark:text-slate-300">
              {collapsed ? "left_panel_open" : "left_panel_close"}
            </span>
          </button>
        </div>

        <div
          className={`flex-1 overflow-y-auto pr-1 transition-opacity duration-200 ${
            showContent ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {showContent && (
            <>
            {loading ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">認証状態を確認中...</p>
            ) : user ? (
              <>
                {fetching && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">履歴を読み込み中...</p>
                )}
                {error && (
                  <p className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}
                {!fetching && !error && runs.length === 0 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    まだ履歴がありません。企業URLを入力して生成すると保存されます。
                  </p>
                )}
                <ul className="mt-2 space-y-2">
                  {runs.map((run) => {
                    const title = run.companyName?.trim() || run.inputUrl;
                    return (
                      <li key={run.id}>
                        <button
                          type="button"
                          onClick={() => onSelectRun(run.id)}
                          className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
                            selectedRunId === run.id
                              ? "border-primary/40 bg-primary/5"
                              : "border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                            {title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {new Date(run.updatedAt).toLocaleString("ja-JP")}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  登録すると使える機能
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  生成結果の保存、履歴からの再表示、編集内容の管理が利用できます。
                </p>
                <div className="flex items-center gap-3 text-sm">
                  <Link href="/signup" className="text-primary hover:underline">
                    新規登録
                  </Link>
                  <span className="text-slate-400">|</span>
                  <Link href="/login" className="text-primary hover:underline">
                    ログイン
                  </Link>
                </div>
              </div>
            )}
            </>
          )}
        </div>

        {showContent && user && !loading && (
          <button
            type="button"
            onClick={() => onSignOut()}
            className="w-full mt-auto rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ログアウト
          </button>
        )}
      </div>
    </aside>
  );
}
