/**
 * サーバー用 Supabase 認証クライアント（フェーズ8）。
 * Route Handler 内で Cookie からセッションを復元し、getUser() で認証済みユーザーを取得する。
 * DB 操作は lib/supabase.ts の createServerSupabaseClient（サービスロール）を使用すること。
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabaseAuthClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component など set できないコンテキストでは無視
          }
        },
      },
    }
  );
}

/**
 * Route Handler 内で認証済みユーザー ID を取得する。
 * 未認証・認証未設定（環境変数不足）・エラー時は null。
 */
export async function getAuthUserId(): Promise<string | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  try {
    const supabase = await createServerSupabaseAuthClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user.id;
  } catch {
    return null;
  }
}
