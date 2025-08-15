"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  supabase,
  type Profile,
  type Faction,
  FactionLabel,
} from "../../lib/supabase/client";

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [nickname, setNickname] = useState("");
  const [staticId, setStaticId] = useState("");
  const [discord, setDiscord] = useState("");
  const [faction, setFaction] = useState<Faction>("CIVILIAN");

  useEffect(() => {
    let alive = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      const session = data.session;
      if (!session?.user) {
        router.replace("/auth/sign-in?next=/account");
        return;
      }

      setUserId(session.user.id);

      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (p) {
        const pr = p as Profile;
        setNickname(pr.nickname ?? "");
        setStaticId(pr.static_id ?? "");
        setDiscord(pr.discord ?? "");
        setFaction(pr.faction ?? "CIVILIAN");
      }

      setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, [router]);

  const onSave = async () => {
    if (!userId) return;
    await supabase.from("profiles").upsert({
      id: userId,
      nickname: nickname.trim(),
      static_id: staticId.trim(),
      discord: discord.trim() || null,
      faction,
    });
    alert("Сохранено");
  };

  if (loading) return <p className="px-4 py-6">Загрузка…</p>;
  if (!userId) return null;

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
      <h1 className="text-2xl font-bold">Мой профиль</h1>

      <div className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
        <label className="block">
          <span className="mb-1 block text-sm">Nick name</span>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm">Static ID</span>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            value={staticId}
            onChange={(e) => setStaticId(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm">Discord</span>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            value={discord}
            onChange={(e) => setDiscord(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm">Фракция</span>
          <select
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            value={faction}
            onChange={(e) => setFaction(e.target.value as Faction)}
          >
            {Object.entries(FactionLabel).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <div className="pt-2">
          <button
            onClick={onSave}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
