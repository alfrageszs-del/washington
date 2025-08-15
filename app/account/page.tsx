// app/account/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabase/client";
import type {
  Profile,
  Faction,
  VerificationKind,
  VerificationStatus,
} from "../../lib/supabase/client";
import { FactionLabel } from "../../lib/supabase/client";

type VState = { status: VerificationStatus | "NONE"; id: string | null };

// перевод ролей/статусов
const roleRu: Record<Profile["gov_role"], string> = {
  NONE: "Нет",
  PROSECUTOR: "Прокурор",
  JUDGE: "Судья",
  TECH_ADMIN: "Тех. администратор",
};
const statusRu = (s: VerificationStatus | "NONE") =>
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
  "JUDICIAL",
];

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

  // запросы на верификацию
  const [govReq, setGovReq] = useState<VState>({ status: "NONE", id: null }); // прокурор
  const [judReq, setJudReq] = useState<VState>({ status: "NONE", id: null }); // судья

  const canAskProsecutor = useMemo(
    () =>
      faction === "GOV" &&
      govRole !== "PROSECUTOR" &&
      govReq.status !== "PENDING" &&
      govReq.status !== "APPROVED",
    [faction, govRole, govReq.status]
  );

  const canAskJudge = useMemo(
    () =>
      faction === "JUDICIAL" &&
      govRole !== "JUDGE" &&
      judReq.status !== "PENDING" &&
      judReq.status !== "APPROVED",
    [faction, govRole, judReq.status]
  );

  // загрузка
  useEffect(() => {
    let alive = true;

    const load = async () => {
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

        // последние заявки
        const { data: ver } = await supabase
          .from("verification_requests")
          .select("*")
          .eq("created_by", uid)
          .order("created_at", { ascending: false })
          .limit(50);

        if (ver) {
          const last = (k: VerificationKind) =>
            (ver as any[]).find((x) => x.kind === k);
          const pr = last("PROSECUTOR");
          const jr = last("JUDGE");
          setGovReq(pr ? { status: pr.status, id: pr.id } : { status: "NONE", id: null });
          setJudReq(jr ? { status: jr.status, id: jr.id } : { status: "NONE", id: null });
        }
      } catch (e: any) {
        setInfo(e?.message ?? String(e));
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, []);

  const refreshProfileAndRequests = async (uid: string) => {
    // перечитать, чтобы UI 100% соответствовал БД
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
      .select("*")
      .eq("created_by", uid)
      .order("created_at", { ascending: false })
      .limit(50);
    if (ver) {
      const last = (k: VerificationKind) =>
        (ver as any[]).find((x) => x.kind === k);
      const pr = last("PROSECUTOR");
      const jr = last("JUDGE");
      setGovReq(pr ? { status: pr.status, id: pr.id } : { status: "NONE", id: null });
      setJudReq(jr ? { status: jr.status, id: jr.id } : { status: "NONE", id: null });
    }
  };

  const onSave = async () => {
    setInfo("");
    if (!userId) {
      setInfo("Вы не авторизованы.");
      return;
    }
    if (nickname.trim().length < 3) {
      setInfo("Ник минимум 3 символа.");
      return;
    }
    if (staticId.trim().length === 0) {
      setInfo("Static ID обязателен.");
      return;
    }

    try {
      const { error } = await supabase.from("profiles").upsert({
        id: userId,
        nickname: nickname.trim(),
        static_id: staticId.trim(),
        faction,
        discord: discord.trim() || null,
      });
      if (error) throw error;
      setInfo("Сохранено.");
      await refreshProfileAndRequests(userId);
    } catch (e: any) {
      setInfo(e?.message ?? String(e));
    }
  };

  const requestVerify = async (kind: VerificationKind) => {
    if (!userId) return;
    setInfo("");

    // мгновенный локальный апдейт — кнопка исчезнет сразу
    if (kind === "PROSECUTOR") setGovReq({ status: "PENDING", id: null });
    if (kind === "JUDGE") setJudReq({ status: "PENDING", id: null });

    try {
      const { error } = await supabase
        .from("verification_requests")
        .insert({ created_by: userId, kind });
      if (error) throw error;

      // перечитаем с сервера, чтобы статус был 100% точный
      await refreshProfileAndRequests(userId);
      setInfo("Запрос отправлен.");
    } catch (e: any) {
      // если не вышло — откатываем локальный статус
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

      {/* Карточка профиля */}
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

          <label className="block">
            <span className="mb-1 block text-sm">Фракция</span>
            <select
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              value={faction}
              onChange={(e) => setFaction(e.target.value as Faction)}
            >
              {factions.map((f) => (
                <option key={f} value={f}>
                  {FactionLabel[f]}
                </option>
              ))}
            </select>
          </label>

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
            <div className="mb-3 text-sm text-gray-600">
              Статус: <span className="font-medium">{statusRu(govReq.status)}</span>
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
                title="Запрос недоступен"
              >
                Запрос недоступен
              </button>
            )}
          </div>

          {/* Судья */}
          <div className="rounded-xl border p-4">
            <div className="font-medium">Судья</div>
            <div className="mb-3 text-sm text-gray-600">
              Статус: <span className="font-medium">{statusRu(judReq.status)}</span>
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
                title="Запрос недоступен"
              >
                Запрос недоступен
              </button>
            )}
          </div>
        </div>
      </div>

      {info && <p className="text-sm text-gray-700">{info}</p>}
    </div>
  );
}
