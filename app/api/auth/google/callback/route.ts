/**
 * フェーズ12: Google OAuth コールバック。code をトークンに交換し Cookie に保存して returnTo へリダイレクト。
 */
import { getAuthUserId } from "@/lib/supabase/server-auth";
import {
  exchangeCodeForTokens,
  encryptTokens,
  buildSetCookieHeader,
} from "@/lib/google-oauth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) {
    const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";
    return NextResponse.redirect(`${base}/?error=login_required`);
  }
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  let returnTo = "/";
  if (state) {
    try {
      returnTo = Buffer.from(state, "base64url").toString("utf-8") || "/";
    } catch {
      // invalid state, keep /
    }
  }
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";
  if (!code) {
    return NextResponse.redirect(`${base}${returnTo.startsWith("/") ? returnTo : `/${returnTo}`}?error=google_no_code`);
  }
  try {
    const tokens = await exchangeCodeForTokens(code);
    const encrypted = await encryptTokens(tokens);
    const setCookie = buildSetCookieHeader(encrypted);
    const url = `${base}${returnTo.startsWith("/") ? returnTo : `/${returnTo}`}?google_linked=1`;
    const res = NextResponse.redirect(url);
    res.headers.set("Set-Cookie", setCookie);
    return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Google 連携に失敗しました。";
    return NextResponse.redirect(`${base}${returnTo.startsWith("/") ? returnTo : `/${returnTo}`}?error=${encodeURIComponent(message)}`);
  }
}
