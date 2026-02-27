/**
 * Structurizer（構造化層）: 11-hypothesis-engine-architecture
 * テキストをカテゴリ別に整理する。解釈・仮説は行わない。
 * 入力は結合テキスト（crawl 出力）。見出し付き1本で返す（案B）。
 */

/** カテゴリラベルと、本文中で検出する見出しパターン（正規表現または文字列） */
const SECTION_PATTERNS: { label: string; patterns: (string | RegExp)[] }[] = [
  { label: "会社概要", patterns: [/会社概要/, /企業情報/, /私たちについて/, /About/, /Corporate/] },
  { label: "事業内容", patterns: [/事業内容/, /サービス/, /ソリューション/, /Business/, /Service/, /Product/] },
  { label: "採用情報", patterns: [/採用/, /採用情報/, /キャリア/, /Recruit/, /Careers/, /Job/] },
  { label: "ニュース・お知らせ", patterns: [/ニュース/, /お知らせ/, /プレス/, /News/, /Press/] },
];

/** セクション区切りとして扱う行の正規表現（見出しらしき行） */
const HEADING_LIKE = /^(#{1,6}\s*)?(.+)$/;

/**
 * 結合テキストをカテゴリ別に見出し付きで整理する。
 * 行単位で見出しパターンを検出し、## ラベル で区切る。該当しない部分は「本文」にまとめる。
 */
export function structureText(combinedText: string): string {
  const trimmed = combinedText.replace(/\s+/g, " ").trim();
  if (!trimmed) return "";

  const lines = combinedText.split(/\r?\n/);
  const sections: { label: string; content: string }[] = [];
  let currentLabel = "本文";
  let currentLines: string[] = [];

  function flush() {
    if (currentLines.length > 0) {
      const content = currentLines.join("\n").replace(/\s+/g, " ").trim();
      if (content) sections.push({ label: currentLabel, content });
    }
    currentLines = [];
  }

  for (const line of lines) {
    const trimmedLine = line.trim();

    let matchedLabel: string | null = null;
    if (trimmedLine.length > 0 && trimmedLine.length <= 80) {
      for (const { label, patterns } of SECTION_PATTERNS) {
        for (const p of patterns) {
          const match = typeof p === "string" ? trimmedLine.includes(p) : p.test(trimmedLine);
          if (match) {
            matchedLabel = label;
            break;
          }
        }
        if (matchedLabel) break;
      }
    }

    if (matchedLabel) {
      flush();
      currentLabel = matchedLabel;
      const afterHeading = trimmedLine.replace(/^#+\s*/, "").trim();
      if (afterHeading) currentLines.push(afterHeading);
    } else {
      currentLines.push(trimmedLine);
    }
  }

  flush();

  if (sections.length === 0) return "## 本文\n\n" + trimmed;

  return sections.map((s) => `## ${s.label}\n\n${s.content}`).join("\n\n");
}
