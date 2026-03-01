import { SignupPage } from "@/views";

export const metadata = { title: "新規登録 - HypoFrame" };

/** /signup ルート。新規登録画面は SignupPage に委譲。 */
export default function SignupRoute() {
  return <SignupPage />;
}
