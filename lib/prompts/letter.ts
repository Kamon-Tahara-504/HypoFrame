/**
 * 提案文下書き用プロンプト。proposal_draft: 200〜400文字、過度な誇張禁止。
 */
import type { HypothesisSegments, OutputFocus } from "@/types";
import {
  COMMON_INSTRUCTIONS,
  HYPOTHESIS_SEGMENT_LABELS,
  LINE_BREAK_AFTER_PERIOD,
} from "./constants";

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
