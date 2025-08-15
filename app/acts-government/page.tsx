"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabase/client";
import type { Profile } from "../../lib/supabase/client";

type GovActRow = {
  id: string;
  author_id: string;
  title: string;
  summary: string | null;
  published_at: string;
};

export default function GovActsPage() {
  const [me, setMe] = useState<Pick<Profile, "id" | "gov_role"> | null>(null);
  const [acts, setActs] = useState<GovActRow[]>([]);
  const [canCreate, setCanCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState("");

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      setInfo("");

      // 1) список опубликованных (берём author_id, чтобы знать права)
      const { data: rows, error: selErr } = await supabase
        .from("gov_acts")
        .select("id,author_id,title,summary,published_at")
        .eq("is_published", true)
        .order("published_at", { ascending: false });

      if (selErr) setInfo(selErr.message);
      if (alive) setActs((rows ?? []) as GovActRow[]);

      // 2) мои права
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id;
      if (!uid) {
        if (alive) {
          setMe(null);
          setCanCreate(false);
        }
      } else {
        const { data: p } = await supabase
          .from("profiles")
          .select("id,gov_role,is_verified")
          .eq("id", uid)
          .maybeSingle();

        if (alive) {
          setMe(p ? { id: p.id, gov_role: p.gov_role } : null);
          setCanCreate(!!p && ((p.gov_role === "PROSECUTOR" && (p as any).is_verified) || p.gov_role === "TECH_ADMIN"));
        }
      }

      if (alive) setLoading(false);
    };

    void load();
    return () => {
      alive = false;
    };
  }, []);

  const isTechAdmin = me?.gov_role === "TECH_ADMIN";
  const canEdit = (row: GovActRow) => isTechAdmin || row.author_id === me?.id;

  const onDelete = async (id: string) => {
    if (!confirm("Удалить акт? Это действие необратимо.")) return;
    setInfo("");
    const { error } = await supabase.from("gov_acts").delete().eq("id", id);
    if (error) {
      setInfo(error.message);
      return;
    }
    setActs((list) => list.filter((x) => x.id !== id));
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Реестр актов правительства</h1>
        {canCreate && (
          <a
            href="/acts-government/new"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Новый акт
          </a>
        )}
      </div>

      {info && <p className="text-sm text-red-600">{info}</p>}

      {loading ? (
        <p>Загрузка...</p>
      ) : acts.length === 0 ? (
        <div className="rounded-2xl border bg-white p-5 shadow-sm text-sm text-gray-600">
          Пока нет опубликованных актов.
        </div>
      ) : (
        <ul className="space-y-3">
          {acts.map((a) => (
            <li key={a.id} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <a href={`/acts-government/${a.id}`} className="group block flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold group-hover:text-indigo-700">
                      {a.title}
                    </h3>
                    <time className="text-xs text-gray-500">
                      {new Date(a.published_at).toLocaleString()}
                    </time>
                  </div>
                  {a.summary && (
                    <p className="mt-2 text-sm text-gray-700 line-clamp-2">{a.summary}</p>
                  )}
                </a>

                {me && canEdit(a) && (
                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={`/acts-government/${a.id}/edit`}
                      className="rounded-md border px-3 py-1.5 text-xs hover:bg-gray-50"
                      title="Редактировать"
                    >
                      Редактировать
                    </a>
                    <button
                      onClick={() => onDelete(a.id)}
                      className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                      title="Удалить"
                    >
                      Удалить
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
