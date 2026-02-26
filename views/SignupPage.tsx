"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import ThemeToggle from "@/components/ThemeToggle";

/** 新規登録ページの UI・フォーム。ルートは app/signup/page.tsx で使用。 */
export default function SignupPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [companyName, setCompanyName] = useState("");
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
      const { error: err } = await signUp(email, password, {
        data: companyName.trim() ? { company_name: companyName.trim() } : undefined,
      });
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
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 md:px-20 py-4 bg-white dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 bg-primary rounded-lg text-white">
            <span className="material-symbols-outlined">account_tree</span>
          </div>
          <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-tight">
            HypoFrame
          </h2>
        </Link>
        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <span className="text-slate-500 dark:text-slate-400 text-sm">
              Already have an account?
            </span>
            <Link href="/login" className="ml-2 text-primary font-semibold hover:underline text-sm">
              Log in
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[1100px] grid md:grid-cols-2 gap-12 items-center">
          {/* Left: 説明（デスクトップのみ） */}
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
                    AI-Powered Insights
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Transform raw data into actionable sales strategies.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                  <span className="material-symbols-outlined">architecture</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200">
                    Structured Thinking
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Build logical frameworks for your sales pitches.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-1 text-primary mb-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className="material-symbols-outlined text-sm">
                    star
                  </span>
                ))}
              </div>
              <p className="italic text-slate-600 dark:text-slate-400 mb-4">
                &quot;This tool completely changed how our team prepares for client meetings.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Satoshi Tanaka, Head of Sales
                </span>
              </div>
            </div>
          </div>

          {/* Right: フォーム */}
          <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Create your account
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                Start building your sales hypothesis today.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold">
                  Company Name
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    corporate_fare
                  </span>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter your company name"
                    className="w-full pl-12 pr-4 py-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold">
                  Work Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    mail
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    autoComplete="email"
                    className="w-full pl-12 pr-4 py-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold">
                  Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    lock
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full pl-12 pr-12 py-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg cursor-pointer hover:text-primary"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    visibility
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                  Must be at least 8 characters
                </p>
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-lg transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{submitting ? "登録中…" : "Create Account"}</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-slate-900 text-slate-500">
                    Or sign up with
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-3 px-6 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-3"
                disabled
                title="Coming soon"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Sign up with Google</span>
              </button>
            </form>
            <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
              By signing up, you agree to our{" "}
              <a href="#" className="text-primary hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-primary hover:underline">
                Privacy Policy
              </a>
              .
            </div>
            <div className="md:hidden mt-6 text-center">
              <span className="text-slate-500 dark:text-slate-400">Already have an account?</span>
              <Link href="/login" className="ml-1 text-primary font-bold hover:underline">
                Log in
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="p-10 text-center text-slate-400 dark:text-slate-600 text-sm">
        © {new Date().getFullYear()} HypoFrame. All rights reserved.
      </footer>
    </div>
  );
}
