"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import ThemeToggle from "./ThemeToggle";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group relative text-base font-semibold text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors duration-200"
    >
      {children}
      <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    </Link>
  );
}

function Divider() {
  return <span className="w-px h-4 bg-slate-300 dark:bg-slate-600 flex-shrink-0" />;
}

/**
 * ヘッダー（05-ui-ux 画面構成）。
 * アプリ名・短い説明。右側にログイン／新規登録、認証時はメールアドレス全文表示。ログアウトはサイドバーのみ。
 */
export default function Header() {
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/?new=1" className="flex items-center gap-3">
            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-primary text-white">
              <span className="material-symbols-outlined text-2xl">account_tree</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                HypoFrame
              </h1>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                営業の思考を構造化するツール
              </p>
            </div>
          </Link>
        </div>
        <nav className="flex items-center gap-5">
          <NavLink href="/?new=1">ホーム</NavLink>
          {!loading && (
            <>
              {user ? (
                <>
                  <Divider />
                  <span className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {user.email ?? ""}
                  </span>
                </>
              ) : (
                <>
                  <Divider />
                  <NavLink href="/login">ログイン</NavLink>
                  <Divider />
                  <NavLink href="/signup">新規登録</NavLink>
                </>
              )}
            </>
          )}
          <Divider />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
