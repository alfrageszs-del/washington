"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import type { Profile } from "../../lib/supabase/client";

type GovAct = {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  status: string;
  source_url?: string;
  created_at: string;
  updated_at: string;
};

export default function GovActsPage() {
  const [acts, setActs] = useState<GovAct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<Profile | null>(null);
  const [canCreate, setCanCreate] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    content: "",
    status: "draft" as const,
    source_url: ""
  });

  useEffect(() => {
    loadUserAndActs();
  }, []);

  const loadUserAndActs = async () => {
    try {
      // Загружаем пользователя
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        
        if (profile) {
          setUser(profile);
          setCanCreate(
            profile.gov_role === "TECH_ADMIN" || 
            profile.gov_role === "ATTORNEY_GENERAL" || 
            profile.gov_role === "CHIEF_JUSTICE" ||
            profile.faction === "GOV"
          );
        }
      }

      // Загружаем акты с информацией об авторе
      const { data: actsData, error: actsError } = await supabase
        .from("gov_acts")
        .select(`
          *,
          author:profiles!gov_acts_author_id_fkey(nickname, static_id)
        `)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (actsError) {
        setError(`Ошибка загрузки актов: ${actsError.message}`);
      } else {
        const formattedActs = actsData?.map(act => ({
          ...act,
          author_name: act.author?.nickname || "Неизвестно"
        })) || [];
        setActs(formattedActs);
      }
    } catch (err) {
      setError(`Ошибка: ${err instanceof Error ? err.message : "Неизвестная ошибка"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAct = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("gov_acts")
        .insert({
          title: createForm.title,
          content: createForm.content,
          status: createForm.status,
          source_url: createForm.source_url || null,
          author_id: user.id
        });

      if (error) {
        setError(`Ошибка создания акта: ${error.message}`);
        return;
      }

      // Закрываем форму и перезагружаем
      setShowCreateForm(false);
      setCreateForm({ title: "", content: "", status: "draft", source_url: "" });
      await loadUserAndActs();
      setError(""); // Очищаем ошибки
    } catch (err) {
      setError(`Ошибка: ${err instanceof Error ? err.message : "Неизвестная ошибка"}`);
    }
  };

  const handleDeleteAct = async (id: string) => {
    if (!confirm("Удалить этот акт? Это действие необратимо.")) return;

    try {
      const { error } = await supabase
        .from("gov_acts")
        .delete()
        .eq("id", id);

      if (error) {
        setError(`Ошибка удаления: ${error.message}`);
        return;
      }

      await loadUserAndActs();
      setError(""); // Очищаем ошибки
    } catch (err) {
      setError(`Ошибка: ${err instanceof Error ? err.message : "Неизвестная ошибка"}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Акты правительства</h1>
              <p className="mt-2 text-sm text-gray-600">
                Реестр всех опубликованных актов правительства
              </p>
            </div>
            {canCreate && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Создать акт
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Сообщения об ошибках */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Список актов */}
        {acts.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Нет актов</h3>
            <p className="mt-1 text-sm text-gray-500">
              Пока не создано ни одного акта правительства.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {acts.map((act) => (
              <div key={act.id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      act.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {act.status === 'published' ? 'Опубликован' : 'Черновик'}
                    </span>
                    {user && (user.gov_role === "TECH_ADMIN" || act.author_id === user.id) && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDeleteAct(act.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                    <a 
                      href={`/acts-government/${act.id}`} 
                      target="_blank"
                      className="hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      {act.title}
                    </a>
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {act.content}
                  </p>
                  
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Автор: {act.author_name}</span>
                      <span>{new Date(act.created_at).toLocaleDateString("ru-RU")}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модальное окно создания акта */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Создать новый акт правительства</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); handleCreateAct(); }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Название акта *
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.title}
                      onChange={(e) => setCreateForm({...createForm, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Введите название акта правительства"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Содержание акта *
                    </label>
                    <textarea
                      required
                      rows={6}
                      value={createForm.content}
                      onChange={(e) => setCreateForm({...createForm, content: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Введите содержание акта правительства"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Статус
                    </label>
                    <select
                      value={createForm.status}
                      onChange={(e) => setCreateForm({...createForm, status: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="draft">Черновик</option>
                      <option value="published">Опубликован</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ссылка на источник
                    </label>
                    <input
                      type="url"
                      value={createForm.source_url}
                      onChange={(e) => setCreateForm({...createForm, source_url: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="https://example.com/document"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={!createForm.title || !createForm.content}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Создать акт
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
