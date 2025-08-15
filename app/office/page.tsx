"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import type { Appointment, AppointmentStatus, Department, Profile } from "../../lib/supabase/client";
import { DepartmentLabel } from "../../lib/supabase/client";

const statuses: AppointmentStatus[] = ["PENDING","APPROVED","REJECTED","DONE","CANCELLED"];

export default function OfficeCabinet() {
  const [me, setMe] = useState<Profile | null>(null);
  const [rows, setRows] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState("");

  const myDept: Department | null = useMemo(()=> me?.office_role ?? null, [me]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) { setMe(null); setLoading(false); return; }
      const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      setMe((data ?? null) as Profile | null);
      setLoading(false);
    })();
  }, []);

  const load = async () => {
    if (!myDept) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("department", myDept)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) { setInfo(error.message); setLoading(false); return; }
    setRows((data ?? []) as Appointment[]);
    setLoading(false);
  };

  useEffect(() => { if (myDept) void load(); }, [myDept]);

  const setStatus = async (id: string, s: AppointmentStatus) => {
    const { error } = await supabase.from("appointments").update({ status: s }).eq("id", id);
    if (error) { setInfo(error.message); return; }
    setRows(prev => prev.map(r => r.id === id ? { ...r, status: s } : r));
  };

  if (!myDept) {
    return <div className="mx-auto max-w-3xl px-4 py-6">У вас не назначен кабинет (office_role). Обратитесь к тех. администратору.</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Кабинет: {DepartmentLabel[myDept]}</h1>
        <button onClick={load} className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-black">Обновить</button>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500">
            <tr>
              <th className="py-2 pl-4">Тема</th>
              <th className="py-2">Когда (жел.)</th>
              <th className="py-2">Статус</th>
              <th className="py-2 pr-4 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t">
                <td className="py-2 pl-4">{r.subject}</td>
                <td className="py-2">{r.preferred_datetime ? new Date(r.preferred_datetime).toLocaleString() : "—"}</td>
                <td className="py-2">{r.status}</td>
                <td className="py-2 pr-4 text-right">
                  <select value={r.status} onChange={(e)=>setStatus(r.id, e.target.value as AppointmentStatus)} className="rounded-md border px-2 py-1">
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {rows.length===0 && <tr><td className="py-6 text-center text-gray-500" colSpan={4}>Нет записей</td></tr>}
          </tbody>
        </table>
      </div>
      {info && <p className="text-sm text-gray-700">{info}</p>}
    </div>
  );
}
