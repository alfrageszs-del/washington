// app/auth/sign-in/page.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";

function technicalEmail(staticId: string) {
  const clean = staticId.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "_");
  return `static_${clean}@washington.local`;
}

export default function SignInPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/account";

  const [staticId, setStaticId] = useState("");
  const [password, setPassword] = useState("");
  const [info, setInfo] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfo("");

    const email = technicalEmail(staticId);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setInfo(error.message);
      return;
    }
    router.replace(next);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">Вход</h1>

      <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
        <label className="block">
          <span className="mb-1 block text-sm">Static ID</span>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={staticId}
            onChange={(e) => setStaticId(e.target.value)}
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm">Пароль</span>
          <input
            type="password"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {info && <p className="text-sm text-red-600">{info}</p>}

        <button
          type="submit"
          className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Войти
        </button>
      </form>
    </div>
  );
}
