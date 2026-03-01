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

/** 429 レスポンスの body から「Please try again in X.XXs」の秒数を取り出す。取れなければ defaultSeconds */
function parseRetryAfterSeconds(errBody: string, defaultSeconds: number): number {
  const m = errBody.match(/try again in ([\d.]+)s/i);
  if (m) {
    const sec = parseFloat(m[1]);
    if (Number.isFinite(sec) && sec > 0) return Math.ceil(sec) + 0.5; // 少し余裕を持たせる
  }
  return defaultSeconds;
}

const GROQ_429_MAX_RETRIES = 3;
const GROQ_429_DEFAULT_WAIT_SEC = 3;

/**
 * Groq Chat Completions を 1 回呼ぶ。429 時は待機して最大 GROQ_429_MAX_RETRIES 回までリトライ。
 * それ以外の API エラー時は throw（Phase 3 で LLM_ERROR にマッピング）。
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

  const body = JSON.stringify({
    model: options?.model ?? DEFAULT_MODEL,
    messages,
    max_tokens: options?.maxTokens ?? DEFAULT_MAX_TOKENS,
    temperature: options?.temperature ?? DEFAULT_TEMPERATURE,
  });

  for (let attempt = 0; attempt <= GROQ_429_MAX_RETRIES; attempt++) {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body,
    });

    if (res.status === 429 && attempt < GROQ_429_MAX_RETRIES) {
      const errBody = await res.text();
      const waitSec = parseRetryAfterSeconds(errBody, GROQ_429_DEFAULT_WAIT_SEC);
      console.warn(`Groq 429 (TPM limit), waiting ${waitSec}s before retry (attempt ${attempt + 1}/${GROQ_429_MAX_RETRIES})`);
      await new Promise((r) => setTimeout(r, waitSec * 1000));
      continue;
    }

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

  throw new Error("Groq API: rate limit retries exhausted");
}

// --- 3 段パイプライン（要約 → 仮説5段 → 提案文） ---

/**
 * 要約 → 仮説5段 → 提案文の順で Groq を 3 回呼び、結果を返す。
 * いずれかの呼び出しが失敗したら throw（Phase 3 で LLM_ERROR）。
 * outputFocus 指定時は該当段階のプロンプトに軽い追加指示が入る。
 * 要約は JSON（industry, employeeScale, summaryBusiness）でパースし、失敗時は全文を summaryBusiness に・業種・従業員は null。
 */
export async function generateSummaryThenHypothesisThenLetter(
  crawledText: string,
  outputFocus?: OutputFocus
): Promise<{
  summaryBusiness: string;
  companyName: string | null;
  industry: string | null;
  employeeScale: string | null;
  irSummary: string | null;
  decisionMakerName: string | null;
  hypothesisSegments: HypothesisSegments;
  letterDraft: string;
}> {
  const summaryRaw = await callGroq(
    getSummaryPrompt(crawledText, outputFocus)
  );
  const {
    summaryBusiness,
    companyName,
    industry,
    employeeScale,
    decisionMakerName,
    irSummary,
  } = parseSummaryResponse(summaryRaw);

  const hypothesisRaw = await callGroq(
    getHypothesisPrompt(summaryBusiness, outputFocus)
  );
  const hypothesisSegments = parseHypothesisSegments(hypothesisRaw);

  const letterDraft = await callGroq(
    getLetterPrompt(summaryBusiness, hypothesisSegments, outputFocus)
  );

  return {
    summaryBusiness,
    companyName,
    industry,
    employeeScale,
    irSummary,
    decisionMakerName,
    hypothesisSegments,
    letterDraft,
  };
}

/** 要約の JSON をパース。失敗時は全文を summaryBusiness にし、companyName/industry/employeeScale/decisionMakerName/irSummary は null */
function parseSummaryResponse(raw: string): {
  summaryBusiness: string;
  companyName: string | null;
  industry: string | null;
  employeeScale: string | null;
  irSummary: string | null;
  decisionMakerName: string | null;
} {
  const trimmed = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    const parsed = JSON.parse(trimmed) as {
      companyName?: unknown;
      industry?: unknown;
      employeeScale?: unknown;
      summaryBusiness?: unknown;
      decisionMakerName?: unknown;
      irSummary?: unknown;
    };
    const summaryBusiness =
      typeof parsed.summaryBusiness === "string"
        ? parsed.summaryBusiness.trim()
        : "";
    if (!summaryBusiness) throw new Error("Missing summaryBusiness");
    return {
      summaryBusiness,
      companyName:
        typeof parsed.companyName === "string" && parsed.companyName.trim()
          ? parsed.companyName.trim()
          : null,
      industry:
        typeof parsed.industry === "string" && parsed.industry.trim()
          ? parsed.industry.trim()
          : null,
      employeeScale:
        typeof parsed.employeeScale === "string" && parsed.employeeScale.trim()
          ? parsed.employeeScale.trim()
          : null,
      irSummary:
        typeof parsed.irSummary === "string" && parsed.irSummary.trim()
          ? parsed.irSummary.trim()
          : null,
      decisionMakerName:
        typeof parsed.decisionMakerName === "string" &&
        parsed.decisionMakerName.trim()
          ? parsed.decisionMakerName.trim()
          : null,
    };
  } catch {
    return {
      summaryBusiness: raw.trim() || "(要約を取得できませんでした)",
      companyName: null,
      industry: null,
      employeeScale: null,
      irSummary: null,
      decisionMakerName: null,
    };
  }
}

/** 仮説5段の JSON レスポンスをパースして長さ5のタプルにする。不正時は throw */
function parseHypothesisSegments(
  raw: string
): HypothesisSegments {
  let trimmed = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  
  // LLMが文字列内に生改行を入れてしまう場合があるので、それを修正する
  // より確実な方法: JSON構造を保ちながら文字列内の改行のみをスペースに置換
  // ダブルクォート内の改行を検出して置換
  let inString = false;
  let escaped = false;
  const chars = trimmed.split('');
  const sanitized = chars.map((char, i) => {
    if (escaped) {
      escaped = false;
      return char;
    }
    if (char === '\\') {
      escaped = true;
      return char;
    }
    if (char === '"') {
      inString = !inString;
      return char;
    }
    // 文字列内の改行をスペースに置換
    if (inString && char === '\n') {
      return ' ';
    }
    return char;
  }).join('');
  
  // JSONの末尾が正しく閉じられているか確認し、必要に応じて補完
  let jsonToparse = sanitized.trim();
  // LLMが末尾の }（閉じ括弧）を省略する場合があるので、必要に応じて補完
  if (!jsonToparse.endsWith('}') && jsonToparse.endsWith(']')) {
    jsonToparse += '}';
  }
  
  let parsed: { segments?: unknown };
  try {
    parsed = JSON.parse(jsonToparse) as { segments?: unknown };
  } catch (err) {
    console.error("Failed to parse hypothesis JSON. Raw response:", raw);
    console.error("JSON to parse:", jsonToparse);
    console.error("Parse error:", err);
    throw new Error(`Failed to parse hypothesis JSON: ${err instanceof Error ? err.message : String(err)}`);
  }
  const segments = parsed.segments;
  if (!Array.isArray(segments) || segments.length !== 5) {
    console.error("Invalid segments structure:", segments);
    throw new Error(`Hypothesis segments must be an array of length 5, got ${Array.isArray(segments) ? segments.length : typeof segments}`);
  }
  const asStrings = segments.map((s) => (typeof s === "string" ? s : String(s)));
  return [asStrings[0], asStrings[1], asStrings[2], asStrings[3], asStrings[4]];
}
