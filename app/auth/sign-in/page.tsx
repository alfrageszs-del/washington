"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabase/client";
import { makeLocalEmail } from "../../../lib/auth/makeLocalEmail";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [staticId, setStaticId] = useState("");
  const [password, setPassword] = useState("");
  const [info, setInfo] = useState("");
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfo("");
    const email = makeLocalEmail(staticId);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setInfo(error.message); return; }
    router.push("/account");
  };

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-bold">Войти</h1>
      <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
        <label className="block">
          <span className="mb-1 block text-sm">Static ID</span>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            value={staticId}
            onChange={(e)=>setStaticId(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm">Пароль</span>
          <input
            type="password"
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Войти
        </button>
      </form>
      {info && <p className="text-sm text-gray-700">{info}</p>}
    </div>
  );
}
