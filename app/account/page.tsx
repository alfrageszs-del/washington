// app/account/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import type { Profile, Faction } from "../../lib/supabase/client";

const factions: Faction[] = ["CIVILIAN","FIB","LSPD","LSCSD","EMS","WN","SANG"];

export default function AccountPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [info, setInfo] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!user) { setLoading(false); return; }
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
      setProfile(data as Profile);
      setLoading(false);
    })();

    return () => { mounted = false; };
  }, []);

  const save = async () => {
    if (!profile) return;
    setInfo("");
    const { error } = await supabase
      .from("profiles")
      .update({
        nickname: profile.nickname,
        static_id: profile.static_id,
        faction: profile.faction,
      })
      .eq("id", profile.id);

    if (error) { setInfo(error.message); return; }
    setInfo("Сохранено");
  };

  if (loading) return <p>Загрузка…</p>;
  if (!profile) return <p>Не авторизован</p>;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">Мой профиль</h1>
      <div className="space-y-3 rounded-2xl border bg-white p-5">
        <label className="block">
          <span className="text-sm">Nick name</span>
          <input
            className="input"
            value={profile.nickname}
            onChange={e=>setProfile({ ...profile, nickname: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-sm">Static ID</span>
          <input
            className="input"
            value={profile.static_id}
            onChange={e=>setProfile({ ...profile, static_id: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-sm">Фракция</span>
          <select
            className="input"
            value={profile.faction}
            onChange={e=>setProfile({ ...profile, faction: e.target.value as Faction })}
          >
            {factions.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Роль: {profile.gov_role}{profile.is_verified ? " (верифицирован)" : ""}
          </span>
          <button onClick={save} className="btn-primary">Сохранить</button>
        </div>
      </div>
      {info && <p className="text-sm text-gray-700">{info}</p>}
    </div>
  );
}
