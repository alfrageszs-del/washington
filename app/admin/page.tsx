// app/admin/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import type {
  Appointment,
  AppointmentStatus,
  Department,
  Profile,
  VerificationRequest,
  VerificationStatus,
} from "../../lib/supabase/client";
import { DepartmentLabel as DLabel } from "../../lib/supabase/client";

type AppRow = Appointment & { author?: Pick<Profile, "id" | "nickname" | "discord"> };
type VerRow = VerificationRequest & { author?: Pick<Profile, "id" | "nickname" | "discord"> };
type SimpleProfile = Pick<
  Profile,
  "id" | "nickname" | "static_id" | "discord" | "faction" | "gov_role" | "is_verified"
> & { created_at?: string | null };

/** Имена ролей-руководителей и высшего состава (должны совпадать с тем, что хранится в БД) */
type GovRoleKey =
  | "TECH_ADMIN"
  | "ATTORNEY_GENERAL"     // Генеральный прокурор
  | "CHIEF_JUSTICE"        // Председатель ВС
  | "GOVERNOR"             // Губернатор (Government leader)
  | "FIB_DIRECTOR"
  | "LSPD_CHIEF"
  | "LSCSD_SHERIFF"
  | "EMS_CHIEF"
  | "WN_DIRECTOR"
  | "SANG_COLONEL";

/** Маппинг лидера -> подразделение его юрисдикции (для фильтра заявок) */
// НЕ ТРОГАЕМ типы сверху, просто правим маппинг:
const deptByLeader: Partial<Record<GovRoleKey, Department>> = {
  GOVERNOR:      'GOV'   as Department,
  FIB_DIRECTOR:  'FIB'   as Department,
  LSPD_CHIEF:    'LSPD'  as Department,
  LSCSD_SHERIFF: 'LSCSD' as Department,
  EMS_CHIEF:     'EMS'   as Department,
  WN_DIRECTOR:   'WN'    as Department,
  SANG_COLONEL:  'SANG'  as Department,
};

const statusOptions: AppointmentStatus[] = ["PENDING", "APPROVED", "REJECTED", "DONE", "CANCELLED"];

