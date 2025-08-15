"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase/client";
import type { Profile } from "../../../../lib/supabase/client";

type Act = {
  id: string;
  author_id: string;
  title: string;
  summary: string | null;
  content: string;
  source_url: string | null;
  is_published: boolean;
};

export default function EditGovActPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();

  const [me, setMe] = useState<Pick<Profile, "id" | "gov_role"> | null>(null);
  const [act, setAct] = useState<Act | null>(null);
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState("");

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [published, setPublished] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setInfo("");

      // акт
      const { data: A, error: e1 } = await supabase
        .from("gov_acts")
        .select("id,author_id,title,summary,content,source_url,is_published")
        .eq("id", id)
        .maybeSingle();
      if (e1) setInfo(e1.message);
      const row = (A ?? null) as Act | null;
      if (alive) {
        setAct(row);
        if (row) {
          setTitle(row.title);
          setSummary(row.summary ?? "");
          setContent(row.content);
          setUrl(row.source_url ?? "");
          setPublished(row.is_published);
        }
      }

      // я
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

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!act || !canEdit) return;
    setInfo("");

    if (title.trim().length < 5) {
      setInfo("Заголовок минимум 5 символов.");
      return;
    }
    if (content.trim().length < 20) {
      setInfo("Текст акта слишком короткий.");
      return;
    }

    const { error } = await supabase
      .from("gov_acts")
      .update({
        title: title.trim(),
        summary: summary.trim() || null,
        content: content.trim(),
        source_url: url.trim() || null,
        is_published: published,
      })
      .eq("id", act.id);

    if (error) {
      setInfo(error.message);
      return;
    }
    router.push(`/acts-government/${act.id}`);
  };

  if (loading) return <p className="px-4 py-6">Загрузка...</p>;
  if (!act) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">Акт не найден.</div>
      </div>
    );
  }
  if (!canEdit) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">Доступ только автору или тех.админу.</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-bold">Редактирование акта</h1>

      <form onSubmit={onSave} className="mt-4 space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
        <label className="block">
          <span className="mb-1 block text-sm">Заголовок</span>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm">Краткое описание (опционально)</span>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm">Текст акта</span>
          <textarea
            className="min-h-[180px] w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm">Источник (ссылка, опционально)</span>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
          />
        </label>

        <label className="flex items-center gap-2 pt-1 text-sm">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          Опубликован (виден всем)
        </label>

        <div className="pt-2 flex items-center gap-3">
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Сохранить
          </button>
          {info && <span className="text-sm text-gray-700">{info}</span>}
        </div>
      </form>
    </div>
  );
}
