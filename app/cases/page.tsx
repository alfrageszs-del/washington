"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import type { Profile } from "../../lib/supabase/client";

type Case = {
  id: string;
  case_number: string;
  title: string;
  description?: string;
  prosecutor_id: string;
  prosecutor_name: string;
  judge_id?: string;
  judge_name?: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<Profile | null>(null);
  const [canCreate, setCanCreate] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [judges, setJudges] = useState<Profile[]>([]);
  const [createForm, setCreateForm] = useState({
    case_number: "",
    title: "",
    description: "",
    judge_id: ""
  });

  useEffect(() => {
    loadUserAndCases();
    loadJudges();
  }, []);

  const loadJudges = async () => {
    try {
      const { data: judgesData, error: judgesError } = await supabase
        .from("profiles")
        .select("id, full_name, nickname")
        .eq("gov_role", "JUDGE")
        .eq("is_verified", true)
        .order("full_name");

      if (judgesError) {
        console.error("Ошибка загрузки судей:", judgesError);
      } else {
        setJudges(judgesData || []);
      }
    } catch (err) {
      console.error("Ошибка загрузки судей:", err);
    }
  };

  const loadUserAndCases = async () => {
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
            profile.gov_role === "PROSECUTOR" || 
            profile.gov_role === "JUDGE" || 
            profile.gov_role === "TECH_ADMIN" || 
            profile.gov_role === "ATTORNEY_GENERAL" || 
            profile.gov_role === "CHIEF_JUSTICE"
          );
        }
      }

      // Загружаем дела с информацией об участниках
      const { data: casesData, error: casesError } = await supabase
        .from("cases")
        .select(`
          *,
          prosecutor:profiles!cases_prosecutor_id_fkey(full_name),
          judge:profiles!cases_judge_id_fkey(full_name)
        `)
        .order("created_at", { ascending: false });

      if (casesError) {
        setError(`Ошибка загрузки дел: ${casesError.message}`);
      } else {
        const formattedCases = casesData?.map(caseItem => ({
          ...caseItem,
          prosecutor_name: caseItem.prosecutor?.full_name || "Неизвестно",
          judge_name: caseItem.judge?.full_name || "Не назначен"
        })) || [];
        setCases(formattedCases);
      }
    } catch (err) {
      setError(`Ошибка: ${err instanceof Error ? err.message : "Неизвестная ошибка"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCase = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("cases")
        .insert({
          case_number: createForm.case_number,
          title: createForm.title,
          description: createForm.description || null,
          prosecutor_id: user.id,
          judge_id: createForm.judge_id || null
        });

      if (error) {
        setError(`Ошибка создания дела: ${error.message}`);
        return;
      }

      // Закрываем форму и перезагружаем
      setShowCreateForm(false);
      setCreateForm({ case_number: "", title: "", description: "", judge_id: "" });
      await loadUserAndCases();
      setError(""); // Очищаем ошибки
    } catch (err) {
      setError(`Ошибка: ${err instanceof Error ? err.message : "Неизвестная ошибка"}`);
    }
  };

  const handleDeleteCase = async (id: string) => {
    if (!confirm("Удалить это дело? Это действие необратимо.")) return;

    try {
      const { error } = await supabase
        .from("cases")
        .delete()
        .eq("id", id);

      if (error) {
        setError(`Ошибка удаления: ${error.message}`);
        return;
      }

      await loadUserAndCases();
      setError(""); // Очищаем ошибки
    } catch (err) {
      setError(`Ошибка: ${err instanceof Error ? err.message : "Неизвестная ошибка"}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Открыто';
      case 'in_progress': return 'В процессе';
      case 'closed': return 'Закрыто';
      case 'archived': return 'Архивировано';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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
              <h1 className="text-3xl font-bold text-gray-900">Дела</h1>
              <p className="mt-2 text-sm text-gray-600">
                Картотека делопроизводств
              </p>
            </div>
            {canCreate && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                    Создать делопроизводство
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

        {/* Список дел */}
        {cases.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Нет дел</h3>
            <p className="mt-1 text-sm text-gray-500">
              Пока не создано ни одного делопроизводства.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cases.map((caseItem) => (
              <div key={caseItem.id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(caseItem.status)}`}>
                      {getStatusText(caseItem.status)}
                    </span>
                    {user && (user.gov_role === "TECH_ADMIN" || caseItem.prosecutor_id === user.id) && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDeleteCase(caseItem.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {caseItem.case_number}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                    {caseItem.title}
                  </h3>
                  
                  {caseItem.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {caseItem.description}
                    </p>
                  )}
                  
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Прокурор:</span>
                      <span className="text-gray-900 font-medium">{caseItem.prosecutor_name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Судья:</span>
                      <span className="text-gray-900 font-medium">
                        {caseItem.judge_name === "Не назначен" ? (
                          <span className="text-gray-400 italic">Не назначен</span>
                        ) : caseItem.judge_name === "Выберите судью" ? (
                          <span className="text-gray-400 italic">Не назначен</span>
                        ) : (
                          caseItem.judge_name
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Дата создания:</span>
                      <span>{new Date(caseItem.created_at).toLocaleDateString("ru-RU")}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модальное окно создания дела */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Создать новое делопроизводство</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); handleCreateCase(); }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Номер делопроизводства *
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.case_number}
                      onChange={(e) => setCreateForm({...createForm, case_number: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ДП №123/2024"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Название делопроизводства *
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.title}
                      onChange={(e) => setCreateForm({...createForm, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Введите название делопроизводства"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Описание делопроизводства
                    </label>
                    <textarea
                      rows={4}
                      value={createForm.description}
                      onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Краткое описание делопроизводства"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Судья для рассмотрения
                    </label>
                    <select
                      value={createForm.judge_id}
                      onChange={(e) => setCreateForm({...createForm, judge_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Выберите судью</option>
                      {judges.map(judge => (
                        <option key={judge.id} value={judge.id}>{judge.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={!createForm.case_number || !createForm.title}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Создать дело
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
