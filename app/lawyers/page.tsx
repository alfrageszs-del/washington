"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import type { Profile } from "../../lib/supabase/client";

interface Lawyer {
  id: string;
  user_id: string;
  name: string;
  type: "government" | "private";
  specialization: string[];
  experience: number;
  rating: number;
  cases_count: number;
  status: "available" | "busy" | "unavailable";
  contact?: string;
  price?: string;
  created_at: string;
  updated_at: string;
}

interface LawyerRequest {
  id: string;
  client_id: string;
  client_name: string;
  client_static_id: string;
  case_type: string;
  description: string;
  status: "pending" | "approved" | "rejected" | "assigned";
  assigned_lawyer_id?: string;
  created_at: string;
  updated_at: string;
}

interface LawyerContract {
  id: string;
  lawyer_id: string;
  client_id: string;
  case_number?: string;
  contract_terms: string;
  fee_amount?: number;
  fee_currency: string;
  status: "active" | "completed" | "terminated";
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export default function LawyersPage() {
  const [activeTab, setActiveTab] = useState<"lawyers" | "requests" | "contracts">("lawyers");
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [requests, setRequests] = useState<LawyerRequest[]>([]);
  const [contracts, setContracts] = useState<LawyerContract[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [filter, setFilter] = useState<"all" | "government" | "private">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "busy" | "unavailable">("all");

  // Форма запроса
  const [requestForm, setRequestForm] = useState({
    caseType: "",
    description: "",
  });

  useEffect(() => {
    loadUserProfile();
    loadData();
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

  const loadData = async () => {
    setLoading(true);
    try {
      // Загружаем адвокатов
      const { data: lawyersData } = await supabase
        .from("lawyers")
        .select("*")
        .order("created_at", { ascending: false });

      if (lawyersData) {
        setLawyers(lawyersData as Lawyer[]);
      }

      // Загружаем запросы
      const { data: requestsData } = await supabase
        .from("lawyer_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (requestsData) {
        setRequests(requestsData as LawyerRequest[]);
      }

      // Загружаем контракты
      const { data: contractsData } = await supabase
        .from("lawyer_contracts")
        .select("*")
        .order("created_at", { ascending: false });

      if (contractsData) {
        setContracts(contractsData as LawyerContract[]);
      }

      // Загружаем профили
      const userIds = [...new Set([
        ...lawyersData?.map(l => l.user_id) || [],
        ...requestsData?.map(r => r.client_id) || [],
        ...contractsData?.map(c => c.client_id) || []
      ])];

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("*")
          .in("id", userIds);

        if (profilesData) {
          const profilesMap: Record<string, Profile> = {};
          profilesData.forEach((profile: Profile) => {
            profilesMap[profile.id] = profile;
          });
          setProfiles(profilesMap);
        }
      }
    } catch (error) {
      console.error("Ошибка при загрузке данных:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Пользователь не авторизован");

      const { error } = await supabase
        .from("lawyer_requests")
        .insert({
          client_id: user.id,
          client_name: userProfile.nickname,
          client_static_id: userProfile.static_id,
          case_type: requestForm.caseType,
          description: requestForm.description,
        });

      if (error) throw error;

      setRequestForm({ caseType: "", description: "" });
      setShowRequestModal(false);
      await loadData();
    } catch (error) {
      console.error("Ошибка при создании запроса:", error);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "government": return "Государственный";
      case "private": return "Частный";
      default: return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available": return "Доступен";
      case "busy": return "Занят";
      case "unavailable": return "Недоступен";
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800";
      case "busy": return "bg-yellow-100 text-yellow-800";
      case "unavailable": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRequestStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Ожидает";
      case "approved": return "Одобрен";
      case "rejected": return "Отклонен";
      case "assigned": return "Назначен";
      default: return status;
    }
  };

  const getRequestStatusClass = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "assigned": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredLawyers = lawyers.filter(lawyer => {
    const matchesType = filter === "all" || lawyer.type === filter;
    const matchesStatus = statusFilter === "all" || lawyer.status === statusFilter;
    return matchesType && matchesStatus;
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-8">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Система адвокатов</h1>

      {/* Табы */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab("lawyers")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "lawyers"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Адвокаты
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "requests"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Запросы
        </button>
        <button
          onClick={() => setActiveTab("contracts")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "contracts"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Контракты
        </button>
      </div>

      {/* Адвокаты */}
      {activeTab === "lawyers" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === "all" 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Все
              </button>
              <button
                onClick={() => setFilter("government")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === "government" 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Государственные
              </button>
              <button
                onClick={() => setFilter("private")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === "private" 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Частные
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  statusFilter === "all" 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Все статусы
              </button>
              <button
                onClick={() => setStatusFilter("available")}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  statusFilter === "available" 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Доступные
              </button>
            </div>
          </div>

          <div className="grid gap-4">
            {filteredLawyers.length > 0 ? (
              filteredLawyers.map((lawyer) => (
                <div key={lawyer.id} className="bg-white rounded-lg border p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{lawyer.name}</h3>
                      <p className="text-sm text-gray-600">
                        {getTypeLabel(lawyer.type)} адвокат
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(lawyer.status)}`}>
                      {getStatusLabel(lawyer.status)}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-500">Опыт:</span>{" "}
                      <span className="font-medium">{lawyer.experience} лет</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Рейтинг:</span>{" "}
                      <span className="font-medium">{lawyer.rating}/5</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Дела:</span>{" "}
                      <span className="font-medium">{lawyer.cases_count}</span>
                    </div>
                  </div>

                  {lawyer.specialization.length > 0 && (
                    <div className="mb-4">
                      <span className="text-sm text-gray-500">Специализация:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {lawyer.specialization.map((spec, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {lawyer.type === "private" && lawyer.price && (
                    <div className="text-sm text-gray-600">
                      <span className="text-gray-500">Стоимость:</span> {lawyer.price}
                    </div>
                  )}

                  {lawyer.type === "government" && lawyer.status === "available" && (
                    <button
                      onClick={() => {
                        setActiveTab("requests");
                        setShowRequestModal(true);
                      }}
                      className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Запросить адвоката
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                Адвокаты не найдены
              </div>
            )}
          </div>
        </div>
      )}

      {/* Запросы */}
      {activeTab === "requests" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Запросы на адвоката</h2>
            <button
              onClick={() => setShowRequestModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Новый запрос
            </button>
          </div>

          <div className="grid gap-4">
            {requests.length > 0 ? (
              requests.map((request) => (
                <div key={request.id} className="bg-white rounded-lg border p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{request.client_name}</h3>
                      <p className="text-sm text-gray-600">ID: {request.client_static_id}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRequestStatusClass(request.status)}`}>
                      {getRequestStatusLabel(request.status)}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Тип дела:</span>{" "}
                      <span className="font-medium">{request.case_type}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Описание:</span>{" "}
                      <span className="font-medium">{request.description}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Дата запроса:</span>{" "}
                      <span className="font-medium">
                        {new Date(request.created_at).toLocaleDateString("ru-RU")}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                Нет запросов на адвоката
              </div>
            )}
          </div>
        </div>
      )}

      {/* Контракты */}
      {activeTab === "contracts" && (
        <div>
          <h2 className="text-lg font-semibold mb-6">Контракты с адвокатами</h2>
          <div className="grid gap-4">
            {contracts.length > 0 ? (
              contracts.map((contract) => (
                <div key={contract.id} className="bg-white rounded-lg border p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">
                        Контракт {contract.case_number ? `№${contract.case_number}` : ""}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {profiles[contract.client_id]?.nickname || "Неизвестный клиент"}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      contract.status === "active" ? "bg-green-100 text-green-800" :
                      contract.status === "completed" ? "bg-blue-100 text-blue-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {contract.status === "active" ? "Активен" :
                       contract.status === "completed" ? "Завершен" : "Расторгнут"}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Условия:</span>{" "}
                      <span className="font-medium">{contract.contract_terms}</span>
                    </div>
                    {contract.fee_amount && (
                      <div>
                        <span className="text-gray-500">Стоимость:</span>{" "}
                        <span className="font-medium">{contract.fee_amount} {contract.fee_currency}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Дата начала:</span>{" "}
                      <span className="font-medium">
                        {new Date(contract.start_date).toLocaleDateString("ru-RU")}
                      </span>
                    </div>
                    {contract.end_date && (
                      <div>
                        <span className="text-gray-500">Дата окончания:</span>{" "}
                        <span className="font-medium">
                          {new Date(contract.end_date).toLocaleDateString("ru-RU")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                Нет контрактов с адвокатами
              </div>
            )}
          </div>
        </div>
      )}

      {/* Модальное окно запроса */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Запрос на государственного адвоката</h2>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Тип дела
                  </label>
                  <input
                    type="text"
                    value={requestForm.caseType}
                    onChange={(e) => setRequestForm({ ...requestForm, caseType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Например: уголовное, гражданское"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Описание ситуации
                  </label>
                  <textarea
                    value={requestForm.description}
                    onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Опишите вашу ситуацию..."
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Отправить запрос
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Отмена
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
