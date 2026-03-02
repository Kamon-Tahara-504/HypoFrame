/**
 * フェーズ8: 認証セッションの更新。Supabase のトークンリフレッシュを Cookie に反映する。
 * 現状は全パスでリフレッシュのみ行い、未認証時のリダイレクトは行わない。
 * 将来、認証必須パス（例: /dashboard）を設ける場合は、request.nextUrl.pathname で分岐し、
 * 未認証なら /login?next=... にリダイレクトするロジックを追加する。
 *
 * Next.js 16 では middleware ファイルは将来的に proxy へ置き換え予定とアナウンスされているため、
 * 本実装も今後 proxy への移行を検討する（docs/08-implementation-order.md 参照）。
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // トークンリフレッシュを実行し、必要なら response に Cookie をセットする
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
