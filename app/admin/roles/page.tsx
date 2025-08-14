"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase/client";
import type { Profile, Faction, GovRole } from "../../../lib/supabase/client";
import { FactionLabel } from "../../../lib/supabase/client";

const govRoles: GovRole[] = ["NONE","PROSECUTOR","JUDGE","TECH_ADMIN"];

export default function AdminRolesPage() {
  const [me, setMe] = useState<Profile | null>(null);
  const [q, setQ] = useState<string>("");
  const [rows, setRows] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [info, setInfo] = useState<string>("");

  // Проверяем, что я тех.админ
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setMe(null); setLoading(false); return; }
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      setMe((data ?? null) as Profile | null);
      setLoading(false);
    })();
  }, []);

  const canSee = useMemo(() => me?.gov_role === "TECH_ADMIN", [me]);

  const search = async () => {
    setInfo("");
    if (!q.trim()) { setRows([]); return; }
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .or(`nickname.ilike.%${q}%,static_id.ilike.%${q}%`)
      .limit(50);
    if (error) { setInfo(error.message); return; }
    setRows((data ?? []) as Profile[]);
  };

  const save = async (p: Profile) => {
    setInfo("");
    const { error } = await supabase
      .from("profiles")
      .update({
        faction: p.faction,
        gov_role: p.gov_role,
        is_verified: p.is_verified,
      })
      .eq("id", p.id);
    if (error) { setInfo(error.message); return; }
    setInfo("Сохранено");
  };

  if (loading) return <p>Загрузка…</p>;
  if (!canSee) return <p>Доступ запрещён (нужна роль TECH_ADMIN).</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-2xl font-bold">Назначение ролей и верификация</h1>

      <div className="rounded-2xl border bg-white p-4">
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            placeholder="Поиск по nickname или Static ID"
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <button onClick={search} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Найти
          </button>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="rounded-2xl border bg-white p-4">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="py-2">Nick</th>
                <th className="py-2">Static ID</th>
                <th className="py-2">Фракция</th>
                <th className="py-2">Роль</th>
                <th className="py-2">Вериф.</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="py-2">{r.nickname}</td>
                  <td className="py-2">{r.static_id}</td>
                  <td className="py-2">
                    <select
                      value={r.faction}
                      onChange={(e)=>setRows(prev=>prev.map(x=>x.id===r.id?{...x,faction:e.target.value as Faction}:x))}
                      className="rounded-md border px-2 py-1"
                    >
                      {Object.entries(FactionLabel).map(([val,label])=>(
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2">
                    <select
                      value={r.gov_role}
                      onChange={(e)=>setRows(prev=>prev.map(x=>x.id===r.id?{...x,gov_role:e.target.value as GovRole}:x))}
                      className="rounded-md border px-2 py-1"
                    >
                      {govRoles.map(g=> <option key={g} value={g}>{g}</option>)}
                    </select>
                  </td>
                  <td className="py-2">
                    <input
                      type="checkbox"
                      checked={r.is_verified}
                      onChange={(e)=>setRows(prev=>prev.map(x=>x.id===r.id?{...x,is_verified:e.target.checked}:x))}
                    />
                  </td>
                  <td className="py-2 text-right">
                    <button onClick={()=>save(r)} className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-black">
                      Сохранить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {info && <p className="text-sm text-gray-700">{info}</p>}
    </div>
  );
}
