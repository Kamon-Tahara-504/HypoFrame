/**
 * 要約・仮説5段・提案文用プロンプト（09-app-design 3.1）。
 * 04-implementation-decisions 第4節の表と「情報源は HP のみ」「断定を避ける」を反映。
 * outputFocus 指定時は該当段階に軽い追加指示を付与（プロンプトに少し反映）。
 */
import type { HypothesisSegments, OutputFocus } from "@/types";

// --- 共通指示（04 第4節・08 フェーズ2 確認） ---
const COMMON_INSTRUCTIONS =
  "情報源は企業の公式HPのみです。断定を避け、推測であることを示す表現にしてください。";

/** 文書表示用：各文の「。」の直後に改行を入れるよう指示（JSON出力時は不要、表示時に改行される） */
const LINE_BREAK_AFTER_PERIOD =
  "各文は読みやすく区切ってください（JSON出力時は改行を入れず、通常の文字列として出力してください）。";

/** 仮説5段のラベル（04 第4節の表。getHypothesisPrompt / getLetterPrompt / エクスポートで共通利用） */
export const HYPOTHESIS_SEGMENT_LABELS = [
  "企業の現在状況整理",
  "潜在課題の仮説",
  "課題の背景要因",
  "改善機会（介入ポイント）",
  "提案仮説",
] as const;

/** 事業要約用メッセージ（callGroq に渡す）。出力は JSON のみ（industry, employeeScale, summaryBusiness）。 */
export function getSummaryPrompt(
  crawledText: string,
  outputFocus?: OutputFocus
): { role: string; content: string }[] {
  const focusHint =
    outputFocus === "summary"
      ? " summaryBusiness はやや詳しめに（3〜5文程度）まとめてください。"
      : "";
  return [
    {
      role: "system",
      content: `あなたは企業の事業内容を要約するアシスタントです。${COMMON_INSTRUCTIONS}${focusHint}
出力は以下のJSON形式のみとし、他に説明は付けないでください。
{"industry": "大まかな業種カテゴリ1つ（例: SaaS事業、製造業、コンサルティング、金融サービスなど）", "employeeScale": "従業員規模（例: 500-1000名。不明なら「不明」）", "summaryBusiness": "事業展開文（2〜4文、事実ベース）"}

【重要】industry の作成ルール:
- 具体的なサービス名や細かい事業内容の列挙は避ける
- 企業の主要な業種・業界を1つのカテゴリで端的に表現する
- 「〜、〜、〜など」のような列挙形式は使わない
- 例: ○「エンターテインメント事業」 ×「動画配信、ゲーム、電子書籍など」

【重要】summaryBusiness の文章作成ルール:
- 単純な列挙（「〜しています、〜しています」の繰り返し）は避ける
- 文章の流れを意識し、接続詞や「また」「さらに」などで自然につなぐ
- 企業の特徴や強みが伝わる構成にする
- 具体的なサービス名や事業内容を織り交ぜながら、自然な文章展開を心がける`,
    },
    {
      role: "user",
      content: `以下の企業HPから取得したテキストから、industry（大まかな業種カテゴリ）、employeeScale（従業員規模、不明なら「不明」）、summaryBusiness（事業展開文2〜4文）を抽出し、JSON形式のみで出力してください。

【industry の要件】
企業の主要な業種を1つの大まかなカテゴリで表現してください。複数の事業を列挙せず、最も代表的な業種を端的に記載してください。

【summaryBusiness の要件】
企業の事業内容を自然な文章で説明してください。単なるサービスの羅列ではなく、企業の特徴や強みが伝わる文章構成にしてください。

---

${crawledText}`,
    },
  ];
}

/** 仮説5段用メッセージ（callGroq に渡す）。出力は JSON の segments 配列で返すよう指示。 */
export function getHypothesisPrompt(
  summary: string,
  outputFocus?: OutputFocus
): { role: string; content: string }[] {
  const focusHint =
    outputFocus === "hypothesis"
      ? " ユーザーが仮説5段を中心に編集したいと指定しているため、各段の論理の流れが明確になるよう、やや丁寧に書いてください。"
      : "";
  return [
    {
      role: "system",
      content: `あなたは営業仮説を構造化するアシスタントです。${COMMON_INSTRUCTIONS} 各段は2〜4文程度で書いてください。${focusHint}`,
    },
    {
      role: "user",
      content: `以下の事業要約をもとに、次の5段の仮説を順番に作成してください。各段のラベルと出力内容は以下に従います。

1. ${HYPOTHESIS_SEGMENT_LABELS[0]}: 事業内容・主力製品・強み・直近の動き（HP要約ベース。事実ベースで簡潔に）
2. ${HYPOTHESIS_SEGMENT_LABELS[1]}: 「〜のような課題が考えられる」と控えめに。根拠となる情報があれば1行で。
3. ${HYPOTHESIS_SEGMENT_LABELS[2]}: 「背景には〜が考えられる」。推測であることを示す表現にする。
4. ${HYPOTHESIS_SEGMENT_LABELS[3]}: 「〜のようなアプローチが有効かもしれない」。押し付けない表現。
5. ${HYPOTHESIS_SEGMENT_LABELS[4]}: 自社の打ち手と結びつけた提案の方向性。仮説であることを明示する。

${LINE_BREAK_AFTER_PERIOD}
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
  hypothesisSegments: HypothesisSegments,
  outputFocus?: OutputFocus
): { role: string; content: string }[] {
  const hypothesisText = hypothesisSegments
    .map((s, i) => `${i + 1}. ${HYPOTHESIS_SEGMENT_LABELS[i]}\n${s}`)
    .join("\n\n");

  const focusHint =
    outputFocus === "letter"
      ? " ユーザーが提案文の仕上げに集中したいと指定しているため、トーンと表現を整えやすいよう、やや丁寧に書いてください。"
      : "";

  return [
    {
      role: "system",
      content: `あなたは営業向けの提案文を下書きするアシスタントです。${COMMON_INSTRUCTIONS} 出力は仮説に基づく下書きであることを明示してください。${focusHint}`,
    },
    {
      role: "user",
      content: `以下の事業要約と仮説5段をもとに、受託営業向けの提案文を1本作成してください。仮説に基づく下書きであることを文中または文末で示し、断定を避けた表現にしてください。${LINE_BREAK_AFTER_PERIOD}

--- 事業要約 ---

${summary}

--- 仮説5段 ---

${hypothesisText}`,
    },
  ];
}
