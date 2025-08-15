"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";

type GovAct = {
  id: string;
  title: string;
  summary: string | null;
  published_at: string;
};

export default function GovActsPage() {
  const [acts, setActs] = useState<GovAct[]>([]);
  const [canCreate, setCanCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);

      // список опубликованных
      const { data } = await supabase
        .from("gov_acts")
        .select("id,title,summary,published_at")
        .eq("is_published", true)
        .order("published_at", { ascending: false });

      if (alive) setActs((data ?? []) as GovAct[]);

      // проверим право создания (быстро через профиль)
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id;
      if (!uid) {
        if (alive) setCanCreate(false);
      } else {
        const { data: p } = await supabase
          .from("profiles")
          .select("gov_role,is_verified")
          .eq("id", uid)
          .maybeSingle();
        if (alive) {
          setCanCreate(
            !!p && ((p.gov_role === "PROSECUTOR" && p.is_verified) || p.gov_role === "TECH_ADMIN")
          );
        }
      }

      if (alive) setLoading(false);
    };

    load();
    return () => {
      alive = false;
    };
  }, []);

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
              <a href={`/acts-government/${a.id}`} className="group block">
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
