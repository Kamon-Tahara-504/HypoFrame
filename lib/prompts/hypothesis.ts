/**
 * 仮説5段用プロンプト。出力は JSON の segments 配列。
 */
import type { OutputFocus } from "@/types";
import {
  COMMON_INSTRUCTIONS,
  HYPOTHESIS_SEGMENT_LABELS,
  LINE_BREAK_AFTER_PERIOD,
  SEGMENT_DEFINITIONS,
  SEGMENT_CONSTRAINTS,
} from "./constants";

const HYPOTHESIS_SYSTEM_BASE = "あなたは営業仮説を構造化するアシスタントです。";
const HYPOTHESIS_USER_INTRO =
  "以下の事業要約をもとに、次の5段の仮説を順番に作成してください。定義・制約に厳密に従い、論理の一貫性を最優先してください。";
const HYPOTHESIS_USER_JSON_EXAMPLE =
  '{"segments": ["1段目の本文", "2段目の本文", "3段目の本文", "4段目の本文", "5段目の本文"]}';

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
