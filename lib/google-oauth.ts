/**
 * フェーズ12: Google OAuth 2.0 用ヘルパー。
 * 認可 URL 生成・code 交換・トークンの Cookie 保存/取得・refresh を行う。
 */
import { createHash, createSecretKey } from "crypto";
import type { KeyObject } from "crypto";
import { compactDecrypt, CompactEncrypt } from "jose";

const COOKIE_NAME = "google_export_tokens";
const COOKIE_MAX_AGE_DAYS = 30;
const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/documents",
];

export type GoogleTokens = {
  access_token: string;
  refresh_token: string;
};

function getEncryptionKey(): KeyObject {
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!secret) throw new Error("GOOGLE_CLIENT_SECRET is not set");
  return createSecretKey(createHash("sha256").update(secret).digest());
}

export function buildAuthUrl(returnTo: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!baseUrl || !clientId) throw new Error("Missing GOOGLE_CLIENT_ID or NEXT_PUBLIC_APP_URL");
  const redirectUri = `${baseUrl.replace(/\/$/, "")}/api/auth/google/callback`;
  const state = Buffer.from(returnTo, "utf-8").toString("base64url");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!baseUrl || !clientId || !clientSecret)
    throw new Error("Missing Google OAuth env vars");
  const redirectUri = `${baseUrl.replace(/\/$/, "")}/api/auth/google/callback`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token exchange failed: ${res.status} ${err}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
  };
  if (!data.refresh_token)
    throw new Error("Google did not return refresh_token (prompt=consent may be needed)");
  return { access_token: data.access_token, refresh_token: data.refresh_token };
}

export async function encryptTokens(tokens: GoogleTokens): Promise<string> {
  const key = getEncryptionKey();
  const plaintext = new TextEncoder().encode(JSON.stringify(tokens));
  const jwe = await new CompactEncrypt(plaintext)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .encrypt(key);
  return jwe;
}

export async function decryptTokens(jwe: string): Promise<GoogleTokens | null> {
  try {
    const key = getEncryptionKey();
    const { plaintext } = await compactDecrypt(jwe, key);
    const json = new TextDecoder().decode(plaintext);
    const data = JSON.parse(json) as GoogleTokens;
    if (typeof data.access_token !== "string" || typeof data.refresh_token !== "string")
      return null;
    return data;
  } catch {
    return null;
  }
}

export function getGoogleTokensFromCookie(request: Request): Promise<GoogleTokens | null> {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return Promise.resolve(null);
  const match = cookieHeader.match(new RegExp(`(?:^|;)\\s*${COOKIE_NAME}=([^;]*)`));
  const value = match?.[1]?.trim();
  if (!value) return Promise.resolve(null);
  return decryptTokens(decodeURIComponent(value));
}

export function buildSetCookieHeader(encrypted: string): string {
  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const secure = baseUrl.startsWith("https://");
  const securePart = secure ? "; Secure" : "";
  return `${COOKIE_NAME}=${encodeURIComponent(encrypted)}; Path=/; HttpOnly${securePart}; SameSite=Lax; Max-Age=${maxAge}`;
}

/** リフレッシュトークンで新しいアクセストークンを取得する。 */
export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Missing Google OAuth env vars");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token refresh failed: ${res.status} ${err}`);
  }
  const data = (await res.json()) as { access_token: string };
  return { access_token: data.access_token, refresh_token: refreshToken };
}
