"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase/client";
import type { Profile, VerificationRequest, VerificationStatus, Faction } from "../../../lib/supabase/client";
import { FactionLabel } from "../../../lib/supabase/client";

type VerRow = VerificationRequest & { author?: Pick<Profile,"id"|"nickname"|"discord"> };

function factionOfLeader(l?: Profile["leader_role"]): Faction | null {
  switch (l) {
    case "GOVERNOR": return "GOV";
    case "DIRECTOR_WN": return "WN";
    case "DIRECTOR_FIB": return "FIB";
    case "CHIEF_LSPD": return "LSPD";
    case "SHERIFF_LSCSD": return "LSCSD";
    case "CHIEF_EMS": return "EMS";
    case "COLONEL_SANG": return "SANG";
    default: return null;
  }
}

export default function FactionLeadersPanel() {
  const [me, setMe] = useState<Profile | null>(null);
  const [rows, setRows] = useState<VerRow[]>([]);
  const [info, setInfo] = useState("");

  const myFaction = useMemo(()=> factionOfLeader(me?.leader_role), [me]);
  const canSee   = useMemo(()=> !!myFaction || me?.gov_role === "TECH_ADMIN", [myFaction, me]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) { setMe(null); return; }
      const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      setMe((data ?? null) as Profile | null);
    })();
  }, []);

  const load = async () => {
    if (!canSee) return;
    setInfo("");
    let q = supabase.from("verification_requests").select("*").eq("kind","FACTION_MEMBER").eq("status","PENDING").order("created_at",{ascending:false}).limit(300);
    if (myFaction) q = q.eq("target_faction", myFaction);
    const { data } = await q;
    const ids = Array.from(new Set((data ?? []).map(v=>v.created_by)));
    const map = new Map<string, Pick<Profile,"id"|"nickname"|"discord">>();
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id,nickname,discord").in("id", ids);
      (profs ?? []).forEach((p:any)=> map.set(p.id, { id:p.id, nickname:p.nickname, discord:p.discord }));
    }
    setRows(((data ?? []) as VerificationRequest[]).map(v=>({ ...(v as any), author: map.get(v.created_by) })));
  };

  useEffect(() => { if (canSee) void load(); }, [canSee, myFaction]);

  const setReqStatus = async (id: string, s: VerificationStatus) => {
    await supabase.from("verification_requests").update({ status: s }).eq("id", id);
  };

  const approve = async (v: VerRow) => {
    if (!v.target_faction) return;
    await setReqStatus(v.id, "APPROVED");
    await supabase.from("profiles").update({ faction: v.target_faction, is_verified: true }).eq("id", v.created_by);
    setRows(prev => prev.filter(x => x.id !== v.id));
  };
  const reject = async (v: VerRow) => {
    await setReqStatus(v.id, "REJECTED");
    setRows(prev => prev.filter(x => x.id !== v.id));
  };

  if (!canSee) return <div className="mx-auto max-w-4xl px-4 py-6">Доступ только для лидеров фракций (или TECH_ADMIN).</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Панель лидера фракции</h1>
        {myFaction && <div className="text-sm text-gray-600">Ваша фракция: <span className="font-medium">{FactionLabel[myFaction]}</span></div>}
        <button onClick={load} className="ml-auto rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-black">Обновить</button>
      </div>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">Запросы на вступление</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500">
            <tr>
              <th className="py-2">Ник</th>
              <th className="py-2">Discord</th>
              <th className="py-2">Фракция</th>
              <th className="py-2">Комментарий</th>
              <th className="py-2 text-right">Действие</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(v=>(
              <tr key={v.id} className="border-t">
                <td className="py-2">{v.author?.nickname ?? "—"}</td>
                <td className="py-2">{v.author?.discord ?? "—"}</td>
                <td className="py-2">{v.target_faction ? FactionLabel[v.target_faction as Faction] : "—"}</td>
                <td className="py-2">{v.comment ?? "—"}</td>
                <td className="py-2 text-right space-x-2">
                  <button onClick={()=>approve(v)} className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">Одобрить</button>
                  <button onClick={()=>reject(v)}  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">Отклонить</button>
                </td>
              </tr>
            ))}
            {rows.length===0 && <tr><td className="py-6 text-center text-gray-500" colSpan={5}>Нет запросов</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}
