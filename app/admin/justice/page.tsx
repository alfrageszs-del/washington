"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase/client";
import type { Profile, VerificationRequest, VerificationStatus } from "../../../lib/supabase/client";

type VerRow = VerificationRequest & { author?: Pick<Profile,"id"|"nickname"|"discord"> };

export default function JusticePanel() {
  const [me, setMe] = useState<Profile | null>(null);
  const [prosecutors, setProsecutors] = useState<VerRow[]>([]);
  const [judges, setJudges] = useState<VerRow[]>([]);
  const [info, setInfo] = useState("");

  const canAG  = useMemo(()=> me?.gov_role === "TECH_ADMIN" || me?.gov_role === "ATTORNEY_GENERAL", [me]);
  const canCJ  = useMemo(()=> me?.gov_role === "TECH_ADMIN" || me?.gov_role === "CHIEF_JUSTICE", [me]);
  const canSee = useMemo(()=> canAG || canCJ, [canAG, canCJ]);

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
    setInfo("");
    // тянем нужные заявки только в статусе PENDING
    const [pRes, jRes] = await Promise.all([
      canAG ? supabase.from("verification_requests").select("*").eq("kind","PROSECUTOR").eq("status","PENDING").order("created_at",{ascending:false}) : Promise.resolve({ data: [] }),
      canCJ ? supabase.from("verification_requests").select("*").eq("kind","JUDGE").eq("status","PENDING").order("created_at",{ascending:false}) : Promise.resolve({ data: [] }),
    ]);

    // подтянем авторов
    const all = [ ...(pRes.data ?? []), ...(jRes.data ?? []) ] as VerificationRequest[];
    const ids = Array.from(new Set(all.map(v=>v.created_by)));
    const map = new Map<string, Pick<Profile,"id"|"nickname"|"discord">>();
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id,nickname,discord").in("id", ids);
      (profs ?? []).forEach((p:any)=> map.set(p.id, { id:p.id, nickname:p.nickname, discord:p.discord }));
    }

    setProsecutors((pRes.data ?? []).map(v=>({ ...(v as any), author: map.get(v.created_by) })));
    setJudges((jRes.data ?? []).map(v=>({ ...(v as any), author: map.get(v.created_by) })));
  };

  useEffect(() => { if (canSee) void load(); }, [canSee]);

  const setReqStatus = async (id: string, s: VerificationStatus) => {
    await supabase.from("verification_requests").update({ status: s }).eq("id", id);
  };

  const approveProsecutor = async (v: VerRow) => {
    await setReqStatus(v.id, "APPROVED");
    await supabase.from("profiles").update({ gov_role: "PROSECUTOR", is_verified: true }).eq("id", v.created_by);
    setProsecutors(prev => prev.filter(x => x.id !== v.id));
  };
  const rejectProsecutor = async (v: VerRow) => {
    await setReqStatus(v.id, "REJECTED");
    setProsecutors(prev => prev.filter(x => x.id !== v.id));
  };

  const approveJudge = async (v: VerRow) => {
    await setReqStatus(v.id, "APPROVED");
    await supabase.from("profiles").update({ gov_role: "JUDGE", is_verified: true }).eq("id", v.created_by);
    setJudges(prev => prev.filter(x => x.id !== v.id));
  };
  const rejectJudge = async (v: VerRow) => {
    await setReqStatus(v.id, "REJECTED");
    setJudges(prev => prev.filter(x => x.id !== v.id));
  };

  const verifyAccount = async (profileId: string, val: boolean) => {
    await supabase.from("profiles").update({ is_verified: val }).eq("id", profileId);
  };

  if (!canSee) return <div className="mx-auto max-w-4xl px-4 py-6">Доступ запрещён (нужна роль Генпрокурора/Председателя ВС или TECH_ADMIN).</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Панель юстиции</h1>
        <button onClick={load} className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-black">Обновить</button>
      </div>

      {canAG && (
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">Запросы: Прокуроры</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500"><tr><th className="py-2">Ник</th><th className="py-2">Discord</th><th className="py-2">Комментарий</th><th className="py-2 text-right">Действие</th></tr></thead>
            <tbody>
            {prosecutors.map(v=>(
              <tr key={v.id} className="border-t">
                <td className="py-2">{v.author?.nickname ?? "—"}</td>
                <td className="py-2">{v.author?.discord ?? "—"}</td>
                <td className="py-2">{v.comment ?? "—"}</td>
                <td className="py-2 text-right space-x-2">
                  <button onClick={()=>approveProsecutor(v)} className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">Одобрить</button>
                  <button onClick={()=>rejectProsecutor(v)} className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">Отклонить</button>
                  <button onClick={()=>verifyAccount(v.created_by, true)} className="rounded-md bg-gray-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800">Вериф. аккаунт</button>
                </td>
              </tr>
            ))}
            {prosecutors.length===0 && <tr><td className="py-4 text-center text-gray-500" colSpan={4}>Нет запросов</td></tr>}
            </tbody>
          </table>
        </section>
      )}

      {canCJ && (
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">Запросы: Судьи</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500"><tr><th className="py-2">Ник</th><th className="py-2">Discord</th><th className="py-2">Комментарий</th><th className="py-2 text-right">Действие</th></tr></thead>
            <tbody>
            {judges.map(v=>(
              <tr key={v.id} className="border-t">
                <td className="py-2">{v.author?.nickname ?? "—"}</td>
                <td className="py-2">{v.author?.discord ?? "—"}</td>
                <td className="py-2">{v.comment ?? "—"}</td>
                <td className="py-2 text-right space-x-2">
                  <button onClick={()=>approveJudge(v)} className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">Одобрить</button>
                  <button onClick={()=>rejectJudge(v)} className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">Отклонить</button>
                  <button onClick={()=>verifyAccount(v.created_by, true)} className="rounded-md bg-gray-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800">Вериф. аккаунт</button>
                </td>
              </tr>
            ))}
            {judges.length===0 && <tr><td className="py-4 text-center text-gray-500" colSpan={4}>Нет запросов</td></tr>}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
