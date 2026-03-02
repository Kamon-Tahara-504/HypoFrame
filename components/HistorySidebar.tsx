"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { User } from "@supabase/supabase-js";
import type { RunListItem } from "@/types";
import CollapsibleSidebar from "@/components/CollapsibleSidebar";
import ConfirmModal from "@/components/ConfirmModal";

type HistorySidebarProps = {
  user: User | null;
  loading: boolean;
  selectedRunId: string | null;
  onSelectRun: (runId: string) => void;
  onNewChat: () => void;
  onSignOut: () => void | Promise<void>;
  /** チャット削除時に呼ぶ。削除した run の id を渡す（選択中だった場合の親側処理用） */
  onRunDeleted?: (runId: string) => void;
  /** チャットタイトル変更時に呼ぶ（選択中 run の表示名を親で同期する用） */
  onRunTitleChange?: (runId: string, newTitle: string) => void;
};

export default function HistorySidebar({
  user,
  loading,
  selectedRunId,
  onSelectRun,
  onNewChat,
  onSignOut,
  onRunDeleted,
  onRunTitleChange,
}: HistorySidebarProps) {
  const [runs, setRuns] = useState<RunListItem[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingRunId, setEditingRunId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [savingTitleId, setSavingTitleId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number } | null>(null);
  const [runToDelete, setRunToDelete] = useState<RunListItem | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const closeMenu = useCallback(() => {
    setOpenMenuId(null);
    setMenuPosition(null);
  }, []);

  useEffect(() => {
    if (openMenuId === null) return;
    const el = triggerRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      setMenuPosition({ left: rect.right + 6, top: rect.top });
    }
  }, [openMenuId]);

  useEffect(() => {
    if (openMenuId === null) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        menuRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      )
        return;
      closeMenu();
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openMenuId, closeMenu]);

  const performDeleteRun = useCallback(
    async (run: RunListItem) => {
      setError(null);
      setDeletingId(run.id);
      try {
        const res = await fetch(`/api/runs/${run.id}`, { method: "DELETE" });
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          throw new Error(data.error ?? "削除に失敗しました。");
        }
        setRuns((prev) => prev.filter((r) => r.id !== run.id));
        onRunDeleted?.(run.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "削除に失敗しました。");
      } finally {
        setDeletingId(null);
      }
    },
    [onRunDeleted]
  );

  const startEditTitle = useCallback((run: RunListItem) => {
    const current = run.companyName?.trim() || run.inputUrl || "";
    setEditingRunId(run.id);
    setEditingTitle(current);
    setOpenMenuId(null);
  }, []);

  useEffect(() => {
    if (editingRunId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingRunId]);

  const saveTitle = useCallback(
    async (runId: string, newTitle: string) => {
      const trimmed = newTitle.trim();
      setSavingTitleId(runId);
      try {
        const res = await fetch(`/api/runs/${runId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyName: trimmed || null }),
        });
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          throw new Error(data.error ?? "タイトルの更新に失敗しました。");
        }
        setRuns((prev) =>
          prev.map((r) =>
            r.id === runId ? { ...r, companyName: trimmed || null } : r
          )
        );
        onRunTitleChange?.(runId, trimmed || "");
      } catch (e) {
        setError(e instanceof Error ? e.message : "タイトルの更新に失敗しました。");
      } finally {
        setSavingTitleId(null);
        setEditingRunId(null);
      }
    },
    [onRunTitleChange]
  );

  const handleEditTitleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, runId: string) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveTitle(runId, (e.target as HTMLInputElement).value);
      } else if (e.key === "Escape") {
        setEditingRunId(null);
      }
    },
    [saveTitle]
  );

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

  const topContent = (
    <>
      <button
        type="button"
        onClick={onNewChat}
        className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <span className="material-symbols-outlined text-xl text-slate-600 dark:text-slate-400">
          edit_note
        </span>
        新しいチャット
      </button>
      <div className="border-b border-slate-200 dark:border-slate-700" aria-hidden />
    </>
  );

  const bottomContent = (
    <>
      {user && !loading && (
        <button
          type="button"
          onClick={() => onSignOut()}
          className="w-full mt-auto rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          ログアウト
        </button>
      )}
      <p className="text-xs text-slate-500 dark:text-slate-400 text-center pt-3 flex-shrink-0">
        © {new Date().getFullYear()} HypoFrame. 営業仮説の構造化ツール
      </p>
    </>
  );

  const runForMenu = openMenuId ? runs.find((r) => r.id === openMenuId) : null;

  return (
    <>
    <CollapsibleSidebar
      side="left"
      title="履歴チャット"
      topContent={topContent}
      bottomContent={bottomContent}
      responsiveClass="hidden md:flex md:flex-col"
    >
      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">認証状態を確認中...</p>
      ) : user ? (
        <>
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
              const title = run.companyName?.trim() || run.inputUrl || "（無題）";
              const isMenuOpen = openMenuId === run.id;
              const isDeleting = deletingId === run.id;
              const isEditing = editingRunId === run.id;
              const isSavingTitle = savingTitleId === run.id;
              return (
                <li
                  key={run.id}
                  className={`flex items-start gap-1 rounded-lg px-2 py-1.5 transition-colors ${
                    selectedRunId === run.id
                      ? "bg-primary/10 dark:bg-primary/20"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => {
                          if (editingRunId === run.id) saveTitle(run.id, editingTitle);
                        }}
                        onKeyDown={(e) => handleEditTitleKeyDown(e, run.id)}
                        disabled={isSavingTitle}
                        className="w-full text-sm font-medium text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="チャットのタイトル"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSelectRun(run.id)}
                        className={`w-full text-left rounded-md px-2 py-1.5 -mx-1.5 -my-1 transition-colors ${
                          selectedRunId === run.id ? "" : "hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
                        }`}
                      >
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                          {title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {new Date(run.updatedAt).toLocaleString("ja-JP", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </button>
                    )}
                  </div>
                  <div className="relative flex-shrink-0 pt-1">
                    <button
                      ref={isMenuOpen ? triggerRef : undefined}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId((prev) => (prev === run.id ? null : run.id));
                      }}
                      disabled={isDeleting || isEditing}
                      className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 disabled:opacity-50"
                      aria-label="メニューを開く"
                      aria-expanded={isMenuOpen}
                    >
                      <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                    </button>
                  </div>
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
    </CollapsibleSidebar>
    {runToDelete && (
      <ConfirmModal
        title="削除の確認"
        message="このチャットを削除しますか？"
        confirmLabel="削除"
        danger
        onClose={() => setRunToDelete(null)}
        onConfirm={() => {
          const run = runToDelete;
          setRunToDelete(null);
          if (run) performDeleteRun(run);
        }}
      />
    )}
    {openMenuId &&
      menuPosition &&
      runForMenu &&
      typeof document !== "undefined" &&
      createPortal(
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            left: menuPosition.left,
            top: menuPosition.top,
            zIndex: 10,
          }}
          className="min-w-[8rem] rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-black/30 py-1.5 px-1.5"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              startEditTitle(runForMenu);
            }}
            className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors whitespace-nowrap"
          >
            タイトルを編集
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setRunToDelete(runForMenu);
              closeMenu();
            }}
            className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors whitespace-nowrap"
          >
            削除
          </button>
        </div>,
        document.body
      )}
    </>
  );
}
