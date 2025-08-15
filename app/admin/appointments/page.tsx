"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase/client";
import type { Appointment, AppointmentStatus, Department, Profile } from "../../../lib/supabase/client";
import { DepartmentLabel } from "../../../lib/supabase/client";

const statuses: AppointmentStatus[] = ["PENDING","APPROVED","REJECTED","DONE","CANCELLED"];

export default function AdminApptsPage() {
  const [me, setMe] = useState<Profile | null>(null);
  const [dept, setDept] = useState<Department | "ALL">("ALL");
  const [rows, setRows] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [info, setInfo] = useState<string>("");

  const canSee = useMemo(() => me?.gov_role === "TECH_ADMIN", [me]);

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

  const load = async () => {
    setInfo("");
    setLoading(true);
    let q = supabase.from("appointments").select("*").order("created_at", { ascending: false });
    if (dept !== "ALL") {
      q = q.eq("department", dept);
    }
    const { data, error } = await q.limit(200);
    if (error) { setInfo(error.message); setLoading(false); return; }
    setRows((data ?? []) as Appointment[]);
    setLoading(false);
  };

  useEffect(() => { if (canSee) load(); }, [canSee, dept]);

  const setStatus = async (id: string, s: AppointmentStatus) => {
    const { error } = await supabase.from("appointments").update({ status: s }).eq("id", id);
    if (error) { setInfo(error.message); return; }
    setRows(prev => prev.map(r => r.id === id ? { ...r, status: s } : r));
  };

  if (loading && !canSee) return <p>Загрузка…</p>;
  if (!canSee) return <p>Доступ запрещён (нужна роль TECH_ADMIN).</p>;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">Заявки на приём (админ)</h1>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-white p-4">
        <select
          value={dept}
          onChange={(e)=>setDept(e.target.value as Department | "ALL")}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="ALL">Все подразделения</option>
          {Object.entries(DepartmentLabel).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <button onClick={load} className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-black">
          Обновить
        </button>
        {info && <span className="text-sm text-gray-700">{info}</span>}
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500">
            <tr>
              <th className="py-2 pl-4">Куда</th>
              <th className="py-2">Тема</th>
              <th className="py-2">Когда (жел.)</th>
              <th className="py-2">Статус</th>
              <th className="py-2 pr-4 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t">
                <td className="py-2 pl-4">{DepartmentLabel[r.department]}</td>
                <td className="py-2">{r.subject}</td>
                <td className="py-2">{r.preferred_datetime ? new Date(r.preferred_datetime).toLocaleString() : "—"}</td>
                <td className="py-2">{r.status}</td>
                <td className="py-2 pr-4 text-right">
                  <select
                    value={r.status}
                    onChange={(e)=>setStatus(r.id, e.target.value as AppointmentStatus)}
                    className="rounded-md border px-2 py-1"
                  >
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}