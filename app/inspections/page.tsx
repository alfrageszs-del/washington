"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase/client";

interface Inspection {
  id: string;
  title: string;
  inspector_id: string | null;
  inspector_name: string;
  department: string;
  target_entity: string;
  inspection_date: string;
  findings: string | null;
  recommendations: string | null;
  status: "scheduled" | "in_progress" | "completed";
  created_at: string;
}

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [filter, setFilter] = useState<"all" | "prosecutor" | "ems">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState("");

  useEffect(() => {
    loadInspections();
  }, []);

  const loadInspections = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("inspections")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setInfo(error.message);
      } else {
        setInspections(data || []);
      }
    } catch (error) {
      setInfo("Ошибка при загрузке проверок");
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (department: string) => {
    return department.toLowerCase().includes("прокурор") || department.toLowerCase().includes("prosecutor") 
      ? "bg-red-100 text-red-800" 
      : "bg-blue-100 text-blue-800";
  };

  const getTypeLabel = (department: string) => {
    return department.toLowerCase().includes("прокурор") || department.toLowerCase().includes("prosecutor") 
      ? "Прокурорская" 
      : "EMS";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "scheduled": return "Запланирована";
      case "in_progress": return "В процессе";
      case "completed": return "Завершена";
      default: return "Неизвестно";
    }
  };

  const filteredInspections = inspections.filter(inspection => {
    if (filter !== "all") {
      const isProsecutor = inspection.department.toLowerCase().includes("прокурор") || 
                          inspection.department.toLowerCase().includes("prosecutor");
      if (filter === "prosecutor" && !isProsecutor) return false;
      if (filter === "ems" && isProsecutor) return false;
    }
    if (statusFilter !== "all" && inspection.status !== statusFilter) return false;
    if (searchQuery && !inspection.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !inspection.target_entity.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-500">Загрузка проверок...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Проверки и надзор</h1>
            <p className="text-gray-600 mt-2">
              Прокурорские проверки и EMS инспекции для обеспечения прозрачности работы правоохранительных органов
            </p>
          </div>
        </div>

        {info && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            {info}
          </div>
        )}

        {/* Фильтры */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Поиск
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию или объекту..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип проверки
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Все типы</option>
                <option value="prosecutor">Прокурорские</option>
                <option value="ems">EMS</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Статус
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Все статусы</option>
                <option value="scheduled">Запланированные</option>
                <option value="in_progress">В процессе</option>
                <option value="completed">Завершенные</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilter("all");
                  setStatusFilter("all");
                  setSearchQuery("");
                }}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Сбросить фильтры
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Список проверок */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Список проверок</h2>
                <p className="text-gray-500 text-sm">Найдено: {filteredInspections.length}</p>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {filteredInspections.length > 0 ? (
                  <div className="divide-y">
                    {filteredInspections.map((inspection) => (
                      <div
                        key={inspection.id}
                        onClick={() => setSelectedInspection(inspection)}
                        className={`p-4 cursor-pointer transition-colors ${
                          selectedInspection?.id === inspection.id ? "bg-blue-50 border-l-4 border-blue-500" : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(inspection.department)}`}>
                            {getTypeLabel(inspection.department)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                            {getStatusLabel(inspection.status)}
                          </span>
                        </div>
                        
                        <h3 className="font-semibold mb-1">{inspection.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{inspection.target_entity}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(inspection.inspection_date)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Проверки не найдены</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Детали проверки */}
          <div className="lg:col-span-2">
            {selectedInspection ? (
              <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">{selectedInspection.title}</h2>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(selectedInspection.department)}`}>
                          {getTypeLabel(selectedInspection.department)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedInspection.status)}`}>
                          {getStatusLabel(selectedInspection.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Основная информация */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Основная информация</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="font-medium text-gray-700">Дата:</span> {formatDate(selectedInspection.inspection_date)}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Инспектор:</span> {selectedInspection.inspector_name}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Ведомство:</span> {selectedInspection.department}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Объект проверки:</span> {selectedInspection.target_entity}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Описание</h3>
                      <p className="text-gray-600">{selectedInspection.title}</p>
                    </div>
                  </div>

                  {/* Результаты проверки */}
                  {selectedInspection.findings && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold mb-4">Выявленные нарушения</h3>
                      <div className="p-3 bg-red-50 rounded-lg">
                        <span className="text-red-800">{selectedInspection.findings}</span>
                      </div>
                    </div>
                  )}

                  {/* Рекомендации */}
                  {selectedInspection.recommendations && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold mb-4">Рекомендации</h3>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <span className="text-green-800">{selectedInspection.recommendations}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <h3 className="text-lg font-semibold mb-2">Выберите проверку</h3>
                <p className="text-gray-500">Выберите проверку из списка слева для просмотра деталей</p>
              </div>
            )}
          </div>
        </div>

        {/* Информация о прозрачности */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            О прозрачности работы
          </h3>
          <p className="text-blue-700 text-sm mb-3">
            Данный раздел создан для обеспечения прозрачности работы правоохранительных органов и медицинских служб. 
            Здесь публикуются результаты проверок, выявленные нарушения и рекомендации по их устранению.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-800 mb-1">Прокурорские проверки</h4>
              <p className="text-blue-700">
                Надзорные мероприятия прокуратуры по проверке соблюдения законности в деятельности правоохранительных органов.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-1">EMS инспекции</h4>
              <p className="text-blue-700">
                Проверки качества медицинского обслуживания и соблюдения санитарных норм в медицинских учреждениях.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
