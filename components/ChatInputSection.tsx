"use client";

import { useState } from "react";
import type { OutputFocus } from "@/types";

/**
 * チャット風入力セクション（ヒーロー＋入力カード＋出力焦点テンプレート）。
 * 生成ボタンで onSubmit(url, companyName?, outputFocus?) を呼ぶ。
 * テンプレートはURL・補足をプリセットせず、出力のどこに焦点を当てるかだけを設定する。
 */
type ChatInputSectionProps = {
  onSubmit: (url: string, companyName?: string, outputFocus?: OutputFocus) => void;
  disabled?: boolean;
};

const FOCUS_TEMPLATES: ReadonlyArray<{
  id: OutputFocus;
  icon: string;
  title: string;
  description: string;
}> = [
  {
    id: "summary",
    icon: "summarize",
    title: "事業要約を重点的に確認",
    description: "生成後、企業の要約から理解を深めたいとき",
  },
  {
    id: "hypothesis",
    icon: "account_tree",
    title: "仮説5段を中心に編集",
    description: "論理の流れや各段の文言を磨きたいとき",
  },
  {
    id: "letter",
    icon: "draft",
    title: "提案文の仕上げに集中",
    description: "提案文のトーンや表現を整えたいとき",
  },
];

export default function ChatInputSection({ onSubmit, disabled }: ChatInputSectionProps) {
  const [url, setUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [outputFocus, setOutputFocus] = useState<OutputFocus | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const u = url.trim();
    if (!u) return;
    onSubmit(u, companyName.trim() || undefined, outputFocus ?? undefined);
  }

  function selectFocus(focus: OutputFocus) {
    setOutputFocus((prev) => (prev === focus ? null : focus));
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-12 py-12 flex flex-col items-center justify-center min-h-[75vh]">
      {/* ヒーロー */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
          営業の仮説構築をAIで加速させる
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto italic font-medium tracking-wide">
          URLを入力するだけで、企業の現状から提案文のドラフトまで構造化します。
        </p>
      </div>

      {/* チャット風入力カード */}
      <div className="w-full">
        <form
          onSubmit={handleSubmit}
          className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 transition-all focus-within:ring-2 focus-within:ring-primary/20"
        >
          <div className="p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 py-2 pl-3 pr-4">
              <span className="material-symbols-outlined text-slate-400 text-sm flex-shrink-0">link</span>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="企業URLを入力 (https://example.com)"
                required
                disabled={disabled}
                className="flex-1 min-w-0 bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 font-medium outline-none disabled:opacity-60"
              />
            </div>
            <textarea
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="会社名（任意）や補足情報を入力..."
              rows={3}
              spellCheck={false}
              disabled={disabled}
              className="w-full bg-slate-50/50 dark:bg-slate-800/50 border-none rounded-xl focus:ring-0 text-sm resize-none py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 outline-none disabled:opacity-60"
            />
          </div>
          <div className="flex items-center justify-between p-2 pt-0">
            <div className="flex gap-1">
              <button
                type="button"
                className="p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="添付"
              >
                <span className="material-symbols-outlined">attach_file</span>
              </button>
              <button
                type="button"
                className="p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="設定"
              >
                <span className="material-symbols-outlined">settings_suggest</span>
              </button>
            </div>
            <button
              type="submit"
              disabled={disabled}
              className="bg-primary text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>生成を開始する</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </form>
      </div>

      {/* 出力焦点テンプレート（URL・補足は変えず、結果のどこに注目するかだけ選択） */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
        {FOCUS_TEMPLATES.map((item) => {
          const isSelected = outputFocus === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => selectFocus(item.id)}
              className={`p-4 text-left rounded-xl border transition-all group ${
                isSelected
                  ? "bg-primary/10 dark:bg-primary/20 border-primary/50 ring-2 ring-primary/30"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:bg-primary/5"
              }`}
            >
              <span className="material-symbols-outlined text-primary mb-2 block">
                {item.icon}
              </span>
              <h4 className="font-bold text-sm mb-1 text-slate-900 dark:text-white">
                {item.title}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {item.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
