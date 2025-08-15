"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase/client";

type Act = {
  id: string;
  title: string;
  summary: string | null;
  content: string;
  source_url: string | null;
  published_at: string;
};

export default function ActView({ params }: { params: { id: string } }) {
  const { id } = params;
  const [act, setAct] = useState<Act | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("gov_acts")
        .select("id,title,summary,content,source_url,published_at")
        .eq("id", id)
        .maybeSingle();
      if (alive) {
        setAct((data ?? null) as Act | null);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) return <p className="px-4 py-6">Загрузка...</p>;
  if (!act) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">Акт не найден.</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold">{act.title}</h1>
      <div className="text-xs text-gray-500">
        Опубликовано: {new Date(act.published_at).toLocaleString()}
      </div>
      {act.summary && (
        <p className="rounded-xl border bg-white p-4 text-sm text-gray-700 shadow-sm">
          {act.summary}
        </p>
      )}
      <article className="prose max-w-none rounded-xl border bg-white p-5 shadow-sm">
        <pre className="whitespace-pre-wrap text-sm leading-relaxed">{act.content}</pre>
      </article>
      {act.source_url && (
        <div className="rounded-xl border bg-white p-4 text-sm shadow-sm">
          Источник:{" "}
          <a href={act.source_url} className="text-indigo-600 underline" target="_blank">
            {act.source_url}
          </a>
        </div>
      )}
    </div>
  );
}
