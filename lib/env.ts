/**
 * サーバー用の環境変数ヘルパー。
 * process.env を参照するため、API Route や Server Component からのみ import すること。
 */
export function getAppBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";
}