export default function AdminDashboard() {
  const [me, setMe] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [info, setInfo] = useState<string>("");

  const [appointments, setAppointments] = useState<AppRow[]>([]);
  const [verAccount, setVerAccount] = useState<VerRow[]>([]);
  const [verRoles, setVerRoles] = useState<VerRow[]>([]);

  // списки для «пользователи/верифицированные» (оставил как было)
  const [verifiedRoles, setVerifiedRoles] = useState<SimpleProfile[]>([]);
  const [allUsers, setAllUsers] = useState<SimpleProfile[]>([]);
  const [q, setQ] = useState<string>("");

  // фильтры
  const [apptDept, setApptDept] = useState<Department | "ALL">("ALL");
  const [showAllVer, setShowAllVer] = useState<boolean>(false);

  // ---- ДОСТУП ----
  const myRole = (me?.gov_role ?? "") as GovRoleKey;

  const canTech = myRole === "TECH_ADMIN";
  const canAG   = myRole === "ATTORNEY_GENERAL"; // Генпрокурор
  const canCJ   = myRole === "CHIEF_JUSTICE";     // Председатель ВС

  // руководители ведомств (включая губернатора)
  const canLeader = useMemo(() => {
    return [
      "GOVERNOR",
      "FIB_DIRECTOR",
      "LSPD_CHIEF",
      "LSCSD_SHERIFF",
      "EMS_CHIEF",
      "WN_DIRECTOR",
      "SANG_COLONEL",
    ].includes(myRole);
  }, [myRole]);

  // кто вообще может войти в админ-панель
  const canEnter = canTech || canAG || canCJ || canLeader;

  // для лидера определяем его «своё» подразделение
  const myDept: Department | undefined = deptByLeader[myRole];

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

  const loadAll = async () => {
    setInfo("");
    setLoading(true);
    try {
      // ---- заявки на приём ----
      let apptQ = supabase.from("appointments").select("*").order("created_at", { ascending: false }).limit(300);

      // TECH_ADMIN — видит все и может выбирать отдел; остальные — только своё ведомство
      if (canTech) {
        if (apptDept !== "ALL") apptQ = apptQ.eq("department", apptDept);
      } else if (canLeader && myDept) {
        apptQ = apptQ.eq("department", myDept);
      } else if (canAG) {
        // по желанию: Генпрокурор видит GOV
        apptQ = apptQ.eq("department", "GOV");
      } else if (canCJ) {
        // по желанию: Председатель ВС видит BAR (судебный отдел) — если у вас такой департамент есть
        // Если департамента «BAR» нет — уберите этот блок, тогда увидит все.
        // apptQ = apptQ.eq("department", "BAR" as Department);
      }

      const { data: appts } = await apptQ;

      // ---- верификация аккаунта ----
      let verAccQ = supabase
        .from("verification_requests")
        .select("*")
        .eq("kind", "ACCOUNT")
        .order("created_at", { ascending: false })
        .limit(300);
      if (!showAllVer) verAccQ = verAccQ.eq("status", "PENDING");
      const { data: vAcc } = await verAccQ;

      // ---- верификация ролей ----
      // TECH_ADMIN — видит всё; Генпрокурор — только PROSECUTOR; Председатель ВС — только JUDGE
      let verRoleQ = supabase.from("verification_requests").select("*").order("created_at", { ascending: false }).limit(300);
      if (canTech) {
        verRoleQ = verRoleQ.in("kind", ["PROSECUTOR", "JUDGE"]);
      } else if (canAG) {
        verRoleQ = verRoleQ.eq("kind", "PROSECUTOR");
      } else if (canCJ) {
        verRoleQ = verRoleQ.eq("kind", "JUDGE");
      } else {
        // руководителям ведомств верификация ролей не показывается
        verRoleQ = verRoleQ.eq("id", "___none___"); // пусто
      }
      if (!showAllVer) verRoleQ = verRoleQ.eq("status", "PENDING");
      const { data: vRole } = await verRoleQ;

      // ---- дополнительные списки (как были) ----
      const { data: vProfiles } = await supabase
        .from("profiles")
        .select("id,nickname,static_id,discord,faction,gov_role,is_verified,created_at")
        .or(
          "and(gov_role.eq.PROSECUTOR,is_verified.eq.true)," +
          "and(gov_role.eq.JUDGE,is_verified.eq.true)," +
          "gov_role.eq.TECH_ADMIN"
        )
        .order("gov_role", { ascending: true })
        .order("created_at", { ascending: false });

      const { data: users } = await supabase
        .from("profiles")
        .select("id,nickname,static_id,discord,faction,gov_role,is_verified,created_at")
        .order("created_at", { ascending: false })
        .limit(500);

      // собрать авторов
      const ids = Array.from(new Set([
        ...((appts ?? []).map(a => a.created_by)),
        ...((vAcc ?? []).map(v => v.created_by)),
        ...((vRole ?? []).map(v => v.created_by)),
      ]));
      const map = new Map<string, Pick<Profile,"id"|"nickname"|"discord">>();
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id,nickname,discord").in("id", ids);
        (profs ?? []).forEach((p: any) => map.set(p.id, { id:p.id, nickname:p.nickname, discord:p.discord }));
      }

      setAppointments((appts ?? []).map(a => ({ ...a, author: map.get(a.created_by) })));
      setVerAccount((vAcc ?? []).map(v => ({ ...v, author: map.get(v.created_by) })));
      setVerRoles((vRole ?? []).map(v => ({ ...v, author: map.get(v.created_by) })));
      setVerifiedRoles((vProfiles ?? []) as SimpleProfile[]);
      setAllUsers((users ?? []) as SimpleProfile[]);
    } catch (e: unknown) {
      setInfo(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (canEnter) void loadAll(); }, [canEnter, apptDept, showAllVer]);

  // --- handlers
  const setApptStatus = async (id: string, s: AppointmentStatus) => {
    const { error } = await supabase.from("appointments").update({ status: s }).eq("id", id);
    if (error) { setInfo(error.message); return; }
    setAppointments(prev => prev.map(r => r.id === id ? { ...r, status: s } : r));
  };
  const setReqStatus = async (id: string, s: VerificationStatus) => {
    const { error } = await supabase.from("verification_requests").update({ status: s }).eq("id", id);
    if (error) setInfo(error.message);
  };
  const approveAccount = async (v: VerRow) => {
    await setReqStatus(v.id, "APPROVED");
    await supabase.from("profiles").update({ is_verified: true }).eq("id", v.created_by);
    setVerAccount(prev => prev.map(x => x.id === v.id ? { ...x, status: "APPROVED" } : x));
  };
  const rejectAccount = async (v: VerRow) => {
    await setReqStatus(v.id, "REJECTED");
    setVerAccount(prev => prev.map(x => x.id === v.id ? { ...x, status: "REJECTED" } : x));
  };
  const approveRole = async (v: VerRow) => {
    await setReqStatus(v.id, "APPROVED");
    const newRole = v.kind === "PROSECUTOR" ? "PROSECUTOR" : "JUDGE";
    await supabase.from("profiles").update({ gov_role: newRole, is_verified: true }).eq("id", v.created_by);
    setVerRoles(prev => prev.map(x => x.id === v.id ? { ...x, status: "APPROVED" } : x));
  };
  const rejectRole = async (v: VerRow) => {
    await setReqStatus(v.id, "REJECTED");
    setVerRoles(prev => prev.map(x => x.id === v.id ? { ...x, status: "REJECTED" } : x));
  };

  const verifyAccountDirect = async (profileId: string, value: boolean) => {
    try {
      const { error } = await supabase.from("profiles").update({ is_verified: value }).eq("id", profileId);
      if (error) throw error;
      setAllUsers(list => list.map(u => (u.id === profileId ? { ...u, is_verified: value } : u)));
    } catch (e: any) {
      alert(e?.message ?? String(e));
    }
  };

  const filteredUsers = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return allUsers;
    return allUsers.filter(
      (u) =>
        (u.static_id || "").toLowerCase().includes(s) ||
        (u.nickname || "").toLowerCase().includes(s) ||
        (u.discord || "").toLowerCase().includes(s)
    );
  }, [allUsers, q]);

  const statusBadge = (s: AppointmentStatus | VerificationStatus) => {
    const cls =
      s === "APPROVED" ? "bg-green-100 text-green-700" :
      s === "REJECTED" ? "bg-red-100 text-red-700" :
      s === "DONE" ? "bg-gray-800 text-white" :
      s === "CANCELLED" ? "bg-gray-200 text-gray-700" :
      "bg-yellow-100 text-yellow-800";
    return <span className={`rounded-md px-2 py-0.5 text-xs ${cls}`}>{s}</span>;
  };

  if (loading && !canEnter) return <p className="px-4 py-6">Загрузка...</p>;
  if (!canEnter) {
    return (
      <p className="px-4 py-6">
        Доступ запрещён (нужна роль TECH_ADMIN, ATTORNEY_GENERAL, CHIEF_JUSTICE или лидер фракции).
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">
          {canTech ? "Админ-панель" : canLeader ? "Панель руководителя" : "Панель верификации"}
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={loadAll} className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-black">
            Обновить
          </button>
          <span className="text-sm text-gray-700">{info}</span>
        </div>
      </div>

      {/* ====== Блок «Все аккаунты + поиск» (оставил только для TECH_ADMIN) ====== */}
      {canTech && (
        <section className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Все зарегистрированные аккаунты</h2>
            <div className="w-80">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Поиск по Static ID, нику или Discord…"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="py-2">Ник</th><th className="py-2">Static ID</th><th className="py-2">Discord</th>
                  <th className="py-2">Фракция</th><th className="py-2">Роль</th><th className="py-2">Вериф.</th>
                  <th className="py-2 text-right">Действие</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="py-2">{u.nickname}</td>
                    <td className="py-2">{u.static_id}</td>
                    <td className="py-2">{u.discord ?? "—"}</td>
                    <td className="py-2">{u.faction}</td>
                    <td className="py-2">{u.gov_role}</td>
                    <td className="py-2">{u.is_verified ? "да" : "нет"}</td>
                    <td className="py-2 text-right space-x-2">
                      <button onClick={() => verifyAccountDirect(u.id, true)}  disabled={u.is_verified}
                        className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50">
                        Верифицировать
                      </button>
                      <button onClick={() => verifyAccountDirect(u.id, false)} disabled={!u.is_verified}
                        className="rounded-md bg-gray-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50">
                        Снять
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr><td className="py-6 text-center text-gray-500" colSpan={7}>Ничего не найдено</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ====== Заявки на приём ====== */}
      <section className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Заявки на приём</h2>
          <div className="flex items-center gap-2">
            {canTech && (
              <select
                value={apptDept}
                onChange={(e) => setApptDept(e.target.value as Department | "ALL")}
                className="rounded-md border px-3 py-2 text-sm"
              >
                <option value="ALL">Все подразделения</option>
                {Object.entries(DLabel).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            )}
            {!canTech && myDept && (
              <span className="text-sm text-gray-600">Подразделение: {DLabel[myDept]}</span>
            )}
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
              {appointments.map((r) => (
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
                      onChange={(e) => setApptStatus(r.id, e.target.value as AppointmentStatus)}
                      className="rounded-md border px-2 py-1"
                    >
                      {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
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

      {/* ====== Верификация аккаунта (заявки) — доступ TECH / AG / CJ ====== */}
      {(canTech || canAG || canCJ) && (
        <section className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Верификация аккаунта</h2>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={showAllVer} onChange={(e)=>setShowAllVer(e.target.checked)} />
              показывать все статусы
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
                {verAccount.map((v) => (
                  <tr key={v.id} className="border-t">
                    <td className="py-2">{v.author?.nickname ?? "—"}</td>
                    <td className="py-2">{v.author?.discord ?? "—"}</td>
                    <td className="py-2">{v.comment ?? "—"}</td>
                    <td className="py-2">{statusBadge(v.status)}</td>
                    <td className="py-2 text-right space-x-2">
                      <button onClick={()=>approveAccount(v)} disabled={v.status !== "PENDING"}
                        className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50">
                        Одобрить
                      </button>
                      <button onClick={()=>rejectAccount(v)} disabled={v.status !== "PENDING"}
                        className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">
                        Отклонить
                      </button>
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
      )}

      {/* ====== Верификация роли — TECH: все; AG: только прокуроры; CJ: только судьи ====== */}
      {(canTech || canAG || canCJ) && (
        <section className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">
            Верификация роли {canAG ? "(прокурор)" : canCJ ? "(судья)" : "(прокурор/судья)"}
          </h2>
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
                {verRoles.map((v) => (
                  <tr key={v.id} className="border-t">
                    <td className="py-2">{v.author?.nickname ?? "—"}</td>
                    <td className="py-2">{v.author?.discord ?? "—"}</td>
                    <td className="py-2">{v.kind}</td>
                    <td className="py-2">{statusBadge(v.status)}</td>
                    <td className="py-2 text-right space-x-2">
                      <button onClick={()=>approveRole(v)} disabled={v.status !== "PENDING"}
                        className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50">
                        Одобрить
                      </button>
                      <button onClick={()=>rejectRole(v)} disabled={v.status !== "PENDING"}
                        className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">
                        Отклонить
                      </button>
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
      )}
    </div>
  );
}
