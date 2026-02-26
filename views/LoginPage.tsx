"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";

/** ログインページ。ホーム画面と同じレイアウト（Header + main + footer）に統一。 */
export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { error: err } = await signIn(email, password);
      if (err) {
        setError(err.message);
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow flex items-center">
        <div className="max-w-5xl mx-auto px-6 py-10 w-full">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* 左: アプリの説明 */}
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

            {/* 右: ログインフォーム */}
            <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  ログイン
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  アカウントにログインして仮説生成を再開します
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <label
                    className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                    htmlFor="email"
                  >
                    メールアドレス
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    autoComplete="email"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                    htmlFor="password"
                  >
                    パスワード
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                >
                  {submitting ? "ログイン中…" : "ログイン"}
                </button>
              </form>
              <div className="mt-6 text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  アカウントをお持ちでない方は{" "}
                  <Link href="/signup" className="text-primary font-semibold hover:underline">
                    新規登録
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="border-t border-slate-200 dark:border-slate-800 py-10 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} HypoFrame. 営業仮説の構造化ツール
        </p>
      </footer>
    </div>
  );
}
