"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabase/client";
import type { Faction } from "../../../lib/supabase/client";
import { makeLocalEmail } from "../../../lib/auth/makeLocalEmail";
import { useRouter } from "next/navigation";

const factions: Faction[] = ["CIVILIAN","FIB","LSPD","LSCSD","EMS","WN","SANG","GOV","JUDICIAL"];

export default function SignUpPage() {
  const [nickname, setNickname] = useState("");
  const [staticId, setStaticId] = useState("");
  const [discord, setDiscord] = useState("");
  const [faction, setFaction] = useState<Faction>("CIVILIAN");
  const [password, setPassword] = useState("");
  const [info, setInfo] = useState("");
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfo("");

    if (!/^\S{3,}$/.test(nickname)) { setInfo("Ник минимум 3 символа."); return; }
    if (!/^\S+$/.test(staticId)) { setInfo("Static ID обязателен."); return; }
    if (password.length < 6) { setInfo("Пароль минимум 6 символов."); return; }

    const email = makeLocalEmail(staticId);

    // 1) регистрация в Supabase (служебный e-mail)
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: undefined }, // нам не нужны письма
    });
    if (signUpErr || !signUpData.user) {
      setInfo(signUpErr?.message ?? "Не удалось создать пользователя");
      return;
    }

    // 2) профиль
    const { error: upsertErr } = await supabase.from("profiles").upsert({
      id: signUpData.user.id,
      nickname,
      static_id: staticId,
      faction,
      discord,
    });
    if (upsertErr) { setInfo(upsertErr.message); return; }

    router.push("/account");
  };

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-bold">Регистрация</h1>
      <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
        <label className="block">
          <span className="mb-1 block text-sm">Nick name в игре</span>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            value={nickname}
            onChange={(e)=>setNickname(e.target.value)}
            placeholder="John_Doe"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm">Static ID в игре</span>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            value={staticId}
            onChange={(e)=>setStaticId(e.target.value)}
            placeholder="12345"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm">Discord</span>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            value={discord}
            onChange={(e)=>setDiscord(e.target.value)}
            placeholder="@username или username#0001"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm">Фракция</span>
          <select
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            value={faction}
            onChange={(e)=>setFaction(e.target.value as Faction)}
          >
            {factions.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm">Пароль</span>
          <input
            type="password"
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            placeholder="минимум 6 символов"
            required
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Создать аккаунт
        </button>
      </form>
      {info && <p className="text-sm text-gray-700">{info}</p>}
    </div>
  );
}
