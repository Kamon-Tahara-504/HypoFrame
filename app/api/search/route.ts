/**
 * GET /api/search
 * q クエリを受け取り、Google Custom Search API を呼び出して
 * 企業候補リスト（title, link, snippet）を返す。
 */

const GOOGLE_SEARCH_ENDPOINT = "https://www.googleapis.com/customsearch/v1";

type SearchApiItem = {
  title?: string;
  link?: string;
  snippet?: string;
};

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const query = url.searchParams.get("q");

  if (!query || !query.trim()) {
    return Response.json(
      { error: "検索クエリ q を指定してください。" },
      { status: 400 }
    );
  }

  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const cx = process.env.GOOGLE_CSE_CX;

  if (!apiKey || !cx) {
    return Response.json(
      { error: "検索機能が正しく設定されていません。" },
      { status: 503 }
    );
  }

  const searchUrl = new URL(GOOGLE_SEARCH_ENDPOINT);
  searchUrl.searchParams.set("key", apiKey);
  searchUrl.searchParams.set("cx", cx);
  searchUrl.searchParams.set("q", query);
  // 返却件数（1〜10）。ひとまず 10 件まで取得する。
  searchUrl.searchParams.set("num", "10");

  let response: Response;
  try {
    response = await fetch(searchUrl.toString());
  } catch (e) {
    console.error("Search API network error:", e);
    return Response.json(
      { error: "検索 API への接続に失敗しました。" },
      { status: 502 }
    );
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    console.error(
      "Search API error:",
      response.status,
      response.statusText,
      bodyText
    );
    return Response.json(
      { error: "検索に失敗しました。時間をおいて再試行してください。" },
      { status: 502 }
    );
  }

  let data: { items?: SearchApiItem[] } = {};
  try {
    data = (await response.json()) as { items?: SearchApiItem[] };
  } catch (e) {
    console.error("Search API JSON parse error:", e);
    return Response.json(
      { error: "検索結果の解析に失敗しました。" },
      { status: 502 }
    );
  }

  const items =
    data.items
      ?.map((item) => ({
        title: item.title ?? "",
        link: item.link ?? "",
        snippet: item.snippet ?? "",
      }))
      .filter((item) => item.link) ?? [];

  return Response.json(
    { items },
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

