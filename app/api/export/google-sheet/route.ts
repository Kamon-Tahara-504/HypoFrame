/**
 * フェーズ12: 現在の結果 1 件を新規 Google スプレッドシートに書き込む。
 * 認証: Supabase ログイン必須 + Google 連携 Cookie。
 */
import { getAuthUserId } from "@/lib/supabase/server-auth";
import {
  getGoogleTokensFromCookie,
  refreshAccessToken,
  encryptTokens,
  buildSetCookieHeader,
} from "@/lib/google-oauth";
import { EXPORT_HEADERS } from "@/lib/export";
import type { ExportRow } from "@/types/export";
import { google } from "googleapis";
import { NextResponse } from "next/server";

function rowToValues(row: ExportRow): string[] {
  return [
    row.companyName?.trim() || "不明",
    row.inputUrl,
    row.industry?.trim() || "",
    row.employeeScale?.trim() || "",
    row.decisionMakerName?.trim() || "",
    row.summaryBusiness,
    row.irSummary?.trim() || "",
    row.hypothesisSegments[0],
    row.hypothesisSegments[1],
    row.hypothesisSegments[2],
    row.hypothesisSegments[3],
    row.hypothesisSegments[4],
    row.letterDraft,
  ];
}

export async function POST(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "ログインしてください。" },
      { status: 401 }
    );
  }
  let tokens = await getGoogleTokensFromCookie(request);
  if (!tokens) {
    return NextResponse.json(
      { error: "Google と連携してください。結果エリアの「Google と連携」から設定できます。" },
      { status: 401 }
    );
  }
  let body: ExportRow;
  try {
    body = (await request.json()) as ExportRow;
  } catch {
    return NextResponse.json(
      { error: "不正なリクエストです。" },
      { status: 400 }
    );
  }
  if (
    typeof body.inputUrl !== "string" ||
    !Array.isArray(body.hypothesisSegments) ||
    body.hypothesisSegments.length !== 5 ||
    typeof body.letterDraft !== "string"
  ) {
    return NextResponse.json(
      { error: "必須項目が不足しています。" },
      { status: 400 }
    );
  }
  const values = [EXPORT_HEADERS as unknown as string[], rowToValues(body)];
  const run = async (accessToken: string) => {
    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")}/api/auth/google/callback`
    );
    oauth2.setCredentials({
      access_token: accessToken,
      refresh_token: tokens!.refresh_token,
    });
    const sheets = google.sheets({ version: "v4", auth: oauth2 });
    const createRes = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: "HypoFrame エクスポート" },
      },
    });
    const spreadsheetId = createRes.data.spreadsheetId;
    if (!spreadsheetId) throw new Error("Failed to create spreadsheet");
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Sheet1!A1:M2",
      valueInputOption: "RAW",
      requestBody: { values },
    });
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    return { spreadsheetId, spreadsheetUrl };
  };
  try {
    const result = await run(tokens.access_token);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const is401 =
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: number }).code === 401;
    if (is401 && tokens.refresh_token) {
      try {
        tokens = await refreshAccessToken(tokens.refresh_token);
        const encrypted = await encryptTokens(tokens);
        const result = await run(tokens.access_token);
        const res = NextResponse.json(result);
        res.headers.set("Set-Cookie", buildSetCookieHeader(encrypted));
        return res;
      } catch {
        // fall through to error
      }
    }
    const message =
      err && typeof err === "object" && "message" in err
        ? String((err as { message: string }).message)
        : "Google スプレッドシートへの書き込みに失敗しました。";
    return NextResponse.json(
      { error: message.includes("access") || message.includes("403") ? "Google のアクセス権限を確認してください。" : message },
      { status: 502 }
    );
  }
}
