"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  supabase,
  type Profile,
  type Faction,
  FactionLabel,
  type VerificationRequest,
  type VerificationKind,
} from "../../lib/supabase/client";

/** Только виды заявок ролей */
type RoleKind = Extract<VerificationKind, "PROSECUTOR" | "JUDGE">;
type VRMap = Partial<Record<RoleKind, VerificationRequest>>;

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [nickname, setNickname] = useState("");
  const [staticId, setStaticId] = useState("");
  const [discord, setDiscord] = useState("");
  const [faction, setFaction] = useState<Faction>("CIVILIAN");
  const [govRole, setGovRole] = useState<Profile["gov_role"]>("NONE");
  const [isVerified, setIsVerified] = useState<boolean>(false);

  const [vr, setVr] = useState<VRMap>({});

  const fetchProfile = async (uid: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .maybeSingle();
    if (data) {
      const pr = data as Profile;
      setNickname(pr.nickname ?? "");
      setStaticId(pr.static_id ?? "");
      setDiscord(pr.discord ?? "");
      setFaction(pr.faction ?? "CIVILIAN");
      setGovRole(pr.gov_role ?? "NONE");
      setIsVerified(!!pr.is_verified);
    }
  };

  const reloadVR = async (uid: string) => {
    const { data, error } = await supabase
      .from("verification_requests")
      .select("*")
      .eq("created_by", uid)
      .in("kind", ["PROSECUTOR", "JUDGE"])
      .order("created_at", { ascending: false });

    if (error) return;

    const map: VRMap = {};
    (data as VerificationRequest[] | null)?.forEach((r) => {
      if (r.kind === "PROSECUTOR" || r.kind === "JUDGE") {
        const k: RoleKind = r.kind;
        if (!map[k]) map[k] = r;
      }
    });
    setVr(map);
  };

  useEffect(() => {
    let alive = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      const session = data.session;
      if (!session?.user) {
        router.replace("/auth/sign-in?next=/account");
        return;
      }

      const uid = session.user.id;
      setUserId(uid);

      await fetchProfile(uid);
      await reloadVR(uid);

      setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, [router]);

  const onSave = async () => {
    if (!userId) return;

    // отправляем новые данные
    await supabase.from("profiles").upsert({
      id: userId,
      nickname: nickname.trim(),
      static_id: staticId.trim(),
      discord: discord.trim() || null,
      faction,
    });

    // ПОДТЯНЕМ обратно профиль и заявки:
    // если сработал триггер сброса, здесь уже увидим gov_role = NONE, is_verified = false,
    // а заявки по ролям уйдут из PENDING/APPROVED -> REJECTED
    await fetchProfile(userId);
    await reloadVR(userId);

    alert("Сохранено");
  };

  const reqDisabled: Record<RoleKind, boolean> = useMemo(
    () => ({
      PROSECUTOR:
        faction !== "GOV" ||
        vr.PROSECUTOR?.status === "PENDING" ||
        (govRole === "PROSECUTOR" && isVerified),
      JUDGE:
        faction !== "JUDICIAL" ||
        vr.JUDGE?.status === "PENDING" ||
        (govRole === "JUDGE" && isVerified),
    }),
    [faction, vr, govRole, isVerified]
  );

  const sendVerification = async (kind: RoleKind) => {
    if (!userId) return;

    // Сразу блокируем кнопку локально, ставим временную PENDING
    setVr((prev) => ({
      ...prev,
      [kind]: {
        id: `local-${Date.now()}`,
        created_by: userId,
        kind,
        comment: null,
        status: "PENDING",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as VerificationRequest,
    }));

    const { error } = await supabase
      .from("verification_requests")
      .insert({ created_by: userId, kind, comment: null });

    if (error) {
      alert(error.message);
      // вернуть локальное состояние (разблокировать)
      setVr((prev) => {
        const cp = { ...prev };
        delete cp[kind];
        return cp;
      });
      return;
    }

    // Подтянуть реальную запись из БД
    await reloadVR(userId);
    alert("Заявка отправлена.");
  };

  if (loading) return <p className="px-4 py-6">Загрузка…</p>;
  if (!userId) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <h1 className="text-2xl font-bold">Мой профиль</h1>

      {/* Профиль */}
      <div className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
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
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm">Фракция</span>
          <select
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            value={faction}
            onChange={(e) => setFaction(e.target.value as Faction)}
          >
            {Object.entries(FactionLabel).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
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

      {/* Верификация роли */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">Верификация роли</h2>
        <p className="mb-4 text-sm text-gray-600">
          Для фракции <b>GOV</b> – верификация <b>прокурора</b>. Для{" "}
          <b>Судейского корпуса</b> – верификация <b>судьи</b>.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border p-4">
            <div className="mb-2 font-medium">Прокурор</div>
            <div className="mb-3 text-sm text-gray-600">
              Статус:{" "}
              <b>
                {govRole === "PROSECUTOR" && isVerified
                  ? "подтверждён"
                  : vr.PROSECUTOR?.status
                  ? vr.PROSECUTOR.status.toLowerCase()
                  : "нет заявки"}
              </b>
            </div>
            <button
              onClick={() => sendVerification("PROSECUTOR")}
              disabled={reqDisabled.PROSECUTOR}
              className={`rounded-lg px-3 py-2 text-sm ${
                reqDisabled.PROSECUTOR
                  ? "cursor-not-allowed border bg-gray-100 text-gray-500"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              Запрос верификации прокурора
            </button>
          </div>

          <div className="rounded-xl border p-4">
            <div className="mb-2 font-medium">Судья</div>
            <div className="mb-3 text-sm text-gray-600">
              Статус:{" "}
              <b>
                {govRole === "JUDGE" && isVerified
                  ? "подтверждён"
                  : vr.JUDGE?.status
                  ? vr.JUDGE.status.toLowerCase()
                  : "нет заявки"}
              </b>
            </div>
            <button
              onClick={() => sendVerification("JUDGE")}
              disabled={reqDisabled.JUDGE}
              className={`rounded-lg px-3 py-2 text-sm ${
                reqDisabled.JUDGE
                  ? "cursor-not-allowed border bg-gray-100 text-gray-500"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              Запрос верификации судьи
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
