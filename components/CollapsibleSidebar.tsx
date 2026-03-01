"use client";

import { useEffect, useState, type ReactNode } from "react";

type Side = "left" | "right";

type CollapsibleSidebarProps = {
  side: Side;
  title: string;
  /** メインのスクロール領域の内容 */
  children: ReactNode;
  /** ヘッダー直下に表示（展開時のみ）。例: 新しいチャットボタン */
  topContent?: ReactNode;
  /** スクロール領域の下に表示（展開時のみ）。例: ログアウト・フッター */
  bottomContent?: ReactNode;
  /** 折りたたみ時の幅（Tailwind class）。例: "w-16" */
  collapsedWidth?: string;
  /** 展開時の幅（Tailwind class）。例: "w-72" */
  expandedWidth?: string;
  /** レスポンシブ表示。例: "hidden md:flex" */
  responsiveClass?: string;
};

const DEFAULT_COLLAPSED = "w-16";
const DEFAULT_EXPANDED = "w-72";
const CONTENT_DELAY_MS = 180;

export default function CollapsibleSidebar({
  side,
  title,
  children,
  topContent,
  bottomContent,
  collapsedWidth = DEFAULT_COLLAPSED,
  expandedWidth = DEFAULT_EXPANDED,
  responsiveClass = "hidden md:flex",
}: CollapsibleSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showContent, setShowContent] = useState(true);

  useEffect(() => {
    if (collapsed) {
      setShowContent(false);
      return;
    }
    const timer = setTimeout(() => setShowContent(true), CONTENT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [collapsed]);

  const borderClass = side === "left" ? "border-r" : "border-l";
  const expandIcon = side === "left" ? "left_panel_open" : "keyboard_double_arrow_left";
  const collapseIcon = side === "left" ? "left_panel_close" : "keyboard_double_arrow_right";

  return (
    <aside
      className={`${responsiveClass} md:flex-col h-screen overflow-hidden min-w-0 ${borderClass} border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md transition-[width] duration-300 shrink-0 select-none ${
        collapsed ? collapsedWidth : expandedWidth
      }`}
    >
      <div className="w-full min-w-0 h-full min-h-0 p-4 flex flex-col gap-3">
        <div
          className={`flex items-center gap-2 ${collapsed ? "justify-center" : side === "right" ? "" : "justify-between"}`}
        >
          {side === "right" && (
            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              className="h-12 w-12 flex-shrink-0 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={collapsed ? "サイドバーを展開" : "サイドバーを折りたたむ"}
            >
              <span className="material-symbols-outlined text-2xl text-slate-600 dark:text-slate-300">
                {collapsed ? expandIcon : collapseIcon}
              </span>
            </button>
          )}
          {showContent && (
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate min-w-0">
              {title}
            </p>
          )}
          {side === "left" && (
            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              className={`h-12 w-12 flex-shrink-0 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${collapsed ? "" : "ml-auto"}`}
              aria-label={collapsed ? "サイドバーを展開" : "サイドバーを折りたたむ"}
            >
              <span className="material-symbols-outlined text-2xl text-slate-600 dark:text-slate-300">
                {collapsed ? expandIcon : collapseIcon}
              </span>
            </button>
          )}
        </div>

        {showContent && topContent}

        <div
          className={`flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain pr-1 transition-opacity duration-200 ${
            showContent ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {showContent && children}
        </div>

        {showContent && bottomContent}
      </div>
    </aside>
  );
}
