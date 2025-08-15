"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";

export default function NewGovActPage() {
  const router = useRouter();
  const [canCreate, setCanCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [info, setInfo] = useState<string>("");

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id;
      if (!uid) {
        setCanCreate(false);
        return;
      }
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
    })();

    return () => {
      alive = false;
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfo("");
    if (!canCreate) {
      setInfo("Нет прав на публикацию акта.");
      return;
    }
    if (title.trim().length < 5) {
      setInfo("Заголовок минимум 5 символов.");
      return;
    }
    if (content.trim().length < 20) {
      setInfo("Текст акта слишком короткий.");
      return;
    }

    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user?.id;
    if (!uid) {
      setInfo("Вы не авторизованы.");
      return;
    }

    const { data, error } = await supabase
      .from("gov_acts")
      .insert({
        author_id: uid,
        title: title.trim(),
        summary: summary.trim() || null,
        content: content.trim(),
        source_url: url.trim() || null,
        is_published: true,
      })
      .select("id")
      .single();

    if (error) {
      setInfo(error.message);
      return;
    }
    router.push(`/acts-government/${data!.id}`);
  };

  if (!canCreate) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-2xl font-bold">Новый акт</h1>
        <div className="mt-4 rounded-2xl border bg-white p-5 shadow-sm text-sm">
          У вас нет прав на публикацию актов.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-bold">Новый акт</h1>

      <form onSubmit={onSubmit} className="mt-4 space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
        <label className="block">
          <span className="mb-1 block text-sm">Заголовок</span>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Постановление №123 ..."
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
            placeholder="Текст акта..."
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

        <div className="pt-2 flex items-center gap-3">
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Опубликовать
          </button>
          {info && <span className="text-sm text-gray-700">{info}</span>}
        </div>
      </form>
    </div>
  );
}
