import type { GenerateResponse } from "./generate";

/** Google 検索結果 1 件分の最小情報 */
export interface SearchItem {
  /** 検索結果のタイトル（企業名など） */
  title: string;
  /** 企業サイトなどへのリンク URL */
  link: string;
  /** Google が返すスニペット（概要テキスト） */
  snippet: string;
}

/** 検索結果に対してアプリ内で保持する候補＋生成結果の状態 */
export interface CompanyCandidate extends SearchItem {
  /** 安定した一意ID（link を元に生成） */
  id: string;
  /** 一括生成対象として選択されているかどうか */
  selected: boolean;
  /** この候補に対する生成ステータス */
  status: "idle" | "loading" | "success" | "error";
  /** 生成に成功した場合の結果 */
  result?: GenerateResponse | null;
  /** 生成に失敗した場合のエラーメッセージ */
  errorMessage?: string | null;
}

/** Search API のレスポンス構造 */
export interface SearchResponse {
  items: SearchItem[];
}

