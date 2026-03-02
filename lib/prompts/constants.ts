/**
 * プロンプト共通の指示・定義・制約。要約・仮説5段・提案文で共有。
 */

/** 共通指示（04 第4節・08 フェーズ2 確認） */
export const COMMON_INSTRUCTIONS =
  "情報源は企業の公式HPのみです。断定を避け、推測であることを示す表現にしてください。";

/** 文書表示用：各文の「。」の直後に改行を入れるよう指示（JSON出力時は不要、表示時に改行される） */
export const LINE_BREAK_AFTER_PERIOD =
  "各文は読みやすく区切ってください（JSON出力時は改行を入れず、通常の文字列として出力してください）。";

/** 仮説5段のラベル（getHypothesisPrompt / getLetterPrompt / エクスポートで共通利用） */
export const HYPOTHESIS_SEGMENT_LABELS = [
  "企業の現在状況整理",
  "潜在課題の仮説",
  "課題の背景要因",
  "改善機会（介入ポイント）",
  "提案仮説",
] as const;

/** 各項目の定義（仮説5段） */
export const SEGMENT_DEFINITIONS = `
【各項目の定義】
1. 企業の現在状況整理（current_state）: 事実ベースで整理する。Web情報から読み取れる範囲に限定。主観的評価は入れない。
2. 潜在課題の仮説（latent_issue）: 表面化していない可能性のある課題。current_stateから論理的に導出。断定ではなく仮説として表現。
3. 課題の背景要因（background_factor）: なぜその課題が生まれている可能性があるか。組織・市場・構造の観点から説明。
4. 改善機会（intervention_point）: 外部から介入できる具体的ポイント。抽象的な表現は禁止。実務レベルでの接点を示す。
5. 提案仮説（proposal_hypothesis）: 介入した場合の変化仮説。Before → Afterが明確になる形で記述。
`;

/** 仮説5段の制約 */
export const SEGMENT_CONSTRAINTS = `
【制約】
- 再生成前提の曖昧表現は禁止。
- 「〜かもしれません」の多用は禁止。
- 論理接続が明確であること。
- 各項目は150〜300文字程度。
- 論理の一貫性を最優先してください。
`;
