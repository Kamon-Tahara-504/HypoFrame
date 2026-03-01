import { Suspense } from "react";
import { HomePage } from "@/views";

/** ルート / 。仮説生成ホーム（新規チャット）。useSearchParams 利用のため Suspense でラップ。 */
export default function RootPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500">読み込み中...</div>}>
      <HomePage />
    </Suspense>
  );
}
