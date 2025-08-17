"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import type { Profile } from "../../lib/supabase/client";

type Inspection = {
  id: string;
  title: string;
  created_by: string;
  inspector_name: string;
  target_id: string;
  target_name: string;
  inspection_type: string;
  status: string;
  description?: string;
  created_at: string;
  updated_at: string;
};

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<Profile | null>(null);
  const [canCreate, setCanCreate] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    target_id: "",
    target_name: "",
    inspection_type: "scheduled" as const,
    description: ""
  });

  useEffect(() => {
    loadUserAndInspections();
  }, []);

  const loadUserAndInspections = async () => {
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
            profile.faction === "EMS" && profile.gov_role === "LEADER" ||
            profile.faction === "GOV" ||
            profile.gov_role === "TECH_ADMIN"
          );
        }
      }

      // Загружаем проверки с информацией об инспекторе
      const { data: inspectionsData, error: inspectionsError } = await supabase
        .from("inspections")
        .select(`
          *,
          inspector:profiles!inspections_created_by_fkey(full_name)
        `)
        .order("created_at", { ascending: false });

      if (inspectionsError) {
        setError(`Ошибка загрузки проверок: ${inspectionsError.message}`);
      } else {
        const formattedInspections = inspectionsData?.map(inspection => ({
          ...inspection,
          inspector_name: inspection.inspector?.full_name || "Неизвестно"
        })) || [];
        setInspections(formattedInspections);
      }
    } catch (err) {
      setError(`Ошибка: ${err instanceof Error ? err.message : "Неизвестная ошибка"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInspection = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("inspections")
        .insert({
          title: createForm.title,
          target_id: createForm.target_id,
          target_name: createForm.target_name,
          inspection_type: createForm.inspection_type,
          description: createForm.description || null,
          created_by: user.id
        });

      if (error) {
        setError(`Ошибка создания проверки: ${error.message}`);
        return;
      }

      // Закрываем форму и перезагружаем
      setShowCreateForm(false);
      setCreateForm({ 
        title: "", 
        target_id: "", 
        target_name: "",
        inspection_type: "scheduled", 
        description: ""
      });
      await loadUserAndInspections();
      setError(""); // Очищаем ошибки
    } catch (err) {
      setError(`Ошибка: ${err instanceof Error ? err.message : "Неизвестная ошибка"}`);
    }
  };

  const handleDeleteInspection = async (id: string) => {
    if (!confirm("Удалить эту проверку? Это действие необратимо.")) return;

    try {
      const { error } = await supabase
        .from("inspections")
        .delete()
        .eq("id", id);

      if (error) {
        setError(`Ошибка удаления: ${error.message}`);
        return;
      }

      await loadUserAndInspections();
      setError(""); // Очищаем ошибки
    } catch (err) {
      setError(`Ошибка: ${err instanceof Error ? err.message : "Неизвестная ошибка"}`);
    }
  };

  const getInspectionTypeText = (type: string) => {
    switch (type) {
      case 'scheduled': return 'Плановая';
      case 'unscheduled': return 'Внеплановая';
      case 'follow_up': return 'Повторная';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planned': return 'Запланирована';
      case 'in_progress': return 'В процессе';
      case 'completed': return 'Завершена';
      case 'cancelled': return 'Отменена';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
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
              <h1 className="text-3xl font-bold text-gray-900">Проверки и надзор</h1>
              <p className="mt-2 text-sm text-gray-600">
                Реестр всех проверок и надзорных мероприятий
              </p>
            </div>
            {canCreate && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Создать проверку
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

        {/* Список проверок */}
        {inspections.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Нет проверок</h3>
            <p className="mt-1 text-sm text-gray-500">
              Пока не создано ни одной проверки.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {inspections.map((inspection) => (
              <div key={inspection.id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                      {getStatusText(inspection.status)}
                    </span>
                    {user && (user.gov_role === "TECH_ADMIN" || inspection.created_by === user.id) && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDeleteInspection(inspection.id)}
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
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {getInspectionTypeText(inspection.inspection_type)}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                    {inspection.title}
                  </h3>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Объект:</span> {inspection.target_name}
                    </p>
                  </div>
                  
                  {inspection.description && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Описание:</h4>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {inspection.description}
                      </p>
                    </div>
                  )}
                  
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Инспектор:</span>
                      <span className="text-gray-900 font-medium">{inspection.inspector_name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Дата создания:</span>
                      <span>{new Date(inspection.created_at).toLocaleDateString("ru-RU")}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модальное окно создания проверки */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Создать новую проверку</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); handleCreateInspection(); }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Название проверки *
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.title}
                      onChange={(e) => setCreateForm({...createForm, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Введите название проверки"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Объект проверки *
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.target_id}
                      onChange={(e) => setCreateForm({...createForm, target_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="ID объекта проверки"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Название объекта проверки *
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.target_name}
                      onChange={(e) => setCreateForm({...createForm, target_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Название организации или объекта"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Тип проверки *
                    </label>
                    <select
                      value={createForm.inspection_type}
                      onChange={(e) => setCreateForm({...createForm, inspection_type: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="scheduled">Плановая</option>
                      <option value="unscheduled">Внеплановая</option>
                      <option value="follow_up">Повторная</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Описание проверки
                    </label>
                    <textarea
                      rows={4}
                      value={createForm.description}
                      onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Описание проверки и её цели"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={!createForm.title || !createForm.target_id || !createForm.target_name || !createForm.inspection_type}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Создать проверку
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
