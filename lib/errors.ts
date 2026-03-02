/**
 * API エラー文言の集約。文言変更・多言語化の足がかりとして利用。
 */
import type { ApiErrorCode } from "@/types";

/** 04 第5節の表示文言 */
const API_ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  BAD_REQUEST: "リクエスト形式が不正です。",
  TIMEOUT:
    "取得できませんでした。URLをご確認のうえ、しばらく経ってから再試行してください。",
  CRAWL_FORBIDDEN: "このページは取得できませんでした。",
  CRAWL_EMPTY:
    "十分な情報が取得できませんでした。別のURL（例：会社概要ページ）をお試しください。",
  LLM_ERROR:
    "仮説の生成に失敗しました。しばらく経ってから再試行してください。",
};

export function getApiErrorMessage(code: ApiErrorCode): string {
  return API_ERROR_MESSAGES[code];
}
