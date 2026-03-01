"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

/**
 * 履歴（run）の選択まわりを管理する。
 * user が null になると runId / selectedRunId / hasRegeneratedOnce をクリアする。
 */
export function useRunHistory(user: User | null) {
  const [runId, setRunId] = useState<string | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [hasRegeneratedOnce, setHasRegeneratedOnce] = useState(false);

  useEffect(() => {
    if (!user) {
      setRunId(null);
      setSelectedRunId(null);
      setHasRegeneratedOnce(false);
    }
  }, [user]);

  return {
    runId,
    setRunId,
    selectedRunId,
    setSelectedRunId,
    hasRegeneratedOnce,
    setHasRegeneratedOnce,
  };
}
