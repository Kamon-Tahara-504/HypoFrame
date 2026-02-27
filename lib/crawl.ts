/**
 * クロール（Page Collector）: 入力 URL の同一ドメインからプレーンテキストを取得する。
 * 11-hypothesis-engine-architecture: 最大8ページ・URL優先スコア・階層深度2まで。
 * User-Agent 明示・robots.txt 尊重。
 */
import * as cheerio from "cheerio";

// --- 定数（07 外部要件・08 フェーズ1・11 アーキテクチャ） ---
const USER_AGENT = "HypoFrame/1.0 (business hypothesis tool)";
const FETCH_DELAY_MS = 500;
const MIN_TEXT_LENGTH = 50;
const MAX_COMBINED_TEXT_LENGTH = 300_000;
/** 取得する最大ページ数（トップ必須 + 最大7追加 = 8） */
const MAX_PAGES = 8;
/** 階層深度の上限（0=トップ, 1=トップから1クリック, 2=2クリック） */
const MAX_DEPTH = 2;

/** URLパス優先スコア: パスセグメントに含まれるキーワード → スコア（高いほど優先） */
const PATH_PRIORITY: { keywords: string[]; score: number }[] = [
  { keywords: ["company", "about", "corporate"], score: 100 },
  { keywords: ["recruit", "careers", "job"], score: 90 },
  { keywords: ["service", "business", "solution", "product"], score: 80 },
  { keywords: ["news", "press"], score: 50 },
];

/** クロール結果。Phase 3 の API エラー code にそのまま渡せる形 */
export type CrawlResult =
  | { success: true; text: string; pdfUrls: string[] }
  | { success: false; code: "CRAWL_FORBIDDEN" | "CRAWL_EMPTY" };

/**
 * 指定 URL の同一サイトからテキストを取得する。
 * 例外は投げず、必ず CrawlResult を返す。
 * @param options.signal - Phase 3 の 90 秒タイムアウト用 AbortSignal
 */
export async function crawl(
  url: string,
  options?: { signal?: AbortSignal }
): Promise<CrawlResult> {
  try {
    // 1. URL 検証（http/https のみ）
    const parsed = parseAndValidateUrl(url);
    if (!parsed) return { success: false, code: "CRAWL_FORBIDDEN" };

    // 2. robots.txt で初回 URL が Disallow されていれば取得しない
    const disallowed = await fetchDisallowedPaths(parsed.origin, options?.signal);
    if (disallowed && isPathDisallowed(parsed.pathname, disallowed)) {
      return { success: false, code: "CRAWL_FORBIDDEN" };
    }

    // 3. 初回ページを fetch（User-Agent 明示）
    const firstRes = await fetch(parsed.href, {
      signal: options?.signal,
      headers: { "User-Agent": USER_AGENT },
    });
    if (!firstRes.ok) return { success: false, code: "CRAWL_FORBIDDEN" };

    const html = await firstRes.text();
    let text = extractText(html);
    if (!text || text.length < MIN_TEXT_LENGTH) {
      return { success: false, code: "CRAWL_EMPTY" };
    }

    // 4. 同一ドメイン内リンクを優先スコア・深度2までで最大8ページ取得
    const disallowedPaths = disallowed ?? [];
    const pdfUrls = new Set<string>();
    type Candidate = { url: string; depth: number; score: number };
    const links1 = getSameOriginLinks(html, parsed);
    const filtered1 = selectLinksToFetch(links1, parsed, disallowedPaths);
    collectPdfUrls(filtered1, parsed, disallowedPaths, pdfUrls, 2);
    const candidates: Candidate[] = filtered1.map((href) => {
      try {
        const u = new URL(href);
        const depth = 1;
        return { url: href, depth, score: scorePathname(u.pathname, depth) };
      } catch {
        return { url: href, depth: 1, score: 0 };
      }
    });
    candidates.sort((a, b) => b.score - a.score);

    const fetched = new Set<string>([parsed.href]);
    const texts: string[] = [text];

    while (texts.length < MAX_PAGES && candidates.length > 0) {
      const next = candidates.shift();
      if (!next || fetched.has(next.url)) continue;
      if (next.depth > MAX_DEPTH) continue;

      if (options?.signal?.aborted) return { success: false, code: "CRAWL_FORBIDDEN" };
      await delay(FETCH_DELAY_MS);

      try {
        const res = await fetch(next.url, {
          signal: options?.signal,
          headers: { "User-Agent": USER_AGENT },
        });
        if (!res.ok) continue;
        const pageHtml = await res.text();
        const pageText = extractText(pageHtml);
        if (pageText) {
          texts.push(pageText);
          fetched.add(next.url);

          if (next.depth < MAX_DEPTH) {
            const links2 = getSameOriginLinks(pageHtml, parsed);
            const filtered2 = selectLinksToFetch(links2, parsed, disallowedPaths);
            collectPdfUrls(filtered2, parsed, disallowedPaths, pdfUrls, 2);
            for (const href of filtered2) {
              if (fetched.has(href)) continue;
              try {
                const u = new URL(href);
                const d2 = next.depth + 1;
                candidates.push({ url: href, depth: d2, score: scorePathname(u.pathname, d2) });
              } catch {
                // ignore
              }
            }
            candidates.sort((a, b) => b.score - a.score);
          }
        }
      } catch {
        // skip failed fetch
      }
    }

    text = texts.join("\n\n");

    // 5. 長さ制限（質を削りすぎない範囲）
    if (text.length > MAX_COMBINED_TEXT_LENGTH) {
      text = text.slice(0, MAX_COMBINED_TEXT_LENGTH);
    }

    return { success: true, text, pdfUrls: Array.from(pdfUrls) };
  } catch {
    return { success: false, code: "CRAWL_FORBIDDEN" };
  }
}

