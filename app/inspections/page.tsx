"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import type { Profile } from "../../lib/supabase/client";

interface Inspection {
  id: string;
  title: string;
  inspector_id: string;
  target_entity: string;
  inspection_type: "scheduled" | "unscheduled" | "follow_up";
  status: "planned" | "in_progress" | "completed" | "cancelled";
  start_date: string;
  end_date?: string;
  findings?: string;
  recommendations?: string;
  created_at: string;
  updated_at: string;
}

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    target_entity: "",
    inspection_type: "scheduled" as "scheduled" | "unscheduled" | "follow_up",
    start_date: "",
    end_date: "",
    findings: "",
    recommendations: ""
  });

  useEffect(() => {
    loadUserProfile();
    loadInspections();
  }, []);

  const loadUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setUserProfile(profile);
    }
  };

  const loadInspections = async () => {
    setLoading(true);
    try {
      const { data: inspectionsData } = await supabase
        .from("inspections")
        .select("*")
        .order("created_at", { ascending: false });

      if (inspectionsData) {
        setInspections(inspectionsData as Inspection[]);
      }
    } catch (error) {
      console.error("Ошибка при загрузке проверок:", error);
    } finally {
      setLoading(false);
    }
  };

  const canCreateInspection = () => {
    if (!userProfile) return false;
    return ["TECH_ADMIN", "ATTORNEY_GENERAL", "CHIEF_JUSTICE"].includes(userProfile.gov_role);
  };

  const handleCreateInspection = async () => {
    if (!userProfile) return;
    
    try {
      const { data, error } = await supabase
        .from("inspections")
        .insert({
          title: createForm.title,
          inspector_id: userProfile.id,
          target_entity: createForm.target_entity,
          inspection_type: createForm.inspection_type,
          status: "planned",
          start_date: createForm.start_date,
          end_date: createForm.end_date || null,
          findings: createForm.findings || null,
          recommendations: createForm.recommendations || null
        })
        .select()
        .single();

      if (error) {
        console.error("Ошибка при создании проверки:", error);
        return;
      }

      // Закрываем форму и перезагружаем проверки
      setShowCreateForm(false);
      setCreateForm({
        title: "",
        target_entity: "",
        inspection_type: "scheduled",
        start_date: "",
        end_date: "",
        findings: "",
        recommendations: ""
      });
      await loadInspections();
    } catch (error) {
      console.error("Ошибка при создании проверки:", error);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "scheduled": return "Плановая";
      case "unscheduled": return "Внеплановая";
      case "follow_up": return "Повторная";
      default: return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "planned": return "Запланирована";
      case "in_progress": return "В процессе";
      case "completed": return "Завершена";
      case "cancelled": return "Отменена";
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "planned": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-8">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Проверки и надзор</h1>
        {canCreateInspection() && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Создать проверку
          </button>
        )}
      </div>

      {/* Форма создания проверки */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Создать новую проверку</h2>
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
                  Название проверки
                </label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm({...createForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите название проверки"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Объект проверки
                </label>
                <input
                  type="text"
                  required
                  value={createForm.target_entity}
                  onChange={(e) => setCreateForm({...createForm, target_entity: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите объект проверки"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тип проверки
                </label>
                <select
                  value={createForm.inspection_type}
                  onChange={(e) => setCreateForm({...createForm, inspection_type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="scheduled">Плановая</option>
                  <option value="unscheduled">Внеплановая</option>
                  <option value="follow_up">Повторная</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Дата начала
                </label>
                <input
                  type="datetime-local"
                  required
                  value={createForm.start_date}
                  onChange={(e) => setCreateForm({...createForm, start_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Дата окончания (необязательно)
                </label>
                <input
                  type="datetime-local"
                  value={createForm.end_date}
                  onChange={(e) => setCreateForm({...createForm, end_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Найденные нарушения
                </label>
                <textarea
                  value={createForm.findings}
                  onChange={(e) => setCreateForm({...createForm, findings: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Опишите найденные нарушения"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Рекомендации
                </label>
                <textarea
                  value={createForm.recommendations}
                  onChange={(e) => setCreateForm({...createForm, recommendations: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Укажите рекомендации по устранению нарушений"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateInspection}
                  disabled={!createForm.title || !createForm.target_entity || !createForm.start_date}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Создать проверку
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

      {/* Список проверок */}
      <div className="grid gap-4">
        {inspections.length > 0 ? (
          inspections.map((inspection) => (
            <div key={inspection.id} className="bg-white rounded-lg border p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{inspection.title}</h3>
                  <p className="text-sm text-gray-600">Объект: {inspection.target_entity}</p>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {getTypeLabel(inspection.inspection_type)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(inspection.status)}`}>
                    {getStatusLabel(inspection.status)}
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="text-gray-500">Дата начала:</span>{" "}
                  <span className="font-medium">
                    {new Date(inspection.start_date).toLocaleString("ru-RU")}
                  </span>
                </div>
                {inspection.end_date && (
                  <div>
                    <span className="text-gray-500">Дата окончания:</span>{" "}
                    <span className="font-medium">
                      {new Date(inspection.end_date).toLocaleString("ru-RU")}
                    </span>
                  </div>
                )}
              </div>

              {inspection.findings && (
                <div className="mb-4">
                  <span className="text-sm text-gray-500">Нарушения:</span>
                  <div className="mt-1 text-sm text-gray-700">{inspection.findings}</div>
                </div>
              )}

              {inspection.recommendations && (
                <div className="mb-4">
                  <span className="text-sm text-gray-500">Рекомендации:</span>
                  <div className="mt-1 text-sm text-gray-700">{inspection.recommendations}</div>
                </div>
              )}

              <div className="text-xs text-gray-500">
                {new Date(inspection.created_at).toLocaleDateString("ru-RU")}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            Проверки не найдены
          </div>
        )}
      </div>
    </div>
  );
}
