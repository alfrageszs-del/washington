// app/account/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import type {
  Profile, Faction,
  VerificationKind, VerificationRequest, VerificationStatus,
} from "../../lib/supabase/client";
import { FactionLabel } from "../../lib/supabase/client";

const factions: Faction[] = ["CIVILIAN","FIB","LSPD","LSCSD","EMS","WN","SANG","GOV","JUDICIAL"];
type VState = { status: VerificationStatus | "NONE"; id: string | null };

export default function AccountPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState("");

  // форма
  const [nickname, setNickname] = useState("");
  const [staticId, setStaticId] = useState("");
  const [discord, setDiscord] = useState("");
  const [faction, setFaction] = useState<Faction>("CIVILIAN");
  const [govRole, setGovRole] = useState<Profile["gov_role"]>("NONE");
  const [isVerified, setIsVerified] = useState<boolean>(false);

  // запросы на верификацию
  const [govReq, setGovReq] = useState<VState>({ status: "NONE", id: null }); // PROSECUTOR
  const [judReq, setJudReq] = useState<VState>({ status: "NONE", id: null }); // JUDGE

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      setInfo("");

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!alive) return;

        const uid = session?.user?.id ?? null;
        if (!uid) {
          setUserId(null);
          return; // покажем блок "не авторизован"
        }
        setUserId(uid);

        // профиль
        const { data: pData, error: pErr } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", uid)
          .maybeSingle();

        if (pErr) setInfo(pErr.message);
        if (pData) {
          const p = pData as Profile;
          setNickname(p.nickname);
          setStaticId(p.static_id);
          setDiscord(p.discord ?? "");
          setFaction(p.faction);
          setGovRole(p.gov_role);
          setIsVerified(p.is_verified);
        }

        // мои последние заявки на верификацию
        const { data: ver, error: vErr } = await supabase
          .from("verification_requests")
          .select("*")
          .eq("created_by", uid)
          .order("created_at", { ascending: false })
          .limit(50);

        if (!vErr && ver) {
          const list = ver as VerificationRequest[];
          const last = (k: VerificationKind) => list.find(x => x.kind === k);
          const pr = last("PROSECUTOR");
          const jr = last("JUDGE");
          if (pr) setGovReq({ status: pr.status, id: pr.id });
          if (jr) setJudReq({ status: jr.status, id: jr.id });
        }
      } catch (e: unknown) {
        setInfo(e instanceof Error ? e.message : String(e));
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => { alive = false; };
  }, []);

  const onSave = async () => {
    setInfo("");
    if (!userId) { setInfo("Вы не авторизованы."); return; }
    if (nickname.trim().length < 3) { setInfo("Ник минимум 3 символа."); return; }
    if (staticId.trim().length === 0) { setInfo("Static ID обязателен."); return; }

    try {
      const { error } = await supabase.from("profiles").upsert({
        id: userId,
        nickname: nickname.trim(),
        static_id: staticId.trim(),
        faction,
        discord: discord.trim() || null,
      });
      if (error) throw error;

      // перечитаем профиль, чтобы поймать возможный сброс верификации триггером
      const { data, error: readErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (readErr) throw readErr;

      if (data) {
        const p = data as Profile;
        setNickname(p.nickname);
        setStaticId(p.static_id);
        setDiscord(p.discord ?? "");
        setFaction(p.faction);
        setGovRole(p.gov_role);
        setIsVerified(p.is_verified);
      }

      setInfo("Сохранено.");
    } catch (e: unknown) {
      setInfo(e instanceof Error ? e.message : String(e));
    }
  };

  const requestVerify = async (kind: VerificationKind) => {
    setInfo("");
    if (!userId) { setInfo("Вы не авторизованы."); return; }
    const exists = kind === "PROSECUTOR" ? govReq.status : judReq.status;
    if (exists === "PENDING" || exists === "APPROVED") return;

    try {
      const { error } = await supabase.from("verification_requests").insert({
        created_by: userId,
        kind,
        comment: null,
      });
      if (error) throw error;
      if (kind === "PROSECUTOR") setGovReq({ status: "PENDING", id: null });
      else setJudReq({ status: "PENDING", id: null });
      setInfo("Запрос отправлен.");
    } catch (e: unknown) {
      setInfo(e instanceof Error ? e.message : String(e));
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
            <a href="/auth/sign-in" className="text-indigo-600 hover:underline">страницу входа</a>.
          </p>
        </div>
      </div>
    );
  }

  const statusLabel = (s: VerificationStatus | "NONE") =>
    s === "PENDING" ? "запрос отправлен (ожидает)" :
    s === "APPROVED" ? "одобрено" :
    s === "REJECTED" ? "отклонено" : "нет запроса";

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Мой профиль</h1>
        <div className="flex items-center gap-2">
          <a href="/account/appointments" className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
            Мои записи
          </a>
          <a href="/appointment" className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Новая запись
          </a>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
        <label className="block">
          <span className="mb-1 block text-sm">Nick name</span>
          <input className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            value={nickname} onChange={(e)=>setNickname(e.target.value)} />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm">Static ID</span>
          <input className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            value={staticId} onChange={(e)=>setStaticId(e.target.value)} />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm">Discord</span>
          <input className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            value={discord} onChange={(e)=>setDiscord(e.target.value)} />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm">Фракция</span>
          <select className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            value={faction} onChange={(e)=>setFaction(e.target.value as Faction)}>
            {factions.map((f)=> <option key={f} value={f}>{FactionLabel[f]}</option>)}
          </select>
        </label>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-gray-500">
            Роль: {govRole}{isVerified ? " (верифицирован)" : ""}
          </span>
          <button onClick={onSave}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Сохранить
          </button>
        </div>
      </div>

      {faction === "GOV" && (
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Верификация прокурора</div>
              <div className="text-sm text-gray-600">Статус: {statusLabel(govReq.status)}</div>
            </div>
            <button
              disabled={govReq.status === "PENDING" || govReq.status === "APPROVED"}
              onClick={()=>requestVerify("PROSECUTOR")}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
            >
              Запрос верификации
            </button>
          </div>
        </div>
      )}

      {faction === "JUDICIAL" && (
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Верификация судьи</div>
              <div className="text-sm text-gray-600">Статус: {statusLabel(judReq.status)}</div>
            </div>
            <button
              disabled={judReq.status === "PENDING" || judReq.status === "APPROVED"}
              onClick={()=>requestVerify("JUDGE")}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
            >
              Запрос верификации
            </button>
          </div>
        </div>
      )}

      {info && <p className="text-sm text-gray-700">{info}</p>}
    </div>
  );
}
