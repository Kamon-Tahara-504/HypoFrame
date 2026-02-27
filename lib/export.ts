/**
 * エクスポート・コピー用テキスト組み立て（04-implementation-decisions 第8節）。
 * 要約・仮説5段（ラベル付き）・提案文を 1 テキストにし、.txt 用に UTF-8 で返す。
 */
import type { HypothesisSegments } from "@/types";
import { HYPOTHESIS_SEGMENT_LABELS } from "./prompts";

/** 04 第8節の構成で 1 テキストを組み立てる。業種・従業員規模があれば先頭に付与 */
export function buildExportText(
  summaryBusiness: string,
  hypothesisSegments: HypothesisSegments,
  letterDraft: string,
  industry?: string | null,
  employeeScale?: string | null
): string {
  const parts: string[] = [];

  if (industry?.trim() || employeeScale?.trim()) {
    const lines: string[] = [];
    if (industry?.trim()) lines.push(`業種: ${industry.trim()}`);
    if (employeeScale?.trim()) lines.push(`従業員規模: ${employeeScale.trim()}`);
    if (lines.length > 0) {
      parts.push(lines.join(" / "));
      parts.push("");
    }
  }

  parts.push("■ 事業要約");
  parts.push("");
  parts.push(summaryBusiness);
  parts.push("");
  parts.push("■ 仮説");
  parts.push("");

  for (let i = 0; i < 5; i++) {
    parts.push(HYPOTHESIS_SEGMENT_LABELS[i]);
    parts.push("");
    parts.push(hypothesisSegments[i]);
    parts.push("");
  }

  parts.push("■ 提案文下書き");
  parts.push("");
  parts.push(letterDraft);

  return parts.join("\n");
}

/** エクスポートファイル名: 仮説_会社名_YYYYMMDD.txt（会社名は入力値または「不明」） */
export function getExportFileName(companyName: string | null | undefined): string {
  const name = companyName?.trim() || "不明";
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `仮説_${name}_${y}${m}${d}.txt`;
}
