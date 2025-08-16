// app/warrants/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import type {
  Profile, Warrant, WarrantStatus, WarrantType
} from "../../lib/supabase/client";
import { WarrantStatusLabel, WarrantTypeLabel } from "../../lib/supabase/client";

type Row = Warrant;

const wStatuses: WarrantStatus[] = ["ACTIVE","EXECUTED","REVOKED","EXPIRED"];
const wTypes: WarrantType[] = ["ARREST","SEARCH","SEIZURE","DETENTION"];

export default function WarrantsPage() {
  const [me, setMe] = useState<Profile | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<WarrantStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState("");

  // form
  const [sid, setSid] = useState("");
  const [name, setName] = useState("");
  const [wtype, setWtype] = useState<WarrantType>("ARREST");
  const [desc, setDesc] = useState("");
  const [expires, setExpires] = useState<number | "">(24); // часы, опц.

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
    let qy = supabase.from("warrants").select("*").order("issued_at", { ascending: false }).limit(300);
    if (q.trim()) {
      qy = qy.or(`subject_static_id.ilike.%${q}%,subject_name.ilike.%${q}%`);
    }
    if (status !== "ALL") qy = qy.eq("status", status);
    const { data, error } = await qy;
    if (error) setInfo(error.message);
    setRows((data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [q, status]);

  const createWarrant = async () => {
    setInfo("");
    if (!canIssue) { setInfo("Нет прав на создание ордеров"); return; }
    if (!sid.trim() || !name.trim() || !desc.trim()) { setInfo("Заполните все поля"); return; }

    const expires_at =
      expires === "" ? null : new Date(Date.now() + Number(expires) * 3600 * 1000).toISOString();

    const { error } = await supabase.from("warrants").insert([{
      subject_static_id: sid.trim(),
      subject_name: name.trim(),
      issuer_faction: me?.faction ?? "GOV",
      warrant_type: wtype,
      description: desc.trim(),
      status: "ACTIVE",
      expires_at
    }]);
    if (error) { setInfo(error.message); return; }

    setSid(""); setName(""); setWtype("ARREST"); setDesc(""); setExpires(24);
    await load();
  };

  const setWStatus = async (id: string, s: WarrantStatus) => {
    setInfo("");
    const patch: Partial<Warrant> = { status: s };
    if (s === "EXECUTED") patch.executed_at = new Date().toISOString();
    if (s === "REVOKED") patch.revoked_at = new Date().toISOString();

    const { error } = await supabase.from("warrants").update(patch).eq("id", id);
    if (error) { setInfo(error.message); return; }
    await load();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Ордера</h1>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            placeholder="Поиск по Static ID или ФИО"
            className="w-72 rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <select value={status} onChange={(e)=>setStatus(e.target.value as any)} className="rounded-md border px-3 py-2 text-sm">
            <option value="ALL">Все статусы</option>
            {wStatuses.map(s => <option key={s} value={s}>{WarrantStatusLabel[s]}</option>)}
          </select>
          <button onClick={load} className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-black">
            Обновить
          </button>
        </div>
      </div>

      {canIssue && (
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Новый ордер</h2>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-6">
            <input value={sid} onChange={(e)=>setSid(e.target.value)} placeholder="Static ID" className="rounded-md border px-3 py-2 text-sm" />
            <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="ФИО (ник)" className="rounded-md border px-3 py-2 text-sm" />
            <select value={wtype} onChange={(e)=>setWtype(e.target.value as WarrantType)} className="rounded-md border px-3 py-2 text-sm">
              {wTypes.map(t => <option key={t} value={t}>{WarrantTypeLabel[t]}</option>)}
            </select>
            <input
              value={expires ?? ""}
              onChange={(e)=> setExpires(e.target.value === "" ? "" : Number(e.target.value))}
              type="number" min={0} placeholder="Срок (часы, опц.)"
              className="rounded-md border px-3 py-2 text-sm"
            />
            <input value={desc} onChange={(e)=>setDesc(e.target.value)} placeholder="Описание/основание" className="rounded-md border px-3 py-2 text-sm md:col-span-2" />
          </div>
          <div className="mt-3">
            <button onClick={createWarrant} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              Выдать ордер
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
                <th className="py-2">Тип</th>
                <th className="py-2">Описание</th>
                <th className="py-2">Статус</th>
                <th className="py-2">Срок</th>
                <th className="py-2 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="py-2">{r.subject_static_id}</td>
                  <td className="py-2">{r.subject_name}</td>
                  <td className="py-2">{r.issuer_faction}</td>
                  <td className="py-2">{WarrantTypeLabel[r.warrant_type]}</td>
                  <td className="py-2">{r.description}</td>
                  <td className="py-2"><span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs">{WarrantStatusLabel[r.status]}</span></td>
                  <td className="py-2">{r.expires_at ? new Date(r.expires_at).toLocaleString() : "—"}</td>
                  <td className="py-2 text-right space-x-2">
                    <button
                      onClick={()=>setWStatus(r.id,"EXECUTED")}
                      disabled={r.status !== "ACTIVE"}
                      className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Исполнен
                    </button>
                    <button
                      onClick={()=>setWStatus(r.id,"REVOKED")}
                      disabled={r.status !== "ACTIVE"}
                      className="rounded-md bg-gray-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                    >
                      Отозвать
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td className="py-6 text-center text-gray-500" colSpan={8}>Нет записей</td></tr>
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
