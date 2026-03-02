"use client";

import { useState } from "react";
import type { OutputFocus } from "@/types";
import { getDomainForFavicon, getFaviconUrl } from "@/lib/favicon";

/**
 * チャット風入力セクション（ヒーロー＋入力カード＋出力焦点テンプレート）。
 * 生成ボタンで onSubmit(url, companyName?, outputFocus?) を呼ぶ（1件目のURLで実行）。
 * テンプレートはURL・補足をプリセットせず、出力のどこに焦点を当てるかだけを設定する。
 */
type ChatInputSectionProps = {
  onSubmit: (url: string, companyName?: string, outputFocus?: OutputFocus) => void;
  disabled?: boolean;
  /** 単一URL制御（urls 未指定時） */
  url?: string;
  onUrlChange?: (url: string) => void;
  /** 複数URL制御（最大3件。サイドバー選択で増える） */
  urls?: string[];
  onUrlsChange?: (urls: string[]) => void;
  /** クリアボタン押下時（入力・選択をリセット。親で inputUrls 等をクリアする場合は渡す） */
  onClear?: () => void;
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

export default function ChatInputSection({
  onSubmit,
  disabled,
  url: urlProp,
  onUrlChange,
  urls: urlsProp,
  onUrlsChange,
  onClear,
}: ChatInputSectionProps) {
  const [urlInternal, setUrlInternal] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [outputFocus, setOutputFocus] = useState<OutputFocus | null>(null);
  /** 複数URLモードで0件のときの手入力URL */
  const [urlManual, setUrlManual] = useState("");
  /** URL未入力時の独自バリデーション表示 */
  const [urlError, setUrlError] = useState<string | null>(null);

  const isMulti = urlsProp !== undefined && onUrlsChange !== undefined;
  const isControlled = !isMulti && urlProp !== undefined && onUrlChange !== undefined;
  const url = isControlled ? urlProp : urlInternal;
  const setUrl = isControlled ? onUrlChange! : setUrlInternal;

  const hasUrlChips = isMulti && urlsProp && urlsProp.length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUrlError(null);
    const firstUrl = hasUrlChips
      ? urlsProp!.find((u) => u.trim())?.trim()
      : isMulti
        ? urlManual.trim()
        : url.trim();
    if (!firstUrl) {
      setUrlError("企業URLを入力してください。");
      return;
    }
    onSubmit(firstUrl, companyName.trim() || undefined, outputFocus ?? undefined);
  }

  function handleRemoveUrl(index: number) {
    if (!isMulti || !onUrlsChange) return;
    if (urlError) setUrlError(null);
    const next = urlsProp!.filter((_, i) => i !== index);
    onUrlsChange(next);
  }

  function selectFocus(focus: OutputFocus) {
    setOutputFocus((prev) => (prev === focus ? null : focus));
  }

  function handleClear() {
    setCompanyName("");
    setOutputFocus(null);
    setUrlManual("");
    if (isMulti && onUrlsChange) onUrlsChange([]);
    onClear?.();
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
          className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 transition-[box-shadow] duration-150 focus-within:ring-2 focus-within:ring-primary/20"
        >
          <div className="p-4 flex flex-col gap-2">
            {/* URLエリア: チップ有無で高さが変わらないよう固定高さ（チップ1行分） */}
            <div className="space-y-1">
              <div className="rounded-xl bg-slate-50/50 dark:bg-slate-800/50 h-12 px-3 flex flex-wrap items-center gap-2">
                {hasUrlChips ? (
                  <>
                    {urlsProp!.map((u, i) => {
                      const domain = getDomainForFavicon(u);
                      const faviconUrl = getFaviconUrl(domain);
                      const label = domain || u || "";
                      const displayLabel = label.length > 28 ? `${label.slice(0, 25)}...` : label;
                      return (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 py-1.5 pl-2 pr-1 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm"
                        >
                          {faviconUrl && (
                            <img
                              src={faviconUrl}
                              alt=""
                              width={16}
                              height={16}
                              className="shrink-0 w-4 h-4 rounded object-contain"
                            />
                          )}
                          <span className="max-w-[12rem] truncate" title={u}>
                            {displayLabel}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveUrl(i)}
                            disabled={disabled}
                            aria-label={`${displayLabel} を削除`}
                            className="shrink-0 p-0.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                        </span>
                      );
                    })}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-slate-400 text-sm flex-shrink-0">link</span>
                    <input
                      type="url"
                      value={isMulti ? urlManual : url}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (urlError) setUrlError(null);
                        if (isMulti) setUrlManual(v);
                        else setUrl(v);
                      }}
                      placeholder="企業URLを入力 (https://example.com)"
                      disabled={disabled}
                      className="flex-1 min-w-0 bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 font-medium outline-none disabled:opacity-60"
                      aria-invalid={!!urlError}
                      aria-describedby={urlError ? "url-error" : undefined}
                    />
                  </>
                )}
              </div>
              {urlError && (
                <p
                  id="url-error"
                  role="alert"
                  className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300"
                >
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  {urlError}
                </p>
              )}
            </div>
            <textarea
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="会社名や補足情報を入力..."
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
                onClick={handleClear}
                disabled={disabled}
                className="p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                aria-label="クリア"
                title="入力をクリア"
              >
                <span className="material-symbols-outlined">delete_sweep</span>
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
              className={`p-4 text-left rounded-xl border transition-[box-shadow,border-color] duration-150 group ${
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
