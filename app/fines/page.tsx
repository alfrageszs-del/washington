// app/fines/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import type { Profile } from "../../lib/supabase/client";

type Fine = {
  id: string;
  offender_static_id: string;
  offender_name: string;
  amount: number;
  reason: string;
  officer_id: string | null;
  officer_name: string | null;
  department: string | null;
  status: "active" | "paid" | "cancelled";
  due_date: string | null;
  created_at: string;
};

const statuses = ["active", "paid", "cancelled"] as const;

export default function FinesPage() {
  const [me, setMe] = useState<Profile | null>(null);
  const [rows, setRows] = useState<Fine[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState("");

  // form
  const [sid, setSid] = useState("");         // offender static id
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState("");

  const canIssue = useMemo(
    () => !!me && (me.gov_role === "TECH_ADMIN" || me.faction === "LSPD" || me.faction === "LSCSD" || me.faction === "FIB"),
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
    let qy = supabase.from("fines").select("*").order("created_at", { ascending: false }).limit(300);
    if (q.trim()) {
      qy = qy.or(`offender_static_id.ilike.%${q}%,offender_name.ilike.%${q}%`);
    }
    const { data, error } = await qy;
    if (error) setInfo(error.message);
    setRows((data ?? []) as Fine[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [q]);

  const createFine = async () => {
    setInfo("");
    if (!canIssue) { setInfo("Нет прав на создание штрафов"); return; }
    if (!sid.trim() || !name.trim() || !reason.trim() || !amount) { setInfo("Заполните все поля"); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setInfo("Вы не авторизованы"); return; }

    const { error } = await supabase.from("fines").insert([{
      offender_static_id: sid.trim(),
      offender_name: name.trim(),
      officer_id: user.id,
      officer_name: me?.nickname || "Неизвестно",
      department: me?.faction || "Неизвестно",
      amount: Math.max(0, Number(amount)),
      reason: reason.trim(),
      status: "active",
    }]);
    if (error) { setInfo(error.message); return; }

    setSid(""); setName(""); setAmount(0); setReason("");
    await load();
  };

  const setStatus = async (id: string, status: "active" | "paid" | "cancelled") => {
    setInfo("");
    const patch: Partial<Fine> = { status };

    const { error } = await supabase.from("fines").update(patch).eq("id", id);
    if (error) { setInfo(error.message); return; }
    await load();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Штрафы</h1>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Поиск по Static ID или ФИО"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <button
            onClick={load}
            className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Обновить
          </button>
        </div>
      </div>

      {info && <p className="text-sm text-red-600">{info}</p>}

      {canIssue && (
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Новый штраф</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              type="text"
              placeholder="Static ID"
              value={sid}
              onChange={(e) => setSid(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="ФИО"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              type="number"
              placeholder="Сумма"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Основание"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={createFine}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Создать штраф
          </button>
        </div>
      )}

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm font-medium text-gray-500">
                <th className="pb-3">Static ID</th>
                <th className="pb-3">ФИО</th>
                <th className="pb-3">Ведомство</th>
                <th className="pb-3">Сумма</th>
                <th className="pb-3">Основание</th>
                <th className="pb-3">Статус</th>
                <th className="pb-3">Действия</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b text-sm">
                  <td className="py-3">{row.offender_static_id}</td>
                  <td className="py-3">{row.offender_name}</td>
                  <td className="py-3">{row.department || "Неизвестно"}</td>
                  <td className="py-3">${row.amount}</td>
                  <td className="py-3">{row.reason}</td>
                  <td className="py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                      row.status === "active" ? "bg-yellow-100 text-yellow-800" :
                      row.status === "paid" ? "bg-green-100 text-green-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {row.status === "active" ? "Активен" :
                       row.status === "paid" ? "Оплачен" : "Отменен"}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex space-x-2">
                      {row.status === "active" && (
                        <>
                          <button
                            onClick={() => setStatus(row.id, "paid")}
                            className="rounded bg-green-100 px-2 py-1 text-xs text-green-700 hover:bg-green-200"
                          >
                            Оплачен
                          </button>
                          <button
                            onClick={() => setStatus(row.id, "cancelled")}
                            className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200"
                          >
                            Отменить
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              Нет записей
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
