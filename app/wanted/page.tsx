// app/wanted/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import type { Profile, Warrant, WarrantType, WarrantStatus } from "../../lib/supabase/client";

export default function WantedPage() {
  const [warrants, setWarrants] = useState<Warrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<Profile | null>(null);
  const [canCreate, setCanCreate] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    target_name: "",
    target_static_id: "",
    warrant_type: "A" as WarrantType,
    reason: "",
    articles: "",
    valid_until: "",
    source_url: "",
    notes: ""
  });

  useEffect(() => {
    loadUserAndWarrants();
  }, []);

  const loadUserAndWarrants = async () => {
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
            profile.faction === "GOV" || 
            profile.faction === "COURT" ||
            profile.gov_role === "TECH_ADMIN"
          );
        }
      }

      // Загружаем ордера с информацией об авторе
      const { data: warrantsData, error: warrantsError } = await supabase
        .from("warrants")
        .select(`
          *,
          issuer:profiles!warrants_issued_by_fkey(full_name)
        `)
        .order("created_at", { ascending: false });

      if (warrantsError) {
        setError(`Ошибка загрузки ордеров: ${warrantsError.message}`);
      } else {
        const formattedWarrants = warrantsData?.map(warrant => ({
          ...warrant,
          issuer_name: warrant.issuer?.full_name || "Неизвестно"
        })) || [];
        setWarrants(formattedWarrants);
      }
    } catch (err) {
      setError(`Ошибка: ${err instanceof Error ? err.message : "Неизвестная ошибка"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWarrant = async () => {
    if (!user) return;

    try {
      // Парсим статьи из строки в массив
      const articlesArray = createForm.articles
        .split(',')
        .map(article => article.trim())
        .filter(article => article.length > 0);

      const { error } = await supabase
        .from("warrants")
        .insert({
          warrant_number: `WNT-${Date.now()}`,
          target_name: createForm.target_name,
          target_static_id: createForm.target_static_id,
          warrant_type: createForm.warrant_type,
          reason: createForm.reason,
          articles: articlesArray,
          issued_by: user.id,
          status: "active",
          valid_until: createForm.valid_until,
          source_url: createForm.source_url || null,
          notes: createForm.notes || null
        });

      if (error) {
        setError(`Ошибка создания ордера: ${error.message}`);
        return;
      }

      // Закрываем форму и перезагружаем
      setShowCreateForm(false);
      setCreateForm({ 
        target_name: "", 
        target_static_id: "",
        warrant_type: "A", 
        reason: "", 
        articles: "", 
        valid_until: "", 
        source_url: "", 
        notes: "" 
      });
      await loadUserAndWarrants();
      setError(""); // Очищаем ошибки
    } catch (err) {
      setError(`Ошибка: ${err instanceof Error ? err.message : "Неизвестная ошибка"}`);
    }
  };

  const handleDeleteWarrant = async (id: string) => {
    if (!confirm("Удалить этот ордер? Это действие необратимо.")) return;

    try {
      const { error } = await supabase
        .from("warrants")
        .delete()
        .eq("id", id);

      if (error) {
        setError(`Ошибка удаления: ${error.message}`);
        return;
      }

      await loadUserAndWarrants();
      setError(""); // Очищаем ошибки
    } catch (err) {
      setError(`Ошибка: ${err instanceof Error ? err.message : "Неизвестная ошибка"}`);
    }
  };

  const handleStatusChange = async (id: string, newStatus: WarrantStatus) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === "executed") {
        updateData.updated_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("warrants")
        .update(updateData)
        .eq("id", id);

      if (error) {
        setError(`Ошибка обновления: ${error.message}`);
        return;
      }

      await loadUserAndWarrants();
      setError(""); // Очищаем ошибки
    } catch (err) {
      setError(`Ошибка: ${err instanceof Error ? err.message : "Неизвестная ошибка"}`);
    }
  };

  const getStatusColor = (status: WarrantStatus) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'executed': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: WarrantStatus) => {
    switch (status) {
      case 'active': return 'Активен';
      case 'executed': return 'Исполнен';
      case 'expired': return 'Истек';
      case 'cancelled': return 'Отменен';
      default: return status;
    }
  };

  const getWarrantTypeText = (type: WarrantType) => {
    switch (type) {
      case 'AS': return 'Арест и обыск';
      case 'S': return 'Обыск';
      case 'A': return 'Арест';
      default: return type;
    }
  };

  const getWarrantTypeColor = (type: WarrantType) => {
    switch (type) {
      case 'AS': return 'bg-purple-100 text-purple-800';
      case 'S': return 'bg-blue-100 text-blue-800';
      case 'A': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
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
              <h1 className="text-3xl font-bold text-gray-900">Ордера</h1>
              <p className="mt-2 text-sm text-gray-600">
                Реестр всех ордеров на арест и обыск
              </p>
            </div>
            {canCreate && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Создать ордер
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

        {/* Список ордеров */}
        {warrants.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Нет ордеров</h3>
            <p className="mt-1 text-sm text-gray-500">
              Пока не создано ни одного ордера.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {warrants.map((warrant) => (
              <div key={warrant.id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(warrant.status)}`}>
                      {getStatusText(warrant.status)}
                    </span>
                    {user && (user.gov_role === "TECH_ADMIN" || warrant.issued_by === user.id) && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDeleteWarrant(warrant.id)}
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getWarrantTypeColor(warrant.warrant_type)}`}>
                      {getWarrantTypeText(warrant.warrant_type)}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {warrant.target_name}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    {warrant.reason}
                  </p>

                  {warrant.articles && warrant.articles.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm text-gray-500 mb-1">Статьи:</div>
                      <div className="flex flex-wrap gap-1">
                        {warrant.articles.map((article, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {article}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Номер ордера:</span>
                      <span className="text-gray-900 font-mono">{warrant.warrant_number}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Выдан:</span>
                      <span className="text-gray-900 font-medium">{warrant.issuer_name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Срок действия:</span>
                      <span className="text-gray-900 font-medium">
                        {new Date(warrant.valid_until).toLocaleDateString("ru-RU")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Дата создания:</span>
                      <span>{new Date(warrant.created_at).toLocaleDateString("ru-RU")}</span>
                    </div>
                    {warrant.source_url && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Источник:</span>
                        <a 
                          href={warrant.source_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          Ссылка
                        </a>
                      </div>
                    )}
                    {warrant.notes && (
                      <div className="flex items-start justify-between text-sm">
                        <span className="text-gray-500">Примечания:</span>
                        <span className="text-gray-900 text-right max-w-xs">{warrant.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Кнопки управления статусом */}
                  {user && (user.gov_role === "TECH_ADMIN" || warrant.issued_by === user.id) && warrant.status === "active" && (
                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={() => handleStatusChange(warrant.id, "executed")}
                        className="flex-1 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        Отметить как исполненный
                      </button>
                      <button
                        onClick={() => handleStatusChange(warrant.id, "cancelled")}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        Отменить
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модальное окно создания ордера */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Создать новый ордер</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); handleCreateWarrant(); }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Имя и фамилия лица * 
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.target_name}
                      onChange={(e) => setCreateForm({...createForm, target_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="ФИО подозреваемого"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Static ID лица *
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.target_static_id}
                      onChange={(e) => setCreateForm({...createForm, target_static_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Static ID подозреваемого"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Тип ордера *
                    </label>
                    <select
                      value={createForm.warrant_type}
                      onChange={(e) => setCreateForm({...createForm, warrant_type: e.target.value as WarrantType})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="A">Арест</option>
                      <option value="S">Обыск</option>
                      <option value="AS">Арест и обыск</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Основание ордера *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={createForm.reason}
                      onChange={(e) => setCreateForm({...createForm, reason: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Описание основания для выдачи ордера"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Статьи (опционально)
                    </label>
                    <input
                      type="text"
                      value={createForm.articles}
                      onChange={(e) => setCreateForm({...createForm, articles: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Статья 1, Статья 2, Статья 3"
                    />
                    <p className="text-xs text-gray-500 mt-1">Разделяйте статьи запятыми</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Срок действия * 
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={createForm.valid_until}
                      onChange={(e) => setCreateForm({...createForm, valid_until: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ссылка на источник
                    </label>
                    <input
                      type="url"
                      value={createForm.source_url}
                      onChange={(e) => setCreateForm({...createForm, source_url: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="https://example.com/document"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Примечания
                    </label>
                    <textarea
                      rows={3}
                      value={createForm.notes}
                      onChange={(e) => setCreateForm({...createForm, notes: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Дополнительная информация"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={!createForm.target_name || !createForm.reason || !createForm.valid_until}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Создать ордер
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
