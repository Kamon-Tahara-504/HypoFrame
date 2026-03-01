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

// --- 要約プロンプト用断片 ---
const SUMMARY_SYSTEM_BASE =
  "あなたは企業の事業内容を要約するアシスタントです。";
const SUMMARY_SYSTEM_IR_NOTE =
  "入力テキストには、企業HPのテキストに加えて、IR資料（決算説明資料・統合報告書・中期経営計画など）の抜粋が含まれている場合があります。";
const SUMMARY_SYSTEM_JSON_EXAMPLE =
  '{"companyName": "企業の正式名称または広く使われている通称（例: 株式会社ドワンゴ）。HP・IR・見出しから読み取れる範囲で記載。判別できない場合は null", "industry": "大まかな業種カテゴリ1つ（例: SaaS事業、製造業、コンサルティング、金融サービスなど）", "employeeScale": "従業員規模（例: 約300名、500-1000名。入力のどこにも記載がなければ「不明」）", "summaryBusiness": "事業展開（3〜5文、事実ベースで具体的に）", "decisionMakerName": "代表者名（就任時期が分かれば「名前（〇〇年〇月就任）」の形で。分からない場合は null）", "irSummary": "IR資料（決算・中期経営計画・リスク情報など）に基づく要約。入力に「## IR情報」が含まれる場合は必ず要約する。含まれない場合は null"}';
const SUMMARY_SYSTEM_INDUSTRY_RULES = `
【重要】industry の作成ルール:
- 具体的なサービス名や細かい事業内容の列挙は避ける
- 企業の主要な業種・業界を1つのカテゴリで端的に表現する
- 「〜、〜、〜など」のような列挙形式は使わない
- 例: ○「エンターテインメント事業」 ×「動画配信、ゲーム、電子書籍など」`;
const SUMMARY_SYSTEM_SUMMARY_BUSINESS_RULES = `
【重要】summaryBusiness（事業展開）の文章作成ルール:
- 3〜5文で、企業の事業内容を具体的に説明する。短文の羅列にせず、一続きの読みやすい文章にする。
- 「〇〇は、…として、…を展開しています。」「…をはじめ、…まで、幅広く展開しています。」「さらに、…も行っています。」のように、接続詞でつなぐ。
- 具体的なサービス名・製品名・イベント名を織り交ぜ、企業の特徴や強みが伝わる構成にする。
- 単純な列挙（「〜しています、〜しています」の繰り返し）は避ける。`;
const SUMMARY_USER_INTRO =
  "以下の企業HPから取得したテキスト（構造化済みの場合は ## 会社概要・## 事業内容 等の見出しで区切られています。また「## Google 上の企業情報（補足）」として検索結果・Wikipedia 等の抜粋が含まれる場合があります）から、companyName（企業名）、industry（大まかな業種カテゴリ）、employeeScale（従業員規模）、summaryBusiness（事業展開・3〜5文で具体的に）を抽出し、JSON形式のみで出力してください。";
const SUMMARY_USER_REQUIREMENTS = `
【companyName の要件】
- 企業の正式名称（株式会社〇〇など）または、HP・IRで広く使われている通称を記載してください。
- 見出し・会社概要・IR資料などから明確に読み取れる範囲で記載し、判別できない場合は null を返してください。

【industry の要件】
企業の主要な業種を1つの大まかなカテゴリで表現してください。複数の事業を列挙せず、最も代表的な業種を端的に記載してください。

【employeeScale（従業員規模）の要件】
- 入力テキスト全体（会社概要・事業内容・IR情報・「## Google 上の企業情報（補足）」の検索スニペット・Wikipedia 風の記述など）をくまなく確認し、「従業員数」「社員数」「正社員数」「約〇〇名」「〇〇人」などの記述がどこかにあれば、必ず employeeScale に記載してください。
- 範囲（例: 500-1000名）や概数（例: 約300名、1000人以上）の形でよい。複数ある場合は代表的な値や直近のものを記載。
- 上記のいずれのセクションにも従業員規模に該当する記載が本当にない場合のみ「不明」を返してください。

【summaryBusiness（事業展開）の要件】
- 3〜5文で、企業の事業内容を具体的に説明してください。短文の羅列ではなく、「〇〇は、…として、…を展開しています。」「…をはじめ、…まで、幅広く展開しています。」「さらに、…も行っています。」のように接続詞でつなぎ、具体的なサービス名・製品名・イベント名を織り交ぜた自然な文章にしてください。
- 単なるサービスの羅列は避け、企業の特徴や強みが伝わる構成にしてください。

【decisionMakerName（代表者名）の要件】
- 代表取締役や社長など、公式HP上で明確に記載されている代表者・主要役員名を記載してください。
- 「〇〇年〇月就任」「〇〇年就任」のように就任時期が記載されている場合は、括弧で含めて記載してください（例: 夏野剛（2024年6月就任））。就任時期の記載がなければ名前のみでよい。いつ時点の情報か分かると利用者に親切です。
- Web上に明確な記載がない場合は、推測せずに null または空文字を返してください。

【irSummary の要件】
- 入力テキストに「## IR情報」または IR資料（決算説明資料・統合報告書・中期経営計画など）の抜粋が含まれている場合は、その内容に基づいて2〜4文で要約し、irSummary に記載してください。売上構成、中期方針、主要なリスクや重点投資領域など、数値寄り・計画寄りのポイントをまとめてください。
- 「## IR情報」やIR資料の抜粋が入力に含まれていない場合のみ、irSummary は null を返してください。推測で書かないでください。`;

