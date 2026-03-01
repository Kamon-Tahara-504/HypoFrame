/**
 * フェーズ12: Google エクスポート API の Body 型。
 * buildExportCsv の引数と同じ形状で、Sheet 出力で利用する。
 */
import type { HypothesisSegments } from "./hypothesis";

export type ExportRow = {
  companyName?: string | null;
  inputUrl: string;
  industry?: string | null;
  employeeScale?: string | null;
  decisionMakerName?: string | null;
  irSummary?: string | null;
  summaryBusiness: string;
  hypothesisSegments: HypothesisSegments;
  letterDraft: string;
};

export type GoogleDocsExportBody = {
  companyName?: string | null;
  letterDraft: string;
};
