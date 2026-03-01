/**
 * フェーズ12: 現在の結果 1 件を新規 Google スプレッドシートに書き込む。
 * 認証: Supabase ログイン必須 + Google 連携 Cookie。
 */
import { getAuthUserId } from "@/lib/supabase/server-auth";
import { getGoogleTokensFromCookie, withGoogleAuthRetry } from "@/lib/google-oauth";
import { EXPORT_HEADERS } from "@/lib/export";
import type { ExportRow } from "@/types/export";
import { google } from "googleapis";
import { NextResponse } from "next/server";

function rowToValues(row: ExportRow): string[] {
  const videoUrlsCell =
    row.videoUrls && row.videoUrls.length > 0 ? row.videoUrls.join("\n") : "";
  return [
    row.companyName?.trim() || "不明",
    row.inputUrl,
    row.industry?.trim() || "",
    row.employeeScale?.trim() || "",
    row.decisionMakerName?.trim() || "",
    row.summaryBusiness,
    row.irSummary?.trim() || "",
    videoUrlsCell,
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
  const tokens = await getGoogleTokensFromCookie(request);
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
  const run = async (tokens: { access_token: string; refresh_token: string }) => {
    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")}/api/auth/google/callback`
    );
    oauth2.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
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
      range: "Sheet1!A1:N2",
      valueInputOption: "RAW",
      requestBody: { values },
    });
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    return { spreadsheetId, spreadsheetUrl };
  };
  try {
    const { result, setCookieHeader } = await withGoogleAuthRetry(request, run);
    const res = NextResponse.json(result);
    if (setCookieHeader) res.headers.set("Set-Cookie", setCookieHeader);
    return res;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Google スプレッドシートへの書き込みに失敗しました。";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
