"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import type { Profile } from "../../lib/supabase/client";

interface Warrant {
  id: string;
  title: string;
  type: "AS"; // Arrest & Search
  target_name: string;
  target_id?: string;
  valid_until: string;
  warrant_url: string;
  articles: string[];
  description?: string;
  issued_by: string;
  issued_by_id: string;
  status: "active" | "expired" | "executed";
  created_at: string;
}

export default function WarrantsPage() {
  const [warrants, setWarrants] = useState<Warrant[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    target_name: "",
    target_id: "",
    valid_until: "",
    warrant_url: "",
    articles: "",
    description: ""
  });

  useEffect(() => {
    loadUserProfile();
    loadWarrants();
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

  const loadWarrants = async () => {
    setLoading(true);
    try {
      const { data: warrantsData } = await supabase
        .from("warrants")
        .select("*")
        .order("created_at", { ascending: false });

      if (warrantsData) {
        setWarrants(warrantsData as Warrant[]);
      }
    } catch (error) {
      console.error("Ошибка при загрузке ордеров:", error);
    } finally {
      setLoading(false);
    }
  };

  const canCreateWarrant = () => {
    if (!userProfile) return false;
    return ["JUDGE", "CHIEF_JUSTICE", "TECH_ADMIN", "ATTORNEY_GENERAL"].includes(userProfile.gov_role);
  };

  const handleCreateWarrant = async () => {
    if (!userProfile) return;
    
    try {
      const articlesArray = createForm.articles
        .split(",")
        .map(article => article.trim())
        .filter(article => article.length > 0);

      const { data, error } = await supabase
        .from("warrants")
        .insert({
          title: createForm.title,
          type: "AS",
          target_name: createForm.target_name,
          target_id: createForm.target_id || null,
          valid_until: createForm.valid_until,
          warrant_url: createForm.warrant_url,
          articles: articlesArray,
          description: createForm.description || null,
          issued_by: userProfile.nickname || userProfile.full_name || "Судья",
          issued_by_id: userProfile.id,
          status: "active"
        })
        .select()
        .single();

      if (error) {
        console.error("Ошибка при создании ордера:", error);
        return;
      }

      // Закрываем форму и перезагружаем ордера
      setShowCreateForm(false);
      setCreateForm({
        title: "",
        target_name: "",
        target_id: "",
        valid_until: "",
        warrant_url: "",
        articles: "",
        description: ""
      });
      await loadWarrants();
    } catch (error) {
      console.error("Ошибка при создании ордера:", error);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Активен";
      case "expired": return "Истек";
      case "executed": return "Исполнен";
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "expired": return "bg-red-100 text-red-800";
      case "executed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "AS": return "Arrest & Search";
      default: return type;
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
        <h1 className="text-2xl font-bold">Ордера</h1>
        {canCreateWarrant() && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Создать ордер
          </button>
        )}
      </div>

      {/* Форма создания ордера */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Создать новый ордер</h2>
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
                  Название ордера *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm({...createForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите название ордера"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Имя цели *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.target_name}
                  onChange={(e) => setCreateForm({...createForm, target_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Имя человека"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID цели (необязательно)
                </label>
                <input
                  type="text"
                  value={createForm.target_id}
                  onChange={(e) => setCreateForm({...createForm, target_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ID в игре"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Действителен до *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={createForm.valid_until}
                  onChange={(e) => setCreateForm({...createForm, valid_until: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ссылка на ордер *
                </label>
                <input
                  type="url"
                  required
                  value={createForm.warrant_url}
                  onChange={(e) => setCreateForm({...createForm, warrant_url: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/warrant"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Статьи (через запятую) *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.articles}
                  onChange={(e) => setCreateForm({...createForm, articles: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Статья 1, Статья 2, Статья 3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Дополнительное описание"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateWarrant}
                  disabled={!createForm.title || !createForm.target_name || !createForm.valid_until || !createForm.warrant_url || !createForm.articles}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Создать ордер
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

      {/* Список ордеров */}
      <div className="grid gap-4">
        {warrants.length > 0 ? (
          warrants.map((warrant) => (
            <div key={warrant.id} className="bg-white rounded-lg border p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{warrant.title}</h3>
                  <p className="text-sm text-gray-600">Цель: {warrant.target_name}</p>
                  {warrant.target_id && (
                    <p className="text-sm text-gray-600">ID: {warrant.target_id}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {getTypeLabel(warrant.type)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(warrant.status)}`}>
                    {getStatusLabel(warrant.status)}
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="text-gray-500">Действителен до:</span>{" "}
                  <span className="font-medium">
                    {new Date(warrant.valid_until).toLocaleString("ru-RU")}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Выдан:</span>{" "}
                  <span className="font-medium">{warrant.issued_by}</span>
                </div>
              </div>

              {warrant.articles.length > 0 && (
                <div className="mb-4">
                  <span className="text-sm text-gray-500">Статьи:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {warrant.articles.map((article, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs"
                      >
                        {article}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {warrant.description && (
                <div className="text-sm text-gray-600 mb-4">
                  {warrant.description}
                </div>
              )}

              <div className="flex justify-between items-center">
                <a
                  href={warrant.warrant_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Открыть ордер →
                </a>
                <span className="text-xs text-gray-500">
                  {new Date(warrant.created_at).toLocaleDateString("ru-RU")}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            Ордера не найдены
          </div>
        )}
      </div>
    </div>
  );
}
