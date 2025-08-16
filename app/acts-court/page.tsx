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
  status: string;
};

export default function CourtActsPage() {
  const [me, setMe] = useState<Pick<Profile, "id" | "gov_role"> | null>(null);
  const [acts, setActs] = useState<CourtActRow[]>([]);
  const [canCreate, setCanCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    content: "",
    status: "draft",
    source_url: ""
  });

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      setInfo("");

      const { data: rows, error: selErr } = await supabase
        .from("court_acts")
        .select("id,judge_id,title,content,created_at,status")
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

  const handleCreateAct = async () => {
    if (!me) return;
    
    try {
      const { data, error } = await supabase
        .from("court_acts")
        .insert({
          title: createForm.title,
          content: createForm.content,
          status: createForm.status,
          source_url: createForm.source_url || null,
          judge_id: me.id
        })
        .select()
        .single();

      if (error) {
        setInfo(error.message);
        return;
      }

      // Закрываем форму и перезагружаем акты
      setShowCreateForm(false);
      setCreateForm({ title: "", content: "", status: "draft", source_url: "" });
      await loadActs();
      setInfo("Акт суда успешно создан!");
    } catch (error) {
      console.error("Ошибка при создании акта:", error);
      setInfo("Ошибка при создании акта");
    }
  };

  const loadActs = async () => {
    const { data: rows, error: selErr } = await supabase
      .from("court_acts")
      .select("id,judge_id,title,content,created_at,status")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (selErr) setInfo(selErr.message);
    setActs((rows ?? []) as CourtActRow[]);
  };

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
          <button
            onClick={() => setShowCreateForm(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Новый акт
          </button>
        )}
      </div>

      {info && <p className="mb-4 text-sm text-red-600">{info}</p>}

      {/* Форма создания акта */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Создать новый судебный акт</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название акта
                </label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({...createForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите название судебного акта"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Содержание акта
                </label>
                <textarea
                  value={createForm.content}
                  onChange={(e) => setCreateForm({...createForm, content: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={10}
                  placeholder="Введите содержание судебного акта"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Статус
                </label>
                <select
                  value={createForm.status}
                  onChange={(e) => setCreateForm({...createForm, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Черновик</option>
                  <option value="published">Опубликован</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ссылка на источник (обязательно)
                </label>
                <input
                  type="url"
                  required
                  value={createForm.source_url}
                  onChange={(e) => setCreateForm({...createForm, source_url: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/document"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateAct}
                  disabled={!createForm.title || !createForm.content || !createForm.source_url}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Создать акт
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
