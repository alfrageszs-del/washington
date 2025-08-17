"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import type { Profile } from "../../lib/supabase/client";

interface CourtSession {
  id: string;
  session_date: string;
  title: string;
  description?: string;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export default function CourtSessionsPage() {
  const [sessions, setSessions] = useState<CourtSession[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    session_date: "",
    description: "",
    status: "scheduled"
  });

  useEffect(() => {
    loadUserProfile();
    loadSessions();
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

  const loadSessions = async () => {
    setLoading(true);
    try {
      const { data: sessionsData } = await supabase
        .from("court_sessions")
        .select("*")
        .order("session_date", { ascending: true });

      if (sessionsData) {
        setSessions(sessionsData as CourtSession[]);
        
        // Загружаем профили создателей
        const creatorIds = sessionsData
          .map(s => s.created_by)
          .filter(Boolean);

        if (creatorIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("*")
            .in("id", creatorIds);

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
      console.error("Ошибка при загрузке заседаний:", error);
    } finally {
      setLoading(false);
    }
  };

  const canCreateSession = () => {
    if (!userProfile) return false;
    return ["JUDGE", "CHIEF_JUSTICE", "TECH_ADMIN"].includes(userProfile.gov_role);
  };

  const handleCreateSession = async () => {
    if (!userProfile) return;
    
    try {
      const { data, error } = await supabase
        .from("court_sessions")
        .insert({
          title: createForm.title,
          session_date: createForm.session_date,
          description: createForm.description || null,
          status: createForm.status,
          created_by: userProfile.id
        })
        .select()
        .single();

      if (error) {
        console.error("Ошибка при создании заседания:", error);
        return;
      }

      // Закрываем форму и перезагружаем заседания
      setShowCreateForm(false);
      setCreateForm({
        title: "",
        session_date: "",
        description: "",
        status: "scheduled"
      });
      await loadSessions();
    } catch (error) {
      console.error("Ошибка при создании заседания:", error);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "scheduled": return "Запланировано";
      case "in_progress": return "В процессе";
      case "completed": return "Завершено";
      case "cancelled": return "Отменено";
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (statusFilter === "all") return true;
    return session.status === statusFilter;
  });

  // Отладочная информация
  console.log("Все заседания:", sessions);
  console.log("Фильтр статуса:", statusFilter);
  console.log("Отфильтрованные заседания:", filteredSessions);

  // Календарные функции
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const getSessionsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredSessions.filter(session => {
      const sessionDate = new Date(session.session_date).toISOString().split('T')[0];
      return sessionDate === dateStr;
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ru-RU", { 
      day: "numeric", 
      month: "long", 
      year: "numeric" 
    });
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newMonth = new Date(currentMonth);
    if (direction === "prev") {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
    const days = [];

    // Добавляем пустые ячейки для начала месяца
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 border border-gray-200 bg-gray-50"></div>);
    }

    // Добавляем дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const sessionsForDay = getSessionsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = date.toDateString() === selectedDate.toDateString();

      days.push(
        <div
          key={day}
          className={`p-2 border border-gray-200 min-h-[100px] cursor-pointer transition-colors ${
            isToday ? "bg-blue-50" : ""
          } ${isSelected ? "ring-2 ring-blue-500" : ""}`}
          onClick={() => setSelectedDate(date)}
        >
          <div className={`text-sm font-medium ${isToday ? "text-blue-600" : ""}`}>
            {day}
          </div>
          <div className="mt-1 space-y-1">
            {sessionsForDay.slice(0, 2).map((session) => (
              <div
                key={session.id}
                className={`text-xs p-1 rounded truncate ${getStatusClass(session.status)}`}
                title={session.title}
              >
                {session.title}
              </div>
            ))}
            {sessionsForDay.length > 2 && (
              <div className="text-xs text-gray-500">
                +{sessionsForDay.length - 2} еще
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
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
        <h1 className="text-2xl font-bold">Судебные заседания</h1>
        <div className="flex gap-2">
          {canCreateSession() && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Создать заседание
            </button>
          )}
          <button
            onClick={() => setView("list")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              view === "list" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Список
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              view === "calendar" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Календарь
          </button>
        </div>
      </div>

      {/* Форма создания заседания */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Создать новое заседание</h2>
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
                  Название заседания
                </label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({...createForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите название заседания"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Дата и время
                </label>
                <input
                  type="datetime-local"
                  value={createForm.session_date}
                  onChange={(e) => setCreateForm({...createForm, session_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  placeholder="Краткое описание заседания"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Статус
                </label>
                <select
                  value={createForm.status}
                  onChange={(e) => setCreateForm({...createForm, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="scheduled">Запланировано</option>
                  <option value="in_progress">В процессе</option>
                  <option value="completed">Завершено</option>
                  <option value="cancelled">Отменено</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateSession}
                  disabled={!createForm.title || !createForm.session_date}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Создать заседание
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

      {/* Фильтры */}
      <div className="mb-6 space-y-4">
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
            onClick={() => setStatusFilter("scheduled")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              statusFilter === "scheduled" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Запланированные
          </button>
          <button
            onClick={() => setStatusFilter("in_progress")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              statusFilter === "in_progress" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            В процессе
          </button>
          <button
            onClick={() => setStatusFilter("completed")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              statusFilter === "completed" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Завершенные
          </button>
        </div>
      </div>

      {/* Список заседаний */}
      {view === "list" && (
        <div className="grid gap-4">
          {filteredSessions.length > 0 ? (
            filteredSessions.map((session) => (
              <div key={session.id} className="bg-white rounded-lg border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{session.title}</h3>
                    <p className="text-sm text-gray-600">
                      Создано: {profiles[session.created_by]?.full_name || "Неизвестно"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(session.status)}`}>
                      {getStatusLabel(session.status)}
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Дата и время:</span>{" "}
                    <span className="font-medium">
                      {new Date(session.session_date).toLocaleString("ru-RU")}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Создано:</span>{" "}
                    <span className="font-medium">
                      {new Date(session.created_at).toLocaleDateString("ru-RU")}
                    </span>
                  </div>
                </div>

                {session.description && (
                  <div className="text-sm text-gray-600 mb-4">
                    {session.description}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              Заседания не найдены
            </div>
          )}
        </div>
      )}

      {/* Календарный вид */}
      {view === "calendar" && (
        <div>
          {/* Навигация по месяцам */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth("prev")}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-xl font-semibold">{getMonthName(currentMonth)}</h2>
            <button
              onClick={() => navigateMonth("next")}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Календарная сетка */}
          <div className="bg-white rounded-lg border overflow-hidden">
            {/* Заголовки дней недели */}
            <div className="grid grid-cols-7 bg-gray-50">
              {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-700">
                  {day}
                </div>
              ))}
            </div>

            {/* Дни месяца */}
            <div className="grid grid-cols-7">
              {renderCalendar()}
            </div>
          </div>

          {/* Детали выбранного дня */}
          {selectedDate && (
            <div className="mt-6 bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">
                Заседания на {formatDate(selectedDate)}
              </h3>
              
              {getSessionsForDate(selectedDate).length > 0 ? (
                <div className="space-y-4">
                  {getSessionsForDate(selectedDate).map((session) => (
                    <div key={session.id} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{session.title}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(session.session_date).toLocaleTimeString("ru-RU", {hour: '2-digit', minute:'2-digit'})} • {profiles[session.created_by]?.full_name || "Неизвестно"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(session.status)}`}>
                            {getStatusLabel(session.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">На этот день заседаний не запланировано</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