// --- URL 検証 ---
/** http/https の URL なら URL オブジェクトを、それ以外は null */
function parseAndValidateUrl(url: string): URL | null {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u;
  } catch {
    return null;
  }
}

// --- robots.txt ---
/** origin の robots.txt を取得し、Disallow されたパス一覧を返す。失敗時は null */
async function fetchDisallowedPaths(
  origin: string,
  signal?: AbortSignal
): Promise<string[] | null> {
  try {
    const res = await fetch(`${origin}/robots.txt`, { signal });
    if (!res.ok) return null;
    const text = await res.text();
    return parseDisallowFromRobotsTxt(text);
  } catch {
    return null;
  }
}

/** robots.txt の User-agent: * または hypoframe ブロック内の Disallow 行をパース */
function parseDisallowFromRobotsTxt(txt: string): string[] {
  const lines = txt.split(/\r?\n/).map((l) => l.trim());
  const paths: string[] = [];
  let inRelevantBlock = false;

  for (const line of lines) {
    const uaMatch = line.match(/^User-agent:\s*(.*)/i);
    if (uaMatch) {
      const ua = uaMatch[1].trim().toLowerCase();
      inRelevantBlock = ua === "*" || ua === "hypoframe";
    } else if (inRelevantBlock) {
      const disallow = line.match(/^Disallow:\s*(\S*)/i);
      if (disallow) {
        const path = disallow[1].trim();
        if (path) paths.push(path);
      }
    }
  }

  return paths;
}

/** pathname が disallowedPaths のいずれかにマッチするか（プレフィックス一致） */
function isPathDisallowed(pathname: string, disallowedPaths: string[]): boolean {
  for (const d of disallowedPaths) {
    if (d === "/") return true;
    if (pathname === d || pathname.startsWith(d + "/")) return true;
  }
  return false;
}

// --- 優先ページ取得ロジック（11 アーキテクチャ） ---
/** pathname をスコアリング（優先キーワードにマッチするほど高く、階層が浅いほど高く） */
function scorePathname(pathname: string, depth: number): number {
  const normalized = pathname.toLowerCase().replace(/^\/|\/$/g, "");
  const segments = normalized ? normalized.split("/") : [];
  let score = 50;
  for (const { keywords, score: s } of PATH_PRIORITY) {
    for (const seg of segments) {
      if (keywords.some((k) => seg.includes(k))) {
        score = Math.max(score, s);
        break;
      }
    }
  }
  const depthPenalty = depth * 10;
  return Math.max(0, score - depthPenalty);
}

// --- HTML からテキスト抽出 ---
/** script/style/noscript を除き、body のテキストを空白正規化して返す */
function extractText(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();
  const raw =
    $("body").length > 0 ? $("body").text() : $.root().children().text();
  return raw.replace(/\s+/g, " ").trim();
}

// --- 同一オリジンリンク取得 ---
/** HTML から同一オリジンの a[href] を絶対 URL で収集（pathname で重複排除） */
function getSameOriginLinks(html: string, base: URL): string[] {
  const $ = cheerio.load(html);
  const origin = base.origin;
  const seen = new Set<string>();
  const out: string[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      const absolute = new URL(href, base.href);
      absolute.hash = "";
      if (absolute.origin !== origin) return;
      const key = absolute.pathname;
      if (seen.has(key)) return;
      seen.add(key);
      out.push(absolute.href);
    } catch {
      // ignore invalid URLs
    }
  });

  return out;
}

/** 同一オリジンリンクのうち、PDF (.pdf) のみを最大 max 件まで収集する */
function collectPdfUrls(
  links: string[],
  base: URL,
  disallowedPaths: string[],
  pdfUrls: Set<string>,
  max: number
): void {
  if (pdfUrls.size >= max) return;
  for (const href of links) {
    if (pdfUrls.size >= max) break;
    try {
      const u = new URL(href, base.href);
      const pathname = u.pathname;
      if (!pathname.toLowerCase().endsWith(".pdf")) continue;
      if (isPathDisallowed(pathname, disallowedPaths)) continue;
      const key = u.href;
      if (pdfUrls.has(key)) continue;
      pdfUrls.add(key);
    } catch {
      // ignore invalid URLs
    }
  }
}

/** 初回 URL と重複せず、robots で禁止されていないリンクのみに絞る */
function selectLinksToFetch(
  links: string[],
  base: URL,
  disallowedPaths: string[]
): string[] {
  const basePath = base.pathname;
  return links.filter((href) => {
    try {
      const u = new URL(href);
      if (u.pathname === basePath) return false;
      if (isPathDisallowed(u.pathname, disallowedPaths)) return false;
      return true;
    } catch {
      return false;
    }
  });
}

/** 指定ミリ秒だけ待機（同一サイト連続リクエストの間隔用） */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
