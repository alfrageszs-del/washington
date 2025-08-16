"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Case {
  id: string;
  title: string;
  caseNumber: string;
  type: "criminal" | "civil" | "administrative";
  status: "active" | "closed" | "pending";
  startDate: string;
  endDate?: string;
  participants: {
    name: string;
    role: string;
    staticID?: string;
  }[];
  documents: {
    id: string;
    type: string;
    title: string;
    date: string;
    url: string;
  }[];
  timeline: {
    id: string;
    date: string;
    event: string;
    description: string;
    documentId?: string;
  }[];
  judge?: string;
  prosecutor?: string;
  lawyer?: string;
}

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [filter, setFilter] = useState<"all" | "criminal" | "civil" | "administrative">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Загрузка данных о делах
    const mockCases: Case[] = [
      {
        id: "1",
        title: "Дело о краже в магазине",
        caseNumber: "123/2024",
        type: "criminal",
        status: "active",
        startDate: "2024-01-10",
        participants: [
          { name: "Петров П.П.", role: "Подозреваемый", staticID: "12345" },
          { name: "Иванов И.И.", role: "Потерпевший", staticID: "67890" },
          { name: "Сидоров С.С.", role: "Свидетель", staticID: "11111" }
        ],
        documents: [
          {
            id: "doc1",
            type: "Постановление",
            title: "Постановление о возбуждении уголовного дела",
            date: "2024-01-10",
            url: "/acts-court/doc1"
          },
          {
            id: "doc2",
            type: "Протокол",
            title: "Протокол допроса подозреваемого",
            date: "2024-01-12",
            url: "/acts-court/doc2"
          },
          {
            id: "doc3",
            type: "Запрос",
            title: "Запрос о предоставлении данных",
            date: "2024-01-14",
            url: "/acts-court/doc3"
          }
        ],
        timeline: [
          {
            id: "1",
            date: "2024-01-10",
            event: "Возбуждение дела",
            description: "Вынесено постановление о возбуждении уголовного дела",
            documentId: "doc1"
          },
          {
            id: "2",
            date: "2024-01-12",
            event: "Допрос подозреваемого",
            description: "Проведен допрос подозреваемого Петрова П.П.",
            documentId: "doc2"
          },
          {
            id: "3",
            date: "2024-01-14",
            event: "Запрос данных",
            description: "Отправлен запрос о предоставлении дополнительных данных",
            documentId: "doc3"
          }
        ],
        judge: "Судья Иванов И.И.",
        prosecutor: "Прокурор Козлов К.К."
      },
      {
        id: "2",
        title: "Дело о возмещении ущерба",
        caseNumber: "124/2024",
        type: "civil",
        status: "pending",
        startDate: "2024-01-15",
        participants: [
          { name: "Козлов К.К.", role: "Истец", staticID: "22222" },
          { name: "Петров П.П.", role: "Ответчик", staticID: "12345" }
        ],
        documents: [
          {
            id: "doc4",
            type: "Исковое заявление",
            title: "Исковое заявление о возмещении ущерба",
            date: "2024-01-15",
            url: "/acts-court/doc4"
          }
        ],
        timeline: [
          {
            id: "4",
            date: "2024-01-15",
            event: "Подача иска",
            description: "Подано исковое заявление о возмещении ущерба",
            documentId: "doc4"
          }
        ],
        judge: "Судья Петрова П.П."
      }
    ];
    setCases(mockCases);
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "criminal": return "bg-red-100 text-red-800";
      case "civil": return "bg-blue-100 text-blue-800";
      case "administrative": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "criminal": return "Уголовное";
      case "civil": return "Гражданское";
      case "administrative": return "Административное";
      default: return "Неизвестно";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "closed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Активно";
      case "pending": return "В ожидании";
      case "closed": return "Закрыто";
      default: return "Неизвестно";
    }
  };

  const filteredCases = cases.filter(caseItem => {
    if (filter !== "all" && caseItem.type !== filter) return false;
    if (statusFilter !== "all" && caseItem.status !== statusFilter) return false;
    if (searchQuery && !caseItem.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !caseItem.caseNumber.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Система дел</h1>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Создать дело
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
                placeholder="Поиск по названию или номеру дела..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип дела
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Все типы</option>
                <option value="criminal">Уголовные</option>
                <option value="civil">Гражданские</option>
                <option value="administrative">Административные</option>
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
                <option value="active">Активные</option>
                <option value="pending">В ожидании</option>
                <option value="closed">Закрытые</option>
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
          {/* Список дел */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Список дел</h2>
                <p className="text-gray-500 text-sm">Найдено: {filteredCases.length}</p>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {filteredCases.length > 0 ? (
                  <div className="divide-y">
                    {filteredCases.map((caseItem) => (
                      <div
                        key={caseItem.id}
                        onClick={() => setSelectedCase(caseItem)}
                        className={`p-4 cursor-pointer transition-colors ${
                          selectedCase?.id === caseItem.id ? "bg-blue-50 border-l-4 border-blue-500" : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(caseItem.type)}`}>
                            {getTypeLabel(caseItem.type)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(caseItem.status)}`}>
                            {getStatusLabel(caseItem.status)}
                          </span>
                        </div>
                        
                        <h3 className="font-semibold mb-1">{caseItem.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">№{caseItem.caseNumber}</p>
                        <p className="text-xs text-gray-500">
                          Начато: {formatDate(caseItem.startDate)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Дела не найдены</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Детали дела */}
          <div className="lg:col-span-2">
            {selectedCase ? (
              <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">{selectedCase.title}</h2>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(selectedCase.type)}`}>
                          {getTypeLabel(selectedCase.type)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedCase.status)}`}>
                          {getStatusLabel(selectedCase.status)}
                        </span>
                        <span className="text-gray-600">№{selectedCase.caseNumber}</span>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                      Редактировать
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {/* Участники */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">Участники дела</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedCase.participants.map((participant, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="font-medium">{participant.name}</div>
                          <div className="text-sm text-gray-600">{participant.role}</div>
                          {participant.staticID && (
                            <div className="text-xs text-gray-500">StaticID: {participant.staticID}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Судья, прокурор, адвокат */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">Служебные лица</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {selectedCase.judge && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="font-medium text-blue-800">Судья</div>
                          <div className="text-sm">{selectedCase.judge}</div>
                        </div>
                      )}
                      {selectedCase.prosecutor && (
                        <div className="p-3 bg-red-50 rounded-lg">
                          <div className="font-medium text-red-800">Прокурор</div>
                          <div className="text-sm">{selectedCase.prosecutor}</div>
                        </div>
                      )}
                      {selectedCase.lawyer && (
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="font-medium text-green-800">Адвокат</div>
                          <div className="text-sm">{selectedCase.lawyer}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Документы */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">Документы ({selectedCase.documents.length})</h3>
                    <div className="space-y-3">
                      {selectedCase.documents.map((doc) => (
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

                  {/* Таймлайн */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Хронология событий</h3>
                    <div className="space-y-4">
                      {selectedCase.timeline.map((event) => (
                        <div key={event.id} className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-medium">{event.event}</span>
                              <span className="text-sm text-gray-500">{formatDate(event.date)}</span>
                            </div>
                            <p className="text-gray-600 text-sm">{event.description}</p>
                            {event.documentId && (
                              <Link
                                href={selectedCase.documents.find(d => d.id === event.documentId)?.url || "#"}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Просмотреть документ →
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <h3 className="text-lg font-semibold mb-2">Выберите дело</h3>
                <p className="text-gray-500">Выберите дело из списка слева для просмотра деталей</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
