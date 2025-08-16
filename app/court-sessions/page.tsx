"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface CourtSession {
  id: string;
  title: string;
  caseNumber: string;
  judge: string;
  date: string;
  time: string;
  type: "open" | "closed";
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  participants: string[];
  description: string;
  courtroom: string;
}

export default function CourtSessionsPage() {
  const [sessions, setSessions] = useState<CourtSession[]>([]);
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [view, setView] = useState<"list" | "calendar">("list");

  useEffect(() => {
    // Загрузка данных о заседаниях
    const mockSessions: CourtSession[] = [
      {
        id: "1",
        title: "Дело №123/2024 - Уголовное дело",
        caseNumber: "123/2024",
        judge: "Судья Иванов И.И.",
        date: "2024-01-20",
        time: "14:00",
        type: "open",
        status: "scheduled",
        participants: ["Истец: Петров П.П.", "Ответчик: Сидоров С.С.", "Прокурор: Козлов К.К."],
        description: "Рассмотрение уголовного дела по обвинению в краже",
        courtroom: "Зал №1"
      },
      {
        id: "2",
        title: "Дело №124/2024 - Гражданское дело",
        caseNumber: "124/2024",
        judge: "Судья Петрова П.П.",
        date: "2024-01-21",
        time: "10:00",
        type: "closed",
        status: "scheduled",
        participants: ["Истец: Козлов К.К.", "Ответчик: Иванов И.И."],
        description: "Рассмотрение гражданского иска о возмещении ущерба",
        courtroom: "Зал №2"
      },
      {
        id: "3",
        title: "Дело №125/2024 - Административное дело",
        caseNumber: "125/2024",
        judge: "Судья Сидоров С.С.",
        date: "2024-01-19",
        time: "16:00",
        type: "open",
        status: "completed",
        participants: ["Заявитель: Петров П.П.", "Представитель: Козлов К.К."],
        description: "Рассмотрение административного дела о нарушении ПДД",
        courtroom: "Зал №3"
      }
    ];
    setSessions(mockSessions);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "scheduled": return "Запланировано";
      case "in_progress": return "В процессе";
      case "completed": return "Завершено";
      case "cancelled": return "Отменено";
      default: return "Неизвестно";
    }
  };

  const getTypeColor = (type: string) => {
    return type === "open" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  const getTypeLabel = (type: string) => {
    return type === "open" ? "Открытое" : "Закрытое";
  };

  const filteredSessions = sessions.filter(session => {
    if (filter === "open" && session.type !== "open") return false;
    if (filter === "closed" && session.type !== "closed") return false;
    if (statusFilter !== "all" && session.status !== statusFilter) return false;
    if (selectedDate && session.date !== selectedDate) return false;
    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Реестр судебных заседаний</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView("list")}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                view === "list" 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Список
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                view === "calendar" 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Календарь
            </button>
          </div>
        </div>

        {/* Фильтры */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип заседания
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Все заседания</option>
                <option value="open">Открытые</option>
                <option value="closed">Закрытые</option>
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
                <option value="scheduled">Запланировано</option>
                <option value="in_progress">В процессе</option>
                <option value="completed">Завершено</option>
                <option value="cancelled">Отменено</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Дата
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilter("all");
                  setStatusFilter("all");
                  setSelectedDate("");
                }}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Сбросить фильтры
              </button>
            </div>
          </div>
        </div>

        {/* Список заседаний */}
        {view === "list" && (
          <div className="bg-white rounded-lg shadow-md">
            {filteredSessions.length > 0 ? (
              <div className="divide-y">
                {filteredSessions.map((session) => (
                  <div key={session.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(session.type)}`}>
                            {getTypeLabel(session.type)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                            {getStatusLabel(session.status)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDate(session.date)} в {session.time}
                          </span>
                          <span className="text-sm text-gray-500">
                            {session.courtroom}
                          </span>
                        </div>
                        
                        <h3 className="text-xl font-semibold mb-2">{session.title}</h3>
                        <p className="text-gray-600 mb-3">{session.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Судья:</span> {session.judge}
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Номер дела:</span> {session.caseNumber}
                          </div>
                        </div>

                        {session.participants.length > 0 && (
                          <div className="mt-3">
                            <span className="font-medium text-gray-700 text-sm">Участники:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {session.participants.map((participant, index) => (
                                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                  {participant}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-6">
                        {session.type === "open" && (
                          <Link
                            href={`/court-sessions/${session.id}`}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                          >
                            Подробнее
                          </Link>
                        )}
                        {session.status === "scheduled" && (
                          <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm">
                            Присутствовать
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Заседаний не найдено</p>
                <p className="text-gray-400">Попробуйте изменить фильтры</p>
              </div>
            )}
          </div>
        )}

        {/* Календарный вид */}
        {view === "calendar" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Календарный вид</h3>
              <p className="text-gray-500">Здесь будет календарь с заседаниями</p>
              <p className="text-gray-400 text-sm">Функция в разработке</p>
            </div>
          </div>
        )}

        {/* Информация об открытых заседаниях */}
        {filteredSessions.some(s => s.type === "open") && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              Открытые заседания
            </h3>
            <p className="text-blue-700 text-sm">
              Открытые заседания доступны для посещения всеми желающими. 
              Вы можете присутствовать на них в качестве наблюдателя.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
