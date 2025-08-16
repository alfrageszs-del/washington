"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import type { Profile } from "../../lib/supabase/client";

interface Case {
  id: string;
  title: string;
  case_number: string;
  type: "criminal" | "civil" | "administrative";
  status: "active" | "closed" | "pending";
  start_date: string;
  end_date?: string;
  judge_id?: string;
  prosecutor_id?: string;
  lawyer_id?: string;
  created_at: string;
  updated_at: string;
}

interface CaseParticipant {
  id: string;
  case_id: string;
  user_id?: string;
  name: string;
  role: string;
  static_id?: string;
  created_at: string;
}

interface CaseDocument {
  id: string;
  case_id: string;
  document_type: string;
  title: string;
  content?: string;
  file_url?: string;
  created_at: string;
}

interface CaseEvent {
  id: string;
  case_id: string;
  event: string;
  description?: string;
  document_id?: string;
  created_at: string;
}

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [participants, setParticipants] = useState<CaseParticipant[]>([]);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [events, setEvents] = useState<CaseEvent[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "closed" | "pending">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    case_number: "",
    type: "criminal" as "criminal" | "civil" | "administrative",
    description: ""
  });

  useEffect(() => {
    loadUserProfile();
    loadCases();
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

  const loadCases = async () => {
    setLoading(true);
    try {
      const { data: casesData } = await supabase
        .from("cases")
        .select("*")
        .order("created_at", { ascending: false });

      if (casesData) {
        setCases(casesData as Case[]);
        
        // Загружаем профили для участников
        const userIds = [...new Set([
          ...casesData.map(c => c.judge_id).filter(Boolean),
          ...casesData.map(c => c.prosecutor_id).filter(Boolean)
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
      }
    } catch (error) {
      console.error("Ошибка при загрузке дел:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCaseDetails = async (caseId: string) => {
    try {
      // Загружаем участников
      const { data: participantsData } = await supabase
        .from("case_participants")
        .select("*")
        .eq("case_id", caseId);

      if (participantsData) {
        setParticipants(participantsData as CaseParticipant[]);
      }

      // Загружаем документы
      const { data: documentsData } = await supabase
        .from("case_documents")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });

      if (documentsData) {
        setDocuments(documentsData as CaseDocument[]);
      }

      // Загружаем события
      const { data: eventsData } = await supabase
        .from("case_events")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });

      if (eventsData) {
        setEvents(eventsData as CaseEvent[]);
      }
    } catch (error) {
      console.error("Ошибка при загрузке деталей дела:", error);
    }
  };

  const canCreateCase = () => {
    if (!userProfile) return false;
    return ["PROSECUTOR", "JUDGE", "ATTORNEY_GENERAL", "CHIEF_JUSTICE"].includes(userProfile.gov_role);
  };

  const handleCreateCase = async () => {
    if (!userProfile) return;
    
    try {
      const { data, error } = await supabase
        .from("cases")
        .insert({
          title: createForm.title,
          case_number: createForm.case_number,
          type: createForm.type,
          status: "pending",
          start_date: new Date().toISOString(),
          prosecutor_id: userProfile.gov_role === "PROSECUTOR" ? userProfile.id : undefined
        })
        .select()
        .single();

      if (error) {
        console.error("Ошибка при создании дела:", error);
        return;
      }

      // Создаем событие для дела
      await supabase
        .from("case_events")
        .insert({
          case_id: data.id,
          event: "Дело создано",
          description: createForm.description || "Дело было создано в системе"
        });

      // Закрываем форму и перезагружаем дела
      setShowCreateForm(false);
      setCreateForm({ title: "", case_number: "", type: "criminal", description: "" });
      await loadCases();
    } catch (error) {
      console.error("Ошибка при создании дела:", error);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "criminal": return "Уголовное";
      case "civil": return "Гражданское";
      case "administrative": return "Административное";
      default: return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Активное";
      case "closed": return "Закрыто";
      case "pending": return "Ожидает";
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "closed": return "bg-gray-100 text-gray-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredCases = cases.filter(case_ => {
    const matchesFilter = filter === "all" || case_.status === filter;
    const matchesSearch = searchTerm === "" || 
      case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.case_number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Дела</h1>
        {canCreateCase() && (
          <button 
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Создать дело
          </button>
        )}
      </div>

      {/* Форма создания дела */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Создать новое дело</h2>
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
                  Название дела
                </label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({...createForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите название дела"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Номер дела
                </label>
                <input
                  type="text"
                  value={createForm.case_number}
                  onChange={(e) => setCreateForm({...createForm, case_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите номер дела"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тип дела
                </label>
                <select
                  value={createForm.type}
                  onChange={(e) => setCreateForm({...createForm, type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="criminal">Уголовное</option>
                  <option value="civil">Гражданское</option>
                  <option value="administrative">Административное</option>
                </select>
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
                  placeholder="Краткое описание дела"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateCase}
                  disabled={!createForm.title || !createForm.case_number}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Создать дело
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

      {/* Фильтры и поиск */}
      <div className="mb-6 space-y-4">
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
            onClick={() => setFilter("active")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === "active" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Активные
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === "pending" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Ожидающие
          </button>
          <button
            onClick={() => setFilter("closed")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === "closed" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Закрытые
          </button>
        </div>

        <input
          type="text"
          placeholder="Поиск по названию или номеру дела..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Список дел */}
      <div className="grid gap-4">
        {filteredCases.length > 0 ? (
          filteredCases.map((case_) => (
            <div
              key={case_.id}
              className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedCase(case_);
                loadCaseDetails(case_.id);
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{case_.title}</h3>
                  <p className="text-sm text-gray-600">№{case_.case_number}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(case_.status)}`}>
                  {getStatusLabel(case_.status)}
                </span>
              </div>

              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Тип:</span>{" "}
                  <span className="font-medium">{getTypeLabel(case_.type)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Дата начала:</span>{" "}
                  <span className="font-medium">
                    {new Date(case_.start_date).toLocaleDateString("ru-RU")}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Судья:</span>{" "}
                  <span className="font-medium">
                    {case_.judge_id && profiles[case_.judge_id] 
                      ? profiles[case_.judge_id].nickname 
                      : "Не назначен"}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            {filter === "all" ? "Нет дел" : `Нет дел со статусом "${filter}"`}
          </div>
        )}
      </div>

      {/* Модальное окно с деталями дела */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{selectedCase.title}</h2>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Основная информация */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold mb-3">Информация о деле</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-500">Номер дела:</span> {selectedCase.case_number}</div>
                    <div><span className="text-gray-500">Тип:</span> {getTypeLabel(selectedCase.type)}</div>
                    <div><span className="text-gray-500">Статус:</span> {getStatusLabel(selectedCase.status)}</div>
                    <div><span className="text-gray-500">Дата начала:</span> {new Date(selectedCase.start_date).toLocaleDateString("ru-RU")}</div>
                    {selectedCase.end_date && (
                      <div><span className="text-gray-500">Дата окончания:</span> {new Date(selectedCase.end_date).toLocaleDateString("ru-RU")}</div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Участники</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Судья:</span>{" "}
                      {selectedCase.judge_id && profiles[selectedCase.judge_id] 
                        ? profiles[selectedCase.judge_id].nickname 
                        : "Не назначен"}
                    </div>
                    <div>
                      <span className="text-gray-500">Прокурор:</span>{" "}
                      {selectedCase.prosecutor_id && profiles[selectedCase.prosecutor_id] 
                        ? profiles[selectedCase.prosecutor_id].nickname 
                        : "Не назначен"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Участники дела */}
              {participants.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Участники дела</h3>
                  <div className="grid gap-2">
                    {participants.map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{participant.name}</div>
                          <div className="text-sm text-gray-600">{participant.role}</div>
                        </div>
                        {participant.static_id && (
                          <div className="text-sm text-gray-500">ID: {participant.static_id}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Документы */}
              {documents.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Документы</h3>
                  <div className="space-y-2">
                    {documents.map((document) => (
                      <div key={document.id} className="p-3 border rounded-lg">
                        <div className="font-medium">{document.title}</div>
                        <div className="text-sm text-gray-600">{document.document_type}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(document.created_at).toLocaleDateString("ru-RU")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Таймлайн событий */}
              {events.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Таймлайн</h3>
                  <div className="space-y-3">
                    {events.map((event) => (
                      <div key={event.id} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="font-medium">{event.event}</div>
                          {event.description && (
                            <div className="text-sm text-gray-600">{event.description}</div>
                          )}
                          <div className="text-xs text-gray-500">
                            {new Date(event.created_at).toLocaleDateString("ru-RU")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
