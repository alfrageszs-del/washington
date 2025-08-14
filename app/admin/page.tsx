"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import type {
  Appointment,
  AppointmentStatus,
  Department,
  DepartmentLabel,
  Profile,
  VerificationRequest,
  VerificationStatus,
} from "../../lib/supabase/client";
import { DepartmentLabel as DLabel } from "../../lib/supabase/client";

type AppRow = Appointment & { author?: Pick<Profile, "id" | "nickname" | "discord"> };
type VerRow = VerificationRequest & { author?: Pick<Profile, "id" | "nickname" | "discord"> };

const statusOptions: AppointmentStatus[] = ["PENDING", "APPROVED", "REJECTED", "DONE", "CANCELLED"];

export default function AdminDashboard() {
  const [me, setMe] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [info, setInfo] = useState<string>("");

  // данные
  const [appointments, setAppointments] = useState<AppRow[]>([]);
  const [verAccount, setVerAccount] = useState<VerRow[]>([]);
  const [verRoles, setVerRoles] = useState<VerRow[]>([]);

  // фильтры
  const [apptDept, setApptDept] = useState<Department | "ALL">("ALL");
  const [showAllVer, setShowAllVer] = useState<boolean>(false); // иначе показываем только PENDING

  const isAdmin = useMemo(() => me?.gov_role === "TECH_ADMIN", [me]);

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

  // загрузка всего
  const loadAll = async () => {
    setInfo("");
    setLoading(true);

    // 1) Заявки на приём
    let apptQ = supabase.from("appointments").select("*").order("created_at", { ascending: false }).limit(300);
    if (apptDept !== "ALL") apptQ = apptQ.eq("department", apptDept);
    const { data: appts, error: apptErr } = await apptQ;
    if (apptErr) { setInfo(apptErr.message); setLoading(false); return; }

    // 2) Верификация аккаунта
    let verAccQ = supabase
      .from("verification_requests")
      .select("*")
      .eq("kind", "ACCOUNT")
      .order("created_at", { ascending: false })
      .limit(300);
    if (!showAllVer) verAccQ = verAccQ.eq("status", "PENDING");

    const { data: vAcc, error: vAccErr } = await verAccQ;
    if (vAccErr) { setInfo(vAccErr.message); setLoading(false); return; }

    // 3) Верификация роли (PROSECUTOR/JUDGE)
    let verRoleQ = supabase
      .from("verification_requests")
      .select("*")
      .in("kind", ["PROSECUTOR", "JUDGE"])
      .order("created_at", { ascending: false })
      .limit(300);
    if (!showAllVer) verRoleQ = verRoleQ.eq("status", "PENDING");

    const { data: vRole, error: vRoleErr } = await verRoleQ;
    if (vRoleErr) { setInfo(vRoleErr.message); setLoading(false); return; }

    // подтянем профили для created_by
    const allUserIds = Array.from(new Set([
      ...((appts ?? []).map(a => a.created_by)),
      ...((vAcc ?? []).map(v => v.created_by)),
      ...((vRole ?? []).map(v => v.created_by)),
    ]));

    let profilesMap = new Map<string, Pick<Profile, "id" | "nickname" | "discord">>();
    if (allUserIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,nickname,discord")
        .in("id", allUserIds);
      (profs ?? []).forEach((p: { id: string; nickname: string; discord: string | null }) => {
        profilesMap.set(p.id, { id: p.id, nickname: p.nickname, discord: p.discord });
      });
    }

    setAppointments((appts ?? []).map(a => ({ ...a, author: profilesMap.get(a.created_by) })));
    setVerAccount((vAcc ?? []).map(v => ({ ...v, author: profilesMap.get(v.created_by) })));
    setVerRoles((vRole ?? []).map(v => ({ ...v, author: profilesMap.get(v.created_by) })));

    setLoading(false);
  };

  useEffect(() => { if (isAdmin) loadAll(); }, [isAdmin, apptDept, showAllVer]);

  // ====== actions ======
  const setApptStatus = async (id: string, s: AppointmentStatus) => {
    const { error } = await supabase.from("appointments").update({ status: s }).eq("id", id);
    if (error) { setInfo(error.message); return; }
    setAppointments(prev => prev.map(r => r.id === id ? { ...r, status: s } : r));
  };

  const approveAccount = async (v: VerRow) => {
    // 1) approve request
    const { error: e1 } = await supabase.from("verification_requests")
      .update({ status: "APPROVED" })
      .eq("id", v.id);
    if (e1) { setInfo(e1.message); return; }

    // 2) set profile.is_verified = true
    const { error: e2 } = await supabase.from("profiles")
      .update({ is_verified: true })
      .eq("id", v.created_by);
    if (e2) { setInfo(e2.message); return; }

    setVerAccount(prev => prev.map(x => x.id === v.id ? { ...x, status: "APPROVED" } : x));
  };

  const rejectAccount = async (v: VerRow) => {
    const { error } = await supabase.from("verification_requests")
      .update({ status: "REJECTED" })
      .eq("id", v.id);
    if (error) { setInfo(error.message); return; }
    setVerAccount(prev => prev.map(x => x.id === v.id ? { ...x, status: "REJECTED" } : x));
  };

  const approveRole = async (v: VerRow) => {
    // 1) approve request
    const { error: e1 } = await supabase.from("verification_requests")
      .update({ status: "APPROVED" })
      .eq("id", v.id);
    if (e1) { setInfo(e1.message); return; }

    // 2) set profile.gov_role & is_verified = true
    const newRole = v.kind === "PROSECUTOR" ? "PROSECUTOR" : "JUDGE";
    const { error: e2 } = await supabase.from("profiles")
      .update({ gov_role: newRole, is_verified: true })
      .eq("id", v.created_by);
    if (e2) { setInfo(e2.message); return; }

    setVerRoles(prev => prev.map(x => x.id === v.id ? { ...x, status: "APPROVED" } : x));
  };

  const rejectRole = async (v: VerRow) => {
    const { error } = await supabase.from("verification_requests")
      .update({ status: "REJECTED" })
      .eq("id", v.id);
    if (error) { setInfo(error.message); return; }
    setVerRoles(prev => prev.map(x => x.id === v.id ? { ...x, status: "REJECTED" } : x));
  };

  // helpers
  const statusBadge = (s: AppointmentStatus | VerificationStatus) => {
    const cls =
      s === "APPROVED" ? "bg-green-100 text-green-700" :
      s === "REJECTED" ? "bg-red-100 text-red-700" :
      s === "DONE" ? "bg-gray-800 text-white" :
      s === "CANCELLED" ? "bg-gray-200 text-gray-700" :
      "bg-yellow-100 text-yellow-800"; // PENDING
    return <span className={`rounded-md px-2 py-0.5 text-xs ${cls}`}>{s}</span>;
  };

  if (loading && !isAdmin) return <p className="px-4 py-6">Загрузка…</p>;
  if (!isAdmin) return <p className="px-4 py-6">Доступ запрещён (нужна роль TECH_ADMIN).</p>;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Админ-панель</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={loadAll}
            className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-black"
          >
            Обновить
          </button>
          <span className="text-sm text-gray-700">{info}</span>
        </div>
      </div>

      {/* ===== Заявки на приём ===== */}
      <section className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Заявки на приём (все)</h2>
          <div className="flex items-center gap-2">
            <select
              value={apptDept}
              onChange={(e)=>setApptDept(e.target.value as Department | "ALL")}
              className="rounded-md border px-3 py-2 text-sm"
            >
              <option value="ALL">Все подразделения</option>
              {Object.entries(DLabel).map(([val,label])=>(
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="py-2">Гражданин</th>
                <th className="py-2">Discord</th>
                <th className="py-2">Куда</th>
                <th className="py-2">Тема</th>
                <th className="py-2">Желаемая дата</th>
                <th className="py-2">Статус</th>
                <th className="py-2 text-right">Действие</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="py-2">{r.author?.nickname ?? "—"}</td>
                  <td className="py-2">{r.author?.discord ?? "—"}</td>
                  <td className="py-2">{DLabel[r.department]}</td>
                  <td className="py-2">{r.subject}</td>
                  <td className="py-2">{r.preferred_datetime ? new Date(r.preferred_datetime).toLocaleString() : "—"}</td>
                  <td className="py-2">{statusBadge(r.status)}</td>
                  <td className="py-2 text-right">
                    <select
                      value={r.status}
                      onChange={(e)=>setApptStatus(r.id, e.target.value as AppointmentStatus)}
                      className="rounded-md border px-2 py-1"
                    >
                      {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr><td className="py-6 text-center text-gray-500" colSpan={7}>Нет записей</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== Запросы на верификацию аккаунта ===== */}
      <section className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Верификация аккаунта</h2>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showAllVer}
              onChange={(e)=>setShowAllVer(e.target.checked)}
            />
            показывать все статусы (не только PENDING)
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="py-2">Гражданин</th>
                <th className="py-2">Discord</th>
                <th className="py-2">Комментарий</th>
                <th className="py-2">Статус</th>
                <th className="py-2 text-right">Действие</th>
              </tr>
            </thead>
            <tbody>
              {verAccount.map(v => (
                <tr key={v.id} className="border-t">
                  <td className="py-2">{v.author?.nickname ?? "—"}</td>
                  <td className="py-2">{v.author?.discord ?? "—"}</td>
                  <td className="py-2">{v.comment ?? "—"}</td>
                  <td className="py-2">{statusBadge(v.status)}</td>
                  <td className="py-2 text-right space-x-2">
                    <button
                      onClick={()=>approveAccount(v)}
                      disabled={v.status !== "PENDING"}
                      className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >Одобрить</button>
                    <button
                      onClick={()=>rejectAccount(v)}
                      disabled={v.status !== "PENDING"}
                      className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >Отклонить</button>
                  </td>
                </tr>
              ))}
              {verAccount.length === 0 && (
                <tr><td className="py-6 text-center text-gray-500" colSpan={5}>Нет запросов</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== Запросы на верификацию роли ===== */}
      <section className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Верификация роли (прокурор/судья)</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="py-2">Гражданин</th>
                <th className="py-2">Discord</th>
                <th className="py-2">Запрошено</th>
                <th className="py-2">Статус</th>
                <th className="py-2 text-right">Действие</th>
              </tr>
            </thead>
            <tbody>
              {verRoles.map(v => (
                <tr key={v.id} className="border-t">
                  <td className="py-2">{v.author?.nickname ?? "—"}</td>
                  <td className="py-2">{v.author?.discord ?? "—"}</td>
                  <td className="py-2">{v.kind}</td>
                  <td className="py-2">{statusBadge(v.status)}</td>
                  <td className="py-2 text-right space-x-2">
                    <button
                      onClick={()=>approveRole(v)}
                      disabled={v.status !== "PENDING"}
                      className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >Одобрить</button>
                    <button
                      onClick={()=>rejectRole(v)}
                      disabled={v.status !== "PENDING"}
                      className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >Отклонить</button>
                  </td>
                </tr>
              ))}
              {verRoles.length === 0 && (
                <tr><td className="py-6 text-center text-gray-500" colSpan={5}>Нет запросов</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
