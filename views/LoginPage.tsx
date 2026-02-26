"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import ThemeToggle from "@/components/ThemeToggle";

/** ログインページの UI・フォーム。ルートは app/login/page.tsx で使用。 */
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
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-slate-900 dark:text-slate-100">
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg text-white">
            <span className="material-symbols-outlined block text-xl">account_tree</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            HypoFrame
          </h1>
        </Link>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
              営業仮説の構造化ツール
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl shadow-primary/5 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-8 pb-4 text-center">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                HypoFrame
              </h2>
              <p className="text-primary font-medium text-sm tracking-wide">
                営業の思考を構造化するツール
              </p>
            </div>
            <div className="px-8 py-4">
              <div className="h-48 w-full rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center relative overflow-hidden group">
                <span className="material-symbols-outlined text-6xl text-primary/40 group-hover:scale-110 transition-transform duration-500">
                  insights
                </span>
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur p-3 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Welcome Back
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Please enter your credentials to continue building your sales strategy.
                  </p>
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-8 pt-2 space-y-5">
              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label
                  className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-xl">
                    mail
                  </span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label
                    className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <Link
                    href="#"
                    className="text-xs font-semibold text-primary hover:underline transition-all"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-xl">
                    lock
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full pl-10 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <span className="material-symbols-outlined text-xl">visibility</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 px-1 py-1">
                <input
                  id="remember"
                  type="checkbox"
                  className="rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary h-4 w-4"
                />
                <label
                  htmlFor="remember"
                  className="text-xs text-slate-500 dark:text-slate-400 font-medium"
                >
                  Remember me for 30 days
                </label>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                <span>{submitting ? "ログイン中…" : "Login to Dashboard"}</span>
                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>
              <div className="relative py-2 flex items-center justify-center">
                <div className="border-t border-slate-200 dark:border-slate-800 w-full absolute" />
                <span className="bg-white dark:bg-slate-900 px-4 text-xs font-bold text-slate-400 dark:text-slate-500 relative uppercase tracking-widest">
                  or
                </span>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Don&apos;t have an account?{" "}
                  <Link href="/signup" className="text-primary font-bold hover:underline ml-1">
                    Create an account
                  </Link>
                </p>
              </div>
            </form>
          </div>
          <footer className="mt-8 text-center">
            <p className="text-[10px] text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] font-bold">
              © {new Date().getFullYear()} HypoFrame. All rights reserved.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
