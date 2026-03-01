/** URL からドメインを取得（ファビコン用） */
export function getDomainForFavicon(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/** ドメイン用のファビコンURL（Google のサービス利用） */
export function getFaviconUrl(domain: string | null): string | null {
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
}
