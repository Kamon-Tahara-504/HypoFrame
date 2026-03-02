"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExportRow } from "@/types/export";

type GoogleDocsPayload = { companyName?: string | null; letterDraft: string };

type UseGoogleExportOptions = {
  isLoggedIn: boolean;
  pathname: string | null;
};

/**
 * Google 連携状態の取得と、Sheet / Docs エクスポートの state とハンドラを管理する。
 * ResultArea から Google まわりを切り出したフック。
 */
export function useGoogleExport({ isLoggedIn, pathname }: UseGoogleExportOptions) {
  const [googleLinked, setGoogleLinked] = useState<boolean | null>(null);
  const [googleExportError, setGoogleExportError] = useState<string | null>(null);
  const [exportingSheet, setExportingSheet] = useState(false);
  const [exportingDocs, setExportingDocs] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      setGoogleLinked(null);
      return;
    }
    let cancelled = false;
    fetch("/api/auth/google/status")
      .then((res) => res.json())
      .then((data: { linked?: boolean }) => {
        if (!cancelled && typeof data.linked === "boolean") setGoogleLinked(data.linked);
      })
      .catch(() => {
        if (!cancelled) setGoogleLinked(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    if (params.get("google_linked") === "1" && isLoggedIn) setGoogleLinked(true);
  }, [isLoggedIn]);

  const handleGoogleLink = useCallback(() => {
    const returnTo = pathname && pathname !== "/" ? pathname : "/";
    window.location.href = `/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`;
  }, [pathname]);

  const handleExportGoogleSheet = useCallback(async (payload: ExportRow) => {
    setGoogleExportError(null);
    setExportingSheet(true);
    try {
      const res = await fetch("/api/export/google-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { spreadsheetUrl?: string; error?: string };
      if (!res.ok) {
        if (res.status === 401) setGoogleLinked(false);
        setGoogleExportError(data.error ?? "スプレッドシートの出力に失敗しました。");
        return;
      }
      if (data.spreadsheetUrl) window.open(data.spreadsheetUrl, "_blank");
    } catch {
      setGoogleExportError("スプレッドシートの出力に失敗しました。");
    } finally {
      setExportingSheet(false);
    }
  }, []);

  const handleExportGoogleDocs = useCallback(async (payload: GoogleDocsPayload) => {
    setGoogleExportError(null);
    setExportingDocs(true);
    try {
      const res = await fetch("/api/export/google-docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { documentUrl?: string; error?: string };
      if (!res.ok) {
        if (res.status === 401) setGoogleLinked(false);
        setGoogleExportError(data.error ?? "ドキュメントの出力に失敗しました。");
        return;
      }
      if (data.documentUrl) window.open(data.documentUrl, "_blank");
    } catch {
      setGoogleExportError("ドキュメントの出力に失敗しました。");
    } finally {
      setExportingDocs(false);
    }
  }, []);

  const dismissGoogleExportError = useCallback(() => setGoogleExportError(null), []);

  return {
    googleLinked,
    googleExportError,
    exportingSheet,
    exportingDocs,
    handleGoogleLink,
    handleExportGoogleSheet,
    handleExportGoogleDocs,
    dismissGoogleExportError,
  };
}
