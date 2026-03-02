/**
 * 認証画面（ログイン・新規登録）の左カラム：HypoFrame タイトルと3つの特徴説明。
 */
export default function AuthHero() {
  return (
    <div className="hidden md:flex flex-col gap-8">
      <div>
        <h1 className="text-slate-900 dark:text-white text-5xl font-black leading-tight tracking-tight mb-4">
          HypoFrame
        </h1>
        <p className="text-primary text-xl font-medium">営業の思考を構造化するツール</p>
      </div>
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 p-2 rounded-lg text-primary">
            <span className="material-symbols-outlined">insights</span>
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200">
              AI による仮説生成
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              企業 URL から営業仮説を自動生成
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 p-2 rounded-lg text-primary">
            <span className="material-symbols-outlined">architecture</span>
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200">
              構造化された思考
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              5つの仮説とアプローチレターを生成
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 p-2 rounded-lg text-primary">
            <span className="material-symbols-outlined">edit_note</span>
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200">
              編集・保存
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              生成結果を編集して保存可能
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
