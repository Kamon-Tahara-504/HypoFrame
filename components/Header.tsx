/**
 * ヘッダー（05-ui-ux 画面構成）。
 * アプリ名・短い説明を表示。Phase 5 ではナビは非表示。
 */
export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg text-white">
            <span className="material-symbols-outlined block">account_tree</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              HypoFrame
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              営業の思考を構造化するツール
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
