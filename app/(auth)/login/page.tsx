import { LoginPage } from "@/views";

export const metadata = { title: "ログイン - HypoFrame" };

/** /login ルート。ログイン画面は LoginPage に委譲。 */
export default function LoginRoute() {
  return <LoginPage />;
}
