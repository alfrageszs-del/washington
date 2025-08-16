// app/account/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import type {
  Profile,
  Faction,
  VerificationKind,
  VerificationStatus,
  RoleChangeRequest,
  RoleChangeRequestStatus,
} from "../../lib/supabase/client";
import { FactionLabel } from "../../lib/supabase/client";
import RoleChangeRequestForm from "../components/RoleChangeRequestForm";

/* ===== Переводы ===== */
const roleRu: Record<Profile["gov_role"], string> = {
  NONE: "Нет",
  PROSECUTOR: "Прокурор",
  JUDGE: "Судья",
  TECH_ADMIN: "Тех. администратор",
  ATTORNEY_GENERAL: "Генеральный прокурор",
  CHIEF_JUSTICE: "Председатель Верховного суда",
};
const statusBaseRu = (s: VerificationStatus | "NONE") =>
  s === "PENDING"
    ? "ожидает"
    : s === "APPROVED"
    ? "подтверждено"
    : s === "REJECTED"
    ? "отклонено"
    : "нет заявки";

const factions: Faction[] = [
  "CIVILIAN",
  "FIB",
  "LSPD",
  "LSCSD",
  "EMS",
  "WN",
  "SANG",
  "GOV",
  "COURT",
];

/* ===== Утилиты ===== */
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
function add24h(iso?: string | null) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return new Date(t + ONE_DAY_MS);
}
function leftFmt(until: Date | null) {
  if (!until) return "";
  const ms = until.getTime() - Date.now();
  if (ms <= 0) return "";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}ч ${m}м`;
}

/* ===== Компонент ===== */
type ReqView = {
  status: VerificationStatus | "NONE";
  id: string | null;
  created_at: string | null;
};

export default function AccountPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState("");

  // профиль
  const [nickname, setNickname] = useState("");
  const [staticId, setStaticId] = useState("");
  const [discord, setDiscord] = useState("");
  const [faction, setFaction] = useState<Faction>("CIVILIAN");
  const [govRole, setGovRole] = useState<Profile["gov_role"]>("NONE");
  const [isVerified, setIsVerified] = useState(false);

  // заявки
  const [govReq, setGovReq] = useState<ReqView>({
    status: "NONE",
    id: null,
    created_at: null,
  });
  const [judReq, setJudReq] = useState<ReqView>({
    status: "NONE",
    id: null,
    created_at: null,
  });

  // запросы на изменение ролей
  const [roleChangeRequests, setRoleChangeRequests] = useState<RoleChangeRequest[]>([]);
  const [showRoleChangeForm, setShowRoleChangeForm] = useState(false);

  // Эффективно подтверждена роль? (важно для UI)
  const prosecutorEffectiveApproved = useMemo(
    () => govReq.status === "APPROVED" && govRole === "PROSECUTOR" && isVerified,
    [govReq.status, govRole, isVerified]
  );
  const judgeEffectiveApproved = useMemo(
    () => judReq.status === "APPROVED" && govRole === "JUDGE" && isVerified,
    [judReq.status, govRole, isVerified]
  );

  // Кулдауны
  const govCooldownUntil = useMemo(
    () => add24h(govReq.created_at),
    [govReq.created_at]
  );
  const judCooldownUntil = useMemo(
    () => add24h(judReq.created_at),
    [judReq.created_at]
  );
  const govCooldownActive = !!govCooldownUntil && govCooldownUntil > new Date();
  const judCooldownActive = !!judCooldownUntil && judCooldownUntil > new Date();

  // Кнопки «можно подать?» (учитываем роль, статус, кулдаун)
  const canAskProsecutor = useMemo(
    () =>
      faction === "GOV" &&
      (govRole !== "PROSECUTOR" || !isVerified) && // роль слетела или не назначена
      govReq.status !== "PENDING" &&
      !govCooldownActive,
    [faction, govRole, isVerified, govReq.status, govCooldownActive]
  );
  const canAskJudge = useMemo(
    () =>
      faction === "COURT" &&
      (govRole !== "JUDGE" || !isVerified) &&
      judReq.status !== "PENDING" &&
      !judCooldownActive,
    [faction, govRole, isVerified, judReq.status, judCooldownActive]
  );

  // Текст статуса с учётом «слёта роли»
  const prosecutorStatusText = useMemo(() => {
    if (govReq.status === "PENDING") return "ожидает";
    if (govReq.status === "APPROVED") {
      return prosecutorEffectiveApproved
        ? "подтверждено"
        : "одобрено ранее, роль снята";
    }
    if (govReq.status === "REJECTED") return "отклонено";
    return "нет заявки";
  }, [govReq.status, prosecutorEffectiveApproved]);

  const judgeStatusText = useMemo(() => {
    if (judReq.status === "PENDING") return "ожидает";
    if (judReq.status === "APPROVED") {
      return judgeEffectiveApproved ? "подтверждено" : "одобрено ранее, роль снята";
    }
    if (judReq.status === "REJECTED") return "отклонено";
    return "нет заявки";
  }, [judReq.status, judgeEffectiveApproved]);

  // загрузка
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setInfo("");
      try {
        const { data: sess } = await supabase.auth.getSession();
        if (!alive) return;
        const uid = sess.session?.user?.id ?? null;
        setUserId(uid);
        if (!uid) return;

        // профиль
        const { data: pData, error: pErr } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", uid)
          .maybeSingle();
        if (pErr) throw pErr;

        if (pData) {
          const p = pData as Profile;
          setNickname(p.nickname);
          setStaticId(p.static_id);
          setDiscord(p.discord ?? "");
          setFaction(p.faction);
          setGovRole(p.gov_role);
          setIsVerified(p.is_verified);
        }

        // заявки (берём последние по каждому виду)
        const { data: ver } = await supabase
          .from("verification_requests")
          .select("id, kind, status, created_at")
          .eq("created_by", uid)
          .order("created_at", { ascending: false })
          .limit(50);

        if (ver && Array.isArray(ver)) {
          const last = (k: VerificationKind) =>
            ver.find((x: any) => x.kind === k) || null;
          const pr = last("PROSECUTOR");
          const jr = last("JUDGE");
          setGovReq(
            pr
              ? { status: pr.status, id: pr.id, created_at: pr.created_at }
              : { status: "NONE", id: null, created_at: null }
          );
          setJudReq(
            jr
              ? { status: jr.status, id: jr.id, created_at: jr.created_at }
              : { status: "NONE", id: null, created_at: null }
          );
        }

        // запросы на изменение ролей
        const { data: roleRequests } = await supabase
          .from("role_change_requests")
          .select("*")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(10);

        if (roleRequests) {
          setRoleChangeRequests(roleRequests as RoleChangeRequest[]);
        }
      } catch (e: any) {
        setInfo(e?.message ?? String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const refreshAll = async (uid: string) => {
    const { data: pData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .maybeSingle();
    if (pData) {
      const p = pData as Profile;
      setGovRole(p.gov_role);
      setIsVerified(p.is_verified);
      setFaction(p.faction);
      setNickname(p.nickname);
      setStaticId(p.static_id);
      setDiscord(p.discord ?? "");
    }
    const { data: ver } = await supabase
      .from("verification_requests")
      .select("id, kind, status, created_at")
      .eq("created_by", uid)
      .order("created_at", { ascending: false })
      .limit(50);
    if (ver && Array.isArray(ver)) {
      const last = (k: VerificationKind) =>
        ver.find((x: any) => x.kind === k) || null;
      const pr = last("PROSECUTOR");
      const jr = last("JUDGE");
      setGovReq(
        pr
          ? { status: pr.status, id: pr.id, created_at: pr.created_at }
          : { status: "NONE", id: null, created_at: null }
      );
      setJudReq(
        jr
          ? { status: jr.status, id: jr.id, created_at: jr.created_at }
          : { status: "NONE", id: null, created_at: null }
      );
    }

    // обновляем запросы на изменение ролей
    const { data: roleRequests } = await supabase
      .from("role_change_requests")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(10);

    if (roleRequests) {
      setRoleChangeRequests(roleRequests as RoleChangeRequest[]);
    }
  };

  const onSave = async () => {
    setInfo("");
    if (!userId) return setInfo("Вы не авторизованы.");
    if (nickname.trim().length < 3) return setInfo("Ник минимум 3 символа.");
    if (!staticId.trim()) return setInfo("Static ID обязателен.");

    try {
      const { error } = await supabase.from("profiles").upsert({
        id: userId,
        nickname: nickname.trim(),
        static_id: staticId.trim(),
        discord: discord.trim() || null,
      });
      if (error) throw error;
      setInfo("Сохранено.");
      await refreshAll(userId);
    } catch (e: any) {
      setInfo(e?.message ?? String(e));
    }
  };

  const requestVerify = async (kind: VerificationKind) => {
    if (!userId) return;
    setInfo("");

    // локально ставим "PENDING", чтобы кнопка сразу скрылась
    if (kind === "PROSECUTOR")
      setGovReq((s) => ({ ...s, status: "PENDING", created_at: new Date().toISOString() }));
    if (kind === "JUDGE")
      setJudReq((s) => ({ ...s, status: "PENDING", created_at: new Date().toISOString() }));

    try {
      const { error } = await supabase
        .from("verification_requests")
        .insert({ created_by: userId, kind });
      if (error) throw error;

      await refreshAll(userId);
      setInfo("Запрос отправлен.");
    } catch (e: any) {
      // откат локального статуса, если не получилось
      if (kind === "PROSECUTOR") setGovReq((s) => ({ ...s, status: "NONE" }));
      if (kind === "JUDGE") setJudReq((s) => ({ ...s, status: "NONE" }));
      setInfo(e?.message ?? String(e));
    }
  };

  if (loading) return <p className="px-4 py-6">Загрузка...</p>;
  if (!userId) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-6">
        <h1 className="text-2xl font-bold">Мой профиль</h1>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-700">
            Вы не авторизованы. Перейдите на{" "}
            <a href="/auth/sign-in" className="text-indigo-600 hover:underline">
              страницу входа
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <h1 className="text-2xl font-bold">Мой профиль</h1>

      {/* Профиль */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <span>
            <span className="text-gray-500">Роль в системе:</span>{" "}
            <span className="font-medium">{roleRu[govRole]}</span>
          </span>
          <span>•</span>
          <span>
            <span className="text-gray-500">Верификация:</span>{" "}
            <span className="font-medium">{isVerified ? "да" : "нет"}</span>
          </span>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm">Nick name</span>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm">Static ID</span>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              value={staticId}
              onChange={(e) => setStaticId(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm">Discord</span>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              value={discord}
              onChange={(e) => setDiscord(e.target.value)}
              placeholder="@username"
            />
          </label>

          <div className="block">
            <span className="mb-1 block text-sm">Фракция</span>
            <div className="w-full rounded-lg border px-3 py-2 text-sm bg-gray-50 text-gray-600">
              {FactionLabel[faction]}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Для изменения фракции используйте систему запросов ниже
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onSave}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>

      {/* Верификация роли */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">Верификация роли</h2>
        <p className="mb-4 text-sm text-gray-600">
          Для фракции <strong>GOV</strong> — верификация <strong>прокурора</strong>. Для{" "}
          <strong>Судейского корпуса</strong> — верификация <strong>судьи</strong>.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Прокурор */}
          <div className="rounded-xl border p-4">
            <div className="font-medium">Прокурор</div>
            <div className="mb-2 text-sm text-gray-600">
              Статус: <span className="font-medium">{prosecutorStatusText}</span>
            </div>

            {canAskProsecutor ? (
              <button
                onClick={() => requestVerify("PROSECUTOR")}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
              >
                Запрос верификации прокурора
              </button>
            ) : (
              <button
                disabled
                className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-600"
              >
                Запрос недоступен
              </button>
            )}

            {!canAskProsecutor && govCooldownActive && (
              <div className="mt-2 text-xs text-gray-500">
                Повторно через {leftFmt(govCooldownUntil)}
              </div>
            )}
          </div>

          {/* Судья */}
          <div className="rounded-xl border p-4">
            <div className="font-medium">Судья</div>
            <div className="mb-2 text-sm text-gray-600">
              Статус: <span className="font-medium">{judgeStatusText}</span>
            </div>

            {canAskJudge ? (
              <button
                onClick={() => requestVerify("JUDGE")}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
              >
                Запрос верификации судьи
              </button>
            ) : (
              <button
                disabled
                className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-600"
              >
                Запрос недоступен
              </button>
            )}

            {!canAskJudge && judCooldownActive && (
              <div className="mt-2 text-xs text-gray-500">
                Повторно через {leftFmt(judCooldownUntil)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Запросы на изменение ролей */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Запросы на изменение ролей</h2>
          <button
            onClick={() => setShowRoleChangeForm(!showRoleChangeForm)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            {showRoleChangeForm ? "Отмена" : "Запросить изменение роли"}
          </button>
        </div>

        {showRoleChangeForm && userId && (
          <div className="mb-6">
            <RoleChangeRequestForm
              userId={userId}
              currentProfile={{
                faction,
                gov_role: govRole,
                leader_role: null, // добавить в профиль если нужно
                office_role: null, // добавить в профиль если нужно
              }}
              onSuccess={() => {
                setShowRoleChangeForm(false);
                refreshAll(userId);
                setInfo("Запрос на изменение роли отправлен");
              }}
              onCancel={() => setShowRoleChangeForm(false)}
            />
          </div>
        )}

        {/* Список запросов */}
        {roleChangeRequests.length > 0 ? (
          <div className="space-y-3">
            {roleChangeRequests.map((request) => (
              <div key={request.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">
                    {request.request_type === "FACTION" && "Изменение фракции"}
                    {request.request_type === "GOV_ROLE" && "Изменение гос. роли"}
                    {request.request_type === "LEADER_ROLE" && "Изменение лидерской роли"}
                    {request.request_type === "OFFICE_ROLE" && "Изменение офисной роли"}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    request.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                    request.status === "APPROVED" ? "bg-green-100 text-green-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {request.status === "PENDING" ? "Ожидает" :
                     request.status === "APPROVED" ? "Одобрено" : "Отклонено"}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  <div>С {request.current_value || "не указано"} → {request.requested_value}</div>
                  <div>Причина: {request.reason}</div>
                  {request.review_comment && (
                    <div>Комментарий: {request.review_comment}</div>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {request.created_at ? new Date(request.created_at).toLocaleDateString("ru-RU") : ""}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Нет активных запросов на изменение ролей</p>
        )}
      </div>

      {/* Быстрые действия */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Быстрые действия</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <a
            href="/notifications"
            className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50 transition-colors"
          >
            <div>
              <div className="font-medium">Уведомления</div>
              <div className="text-sm text-gray-600">Просмотр новых уведомлений</div>
            </div>
            <div className="text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>
          
          <a
            href="/search"
            className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50 transition-colors"
          >
            <div>
              <div className="font-medium">Поиск документов</div>
              <div className="text-sm text-gray-600">Поиск по StaticID или nickname</div>
            </div>
            <div className="text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>
        </div>
      </div>

      {info && <p className="text-sm text-gray-700">{info}</p>}
    </div>
  );
}
