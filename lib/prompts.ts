import type { HypothesisSegments } from "@/types";

const COMMON_INSTRUCTIONS =
  "情報源は企業の公式HPのみです。断定を避け、推測であることを示す表現にしてください。";

/** 事業要約用メッセージ（callGroq に渡す） */
export function getSummaryPrompt(crawledText: string): { role: string; content: string }[] {
  return [
    {
      role: "system",
      content: `あなたは企業の事業内容を要約するアシスタントです。${COMMON_INSTRUCTIONS}`,
    },
    {
      role: "user",
      content: `以下の企業HPから取得したテキストを、事業要約として簡潔にまとめてください。事実ベースで、2〜4文程度にまとめます。\n\n---\n\n${crawledText}`,
    },
  ];
}

/** 仮説5段用メッセージ（callGroq に渡す）。出力は JSON の segments 配列で返すよう指示。 */
export function getHypothesisPrompt(summary: string): { role: string; content: string }[] {
  return [
    {
      role: "system",
      content: `あなたは営業仮説を構造化するアシスタントです。${COMMON_INSTRUCTIONS} 各段は2〜4文程度で書いてください。`,
    },
    {
      role: "user",
      content: `以下の事業要約をもとに、次の5段の仮説を順番に作成してください。各段のラベルと出力内容は以下に従います。

1. 企業の現在状況整理: 事業内容・主力製品・強み・直近の動き（HP要約ベース。事実ベースで簡潔に）
2. 潜在課題の仮説: 「〜のような課題が考えられる」と控えめに。根拠となる情報があれば1行で。
3. 課題の背景要因: 「背景には〜が考えられる」。推測であることを示す表現にする。
4. 改善機会（介入ポイント）: 「〜のようなアプローチが有効かもしれない」。押し付けない表現。
5. 提案仮説: 自社の打ち手と結びつけた提案の方向性。仮説であることを明示する。

出力は以下のJSON形式のみとし、他に説明は付けないでください。
{"segments": ["1段目の本文", "2段目の本文", "3段目の本文", "4段目の本文", "5段目の本文"]}

--- 事業要約 ---

${summary}`,
    },
  ];
}

/** 提案文下書き用メッセージ（callGroq に渡す） */
export function getLetterPrompt(
  summary: string,
  hypothesisSegments: HypothesisSegments
): { role: string; content: string }[] {
  const hypothesisText = hypothesisSegments
    .map((s, i) => {
      const labels = [
        "企業の現在状況整理",
        "潜在課題の仮説",
        "課題の背景要因",
        "改善機会（介入ポイント）",
        "提案仮説",
      ];
      return `${i + 1}. ${labels[i]}\n${s}`;
    })
    .join("\n\n");

  return [
    {
      role: "system",
      content: `あなたは営業向けの提案文を下書きするアシスタントです。${COMMON_INSTRUCTIONS} 出力は仮説に基づく下書きであることを明示してください。`,
    },
    {
      role: "user",
      content: `以下の事業要約と仮説5段をもとに、受託営業向けの提案文を1本作成してください。仮説に基づく下書きであることを文中または文末で示し、断定を避けた表現にしてください。

--- 事業要約 ---

${summary}

--- 仮説5段 ---

${hypothesisText}`,
    },
  ];
}
