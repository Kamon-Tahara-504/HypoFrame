import * as cheerio from "cheerio";

const USER_AGENT = "HypoFrame/1.0 (business hypothesis tool)";
const FETCH_DELAY_MS = 500;
const MIN_TEXT_LENGTH = 50;
const MAX_COMBINED_TEXT_LENGTH = 300_000;
const MAX_EXTRA_PAGES = 2;

export type CrawlResult =
  | { success: true; text: string }
  | { success: false; code: "CRAWL_FORBIDDEN" | "CRAWL_EMPTY" };

export async function crawl(
  url: string,
  options?: { signal?: AbortSignal }
): Promise<CrawlResult> {
  try {
    const parsed = parseAndValidateUrl(url);
    if (!parsed) return { success: false, code: "CRAWL_FORBIDDEN" };

    const disallowed = await fetchDisallowedPaths(parsed.origin, options?.signal);
    if (disallowed && isPathDisallowed(parsed.pathname, disallowed)) {
      return { success: false, code: "CRAWL_FORBIDDEN" };
    }

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

    const links = getSameOriginLinks(html, parsed);
    const toFetch = selectLinksToFetch(links, parsed, disallowed ?? []).slice(
      0,
      MAX_EXTRA_PAGES
    );

    for (const linkUrl of toFetch) {
      if (options?.signal?.aborted) return { success: false, code: "CRAWL_FORBIDDEN" };
      await delay(FETCH_DELAY_MS);
      const res = await fetch(linkUrl, {
        signal: options?.signal,
        headers: { "User-Agent": USER_AGENT },
      });
      if (res.ok) {
        const extraText = extractText(await res.text());
        if (extraText) text = text + "\n\n" + extraText;
      }
    }

    if (text.length > MAX_COMBINED_TEXT_LENGTH) {
      text = text.slice(0, MAX_COMBINED_TEXT_LENGTH);
    }

    return { success: true, text };
  } catch {
    return { success: false, code: "CRAWL_FORBIDDEN" };
  }
}

function parseAndValidateUrl(url: string): URL | null {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u;
  } catch {
    return null;
  }
}

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

function isPathDisallowed(pathname: string, disallowedPaths: string[]): boolean {
  for (const d of disallowedPaths) {
    if (d === "/") return true;
    if (pathname === d || pathname.startsWith(d + "/")) return true;
  }
  return false;
}

function extractText(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();
  const raw =
    $("body").length > 0 ? $("body").text() : $.root().children().text();
  return raw.replace(/\s+/g, " ").trim();
}

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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
