/**
 * ブラウザ用 Supabase クライアント（フェーズ8 認証）。
 * Client Component でのみ import すること。認証・セッションは Cookie で管理される。
 * 環境変数未設定時は null を返し、認証 UI は表示するがログインは利用できない（ビルド時も安全）。
 */
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
