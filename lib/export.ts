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
  employeeScale?: string | null,
  irSummary?: string | null
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
  if (irSummary && irSummary.trim()) {
    parts.push("■ IR要約");
    parts.push("");
    parts.push(irSummary.trim());
    parts.push("");
  }
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

function escapeCsvField(value: string): string {
  const needsQuote = /[",\n]/.test(value);
  let v = value.replace(/"/g, '""');
  return needsQuote ? `"${v}"` : v;
}

/** 1件分の結果を CSV 1行に整形する。1行目にヘッダーを含めて返す。 */
export function buildExportCsv(args: {
  companyName?: string | null;
  inputUrl: string;
  industry?: string | null;
  employeeScale?: string | null;
  decisionMakerName?: string | null;
  irSummary?: string | null;
  summaryBusiness: string;
  hypothesisSegments: HypothesisSegments;
  letterDraft: string;
}): string {
  const headers = [
    "会社名",
    "URL",
    "業種",
    "従業員規模",
    "代表者名",
    "事業要約",
    "IR要約",
    "仮説1",
    "仮説2",
    "仮説3",
    "仮説4",
    "仮説5",
    "提案文下書き",
  ];

  const {
    companyName,
    inputUrl,
    industry,
    employeeScale,
    decisionMakerName,
    summaryBusiness,
    irSummary,
    hypothesisSegments,
    letterDraft,
  } = args;

  const rowValues = [
    companyName?.trim() || "不明",
    inputUrl,
    industry?.trim() || "",
    employeeScale?.trim() || "",
    decisionMakerName?.trim() || "",
    summaryBusiness,
    irSummary?.trim() || "",
    hypothesisSegments[0],
    hypothesisSegments[1],
    hypothesisSegments[2],
    hypothesisSegments[3],
    hypothesisSegments[4],
    letterDraft,
  ];

  const headerLine = headers.map(escapeCsvField).join(",");
  const rowLine = rowValues.map((v) => escapeCsvField(v)).join(",");
  return `${headerLine}\n${rowLine}`;
}

/** 複数件分の結果を CSV 複数行に整形する。先頭行にヘッダーを 1 回だけ含めて返す。 */
export function buildExportCsvBatch(
  rows: {
    companyName?: string | null;
    inputUrl: string;
    industry?: string | null;
    employeeScale?: string | null;
    decisionMakerName?: string | null;
    irSummary?: string | null;
    summaryBusiness: string;
    hypothesisSegments: HypothesisSegments;
    letterDraft: string;
  }[]
): string {
  if (rows.length === 0) {
    return "";
  }

  const lines: string[] = [];

  rows.forEach((row, index) => {
    const csv = buildExportCsv(row);
    const parts = csv.split("\n");
    if (parts.length === 0) {
      return;
    }
    const [header, ...dataLines] = parts;
    if (index === 0) {
      lines.push(header);
    }
    for (const line of dataLines) {
      if (line.trim().length > 0) {
        lines.push(line);
      }
    }
  });

  return lines.join("\n");
}

