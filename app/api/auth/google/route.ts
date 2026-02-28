/**
 * フェーズ12: Google OAuth 開始。Supabase ログイン済みユーザーのみ。
 * GET /api/auth/google?returnTo=/ など。302 で Google 認可画面へリダイレクト。
 */
import { getAuthUserId } from "@/lib/supabase/server-auth";
import { buildAuthUrl } from "@/lib/google-oauth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "ログインしてください。" },
      { status: 401 }
    );
  }
  const { searchParams } = new URL(request.url);
  const returnTo = searchParams.get("returnTo")?.trim() || "/";
  const url = buildAuthUrl(returnTo);
  return NextResponse.redirect(url);
}
