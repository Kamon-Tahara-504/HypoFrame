/**
 * 要約・仮説5段・提案文用プロンプト（09-app-design 3.1）。
 * 各項目の定義・制約を組み込み。outputFocus 指定時は該当段階に軽い追加指示を付与。
 */
export { HYPOTHESIS_SEGMENT_LABELS } from "./constants";
export { getSummaryPrompt } from "./summary";
export { getHypothesisPrompt } from "./hypothesis";
export { getLetterPrompt } from "./letter";
