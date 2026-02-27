/**
 * 要約・仮説5段・提案文用プロンプト（09-app-design 3.1）。
 * 各項目の定義・制約を組み込み。outputFocus 指定時は該当段階に軽い追加指示を付与。
 */
import type { HypothesisSegments, OutputFocus } from "@/types";

// --- 共通指示（04 第4節・08 フェーズ2 確認） ---
const COMMON_INSTRUCTIONS =
  "情報源は企業の公式HPのみです。断定を避け、推測であることを示す表現にしてください。";

/** 文書表示用：各文の「。」の直後に改行を入れるよう指示（JSON出力時は不要、表示時に改行される） */
const LINE_BREAK_AFTER_PERIOD =
  "各文は読みやすく区切ってください（JSON出力時は改行を入れず、通常の文字列として出力してください）。";

/** 仮説5段のラベル（getHypothesisPrompt / getLetterPrompt / エクスポートで共通利用） */
export const HYPOTHESIS_SEGMENT_LABELS = [
  "企業の現在状況整理",
  "潜在課題の仮説",
  "課題の背景要因",
  "改善機会（介入ポイント）",
  "提案仮説",
] as const;

// --- 各項目の定義（仮説5段・提案文） ---
const SEGMENT_DEFINITIONS = `
【各項目の定義】
1. 企業の現在状況整理（current_state）: 事実ベースで整理する。Web情報から読み取れる範囲に限定。主観的評価は入れない。
2. 潜在課題の仮説（latent_issue）: 表面化していない可能性のある課題。current_stateから論理的に導出。断定ではなく仮説として表現。
3. 課題の背景要因（background_factor）: なぜその課題が生まれている可能性があるか。組織・市場・構造の観点から説明。
4. 改善機会（intervention_point）: 外部から介入できる具体的ポイント。抽象的な表現は禁止。実務レベルでの接点を示す。
5. 提案仮説（proposal_hypothesis）: 介入した場合の変化仮説。Before → Afterが明確になる形で記述。
`;

const SEGMENT_CONSTRAINTS = `
【制約】
- 再生成前提の曖昧表現は禁止。
- 「〜かもしれません」の多用は禁止。
- 論理接続が明確であること。
- 各項目は150〜300文字程度。
- 論理の一貫性を最優先してください。
`;

/** 事業要約用メッセージ（callGroq に渡す）。出力は JSON のみ（industry, employeeScale, summaryBusiness, decisionMakerName, irSummary）。 */
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
入力テキストには、企業HPのテキストに加えて、IR資料（決算説明資料・統合報告書・中期経営計画など）の抜粋が含まれている場合があります。
出力は以下のJSON形式のみとし、他に説明は付けないでください。
{"industry": "大まかな業種カテゴリ1つ（例: SaaS事業、製造業、コンサルティング、金融サービスなど）", "employeeScale": "従業員規模（例: 500-1000名。不明なら「不明」）", "summaryBusiness": "事業展開文（2〜4文、事実ベース）", "decisionMakerName": "代表者名または主要役員名。分からない場合は null または空文字", "irSummary": "IR資料（決算・中期経営計画・リスク情報など）に基づく要約。IR資料が取得できていない場合は null または空文字"}

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
      content: `以下の企業HPから取得したテキスト（構造化済みの場合は ## 会社概要・## 事業内容 等の見出しで区切られています）から、industry（大まかな業種カテゴリ）、employeeScale（従業員規模、不明なら「不明」）、summaryBusiness（事業展開文2〜4文）を抽出し、JSON形式のみで出力してください。

【industry の要件】
企業の主要な業種を1つの大まかなカテゴリで表現してください。複数の事業を列挙せず、最も代表的な業種を端的に記載してください。

【summaryBusiness の要件】
企業の事業内容を自然な文章で説明してください。単なるサービスの羅列ではなく、企業の特徴や強みが伝わる文章構成にしてください。

【decisionMakerName の要件】
- 代表取締役や社長など、公式HP上で明確に記載されている代表者・主要役員名のみを対象としてください。
- Web上に明確な記載がない場合は、推測せずに null または空文字を返してください。

【irSummary の要件】
- IR資料（決算説明資料・統合報告書・中期経営計画・リスク情報など）が入力に含まれている場合、その内容に基づいて2〜4文で要約してください。
- 売上構成、中期方針、主要なリスクや重点投資領域など、数値寄り・計画寄りの情報のポイントを中心にまとめてください。
- IR資料が取得できていない、または明確に判別できない場合は、推測せずに null または空文字を返してください。

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
      content: `あなたは営業仮説を構造化するアシスタントです。${COMMON_INSTRUCTIONS}
${SEGMENT_DEFINITIONS}
${SEGMENT_CONSTRAINTS}
${LINE_BREAK_AFTER_PERIOD}
各段は150〜300文字程度で書いてください。${focusHint}`,
    },
    {
      role: "user",
      content: `以下の事業要約をもとに、次の5段の仮説を順番に作成してください。定義・制約に厳密に従い、論理の一貫性を最優先してください。

1. ${HYPOTHESIS_SEGMENT_LABELS[0]}: 事実ベース。Web情報の範囲に限定。主観的評価は入れない。
2. ${HYPOTHESIS_SEGMENT_LABELS[1]}: 1段目から論理的に導出。断定ではなく仮説として表現。「〜かもしれません」の多用は避ける。
3. ${HYPOTHESIS_SEGMENT_LABELS[2]}: なぜその課題が生まれている可能性があるか。組織・市場・構造の観点で説明。
4. ${HYPOTHESIS_SEGMENT_LABELS[3]}: 外部から介入できる具体的ポイント。抽象的表現は禁止。実務レベルでの接点を示す。
5. ${HYPOTHESIS_SEGMENT_LABELS[4]}: 介入した場合の変化仮説。Before → Afterが明確になる形で記述。

出力は以下のJSON形式のみとし、他に説明は付けないでください。
{"segments": ["1段目の本文", "2段目の本文", "3段目の本文", "4段目の本文", "5段目の本文"]}

--- 事業要約 ---

${summary}`,
    },
  ];
}

/** 提案文下書き用メッセージ（callGroq に渡す）。proposal_draft: 200〜400文字、過度な誇張禁止。 */
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
      content: `あなたは営業向けの提案文を下書きするアシスタントです。${COMMON_INSTRUCTIONS}

【提案文下書き（proposal_draft）の定義】
- 上記5段の論理を踏まえて作成する。
- 営業メール／提案冒頭として使える文章にする。
- 200〜400文字程度。
- 過度な誇張は禁止。
- 仮説に基づく下書きであることを明示してください。${focusHint}`,
    },
    {
      role: "user",
      content: `以下の事業要約と仮説5段をもとに、受託営業向けの提案文を1本作成してください。200〜400文字程度に収め、過度な誇張は避け、論理の流れが明確になるようにしてください。${LINE_BREAK_AFTER_PERIOD}

--- 事業要約 ---

${summary}

--- 仮説5段 ---

${hypothesisText}`,
    },
  ];
}
