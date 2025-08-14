// app/account/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import type { Profile, Faction } from "../../lib/supabase/client";

const factions: Faction[] = ["CIVILIAN", "FIB", "LSPD", "LSCSD", "EMS", "WN", "SANG", "GOV","JUDICIAL"];

export default function AccountPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [info, setInfo] = useState<string>("");

  // локальные поля формы
  const [nickname, setNickname] = useState<string>("");
  const [staticId, setStaticId] = useState<string>("");
  const [discord, setDiscord] = useState<string>("");
  const [faction, setFaction] = useState<Faction>("CIVILIAN");
  const [govRole, setGovRole] = useState<Profile["gov_role"]>("NONE");
  const [isVerified, setIsVerified] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setInfo("");

      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user ?? null;
      if (!mounted) return;

      if (!user) {
        setUserId(null);
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        setInfo(error.message);
        setLoading(false);
        return;
      }

      if (data) {
        const p = data as Profile;
        setNickname(p.nickname);
        setStaticId(p.static_id);
        setDiscord(p.discord ?? "");   // ← читаем в локальный стейт
        setFaction(p.faction);
        setGovRole(p.gov_role);
        setIsVerified(p.is_verified);
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const onSave = async () => {
    setInfo("");
    if (!userId) { setInfo("Вы не авторизованы."); return; }
    if (nickname.trim().length < 3) { setInfo("Ник минимум 3 символа."); return; }
    if (staticId.trim().length === 0) { setInfo("Static ID обязателен."); return; }

    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      nickname: nickname.trim(),
      static_id: staticId.trim(),
      faction,
      discord: discord.trim() || null,  // ← пишем из локального стейта
    });

    if (error) { setInfo(error.message); return; }
    setInfo("Сохранено.");
  };

  if (loading) return <p className="text-sm text-gray-600">Загрузка…</p>;
  if (!userId) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Мой профиль</h1>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-700">
            Вы не авторизованы. Перейдите на{" "}
            <a href="/auth/sign-in" className="text-indigo-600 hover:underline">страницу входа</a>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">Мой профиль</h1>

      <div className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
        <label className="block">
          <span className="mb-1 block text-sm">Nick name</span>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="John_Doe"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm">Static ID</span>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            value={staticId}
            onChange={(e) => setStaticId(e.target.value)}
            placeholder="12345"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm">Discord</span>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            value={discord}
            onChange={(e) => setDiscord(e.target.value)}
            placeholder="@username или username#0001"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm">Фракция</span>
          <select
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            value={faction}
            onChange={(e) => setFaction(e.target.value as Faction)}
          >
            {factions.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-gray-500">
            Роль: {govRole}{isVerified ? " (верифицирован)" : ""}
          </span>
          <button
            onClick={onSave}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Сохранить
          </button>
        </div>
      </div>

      {info && <p className="text-sm text-gray-700">{info}</p>}
    </div>
  );
}
