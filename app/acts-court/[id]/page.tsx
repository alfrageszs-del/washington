"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase/client";
import type { Profile } from "../../../lib/supabase/client";
import { FactionLabel } from "../../../lib/supabase/client";
import { useRouter } from "next/navigation";

type Act = {
  id: string;
  author_id: string;
  title: string;
  summary: string | null;
  content: string;
  source_url: string | null;
  published_at: string;
};

type Author = Pick<Profile, "id" | "nickname" | "faction" | "gov_role">;

const roleRu: Record<Profile["gov_role"], string> = {
  NONE: "Нет",
  PROSECUTOR: "Прокурор",
  JUDGE: "Судья",
  TECH_ADMIN: "Тех. администратор",
    ATTORNEY_GENERAL: "Генеральный прокурор", // NEW
    CHIEF_JUSTICE: "Главный судья", // NEW
};

export default function CourtActView({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();

  const [me, setMe] = useState<Pick<Profile, "id" | "gov_role"> | null>(null);
  const [act, setAct] = useState<Act | null>(null);
  const [author, setAuthor] = useState<Author | null>(null);
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setInfo("");

      const { data: A, error: e1 } = await supabase
        .from("court_acts")
        .select("id,author_id,title,summary,content,source_url,published_at")
        .eq("id", id)
        .maybeSingle();
      if (e1) setInfo(e1.message);
      const actRow = (A ?? null) as Act | null;
      if (alive) setAct(actRow);

      if (actRow?.author_id) {
        const { data: P } = await supabase
          .from("profiles")
          .select("id,nickname,faction,gov_role")
          .eq("id", actRow.author_id)
          .maybeSingle();
        if (alive) setAuthor((P ?? null) as Author | null);
      } else if (alive) {
        setAuthor(null);
      }

      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id;
      if (uid) {
        const { data: p } = await supabase
          .from("profiles")
          .select("id,gov_role")
          .eq("id", uid)
          .maybeSingle();
        if (alive) setMe(p ? { id: p.id, gov_role: p.gov_role } : null);
      } else if (alive) {
        setMe(null);
      }

      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const isTechAdmin = me?.gov_role === "TECH_ADMIN";
  const canEdit = useMemo(() => (act && me ? isTechAdmin || act.author_id === me.id : false), [act, me, isTechAdmin]);

  const onDelete = async () => {
    if (!act) return;
    if (!confirm("Удалить этот судебный акт? Это действие необратимо.")) return;
    setInfo("");
    const { error } = await supabase.from("court_acts").delete().eq("id", act.id);
    if (error) return setInfo(error.message);
    router.push("/acts-court");
  };

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
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{act.title}</h1>
          <div className="mt-1 text-xs text-gray-500">
            Опубликовано: {new Date(act.published_at).toLocaleString()}
          </div>
          {author && (
            <div className="mt-2 text-sm text-gray-700">
              Автор: <span className="font-medium">{author.nickname}</span>{" "}
              <span className="text-gray-500">
                ({roleRu[author.gov_role]}, {FactionLabel[author.faction]})
              </span>
            </div>
          )}
        </div>

        {canEdit && (
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={`/acts-court/${act.id}/edit`}
              className="rounded-md border px-3 py-1.5 text-xs hover:bg-gray-50"
            >
              Редактировать
            </a>
            <button
              onClick={onDelete}
              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
            >
              Удалить
            </button>
          </div>
        )}
      </div>

      {info && <p className="text-sm text-red-600">{info}</p>}

      {act.summary && (
        <p className="rounded-xl border bg-white p-4 text-sm text-gray-700 shadow-sm">{act.summary}</p>
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
