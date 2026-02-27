/**
 * フェーズ12: 手紙下書きを新規 Google ドキュメントに書き込む。
 * 認証: Supabase ログイン必須 + Google 連携 Cookie。
 */
import { getAuthUserId } from "@/lib/supabase/server-auth";
import {
  getGoogleTokensFromCookie,
  refreshAccessToken,
  encryptTokens,
  buildSetCookieHeader,
} from "@/lib/google-oauth";
import { getExportFileName } from "@/lib/export";
import type { GoogleDocsExportBody } from "@/types/export";
import { google } from "googleapis";
import { NextResponse } from "next/server";

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
  let body: GoogleDocsExportBody;
  try {
    body = (await request.json()) as GoogleDocsExportBody;
  } catch {
    return NextResponse.json(
      { error: "不正なリクエストです。" },
      { status: 400 }
    );
  }
  if (typeof body.letterDraft !== "string") {
    return NextResponse.json(
      { error: "必須項目が不足しています。" },
      { status: 400 }
    );
  }
  const title = getExportFileName(body.companyName ?? null).replace(/\.txt$/i, "");
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
    const docs = google.docs({ version: "v1", auth: oauth2 });
    const createRes = await docs.documents.create({
      requestBody: { title },
    });
    const documentId = createRes.data.documentId;
    if (!documentId) throw new Error("Failed to create document");
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: body.letterDraft,
            },
          },
        ],
      },
    });
    const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;
    return { documentId, documentUrl };
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
        // fall through
      }
    }
    const message =
      err && typeof err === "object" && "message" in err
        ? String((err as { message: string }).message)
        : "Google ドキュメントの作成に失敗しました。";
    return NextResponse.json(
      { error: message.includes("access") || message.includes("403") ? "Google のアクセス権限を確認してください。" : message },
      { status: 502 }
    );
  }
}
