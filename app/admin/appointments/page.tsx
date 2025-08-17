// app/admin/appointments/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase/client";
import type {
  Appointment,
  AppointmentStatus,
  Department,
  Profile,
} from "../../../lib/supabase/client";
import { DepartmentLabel } from "../../../lib/supabase/client";

const statuses: AppointmentStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "DONE",
  "CANCELLED",
];

// спец-кейс для лидеров, у которых департамент можно вывести напрямую
const deptByLeaderRole: Record<string, Department> = {
  GOVERNOR: "GOVERNOR",
};

export default function AdminApptsPage() {
  const [me, setMe] = useState<Profile | null>(null);
  const [dept, setDept] = useState<Department | "ALL">("ALL");
  const [rows, setRows] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [info, setInfo] = useState<string>("");

  // профиль
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setMe(null); setLoading(false); return; }
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      setMe((data ?? null) as Profile | null);
      setLoading(false);
    })();
  }, []);

  const isAdmin   = useMemo(() => me?.gov_role === "TECH_ADMIN", [me]);
  const isLeader  = useMemo(() => !!me?.leader_role, [me]);
  const hasOffice = useMemo(() => !!me?.office_role, [me]);

  // пытаемся вычислить «свой» департамент для нелидеров/админов
  const myDept: Department | null = useMemo(() => {
    if (!me) return null;
    if (me.office_role) return me.office_role;                           // назначенный кабинет
    if (me.leader_role && deptByLeaderRole[me.leader_role]) {
      return deptByLeaderRole[me.leader_role];                           // напр. GOVERNOR -> GOVERNOR
    }
    return null;
  }, [me]);

  // Пускать: тех.админа, любого лидера и любого, у кого назначен кабинет
  const canSee = isAdmin || isLeader || hasOffice;

  const load = async () => {
    if (!canSee) return;

    setInfo("");
    setLoading(true);

    // базовый запрос
    let q = supabase
      .from("appointments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);

    if (isAdmin) {
      // админ — по фильтру
      if (dept !== "ALL") q = q.eq("department", dept);
    } else {
      // лидер/владелец кабинета — только своё
      if (!myDept) {
        // кабинета нет — ничего не показываем, но не режем доступ
        setRows([]);
        setLoading(false);
        return;
      }
      q = q.eq("department", myDept);
    }

    const { data, error } = await q;
    if (error) { setInfo(error.message); setLoading(false); return; }
    setRows((data ?? []) as Appointment[]);
    setLoading(false);
  };

  useEffect(() => {
    if (canSee) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSee, isAdmin, dept, myDept]);

  const setStatus = async (id: string, s: AppointmentStatus) => {
    const { error } = await supabase.from("appointments").update({ status: s }).eq("id", id);
    if (error) { setInfo(error.message); return; }
    setRows(prev => prev.map(r => (r.id === id ? { ...r, status: s } : r)));
  };

  if (loading && !canSee) return <p className="px-4 py-6">Загрузка…</p>;
  if (!canSee) {
    return (
      <p className="px-4 py-6">
        Доступ запрещён (нужна роль TECH_ADMIN или лидерская роль/назначенный кабинет).
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">
          Заявки на приём {isAdmin ? "(админ)" : "(моё подразделение)"}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-black"
          >
            Обновить
          </button>
          {info && <span className="text-sm text-gray-700">{info}</span>}
        </div>
      </div>

      {/* Блок фильтра: только админам */}
      {isAdmin ? (
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
        </div>
      ) : (
        <div className="rounded-2xl border bg-white p-4 text-sm text-gray-600">
          Подразделение:&nbsp;
          <span className="font-medium">
            {myDept ? DepartmentLabel[myDept] : "ещё не привязан кабинет (обратитесь к тех.админу)"}
          </span>
        </div>
      )}

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
                <td className="py-2">{r.position}</td>
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
            {rows.length === 0 && (
              <tr>
                <td className="py-6 text-center text-gray-500" colSpan={5}>
                  {myDept
                    ? "Нет записей"
                    : "Кабинет для вашей роли не назначен — заявки появятся после привязки кабинета."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
