import type { HypothesisSegments } from "./hypothesis";

/** 出力のどこに焦点を当てるか（テンプレート選択。プロンプトに軽く反映） */
export type OutputFocus = "summary" | "hypothesis" | "letter";

/** POST /api/generate のリクエスト body */
export interface GenerateRequest {
  url: string;
  companyName?: string;
  /** 指定時、該当する生成段階のプロンプトに軽い指示を追加 */
  outputFocus?: OutputFocus;
}

/** POST /api/generate の成功時レスポンス (200) */
export interface GenerateResponse {
  summaryBusiness: string;
  /** 業種・事業内容（1行）。要約の構造化で取得、未取得時は null */
  industry?: string | null;
  /** 従業員規模（例: 500-1000名）。要約の構造化で取得、未取得時は null */
  employeeScale?: string | null;
  /** 代表者名。代表者・役員等、分かる範囲で1名（不明時は null） */
  decisionMakerName?: string | null;
  /** IR 要約。IR 資料（決算・中期経営計画・リスク情報など）のポイント（未取得時は null） */
  irSummary?: string | null;
  hypothesisSegments: HypothesisSegments;
  letterDraft: string;
}
