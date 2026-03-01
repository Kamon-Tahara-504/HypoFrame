"use client";

import type React from "react";
import type { CompanyCandidate } from "@/types";
import CollapsibleSidebar from "@/components/CollapsibleSidebar";
import { getDomainForFavicon, getFaviconUrl } from "@/lib/favicon";

type SearchSidebarProps = {
  searchQuery: string;
  onSearchQueryChange: (v: string) => void;
  onSearchSubmit: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  searchLoading: boolean;
  searchError: string | null;
  candidates: CompanyCandidate[];
  onToggleCandidateSelected: (id: string) => void;
  onExportCsv: () => void;
  selectionValidationMessage: string | null;
  maxSelectedCandidates: number;
};

export default function SearchSidebar({
  searchQuery,
  onSearchQueryChange,
  onSearchSubmit,
  searchLoading,
  searchError,
  candidates,
  onToggleCandidateSelected,
  onExportCsv,
  selectionValidationMessage,
  maxSelectedCandidates,
}: SearchSidebarProps) {
  return (
    <CollapsibleSidebar
      side="right"
      title="企業を検索してリスト化"
      expandedWidth="w-80"
      responsiveClass="hidden lg:flex lg:flex-col"
    >
      <section className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug">
          業界・地域・キーワードで検索し、
          <br />
          候補企業の一覧を作成します。
        </p>
          <form
            onSubmit={onSearchSubmit}
            className="flex flex-col gap-3"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
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
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                    aria-live="polite"
                  >
                    <span className="tabular-nums">
                      {candidates.filter((c) => c.selected).length} / {maxSelectedCandidates}
                    </span>
                    件選択中
                  </span>
                  <button
                    type="button"
                    onClick={onExportCsv}
                    disabled={candidates.every(
                      (c) => c.status !== "success" || !c.result
                    )}
                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-semibold border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-100 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    一覧をCSVでダウンロード
                  </button>
                </div>
              </div>
              {selectionValidationMessage && (
                <div
                  className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 px-3 py-2 text-sm text-amber-800 dark:text-amber-200"
                  role="alert"
                >
                  <svg
                    className="h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {selectionValidationMessage}
                </div>
              )}
              <ul className="flex flex-col gap-2">
                {candidates.map((candidate) => {
                  const selectedCount = candidates.filter((c) => c.selected).length;
                  const atLimit = selectedCount >= maxSelectedCandidates;
                  const canSelect = candidate.selected || !atLimit;
                  const faviconUrl = getFaviconUrl(getDomainForFavicon(candidate.link));
                  return (
                    <li
                      key={candidate.id}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/70 shadow-sm overflow-hidden"
                    >
                      <div className="p-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onToggleCandidateSelected(candidate.id)}
                            aria-pressed={candidate.selected}
                            aria-label={candidate.selected ? "選択を外す" : canSelect ? "選択する" : "最大3件のため追加できません"}
                            className={`
                              shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border-2 transition-all
                              focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 dark:focus:ring-offset-slate-900
                              ${candidate.selected
                                ? "border-primary bg-primary/15 text-primary shadow-sm"
                                : canSelect
                                  ? "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                                  : "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-75"
                              }
                            `}
                          >
                            {candidate.selected ? (
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="2" />
                              </svg>
                            )}
                          </button>
                          <a
                            href={candidate.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 min-w-0 h-8 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 rounded"
                          >
                            {faviconUrl && (
                              <img
                                src={faviconUrl}
                                alt=""
                                width={20}
                                height={20}
                                className="shrink-0 w-5 h-5 rounded object-contain bg-slate-100 dark:bg-slate-800"
                              />
                            )}
                            <span className="truncate">{candidate.title}</span>
                          </a>
                        </div>
                        <hr className="my-1.5 border-0 border-t border-slate-200 dark:border-slate-700" />
                        {candidate.snippet ? (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                            {candidate.snippet}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 dark:text-slate-500 italic">説明なし</p>
                        )}
                        {candidate.status === "error" && candidate.errorMessage && (
                          <p className="mt-1 text-xs text-red-500 dark:text-red-400 line-clamp-2">
                            {candidate.errorMessage}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
      </section>
    </CollapsibleSidebar>
  );
}
