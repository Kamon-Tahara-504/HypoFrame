import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "HypoFrame",
  description: "営業仮説の構造化ツール",
};

/** 初回描画前に html に theme 用 class を付け、フラッシュを防ぐ */
const themeScript = `
(function() {
  try {
    var s = localStorage.getItem('hypoframe-theme');
    if (s === 'dark') { document.documentElement.classList.add('dark'); document.documentElement.classList.remove('light'); }
    else if (s === 'light') { document.documentElement.classList.add('light'); document.documentElement.classList.remove('dark'); }
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) { document.documentElement.classList.add('dark'); document.documentElement.classList.remove('light'); }
    else { document.documentElement.classList.add('light'); document.documentElement.classList.remove('dark'); }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen font-display">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
