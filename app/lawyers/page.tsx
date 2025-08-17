"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase/client";
import type { Profile } from "../../lib/supabase/client";

interface Lawyer {
  id: string;
  user_id: string;
  certificate_number: string;
  years_in_government: number;
  specialization?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface LawyerRequest {
  id: string;
  user_id: string;
  request_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface LawyerContract {
  id: string;
  lawyer_id: string;
  client_id: string;
  case_id?: string;
  status: string;
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
    certificate_number: "",
    years_in_government: "",
    specialization: ""
  });

  // Форма запроса на адвоката
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    description: "",
    request_type: "LICENSE"
  });

  // Форма добавления договора
  const [showAddContractModal, setShowAddContractModal] = useState(false);
  const [addContractForm, setAddContractForm] = useState({
    client_name: "",
    client_static_id: "",
    trustee_name: "",
    trustee_static_id: "",
    contract_url: ""
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
          certificate_number: addLawyerForm.certificate_number,
          years_in_government: parseInt(addLawyerForm.years_in_government),
          specialization: addLawyerForm.specialization || null,
          status: "ACTIVE"
        });

      if (error) throw error;

      setAddLawyerForm({
        certificate_number: "",
        years_in_government: "",
        specialization: ""
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
          user_id: user.id,
          request_type: requestForm.request_type,
          status: "PENDING"
        });

      if (error) throw error;

      setRequestForm({ request_type: "LICENSE", description: "" });
      setShowRequestModal(false);
      await loadData();
    } catch (error) {
      console.error("Ошибка при создании запроса:", error);
      setInfo("Ошибка при создании запроса");
    }
  };

  const handleAddContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Пользователь не авторизован");

      const { error } = await supabase
        .from("lawyer_contracts")
        .insert({
          lawyer_id: userProfile.id, // ID адвоката
          client_id: addContractForm.client_static_id, // ID клиента
          case_id: null, // Пока не привязываем к делу
          status: "ACTIVE"
        });

      if (error) throw error;

      setAddContractForm({
        client_name: "",
        client_static_id: "",
        trustee_name: "",
        trustee_static_id: "",
        contract_url: ""
      });
      setShowAddContractModal(false);
      await loadData();
    } catch (error) {
      console.error("Ошибка при добавлении договора:", error);
      setInfo("Ошибка при добавлении договора");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800";
      case "SUSPENDED": return "bg-yellow-100 text-yellow-800";
      case "REVOKED": return "bg-red-100 text-red-800";
      case "PENDING": return "bg-blue-100 text-blue-800";
      case "APPROVED": return "bg-green-100 text-green-800";
      case "REJECTED": return "bg-red-100 text-red-800";
      case "COMPLETED": return "bg-gray-100 text-gray-800";
      case "CANCELLED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ACTIVE": return "Активен";
      case "SUSPENDED": return "Приостановлен";
      case "REVOKED": return "Отозван";
      case "PENDING": return "Ожидает";
      case "APPROVED": return "Одобрен";
      case "REJECTED": return "Отклонен";
      case "COMPLETED": return "Завершен";
      case "CANCELLED": return "Отменен";
      default: return status;
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case "LICENSE": return "Лицензия";
      case "SPECIALIZATION": return "Специализация";
      case "STATUS_CHANGE": return "Изменение статуса";
      default: return type;
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
            <button
              onClick={() => setShowAddContractModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Добавить договор
            </button>
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
                      ID пользователя
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Номер удостоверения
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Срок работы (годы)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Специализация
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата создания
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lawyers.map((lawyer) => (
                    <tr key={lawyer.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{lawyer.user_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{lawyer.certificate_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{lawyer.years_in_government}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {lawyer.specialization || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(lawyer.status)}`}>
                          {getStatusLabel(lawyer.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(lawyer.created_at).toLocaleDateString("ru-RU")}
                        </div>
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
                      ID пользователя
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Тип запроса
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
                        <div className="text-sm font-medium text-gray-900">{request.user_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{getRequestTypeLabel(request.request_type)}</div>
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
                      ID адвоката
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID клиента
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID дела
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата создания
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contracts.map((contract) => (
                    <tr key={contract.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{contract.lawyer_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{contract.client_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{contract.case_id || "-"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(contract.status)}`}>
                          {getStatusLabel(contract.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(contract.created_at).toLocaleDateString("ru-RU")}
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
                      Номер удостоверения *
                    </label>
                    <input
                      type="text"
                      value={addLawyerForm.certificate_number}
                      onChange={(e) => setAddLawyerForm({...addLawyerForm, certificate_number: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      placeholder="Номер удостоверения адвоката"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Срок работы в правительстве (годы) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={addLawyerForm.years_in_government}
                      onChange={(e) => setAddLawyerForm({...addLawyerForm, years_in_government: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      placeholder="Количество лет"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Специализация
                    </label>
                    <input
                      type="text"
                      value={addLawyerForm.specialization}
                      onChange={(e) => setAddLawyerForm({...addLawyerForm, specialization: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Например, уголовное право"
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
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Запрашивающий:</strong> {userProfile?.nickname} ({userProfile?.static_id})
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Тип запроса *
                    </label>
                    <select
                      value={requestForm.request_type}
                      onChange={(e) => setRequestForm({...requestForm, request_type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="LICENSE">Лицензия</option>
                      <option value="SPECIALIZATION">Специализация</option>
                      <option value="STATUS_CHANGE">Изменение статуса</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Описание потребности *
                    </label>
                    <textarea
                      rows={4}
                      value={requestForm.description}
                      onChange={(e) => setRequestForm({...requestForm, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      placeholder="Опишите, для чего вам нужен адвокат..."
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

        {/* Модальное окно добавления договора */}
        {showAddContractModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Добавить договор</h3>
              <form onSubmit={handleAddContract}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Имя доверителя *
                    </label>
                    <input
                      type="text"
                      value={addContractForm.client_name}
                      onChange={(e) => setAddContractForm({...addContractForm, client_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      placeholder="ФИО доверителя"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Static ID доверителя *
                    </label>
                    <input
                      type="text"
                      value={addContractForm.client_static_id}
                      onChange={(e) => setAddContractForm({...addContractForm, client_static_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      placeholder="Static ID доверителя"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Имя доверенного *
                    </label>
                    <input
                      type="text"
                      value={addContractForm.trustee_name}
                      onChange={(e) => setAddContractForm({...addContractForm, trustee_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      placeholder="ФИО доверенного"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Static ID доверенного *
                    </label>
                    <input
                      type="text"
                      value={addContractForm.trustee_static_id}
                      onChange={(e) => setAddContractForm({...addContractForm, trustee_static_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      placeholder="Static ID доверенного"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ссылка на копию договора
                    </label>
                    <input
                      type="url"
                      value={addContractForm.contract_url}
                      onChange={(e) => setAddContractForm({...addContractForm, contract_url: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com/contract.pdf"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddContractModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    Добавить договор
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
