/**
 * 要約・仮説5段・提案文用プロンプト（09-app-design 3.1）。
 * 実装は lib/prompts/ に分割。このファイルは後方互換の re-export。
 */
export {
  HYPOTHESIS_SEGMENT_LABELS,
  getSummaryPrompt,
  getHypothesisPrompt,
  getLetterPrompt,
} from "./prompts/index";
