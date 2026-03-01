/**
 * GET /api/search
 * q クエリを受け取り、Serper API を呼び出して
 * 企業候補リスト（title, link, snippet）を返す。
 */

const SERPER_ENDPOINT = "https://google.serper.dev/search";

type SerperOrganicItem = {
  title?: string;
  link?: string;
  snippet?: string;
  position?: number;
};

type SerperResponse = {
  organic?: SerperOrganicItem[];
  searchParameters?: { q?: string };
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

  const apiKey = process.env.SERPER_API_KEY?.trim();

  if (!apiKey) {
    return Response.json(
      { error: "検索機能が正しく設定されていません。SERPER_API_KEY を設定してください。" },
      { status: 503 }
    );
  }

  let response: Response;
  try {
    response = await fetch(SERPER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({
        q: query.trim(),
        num: 10,
      }),
    });
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
    const message =
      response.status === 401 || response.status === 403
        ? "Serper API の認証に失敗しました。API キーは https://serper.dev で取得してください（scaleserp.com や serpapi.com のキーは使えません）。"
        : response.status === 429
          ? "検索の利用上限に達しました。しばらく経ってから再試行してください。"
          : "検索に失敗しました。時間をおいて再試行してください。";
    return Response.json({ error: message }, { status: 502 });
  }

  let data: SerperResponse = {};
  try {
    data = (await response.json()) as SerperResponse;
  } catch (e) {
    console.error("Search API JSON parse error:", e);
    return Response.json(
      { error: "検索結果の解析に失敗しました。" },
      { status: 502 }
    );
  }

  const items =
    data.organic
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
