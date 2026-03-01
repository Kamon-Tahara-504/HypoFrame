import type { CompanyCandidate, SavedSearchCandidate } from "@/types";

/** CompanyCandidate を run 保存用の形式に変換する */
export function toSavedSearchCandidates(
  candidates: CompanyCandidate[]
): SavedSearchCandidate[] {
  return candidates.map((c) => ({
    id: c.id,
    title: c.title,
    link: c.link,
    snippet: c.snippet,
    selected: c.selected,
  }));
}

/** 保存形式を CompanyCandidate に復元する（status: idle, result/errorMessage は null） */
export function fromSavedSearchCandidates(
  saved: SavedSearchCandidate[] | null | undefined
): CompanyCandidate[] {
  if (!saved || !Array.isArray(saved)) return [];
  return saved.map((s) => ({
    id: s.id,
    title: s.title,
    link: s.link,
    snippet: s.snippet,
    selected: s.selected,
    status: "idle" as const,
    result: null,
    errorMessage: null,
  }));
}
