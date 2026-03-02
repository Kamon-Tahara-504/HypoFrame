import { Suspense } from "react";
import { HomePage } from "@/views";
import LoadingFallback from "@/components/LoadingFallback";

/** ルート / 。仮説生成ホーム（新規チャット）。useSearchParams 利用のため Suspense でラップ。 */
export default function RootPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <HomePage />
    </Suspense>
  );
}
