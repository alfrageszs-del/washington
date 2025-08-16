"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Inspection {
  id: string;
  title: string;
  type: "prosecutor" | "ems";
  status: "planned" | "in_progress" | "completed" | "cancelled";
  date: string;
  duration: string;
  location: string;
  inspector: string;
  target: string;
  description: string;
  findings: string[];
  recommendations: string[];
  documents: {
    id: string;
    title: string;
    type: string;
    date: string;
    url: string;
  }[];
  isPublic: boolean;
}

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [filter, setFilter] = useState<"all" | "prosecutor" | "ems">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);

  useEffect(() => {
    // Загрузка данных о проверках
    const mockInspections: Inspection[] = [
      {
        id: "1",
        title: "Проверка деятельности LSPD",
        type: "prosecutor",
        status: "completed",
        date: "2024-01-15",
        duration: "3 часа",
        location: "Отделение LSPD",
        inspector: "Прокурор Иванов И.И.",
        target: "Департамент полиции Лос-Сантоса",
        description: "Плановое прокурорское надзорное мероприятие по проверке соблюдения законности в деятельности полицейского департамента.",
        findings: [
          "Выявлены нарушения в ведении документации",
          "Отсутствуют необходимые протоколы задержаний",
          "Нарушения в процедуре досмотра транспортных средств"
        ],
        recommendations: [
          "Улучшить систему документооборота",
          "Провести дополнительное обучение сотрудников",
          "Внедрить электронную систему учета"
        ],
        documents: [
          {
            id: "doc1",
            title: "Акт прокурорской проверки",
            type: "Акт",
            date: "2024-01-15",
            url: "/inspections/doc1"
          },
          {
            id: "doc2",
            title: "Предписание об устранении нарушений",
            type: "Предписание",
            date: "2024-01-16",
            url: "/inspections/doc2"
          }
        ],
        isPublic: true
      },
      {
        id: "2",
        title: "Проверка медицинского учреждения",
        type: "ems",
        status: "in_progress",
        date: "2024-01-20",
        duration: "2 часа",
        location: "Госпиталь Лос-Сантоса",
        inspector: "Инспектор EMS Петрова П.П.",
        target: "Госпиталь Лос-Сантоса",
        description: "Внеплановая проверка качества медицинского обслуживания и соблюдения санитарных норм.",
        findings: [
          "Проверка в процессе"
        ],
        recommendations: [],
        documents: [
          {
            id: "doc3",
            title: "Предварительный отчет",
            type: "Отчет",
            date: "2024-01-20",
            url: "/inspections/doc3"
          }
        ],
        isPublic: true
      },
      {
        id: "3",
        title: "Проверка FIB",
        type: "prosecutor",
        status: "planned",
        date: "2024-01-25",
        duration: "4 часа",
        location: "Офис FIB",
        inspector: "Прокурор Сидоров С.С.",
        target: "Федеральное бюро расследований",
        description: "Плановое прокурорское надзорное мероприятие по проверке деятельности FIB.",
        findings: [],
        recommendations: [],
        documents: [],
        isPublic: false
      }
    ];
    setInspections(mockInspections);
  }, []);

  const getTypeColor = (type: string) => {
    return type === "prosecutor" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800";
  };

  const getTypeLabel = (type: string) => {
    return type === "prosecutor" ? "Прокурорская" : "EMS";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planned": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "planned": return "Запланирована";
      case "in_progress": return "В процессе";
      case "completed": return "Завершена";
      case "cancelled": return "Отменена";
      default: return "Неизвестно";
    }
  };

  const filteredInspections = inspections.filter(inspection => {
    if (filter !== "all" && inspection.type !== filter) return false;
    if (statusFilter !== "all" && inspection.status !== statusFilter) return false;
    if (searchQuery && !inspection.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !inspection.target.toLowerCase().includes(searchQuery.toLowerCase())) return false;
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
          <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Создать проверку
          </button>
        </div>

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
                <option value="planned">Запланированные</option>
                <option value="in_progress">В процессе</option>
                <option value="completed">Завершенные</option>
                <option value="cancelled">Отмененные</option>
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
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(inspection.type)}`}>
                            {getTypeLabel(inspection.type)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                            {getStatusLabel(inspection.status)}
                          </span>
                          {!inspection.isPublic && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Приватная
                            </span>
                          )}
                        </div>
                        
                        <h3 className="font-semibold mb-1">{inspection.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{inspection.target}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(inspection.date)} • {inspection.duration}
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
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(selectedInspection.type)}`}>
                          {getTypeLabel(selectedInspection.type)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedInspection.status)}`}>
                          {getStatusLabel(selectedInspection.status)}
                        </span>
                        {!selectedInspection.isPublic && (
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                            Приватная проверка
                          </span>
                        )}
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                      Редактировать
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {/* Основная информация */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Основная информация</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="font-medium text-gray-700">Дата:</span> {formatDate(selectedInspection.date)}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Длительность:</span> {selectedInspection.duration}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Место проведения:</span> {selectedInspection.location}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Инспектор:</span> {selectedInspection.inspector}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Объект проверки:</span> {selectedInspection.target}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Описание</h3>
                      <p className="text-gray-600">{selectedInspection.description}</p>
                    </div>
                  </div>

                  {/* Результаты проверки */}
                  {selectedInspection.findings.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold mb-4">Выявленные нарушения</h3>
                      <div className="space-y-2">
                        {selectedInspection.findings.map((finding, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                            <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                            <span className="text-red-800">{finding}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Рекомендации */}
                  {selectedInspection.recommendations.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold mb-4">Рекомендации</h3>
                      <div className="space-y-2">
                        {selectedInspection.recommendations.map((recommendation, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                            <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                            <span className="text-green-800">{recommendation}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Документы */}
                  {selectedInspection.documents.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Документы ({selectedInspection.documents.length})</h3>
                      <div className="space-y-3">
                        {selectedInspection.documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium">{doc.title}</div>
                              <div className="text-sm text-gray-600">
                                {doc.type} • {formatDate(doc.date)}
                              </div>
                            </div>
                            <Link
                              href={doc.url}
                              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                            >
                              Просмотр
                            </Link>
                          </div>
                        ))}
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
