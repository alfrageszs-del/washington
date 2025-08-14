// app/auth/sign-up/page.tsx
"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabase/client";
import type { Faction } from "../../../lib/supabase/client";

const factions: Faction[] = ["CIVILIAN","FIB","LSPD","LSCSD","EMS","WN","SANG"];

export default function SignUpPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [nickname, setNickname] = useState<string>("");
  const [staticId, setStaticId] = useState<string>("");
  const [faction, setFaction] = useState<Faction>("CIVILIAN");
  const [info, setInfo] = useState<string>("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfo("");

    // 1) Создаём юзера
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signUpErr || !signUpData.user) {
      setInfo(signUpErr?.message ?? "Не удалось создать пользователя");
      return;
    }

    // 2) Создаём профиль (если таблица profiles не создана — покажем подсказку)
    const { error: upsertErr } = await supabase.from("profiles").upsert({
      id: signUpData.user.id,
      nickname,
      static_id: staticId,
      faction,
    });
    if (upsertErr) {
      // Частый случай — таблица profiles отсутствует: напомним про SQL из шага 2
      if (upsertErr.message.includes("relation") && upsertErr.message.includes("does not exist")) {
        setInfo("Таблица profiles отсутствует. Выполни SQL из шага 2 (создание типов/таблиц/RLS) в Supabase.");
      } else {
        setInfo(upsertErr.message);
      }
      return;
    }

    setInfo("Аккаунт создан. Теперь можно войти.");
  };

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-bold">Регистрация</h1>
      <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border bg-white p-5">
        <label className="block">
          <span className="text-sm">Email</span>
          <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="input" />
        </label>
        <label className="block">
          <span className="text-sm">Пароль</span>
          <input required type="password" value={password} onChange={e=>setPassword(e.target.value)} className="input" />
        </label>
        <label className="block">
          <span className="text-sm">Nick name в игре</span>
          <input required value={nickname} onChange={e=>setNickname(e.target.value)} className="input" />
        </label>
        <label className="block">
          <span className="text-sm">Static ID в игре</span>
          <input required value={staticId} onChange={e=>setStaticId(e.target.value)} className="input" />
        </label>
        <label className="block">
          <span className="text-sm">Фракция</span>
          <select value={faction} onChange={e=>setFaction(e.target.value as Faction)} className="input">
            {factions.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>
        <button type="submit" className="btn-primary w-full">Создать аккаунт</button>
      </form>
      {info && <p className="text-sm text-gray-700">{info}</p>}
    </div>
  );
}
