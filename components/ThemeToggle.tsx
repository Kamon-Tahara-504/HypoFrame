"use client";

import { useTheme } from "./ThemeProvider";

/**
 * ダーク／ライトモード切り替えボタン。ヘッダー右側に配置。
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "ライトモードに切り替え" : "ダークモードに切り替え"}
      className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
    >
      {theme === "dark" ? (
        <span className="material-symbols-outlined text-2xl" aria-hidden>
          light_mode
        </span>
      ) : (
        <span className="material-symbols-outlined text-2xl" aria-hidden>
          dark_mode
        </span>
      )}
    </button>
  );
}
