import type { ApiErrorCode, GenerateRequest, GenerateResponse } from "@/types";
import { crawl } from "@/lib/crawl";
import { generateSummaryThenHypothesisThenLetter } from "@/lib/groq";

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
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return buildErrorResponse(400, "CRAWL_FORBIDDEN");
  }

  const url = body && typeof body === "object" && "url" in body ? (body as GenerateRequest).url : undefined;
  if (!validateUrl(url)) {
    return buildErrorResponse(400, "CRAWL_FORBIDDEN");
  }

  const controller = new AbortController();
  const timeoutRef = { id: undefined as ReturnType<typeof setTimeout> | undefined };
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
    const data = await generateSummaryThenHypothesisThenLetter(
      crawlResult.text
    );
    return { ok: true, data };
  })().finally(() => {
    if (timeoutRef.id != null) clearTimeout(timeoutRef.id);
  });

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
