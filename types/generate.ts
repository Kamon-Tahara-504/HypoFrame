import type { HypothesisSegments } from "./hypothesis";

/** POST /api/generate のリクエスト body */
export interface GenerateRequest {
  url: string;
  companyName?: string;
}

/** POST /api/generate の成功時レスポンス (200) */
export interface GenerateResponse {
  summaryBusiness: string;
  hypothesisSegments: HypothesisSegments;
  letterDraft: string;
}
