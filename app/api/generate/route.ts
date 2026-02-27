/**
 * POST /api/generate
 * Body: { url: string, companyName?: string, outputFocus?: "summary"|"hypothesis"|"letter" }。
 * Page Collector（クロール）→ Structurizer（構造化）→ Hypothesis Engine（要約→仮説5段→提案文）。90秒でタイムアウト（09 4.1・11 アーキテクチャ）。
 */
import type {
  ApiErrorCode,
  GenerateRequest,
  GenerateResponse,
  OutputFocus,
} from "@/types";
import { crawl } from "@/lib/crawl";
import { structureText } from "@/lib/structurizer";
import { generateSummaryThenHypothesisThenLetter } from "@/lib/groq";
import { fetchAndExtractPdfText } from "@/lib/pdf";

/** タイムアウト 90 秒（09-app-design 4.1・04 第2節） */
const TIMEOUT_MS = 90_000;

/** 04 第5節の表示文言 */
const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  TIMEOUT:
    "取得できませんでした。URLをご確認のうえ、しばらく経ってから再試行してください。",
  CRAWL_FORBIDDEN: "このページは取得できませんでした。",
  CRAWL_EMPTY:
    "十分な情報が取得できませんでした。別のURL（例：会社概要ページ）をお試しください。",
  LLM_ERROR:
    "仮説の生成に失敗しました。しばらく経ってから再試行してください。",
};

function buildErrorResponse(
  status: number,
  code: ApiErrorCode
): Response {
  return Response.json(
    { error: ERROR_MESSAGES[code], code },
    { status, headers: { "Content-Type": "application/json" } }
  );
}

/** url が http/https の有効な文字列かどうか */
function validateUrl(url: unknown): url is string {
  if (typeof url !== "string" || !url.trim()) return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: Request): Promise<Response> {
  // --- リクエスト検証 ---
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return buildErrorResponse(400, "CRAWL_FORBIDDEN");
  }

  const url =
    body && typeof body === "object" && "url" in body
      ? (body as GenerateRequest).url
      : undefined;
  if (!validateUrl(url)) {
    return buildErrorResponse(400, "CRAWL_FORBIDDEN");
  }

  const outputFocus =
    body && typeof body === "object" && "outputFocus" in body
      ? (body as GenerateRequest).outputFocus
      : undefined;
  const validFocus: OutputFocus[] = ["summary", "hypothesis", "letter"];
  const focus =
    outputFocus && validFocus.includes(outputFocus) ? outputFocus : undefined;

  // --- タイムアウト制御（90秒） ---
  const controller = new AbortController();
  const timeoutRef = {
    id: undefined as ReturnType<typeof setTimeout> | undefined,
  };
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutRef.id = setTimeout(() => {
      controller.abort();
      reject(new Error("TIMEOUT"));
    }, TIMEOUT_MS);
  });

  const workPromise = (async (): Promise<
    | { ok: true; data: GenerateResponse }
    | { ok: false; code: "CRAWL_FORBIDDEN" | "CRAWL_EMPTY" }
  > => {
    const crawlResult = await crawl(url, { signal: controller.signal });
    if (!crawlResult.success) {
      return { ok: false, code: crawlResult.code };
    }
    const structuredText = structureText(crawlResult.text);

    // IR PDF があればテキストを取得して構造化テキストに結合
    let combinedText = structuredText;
    try {
      const pdfUrls = (crawlResult.pdfUrls ?? []).slice(0, 2);
      if (pdfUrls.length > 0) {
        const pdfText = await fetchAndExtractPdfText(pdfUrls, {
          signal: controller.signal,
          maxPagesPerPdf: 20,
          maxCharsTotal: 200_000,
        });
        if (pdfText.trim()) {
          combinedText = `${structuredText}\n\n## IR情報\n\n${pdfText}`;
        }
      }
    } catch (e) {
      // IR PDF 取得に失敗しても HP テキストのみで続行する
      console.error("IR PDF extraction failed:", e);
    }
    const data = await generateSummaryThenHypothesisThenLetter(
      combinedText,
      focus
    );
    return { ok: true, data };
  })().finally(() => {
    if (timeoutRef.id != null) clearTimeout(timeoutRef.id);
  });

  // --- Page Collector → Structurizer → Hypothesis Engine（race でタイムアウトと競合） ---
  try {
    const result = await Promise.race([workPromise, timeoutPromise]);

    if (!result.ok) {
      const status = result.code === "CRAWL_EMPTY" ? 422 : 400;
      return buildErrorResponse(status, result.code);
    }

    return Response.json(result.data, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    if (timeoutRef.id != null) clearTimeout(timeoutRef.id);
    if (e instanceof Error && e.message === "TIMEOUT") {
      return buildErrorResponse(408, "TIMEOUT");
    }
    console.error("Generate API error:", e);
    return buildErrorResponse(502, "LLM_ERROR");
  }
}
