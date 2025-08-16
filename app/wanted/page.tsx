// app/wanted/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import type { Profile } from "../../lib/supabase/client";

type Wanted = {
  id: string;
  target_static_id: string;
  target_name: string;
  reason: string;
  reward: number | null;
  department: string | null;
  status: "active" | "caught" | "cancelled";
  created_at: string;
};

const statuses = ["active", "caught", "cancelled"] as const;

export default function WantedPage() {
  const [me, setMe] = useState<Profile | null>(null);
  const [rows, setRows] = useState<Wanted[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("Все статусы");
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState("");

  // form
  const [sid, setSid] = useState("");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [reward, setReward] = useState<number>(0);

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
    let qy = supabase.from("warrants").select("*").order("created_at", { ascending: false }).limit(300);
    if (q.trim()) {
      qy = qy.or(`target_static_id.ilike.%${q}%,target_name.ilike.%${q}%`);
    }
    if (status !== "Все статусы") {
      qy = qy.eq("status", status.toLowerCase());
    }
    const { data, error } = await qy;
    if (error) setInfo(error.message);
    setRows((data ?? []) as Wanted[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [q, status]);

  const createWanted = async () => {
    setInfo("");
    if (!canIssue) { setInfo("Нет прав на создание ордеров"); return; }
    if (!sid.trim() || !name.trim() || !desc.trim()) { setInfo("Заполните все поля"); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setInfo("Вы не авторизованы"); return; }

    const { error } = await supabase.from("warrants").insert([{
      target_static_id: sid.trim(),
      target_name: name.trim(),
      reason: desc.trim(),
      reward: reward > 0 ? reward : null,
      department: me?.faction || "Неизвестно",
      status: "active",
    }]);
    if (error) { setInfo(error.message); return; }

    setSid(""); setName(""); setDesc(""); setReward(0);
    await load();
  };

  const setWStatus = async (id: string, s: "active" | "caught" | "cancelled") => {
    setInfo("");
    const patch: Partial<Wanted> = { status: s };

    const { error } = await supabase.from("warrants").update(patch).eq("id", id);
    if (error) { setInfo(error.message); return; }
    await load();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ордера</h1>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Поиск по Static ID или ФИО"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option>Все статусы</option>
            <option>Активные</option>
            <option>Пойманные</option>
            <option>Отмененные</option>
          </select>
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
          <h2 className="mb-4 text-lg font-semibold">Новый ордер</h2>
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
              placeholder="Награда (опционально)"
              value={reward || ""}
              onChange={(e) => setReward(Number(e.target.value))}
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Описание"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={createWanted}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Создать ордер
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
                <th className="pb-3">Тип</th>
                <th className="pb-3">Описание</th>
                <th className="pb-3">Статус</th>
                <th className="pb-3">Срок</th>
                <th className="pb-3">Действия</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b text-sm">
                  <td className="py-3">{row.target_static_id}</td>
                  <td className="py-3">{row.target_name}</td>
                  <td className="py-3">{row.department || "Неизвестно"}</td>
                  <td className="py-3">Ордер на арест</td>
                  <td className="py-3">{row.reason}</td>
                  <td className="py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                      row.status === "active" ? "bg-red-100 text-red-800" :
                      row.status === "caught" ? "bg-green-100 text-green-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {row.status === "active" ? "Активен" :
                       row.status === "caught" ? "Пойман" : "Отменен"}
                    </span>
                  </td>
                  <td className="py-3">-</td>
                  <td className="py-3">
                    <div className="flex space-x-2">
                      {row.status === "active" && (
                        <>
                          <button
                            onClick={() => setWStatus(row.id, "caught")}
                            className="rounded bg-green-100 px-2 py-1 text-xs text-green-700 hover:bg-green-200"
                          >
                            Пойман
                          </button>
                          <button
                            onClick={() => setWStatus(row.id, "cancelled")}
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
