import { Suspense } from "react";
import SignInClient from "./SignInClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div className="px-4 py-8">Загрузка…</div>}>
      <SignInClient />
    </Suspense>
  );
}
