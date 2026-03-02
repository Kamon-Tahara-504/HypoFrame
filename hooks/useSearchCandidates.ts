"use client";

import { useCallback, useEffect, useState } from "react";
import type React from "react";
import type { CompanyCandidate } from "@/types";
import { buildExportSearchListCsv } from "@/lib/export";
import { toSavedSearchCandidates } from "@/lib/search-candidates";

const MAX_SELECTED_CANDIDATES = 3;

/**
 * 企業検索クエリ・候補リスト・選択トグル・CSV エクスポートを管理する。
 * runId があるときは候補・クエリの変更を debounce で PATCH する。
 */
export function useSearchCandidates(
  runId: string | null,
  setInputUrls: React.Dispatch<React.SetStateAction<string[]>>
) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<CompanyCandidate[]>([]);
  const [selectionValidationMessage, setSelectionValidationMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!selectionValidationMessage) return;
    const t = setTimeout(() => setSelectionValidationMessage(null), 4000);
    return () => clearTimeout(t);
  }, [selectionValidationMessage]);

  useEffect(() => {
    if (!runId) return;
    if (candidates.length === 0 && !searchQuery.trim()) return;
    const t = setTimeout(() => {
      fetch(`/api/runs/${runId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchQuery: searchQuery.trim() || null,
          searchCandidates:
            candidates.length > 0 ? toSavedSearchCandidates(candidates) : null,
        }),
      }).catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [runId, candidates, searchQuery]);

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
        if (runId) {
          try {
            await fetch(`/api/runs/${runId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                searchQuery: trimmed,
                searchCandidates: toSavedSearchCandidates(nextCandidates),
              }),
            });
          } catch {}
        }
      } catch {
        setSearchError(
          "検索に失敗しました。ネットワーク状況を確認のうえ、しばらく経ってから再試行してください。"
        );
      } finally {
        setSearchLoading(false);
      }
    },
    [searchQuery, runId]
  );

  const toggleCandidateSelected = useCallback((id: string) => {
    setSelectionValidationMessage(null);
    setCandidates((prev) => {
      const target = prev.find((c) => c.id === id);
      if (!target) return prev;
      const nextSelected = !target.selected;
      const selectedCount = prev.filter((c) => c.selected).length;
      if (nextSelected && selectedCount >= MAX_SELECTED_CANDIDATES) {
        setSelectionValidationMessage(
          "最大3件まで選択できます。不要な選択を外してから追加してください。"
        );
        return prev;
      }
      const next = prev.map((c) =>
        c.id === id ? { ...c, selected: nextSelected } : c
      );
      setInputUrls((urls) => {
        if (nextSelected) {
          if (urls.includes(target.link) || urls.length >= MAX_SELECTED_CANDIDATES)
            return urls;
          return [...urls, target.link];
        }
        return urls.filter((u) => u !== target.link);
      });
      return next;
    });
  }, [setInputUrls]);

  const handleExportCandidatesCsv = useCallback(() => {
    if (candidates.length === 0) return;
    const csv = buildExportSearchListCsv(
      candidates.map((c) => ({
        title: c.title,
        link: c.link,
        snippet: c.snippet ?? "",
        selected: c.selected,
      }))
    );
    if (!csv) return;
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = "企業リスト.csv";
      a.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  }, [candidates]);

  return {
    searchQuery,
    setSearchQuery,
    searchLoading,
    searchError,
    setSearchError,
    candidates,
    setCandidates,
    selectionValidationMessage,
    handleSearchSubmit,
    toggleCandidateSelected,
    handleExportCandidatesCsv,
    maxSelectedCandidates: MAX_SELECTED_CANDIDATES,
  };
}
