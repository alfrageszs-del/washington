"use client";

import { useState, useEffect } from "react";
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
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [requests, setRequests] = useState<LawyerRequest[]>([]);
  const [contracts, setContracts] = useState<LawyerContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState("");
  const [activeTab, setActiveTab] = useState<"lawyers" | "requests" | "contracts">("lawyers");

  // Форма добавления адвоката
  const [showAddLawyerModal, setShowAddLawyerModal] = useState(false);
  const [addLawyerForm, setAddLawyerForm] = useState({
    name: "",
    type: "government" as "government" | "private",
    specialization: "",
    experience: 0,
    contact: "",
    price: ""
  });

  // Форма запроса на адвоката
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    caseType: "",
    description: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Загружаем профиль пользователя
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setUserProfile(profile);

      // Загружаем адвокатов
      const { data: lawyersData } = await supabase
        .from("lawyers")
        .select("*")
        .order("created_at", { ascending: false });
      setLawyers(lawyersData || []);

      // Загружаем запросы на адвоката
      const { data: requestsData } = await supabase
        .from("lawyer_requests")
        .select("*")
        .order("created_at", { ascending: false });
      setRequests(requestsData || []);

      // Загружаем договоры
      const { data: contractsData } = await supabase
        .from("lawyer_contracts")
        .select("*")
        .order("created_at", { ascending: false });
      setContracts(contractsData || []);

    } catch (error) {
      console.error("Ошибка при загрузке данных:", error);
      setInfo("Ошибка при загрузке данных");
    } finally {
      setLoading(false);
    }
  };

  const canAddLawyers = () => {
    if (!userProfile) return false;
    return userProfile.leader_role === "GOVERNOR" || userProfile.gov_role === "TECH_ADMIN";
  };

  const canRequestLawyer = () => {
    if (!userProfile) return false;
    return true; // Любой пользователь может запросить адвоката
  };

  const handleAddLawyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Пользователь не авторизован");

      const { error } = await supabase
        .from("lawyers")
        .insert({
          user_id: user.id,
          name: addLawyerForm.name,
          type: addLawyerForm.type,
          specialization: addLawyerForm.specialization.split(",").map(s => s.trim()),
          experience: addLawyerForm.experience,
          contact: addLawyerForm.contact || null,
          price: addLawyerForm.price || null,
          status: "available"
        });

      if (error) throw error;

      setAddLawyerForm({
        name: "",
        type: "government",
        specialization: "",
        experience: 0,
        contact: "",
        price: ""
      });
      setShowAddLawyerModal(false);
      await loadData();
    } catch (error) {
      console.error("Ошибка при добавлении адвоката:", error);
      setInfo("Ошибка при добавлении адвоката");
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
      setInfo("Ошибка при создании запроса");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800";
      case "busy": return "bg-yellow-100 text-yellow-800";
      case "unavailable": return "bg-red-100 text-red-800";
      case "pending": return "bg-blue-100 text-blue-800";
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "assigned": return "bg-purple-100 text-purple-800";
      case "active": return "bg-green-100 text-green-800";
      case "completed": return "bg-gray-100 text-gray-800";
      case "terminated": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available": return "Доступен";
      case "busy": return "Занят";
      case "unavailable": return "Недоступен";
      case "pending": return "Ожидает";
      case "approved": return "Одобрен";
      case "rejected": return "Отклонен";
      case "assigned": return "Назначен";
      case "active": return "Активен";
      case "completed": return "Завершен";
      case "terminated": return "Расторгнут";
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-500">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Адвокаты и правовая помощь</h1>
            <p className="text-gray-600 mt-2">
              Система управления адвокатами, запросами на правовую помощь и договорами
            </p>
          </div>
          <div className="flex gap-2">
            {canRequestLawyer() && (
              <button
                onClick={() => setShowRequestModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Запросить адвоката
              </button>
            )}
            {canAddLawyers() && (
              <button
                onClick={() => setShowAddLawyerModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Добавить адвоката
              </button>
            )}
          </div>
        </div>

        {info && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            {info}
          </div>
        )}

        {/* Табы */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("lawyers")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "lawyers"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Адвокаты ({lawyers.length})
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "requests"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Запросы ({requests.length})
            </button>
            <button
              onClick={() => setActiveTab("contracts")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "contracts"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Договоры ({contracts.length})
            </button>
          </div>
        </div>

        {/* Контент табов */}
        {activeTab === "lawyers" && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Список адвокатов</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Имя
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Тип
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Специализация
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Опыт
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Контакт
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lawyers.map((lawyer) => (
                    <tr key={lawyer.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{lawyer.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          lawyer.type === "government" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                        }`}>
                          {lawyer.type === "government" ? "Государственный" : "Частный"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {lawyer.specialization.join(", ")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{lawyer.experience} лет</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(lawyer.status)}`}>
                          {getStatusLabel(lawyer.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{lawyer.contact || "-"}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {lawyers.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Адвокаты не найдены</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "requests" && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Запросы на адвоката</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Клиент
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Тип дела
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Описание
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{request.client_name}</div>
                        <div className="text-sm text-gray-500">{request.client_static_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.case_type}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">{request.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                          {getStatusLabel(request.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(request.created_at).toLocaleDateString("ru-RU")}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {requests.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Запросы не найдены</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "contracts" && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Договоры адвокатов</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Номер дела
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Условия
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Сумма
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата начала
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contracts.map((contract) => (
                    <tr key={contract.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{contract.case_number || "-"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">{contract.contract_terms}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {contract.fee_amount ? `${contract.fee_amount} ${contract.fee_currency}` : "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(contract.status)}`}>
                          {getStatusLabel(contract.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(contract.start_date).toLocaleDateString("ru-RU")}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {contracts.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Договоры не найдены</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Модальное окно добавления адвоката */}
        {showAddLawyerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Добавить адвоката</h3>
              <form onSubmit={handleAddLawyer}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Имя адвоката
                    </label>
                    <input
                      type="text"
                      value={addLawyerForm.name}
                      onChange={(e) => setAddLawyerForm({...addLawyerForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Тип
                    </label>
                    <select
                      value={addLawyerForm.type}
                      onChange={(e) => setAddLawyerForm({...addLawyerForm, type: e.target.value as "government" | "private"})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="government">Государственный</option>
                      <option value="private">Частный</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Специализация (через запятую)
                    </label>
                    <input
                      type="text"
                      value={addLawyerForm.specialization}
                      onChange={(e) => setAddLawyerForm({...addLawyerForm, specialization: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Уголовное право, Гражданское право"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Опыт (лет)
                    </label>
                    <input
                      type="number"
                      value={addLawyerForm.experience}
                      onChange={(e) => setAddLawyerForm({...addLawyerForm, experience: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Контакт
                    </label>
                    <input
                      type="text"
                      value={addLawyerForm.contact}
                      onChange={(e) => setAddLawyerForm({...addLawyerForm, contact: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Цена (для частных)
                    </label>
                    <input
                      type="text"
                      value={addLawyerForm.price}
                      onChange={(e) => setAddLawyerForm({...addLawyerForm, price: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="1000$ за час"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddLawyerModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Добавить
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Модальное окно запроса на адвоката */}
        {showRequestModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Запросить адвоката</h3>
              <form onSubmit={handleRequestSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Тип дела
                    </label>
                    <input
                      type="text"
                      value={requestForm.caseType}
                      onChange={(e) => setRequestForm({...requestForm, caseType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Уголовное дело, Гражданский спор"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Описание ситуации
                    </label>
                    <textarea
                      value={requestForm.description}
                      onChange={(e) => setRequestForm({...requestForm, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      placeholder="Опишите вашу ситуацию..."
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Отправить запрос
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
