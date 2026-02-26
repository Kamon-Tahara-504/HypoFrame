/**
 * Groq API 呼び出し（09-app-design 3.1）。
 * callGroq: 1 回の Chat Completions。generateSummaryThenHypothesisThenLetter: 要約→仮説5段→提案文の 3 段パイプライン。
 */
import type { HypothesisSegments, OutputFocus } from "@/types";
import {
  getSummaryPrompt,
  getHypothesisPrompt,
  getLetterPrompt,
} from "./prompts";

// --- 定数（07 外部要件・無料枠を考慮） ---
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
/** モデル指定（実装時に選択。無料枠で利用可能なもの） */
const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_MAX_TOKENS = 2048;
/** 再現性のため低め（04 設計原則） */
const DEFAULT_TEMPERATURE = 0.3;

export type GroqMessage = { role: string; content: string };

/**
 * Groq Chat Completions を 1 回呼ぶ。API エラー時は throw（Phase 3 で LLM_ERROR にマッピング）。
 */
export async function callGroq(
  messages: GroqMessage[],
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set");
  }

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options?.model ?? DEFAULT_MODEL,
      messages,
      max_tokens: options?.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: options?.temperature ?? DEFAULT_TEMPERATURE,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Groq API error: ${res.status} ${errBody}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (content == null) {
    throw new Error("Groq API returned no content");
  }
  return content.trim();
}

// --- 3 段パイプライン（要約 → 仮説5段 → 提案文） ---

/**
 * 要約 → 仮説5段 → 提案文の順で Groq を 3 回呼び、結果を返す。
 * いずれかの呼び出しが失敗したら throw（Phase 3 で LLM_ERROR）。
 * outputFocus 指定時は該当段階のプロンプトに軽い追加指示が入る。
 */
export async function generateSummaryThenHypothesisThenLetter(
  crawledText: string,
  outputFocus?: OutputFocus
): Promise<{
  summaryBusiness: string;
  hypothesisSegments: HypothesisSegments;
  letterDraft: string;
}> {
  const summaryBusiness = await callGroq(
    getSummaryPrompt(crawledText, outputFocus)
  );

  const hypothesisRaw = await callGroq(
    getHypothesisPrompt(summaryBusiness, outputFocus)
  );
  const hypothesisSegments = parseHypothesisSegments(hypothesisRaw);

  const letterDraft = await callGroq(
    getLetterPrompt(summaryBusiness, hypothesisSegments, outputFocus)
  );

  return { summaryBusiness, hypothesisSegments, letterDraft };
}

/** 仮説5段の JSON レスポンスをパースして長さ5のタプルにする。不正時は throw */
function parseHypothesisSegments(
  raw: string
): HypothesisSegments {
  const trimmed = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  let parsed: { segments?: unknown };
  try {
    parsed = JSON.parse(trimmed) as { segments?: unknown };
  } catch {
    throw new Error("Failed to parse hypothesis JSON");
  }
  const segments = parsed.segments;
  if (!Array.isArray(segments) || segments.length !== 5) {
    throw new Error("Hypothesis segments must be an array of length 5");
  }
  const asStrings = segments.map((s) => (typeof s === "string" ? s : String(s)));
  return [asStrings[0], asStrings[1], asStrings[2], asStrings[3], asStrings[4]];
}
