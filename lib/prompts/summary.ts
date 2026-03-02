/**
 * 事業要約用プロンプト。出力は JSON（companyName, industry, employeeScale, summaryBusiness, decisionMakerName, irSummary）。
 */
import type { OutputFocus } from "@/types";
import { COMMON_INSTRUCTIONS } from "./constants";

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
