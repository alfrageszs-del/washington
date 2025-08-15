"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  supabase,
  type Faction,
  FactionLabel,
} from "../../../lib/supabase/client";

function technicalEmail(staticId: string) {
  const clean = staticId.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "_");
  return `static_${clean}@washington.local`;
}

export default function SignUpClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/account";

  const [staticId, setStaticId] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [discord, setDiscord] = useState("");
  const [faction, setFaction] = useState<Faction>("CIVILIAN");
  const [info, setInfo] = useState("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInfo("");

    if (!staticId || !password) {
      setInfo("Static ID и пароль обязательны.");
      return;
    }

    const email = technicalEmail(staticId);

    // Создаём пользователя
    const { data: sign, error: signErr } = await supabase.auth.signUp({ email, password });
    if (signErr) {
      setInfo(signErr.message);
      return;
    }
    const user = sign.user;
    if (!user) {
      setInfo("Не удалось создать пользователя (в Supabase включено подтверждение e-mail?).");
      return;
    }

    // Профиль
    await supabase.from("profiles").upsert({
      id: user.id,
      nickname: nickname.trim() || staticId.trim(),
      static_id: staticId.trim(),
      discord: discord.trim() || null,
      faction,
    });

    router.replace(next);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">Регистрация</h1>

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

        <label className="block">
          <span className="mb-1 block text-sm">Nick name</span>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Можно оставить пустым"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm">Discord</span>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={discord}
            onChange={(e) => setDiscord(e.target.value)}
            placeholder="@user#0000 (по желанию)"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm">Фракция</span>
          <select
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={faction}
            onChange={(e) => setFaction(e.target.value as Faction)}
          >
            {Object.entries(FactionLabel).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>

        {info && <p className="text-sm text-red-600">{info}</p>}

        <button
          type="submit"
          className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Зарегистрироваться
        </button>
      </form>
    </div>
  );
}
