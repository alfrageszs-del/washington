"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Lawyer {
  id: string;
  name: string;
  type: "government" | "private";
  specialization: string[];
  experience: number;
  rating: number;
  cases: number;
  status: "available" | "busy" | "unavailable";
  contact: string;
  price?: string;
}

interface LawyerRequest {
  id: string;
  clientName: string;
  clientStaticID: string;
  caseType: string;
  description: string;
  date: string;
  status: "pending" | "approved" | "rejected" | "assigned";
  assignedLawyer?: string;
}

export default function LawyersPage() {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [requests, setRequests] = useState<LawyerRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"lawyers" | "requests" | "contracts">("lawyers");
  const [filter, setFilter] = useState<"all" | "government" | "private">("all");
  const [showRequestForm, setShowRequestForm] = useState(false);

  useEffect(() => {
    // Загрузка данных об адвокатах
    const mockLawyers: Lawyer[] = [
      {
        id: "1",
        name: "Иванов Иван Иванович",
        type: "government",
        specialization: ["Уголовные дела", "Административные дела"],
        experience: 8,
        rating: 4.8,
        cases: 156,
        status: "available",
        contact: "gov.lawyer@washington.gov"
      },
      {
        id: "2",
        name: "Петрова Анна Сергеевна",
        type: "government",
        specialization: ["Гражданские дела", "Семейные споры"],
        experience: 12,
        rating: 4.9,
        cases: 234,
        status: "busy",
        contact: "gov.lawyer2@washington.gov"
      },
      {
        id: "3",
        name: "Сидоров Михаил Петрович",
        type: "private",
        specialization: ["Уголовные дела", "Корпоративное право"],
        experience: 15,
        rating: 4.7,
        cases: 189,
        status: "available",
        contact: "sidorov.law@email.com",
        price: "от 5000$"
      },
      {
        id: "4",
        name: "Козлова Елена Александровна",
        type: "private",
        specialization: ["Гражданские дела", "Налоговое право"],
        experience: 10,
        rating: 4.6,
        cases: 145,
        status: "available",
        contact: "kozlova.law@email.com",
        price: "от 4000$"
      }
    ];

    const mockRequests: LawyerRequest[] = [
      {
        id: "1",
        clientName: "Петров П.П.",
        clientStaticID: "12345",
        caseType: "Уголовное дело",
        description: "Обвинение в краже. Требуется защита в суде.",
        date: "2024-01-15",
        status: "pending"
      },
      {
        id: "2",
        clientName: "Сидоров С.С.",
        clientStaticID: "67890",
        caseType: "Гражданское дело",
        description: "Спор о возмещении ущерба. Требуется представительство.",
        date: "2024-01-14",
        status: "approved",
        assignedLawyer: "Иванов Иван Иванович"
      }
    ];

    setLawyers(mockLawyers);
    setRequests(mockRequests);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800";
      case "busy": return "bg-yellow-100 text-yellow-800";
      case "unavailable": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available": return "Доступен";
      case "busy": return "Занят";
      case "unavailable": return "Недоступен";
      default: return "Неизвестно";
    }
  };

  const getTypeColor = (type: string) => {
    return type === "government" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800";
  };

  const getTypeLabel = (type: string) => {
    return type === "government" ? "Государственный" : "Частный";
  };

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "assigned": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRequestStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "На рассмотрении";
      case "approved": return "Одобрено";
      case "rejected": return "Отклонено";
      case "assigned": return "Назначен адвокат";
      default: return "Неизвестно";
    }
  };

  const filteredLawyers = lawyers.filter(lawyer => {
    if (filter === "government" && lawyer.type !== "government") return false;
    if (filter === "private" && lawyer.type !== "private") return false;
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Система адвокатов</h1>
          <button
            onClick={() => setShowRequestForm(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Запросить адвоката
          </button>
        </div>

        {/* Табы */}
        <div className="flex border-b mb-6">
          {[
            { id: "lawyers", label: "Адвокаты", count: lawyers.length },
            { id: "requests", label: "Запросы", count: requests.length },
            { id: "contracts", label: "Договоры", count: 0 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Список адвокатов */}
        {activeTab === "lawyers" && (
          <div>
            {/* Фильтры */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Тип адвоката
                  </label>
                  <div className="flex gap-2">
                    {[
                      { id: "all", label: "Все" },
                      { id: "government", label: "Государственные" },
                      { id: "private", label: "Частные" }
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFilter(f.id as any)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          filter === f.id
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Список */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredLawyers.map((lawyer) => (
                <div key={lawyer.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{lawyer.name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(lawyer.type)}`}>
                          {getTypeLabel(lawyer.type)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lawyer.status)}`}>
                          {getStatusLabel(lawyer.status)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-yellow-500">★</span>
                        <span className="font-medium">{lawyer.rating}</span>
                      </div>
                      <span className="text-sm text-gray-500">{lawyer.cases} дел</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-700">Опыт:</span> {lawyer.experience} лет
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-700">Специализация:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {lawyer.specialization.map((spec, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>

                    {lawyer.price && (
                      <div>
                        <span className="font-medium text-gray-700">Стоимость:</span> {lawyer.price}
                      </div>
                    )}

                    <div>
                      <span className="font-medium text-gray-700">Контакты:</span> {lawyer.contact}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    {lawyer.type === "government" && lawyer.status === "available" && (
                      <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                        Запросить
                      </button>
                    )}
                    {lawyer.type === "private" && lawyer.status === "available" && (
                      <button className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                        Связаться
                      </button>
                    )}
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                      Подробнее
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Запросы на адвоката */}
        {activeTab === "requests" && (
          <div className="bg-white rounded-lg shadow-md">
            {requests.length > 0 ? (
              <div className="divide-y">
                {requests.map((request) => (
                  <div key={request.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRequestStatusColor(request.status)}`}>
                            {getRequestStatusLabel(request.status)}
                          </span>
                          <span className="text-sm text-gray-500">{request.date}</span>
                        </div>
                        
                        <h3 className="text-lg font-semibold mb-2">
                          {request.clientName} (StaticID: {request.clientStaticID})
                        </h3>
                        
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Тип дела:</span> {request.caseType}
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Описание:</span> {request.description}
                          </div>
                          {request.assignedLawyer && (
                            <div>
                              <span className="font-medium text-gray-700">Назначен адвокат:</span> {request.assignedLawyer}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-6">
                        {request.status === "pending" && (
                          <>
                            <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm">
                              Одобрить
                            </button>
                            <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm">
                              Отклонить
                            </button>
                          </>
                        )}
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm">
                          Подробнее
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Запросов не найдено</p>
              </div>
            )}
          </div>
        )}

        {/* Реестр договоров */}
        {activeTab === "contracts" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Реестр договоров</h3>
              <p className="text-gray-500">Здесь будет отображаться реестр заключенных договоров с частными адвокатами</p>
              <p className="text-gray-400 text-sm">Функция в разработке</p>
            </div>
          </div>
        )}

        {/* Модальное окно запроса адвоката */}
        {showRequestForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Запрос на назначение адвоката</h3>
              
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ваше имя
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Введите ваше имя"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    StaticID
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Введите ваш StaticID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Тип дела
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Выберите тип дела</option>
                    <option value="criminal">Уголовное дело</option>
                    <option value="civil">Гражданское дело</option>
                    <option value="administrative">Административное дело</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание ситуации
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Опишите вашу ситуацию..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Отправить запрос
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRequestForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
