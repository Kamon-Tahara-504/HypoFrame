/**
 * IR PDF 用テキスト抽出ユーティリティ。
 * 指定された PDF URL 群からテキストを取得し、結合して返す。
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error 型定義がないため any 扱いとする
import pdfParse from "pdf-parse";

export interface PdfExtractOptions {
  signal?: AbortSignal;
  /** 1本あたりの最大ページ数（超過分は無視） */
  maxPagesPerPdf?: number;
  /** すべての PDF を合わせた最大文字数（超過分は切り捨て） */
  maxCharsTotal?: number;
}

/**
 * 複数の PDF URL からテキストを取得して結合する。
 * 失敗した URL はスキップし、取得できたテキストのみを連結する。
 */
export async function fetchAndExtractPdfText(
  urls: string[],
  options: PdfExtractOptions = {}
): Promise<string> {
  const { signal, maxPagesPerPdf = 20, maxCharsTotal = 200_000 } = options;
  const texts: string[] = [];
  let totalChars = 0;

  for (const url of urls) {
    if (signal?.aborted) break;
    if (totalChars >= maxCharsTotal) break;

    try {
      const res = await fetch(url, { signal });
      if (!res.ok) continue;

      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await pdfParse(buffer, { max: maxPagesPerPdf });
      const rawText: string = (result && (result as { text?: string }).text) || "";
      const normalized = rawText.replace(/\s+/g, " ").trim();
      if (!normalized) continue;

      const remaining = maxCharsTotal - totalChars;
      if (remaining <= 0) break;

      const clipped =
        normalized.length > remaining ? normalized.slice(0, remaining) : normalized;
      texts.push(clipped);
      totalChars += clipped.length;
    } catch (e) {
      // PDF 取得・解析に失敗した場合はその URL をスキップする
      // 呼び出し側で必要に応じてログを出す想定
      continue;
    }
  }

  return texts.join("\n\n");
}

