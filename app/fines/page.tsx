// app/fines/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import type { Profile, Fine, FineStatus } from "../../lib/supabase/client";
import { FineStatusLabel } from "../../lib/supabase/client";

type Row = Fine;

const statuses: FineStatus[] = ["UNPAID", "PAID", "CANCELLED"];

export default function FinesPage() {
  const [me, setMe] = useState<Profile | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState("");

  // form
  const [sid, setSid] = useState("");         // offender static id
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState("");

  const canIssue = useMemo(
    () => !!me && (me.gov_role === "TECH_ADMIN" || me.gov_role === "PROSECUTOR" || me.gov_role === "JUDGE" || !!me.leader_role),
    [me]
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setMe(null); setRows([]); setLoading(false); return; }
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      setMe((data ?? null) as Profile | null);
      setLoading(false);
    })();
  }, []);

  const load = async () => {
    setLoading(true);
    let qy = supabase.from("fines").select("*").order("issued_at", { ascending: false }).limit(300);
    if (q.trim()) {
      qy = qy.or(`offender_static_id.ilike.%${q}%,offender_name.ilike.%${q}%`);
    }
    const { data, error } = await qy;
    if (error) setInfo(error.message);
    setRows((data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [q]);

  const createFine = async () => {
    setInfo("");
    if (!canIssue) { setInfo("Нет прав на создание штрафов"); return; }
    if (!sid.trim() || !name.trim() || !reason.trim() || !amount) { setInfo("Заполните все поля"); return; }

    const { error } = await supabase.from("fines").insert([{
      offender_static_id: sid.trim(),
      offender_name: name.trim(),
      issuer_faction: me?.faction ?? "GOV",
      amount: Math.max(0, Number(amount)),
      reason: reason.trim(),
      status: "UNPAID",
    }]);
    if (error) { setInfo(error.message); return; }

    setSid(""); setName(""); setAmount(0); setReason("");
    await load();
  };

  const setStatus = async (id: string, status: FineStatus) => {
    setInfo("");
    const patch: Partial<Fine> = { status };
    if (status === "PAID") patch.paid_at = new Date().toISOString();
    if (status !== "PAID") patch.paid_at = null;

    const { error } = await supabase.from("fines").update(patch).eq("id", id);
    if (error) { setInfo(error.message); return; }
    await load();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Штрафы</h1>
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            placeholder="Поиск по Static ID или ФИО"
            className="w-72 rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <button onClick={load} className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-black">
            Обновить
          </button>
        </div>
      </div>

      {canIssue && (
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Новый штраф</h2>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
            <input value={sid} onChange={(e)=>setSid(e.target.value)} placeholder="Static ID" className="rounded-md border px-3 py-2 text-sm" />
            <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="ФИО (ник)" className="rounded-md border px-3 py-2 text-sm" />
            <input type="number" min={0} value={amount} onChange={(e)=>setAmount(Number(e.target.value))} placeholder="Сумма" className="rounded-md border px-3 py-2 text-sm" />
            <input value={reason} onChange={(e)=>setReason(e.target.value)} placeholder="Основание" className="rounded-md border px-3 py-2 text-sm md:col-span-2" />
          </div>
          <div className="mt-3">
            <button onClick={createFine} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              Выписать
            </button>
          </div>
        </section>
      )}

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="py-2">Static ID</th>
                <th className="py-2">ФИО</th>
                <th className="py-2">Ведомство</th>
                <th className="py-2">Сумма</th>
                <th className="py-2">Основание</th>
                <th className="py-2">Статус</th>
                <th className="py-2 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="py-2">{r.offender_static_id}</td>
                  <td className="py-2">{r.offender_name}</td>
                  <td className="py-2">{r.issuer_faction}</td>
                  <td className="py-2">{r.amount}</td>
                  <td className="py-2">{r.reason}</td>
                  <td className="py-2">
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs">{FineStatusLabel[r.status]}</span>
                  </td>
                  <td className="py-2 text-right space-x-2">
                    <button
                      onClick={()=>setStatus(r.id,"PAID")}
                      disabled={r.status !== "UNPAID"}
                      className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Оплачен
                    </button>
                    <button
                      onClick={()=>setStatus(r.id,"CANCELLED")}
                      disabled={r.status !== "UNPAID"}
                      className="rounded-md bg-gray-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                    >
                      Отменить
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td className="py-6 text-center text-gray-500" colSpan={7}>Нет записей</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {info && <p className="text-sm text-gray-600">{info}</p>}
      {loading && <p className="text-sm text-gray-500">Загрузка…</p>}
    </div>
  );
}
