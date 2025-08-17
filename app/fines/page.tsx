"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import type { Profile, Fine, FineStatus } from "../../lib/supabase/client";

export default function FinesPage() {
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<Profile | null>(null);
  const [canCreate, setCanCreate] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    offender_static_id: "",
    offender_name: "",
    issuer_faction: "LSPD" as const,
    amount: "",
    reason: "",
    source_url: "",
    notes: ""
  });

  useEffect(() => {
    loadUserAndFines();
  }, []);

  const loadUserAndFines = async () => {
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

      // Загружаем штрафы с информацией об авторе
      const { data: finesData, error: finesError } = await supabase
        .from("fines")
        .select(`
          *,
          issuer:profiles!fines_created_by_fkey(full_name)
        `)
        .order("created_at", { ascending: false });

      if (finesError) {
        setError(`Ошибка загрузки штрафов: ${finesError.message}`);
      } else {
        const formattedFines = finesData?.map(fine => ({
          ...fine,
          issuer_name: fine.issuer?.full_name || "Неизвестно"
        })) || [];
        setFines(formattedFines);
      }
    } catch (err) {
      setError(`Ошибка: ${err instanceof Error ? err.message : "Неизвестная ошибка"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFine = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("fines")
        .insert({
          offender_static_id: createForm.offender_static_id,
          offender_name: createForm.offender_name,
          issuer_faction: createForm.issuer_faction,
          amount: parseInt(createForm.amount),
          reason: createForm.reason,
          source_url: createForm.source_url || null,
          notes: createForm.notes || null,
          created_by: user.id
        });

      if (error) {
        setError(`Ошибка создания штрафа: ${error.message}`);
        return;
      }

      // Закрываем форму и перезагружаем
      setShowCreateForm(false);
      setCreateForm({ 
        offender_static_id: "", 
        offender_name: "", 
        issuer_faction: "LSPD", 
        amount: "", 
        reason: "", 
        source_url: "", 
        notes: "" 
      });
      await loadUserAndFines();
      setError(""); // Очищаем ошибки
    } catch (err) {
      setError(`Ошибка: ${err instanceof Error ? err.message : "Неизвестная ошибка"}`);
    }
  };

  const handleDeleteFine = async (id: string) => {
    if (!confirm("Удалить этот штраф? Это действие необратимо.")) return;

    try {
      const { error } = await supabase
        .from("fines")
        .delete()
        .eq("id", id);

      if (error) {
        setError(`Ошибка удаления: ${error.message}`);
        return;
      }

      await loadUserAndFines();
      setError(""); // Очищаем ошибки
    } catch (err) {
      setError(`Ошибка: ${err instanceof Error ? err.message : "Неизвестная ошибка"}`);
    }
  };

  const handleStatusChange = async (id: string, newStatus: FineStatus) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === "PAID") {
        updateData.paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("fines")
        .update(updateData)
        .eq("id", id);

      if (error) {
        setError(`Ошибка обновления: ${error.message}`);
        return;
      }

      await loadUserAndFines();
      setError(""); // Очищаем ошибки
    } catch (err) {
      setError(`Ошибка: ${err instanceof Error ? err.message : "Неизвестная ошибка"}`);
    }
  };

  const getStatusColor = (status: FineStatus) => {
    switch (status) {
      case 'UNPAID': return 'bg-red-100 text-red-800';
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: FineStatus) => {
    switch (status) {
      case 'UNPAID': return 'Не оплачен';
      case 'PAID': return 'Оплачен';
      case 'CANCELLED': return 'Отменен';
      default: return status;
    }
  };

  const getFactionText = (faction: string) => {
    switch (faction) {
      case 'LSPD': return 'LSPD';
      case 'LSCSD': return 'LSCSD';
      case 'FIB': return 'FIB';
      case 'EMS': return 'EMS';
      case 'SANG': return 'SANG';
      case 'WN': return 'WN';
      default: return faction;
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
              <h1 className="text-3xl font-bold text-gray-900">Штрафы</h1>
              <p className="mt-2 text-sm text-gray-600">
                Реестр всех штрафов и взысканий
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
                Создать штраф
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

        {/* Список штрафов */}
        {fines.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Нет штрафов</h3>
            <p className="mt-1 text-sm text-gray-500">
              Пока не создано ни одного штрафа.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {fines.map((fine) => (
              <div key={fine.id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(fine.status)}`}>
                      {getStatusText(fine.status)}
                    </span>
                    {user && (user.gov_role === "TECH_ADMIN" || fine.created_by === user.id) && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDeleteFine(fine.id)}
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
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getFactionText(fine.issuer_faction)}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {fine.offender_name}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    {fine.reason}
                  </p>

                  <div className="mb-4">
                    <div className="text-2xl font-bold text-red-600">
                      ${fine.amount.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">ID нарушителя:</span>
                      <span className="text-gray-900 font-mono">{fine.offender_static_id}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Выдан:</span>
                      <span className="text-gray-900 font-medium">{fine.issuer_name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Дата создания:</span>
                      <span>{new Date(fine.created_at).toLocaleDateString("ru-RU")}</span>
                    </div>
                    {fine.paid_at && (
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Оплачен:</span>
                        <span>{new Date(fine.paid_at).toLocaleDateString("ru-RU")}</span>
                      </div>
                    )}
                  </div>

                  {/* Кнопки управления статусом */}
                  {user && (user.gov_role === "TECH_ADMIN" || fine.created_by === user.id) && fine.status === "UNPAID" && (
                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={() => handleStatusChange(fine.id, "PAID")}
                        className="flex-1 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        Отметить как оплаченный
                      </button>
                      <button
                        onClick={() => handleStatusChange(fine.id, "CANCELLED")}
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

      {/* Модальное окно создания штрафа */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Создать новый штраф</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); handleCreateFine(); }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ID нарушителя *
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.offender_static_id}
                      onChange={(e) => setCreateForm({...createForm, offender_static_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="ID123456"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ФИО нарушителя *
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.offender_name}
                      onChange={(e) => setCreateForm({...createForm, offender_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="ФИО нарушителя"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Выдающая фракция *
                    </label>
                    <select
                      value={createForm.issuer_faction}
                      onChange={(e) => setCreateForm({...createForm, issuer_faction: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="LSPD">LSPD</option>
                      <option value="LSCSD">LSCSD</option>
                      <option value="FIB">FIB</option>
                      <option value="EMS">EMS</option>
                      <option value="SANG">SANG</option>
                      <option value="WN">WN</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Сумма штрафа *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={createForm.amount}
                      onChange={(e) => setCreateForm({...createForm, amount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="1000"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Основание *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={createForm.reason}
                      onChange={(e) => setCreateForm({...createForm, reason: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Описание нарушения"
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
                    disabled={!createForm.offender_static_id || !createForm.offender_name || !createForm.reason || !createForm.amount}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Создать штраф
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
