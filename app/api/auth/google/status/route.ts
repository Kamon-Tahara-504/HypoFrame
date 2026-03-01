/**
 * フェーズ12: Google 連携済みかどうか。Cookie の有無のみ返す（認証必須）。
 */
import { getAuthUserId } from "@/lib/supabase/server-auth";
import { getGoogleTokensFromCookie } from "@/lib/google-oauth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ linked: false }, { status: 200 });
  }
  const tokens = await getGoogleTokensFromCookie(request);
  return NextResponse.json({ linked: !!tokens });
}
