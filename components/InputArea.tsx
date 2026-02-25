"use client";

/**
 * 入力エリア（05-ui-ux）。企業URL（必須）・会社名（任意）・生成ボタン。
 * 親から onSubmit と disabled を受け取り、生成中は入力を無効化。
 */
type InputAreaProps = {
  /** 生成ボタン押下時に (url, companyName?) で呼ばれる */
  onSubmit: (url: string, companyName?: string) => void;
  /** true のとき入力・ボタンを無効化（生成中） */
  disabled?: boolean;
};

export default function InputArea({ onSubmit, disabled }: InputAreaProps) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const url = (form.elements.namedItem("url") as HTMLInputElement).value.trim();
    const companyName = (
      form.elements.namedItem("companyName") as HTMLInputElement
    )?.value?.trim();
    if (!url) return;
    onSubmit(url, companyName || undefined);
  }

  // --- フォーム: URL・会社名・生成ボタン ---
  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-6 md:p-8">
        <div className="flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-primary">
            edit_note
          </span>
          <h2 className="text-lg font-bold">入力情報</h2>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label
              htmlFor="url"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              企業のURL <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[20px]">
                link
              </span>
              <input
                id="url"
                name="url"
                type="url"
                required
                placeholder="例：https://example.co.jp"
                disabled={disabled}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all disabled:opacity-60"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label
              htmlFor="companyName"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              企業名（任意）
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[20px]">
                corporate_fare
              </span>
              <input
                id="companyName"
                name="companyName"
                type="text"
                placeholder="例：株式会社サンプル"
                disabled={disabled}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all disabled:opacity-60"
              />
            </div>
          </div>
          <div className="md:col-span-2 mt-8 flex justify-center">
            <button
              type="submit"
              disabled={disabled}
              className="w-full max-w-md bg-primary hover:bg-primary/90 text-white px-10 py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed text-lg"
            >
              <span className="material-symbols-outlined">auto_awesome</span>
              生成
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
