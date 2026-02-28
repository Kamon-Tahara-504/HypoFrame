/**
 * 企業名などで検索し、概要・ニュースのスニペットを最大2件取得する。
 * 要約の補助入力（Google 上の企業情報）に利用。失敗時は空文字を返す。
 */
const SERPER_ENDPOINT = "https://google.serper.dev/search";

type SerperOrganicItem = {
  snippet?: string;
};

type SerperResponse = {
  organic?: SerperOrganicItem[];
};

/** 企業名（またはクエリ）で検索し、スニペットを最大2件分のテキストで返す。未設定・失敗時は "" */
export async function fetchCompanySnippets(query: string): Promise<string> {
  const apiKey = process.env.SERPER_API_KEY?.trim();
  if (!apiKey || !query.trim()) return "";

  try {
    const res = await fetch(SERPER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({
        q: query.trim(),
        num: 3,
      }),
    });
    if (!res.ok) return "";

    const data = (await res.json()) as SerperResponse;
    const snippets =
      data.organic
        ?.map((item) => (item.snippet ?? "").trim())
        .filter(Boolean)
        .slice(0, 2) ?? [];

    return snippets.join("\n\n");
  } catch {
    return "";
  }
}
