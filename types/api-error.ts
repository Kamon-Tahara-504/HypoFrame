/** API エラー時の code。4.2 節の統一エラー形式 */
export type ApiErrorCode =
  | "TIMEOUT"
  | "CRAWL_FORBIDDEN"
  | "CRAWL_EMPTY"
  | "LLM_ERROR";

/** 4xx/5xx 時の body */
export interface ApiErrorBody {
  error: string;
  code: ApiErrorCode;
}