/** 事業要約用メッセージ（callGroq に渡す）。出力は JSON のみ（companyName, industry, employeeScale, summaryBusiness, decisionMakerName, irSummary）。 */
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
      content: [
        SUMMARY_SYSTEM_BASE,
        COMMON_INSTRUCTIONS,
        focusHint,
        SUMMARY_SYSTEM_IR_NOTE,
        "出力は以下のJSON形式のみとし、他に説明は付けないでください。",
        SUMMARY_SYSTEM_JSON_EXAMPLE,
        SUMMARY_SYSTEM_INDUSTRY_RULES,
        SUMMARY_SYSTEM_SUMMARY_BUSINESS_RULES,
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
    {
      role: "user",
      content: `${SUMMARY_USER_INTRO}\n${SUMMARY_USER_REQUIREMENTS}\n\n---\n\n${crawledText}`,
    },
  ];
}

// --- 仮説5段プロンプト用断片 ---
const HYPOTHESIS_SYSTEM_BASE = "あなたは営業仮説を構造化するアシスタントです。";
const HYPOTHESIS_USER_INTRO =
  "以下の事業要約をもとに、次の5段の仮説を順番に作成してください。定義・制約に厳密に従い、論理の一貫性を最優先してください。";
const HYPOTHESIS_USER_JSON_EXAMPLE =
  '{"segments": ["1段目の本文", "2段目の本文", "3段目の本文", "4段目の本文", "5段目の本文"]}';

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
      content: [
        HYPOTHESIS_SYSTEM_BASE,
        COMMON_INSTRUCTIONS,
        SEGMENT_DEFINITIONS,
        SEGMENT_CONSTRAINTS,
        LINE_BREAK_AFTER_PERIOD,
        `各段は150〜300文字程度で書いてください。${focusHint}`,
      ].join("\n\n"),
    },
    {
      role: "user",
      content: [
        HYPOTHESIS_USER_INTRO,
        "",
        `1. ${HYPOTHESIS_SEGMENT_LABELS[0]}: 事実ベース。Web情報の範囲に限定。主観的評価は入れない。`,
        `2. ${HYPOTHESIS_SEGMENT_LABELS[1]}: 1段目から論理的に導出。断定ではなく仮説として表現。「〜かもしれません」の多用は避ける。`,
        `3. ${HYPOTHESIS_SEGMENT_LABELS[2]}: なぜその課題が生まれている可能性があるか。組織・市場・構造の観点で説明。`,
        `4. ${HYPOTHESIS_SEGMENT_LABELS[3]}: 外部から介入できる具体的ポイント。抽象的表現は禁止。実務レベルでの接点を示す。`,
        `5. ${HYPOTHESIS_SEGMENT_LABELS[4]}: 介入した場合の変化仮説。Before → Afterが明確になる形で記述。`,
        "",
        "出力は以下のJSON形式のみとし、他に説明は付けないでください。",
        HYPOTHESIS_USER_JSON_EXAMPLE,
        "",
        "--- 事業要約 ---",
        "",
        summary,
      ].join("\n"),
    },
  ];
}

// --- 提案文プロンプト用断片 ---
const LETTER_SYSTEM_BASE = "あなたは営業向けの提案文を下書きするアシスタントです。";
const LETTER_SYSTEM_DEFINITION = `
【提案文下書き（proposal_draft）の定義】
- 上記5段の論理を踏まえて作成する。
- 営業メール／提案冒頭として使える文章にする。
- 200〜400文字程度。
- 過度な誇張は禁止。断定ではなく仮説であることを示す表現にしてください。
- 冒頭で「仮説に基づく提案」であることを明示してください。
- 「課題があります」と述べたうえで、その課題が何か（仮説5段の「潜在課題の仮説」「課題の背景要因」を要約した形で）をはっきり書いてください。現状から考えられる仮説として思い切って述べてよいが、誇張表現は避けてください。そのうえで改善機会・提案仮説につなげる流れにしてください。`;
const LETTER_USER_INTRO =
  "以下の事業要約と仮説5段をもとに、受託営業向けの提案文を1本作成してください。200〜400文字程度に収め、過度な誇張は避け、論理の流れが明確になるようにしてください。";
const LETTER_USER_STRUCTURE = `
【提案文の構成】
1. 冒頭で「仮説に基づく提案」であることを示す。
2. 事業要約を簡潔に触れたあと、「同社には〇〇といった課題が考えられます。」のように、課題を明示してからその内容（潜在課題・背景要因の要約）を述べる。
3. 改善機会・提案仮説につなげて締める。

誇張表現は使わず、仮説であることを示す表現（〜と考えられます、〜の可能性がある、など）で統一してください。`;

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
      content: [
        LETTER_SYSTEM_BASE,
        COMMON_INSTRUCTIONS,
        LETTER_SYSTEM_DEFINITION.trim(),
        focusHint,
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
    {
      role: "user",
      content: [
        LETTER_USER_INTRO + LINE_BREAK_AFTER_PERIOD,
        LETTER_USER_STRUCTURE,
        "--- 事業要約 ---",
        "",
        summary,
        "",
        "--- 仮説5段 ---",
        "",
        hypothesisText,
      ].join("\n"),
    },
  ];
}
