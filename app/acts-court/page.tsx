"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import type { Profile } from "../../lib/supabase/client";

type CourtActRow = {
  id: string;
  judge_id: string;
  title: string;
  content: string;
  created_at: string;
};

export default function CourtActsPage() {
  const [me, setMe] = useState<Pick<Profile, "id" | "gov_role"> | null>(null);
  const [acts, setActs] = useState<CourtActRow[]>([]);
  const [canCreate, setCanCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState("");

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      setInfo("");

      const { data: rows, error: selErr } = await supabase
        .from("court_acts")
        .select("id,judge_id,title,content,created_at")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (selErr) setInfo(selErr.message);
      if (alive) setActs((rows ?? []) as CourtActRow[]);

      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id;
      if (uid) {
        const { data: p } = await supabase
          .from("profiles")
          .select("id,gov_role")
          .eq("id", uid)
          .maybeSingle();
        if (alive) {
          const prof = (p ?? null) as Pick<Profile, "id" | "gov_role"> | null;
          setMe(prof);
          setCanCreate(!!prof && (prof.gov_role === "JUDGE" || prof.gov_role === "TECH_ADMIN" || prof.gov_role === "CHIEF_JUSTICE"));
        }
      } else if (alive) {
        setMe(null);
        setCanCreate(false);
      }

      if (alive) setLoading(false);
    };

    void load();
    return () => {
      alive = false;
    };
  }, []);

  const isTechAdmin = me?.gov_role === "TECH_ADMIN";
  const canEdit = (row: CourtActRow) => isTechAdmin || row.judge_id === me?.id;

  const onDelete = async (id: string) => {
    if (!confirm("Удалить этот судебный акт? Это действие необратимо.")) return;
    setInfo("");
    const { error } = await supabase.from("court_acts").delete().eq("id", id);
    if (error) return setInfo(error.message);
    setActs(acts.filter((act) => act.id !== id));
  };

  if (loading) return <p className="px-4 py-6">Загрузка...</p>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Реестр судебных актов</h1>
        {canCreate && (
          <a
            href="/acts-court/new"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Новый акт
          </a>
        )}
      </div>

      {info && <p className="mb-4 text-sm text-red-600">{info}</p>}

      {acts.length === 0 ? (
        <div className="rounded-2xl border bg-white p-8 text-center text-gray-500">
          Пока нет опубликованных актов.
        </div>
      ) : (
        <div className="space-y-3">
          {acts.map((act) => (
            <div key={act.id} className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium">
                    <a href={`/acts-court/${act.id}`} className="hover:underline">
                      {act.title}
                    </a>
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {new Date(act.created_at).toLocaleDateString("ru-RU")}
                  </p>
                </div>
                {canEdit(act) && (
                  <div className="ml-4 flex space-x-2">
                    <a
                      href={`/acts-court/${act.id}/edit`}
                      className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
                    >
                      Изменить
                    </a>
                    <button
                      onClick={() => onDelete(act.id)}
                      className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200"
                    >
                      Удалить
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
