// app/auth/sign-in/page.tsx
"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [info, setInfo] = useState<string>("");
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfo("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setInfo(error.message); return; }
    router.push("/account");
  };

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-bold">Войти</h1>
      <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border bg-white p-5">
        <label className="block">
          <span className="text-sm">Email</span>
          <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="input" />
        </label>
        <label className="block">
          <span className="text-sm">Пароль</span>
          <input required type="password" value={password} onChange={e=>setPassword(e.target.value)} className="input" />
        </label>
        <button type="submit" className="btn-primary w-full">Войти</button>
      </form>
      {info && <p className="text-sm text-gray-700">{info}</p>}
    </div>
  );
}
