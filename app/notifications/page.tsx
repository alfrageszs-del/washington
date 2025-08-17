"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase/client";

interface Notification {
  id: string;
  type: "document" | "court" | "fine" | "wanted" | "system" | "role_change";
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  url?: string;
  priority: "low" | "medium" | "high";
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState("");

  const notificationTypes = [
    { id: "document", label: "Документы", color: "bg-blue-100 text-blue-800" },
    { id: "court", label: "Суд", color: "bg-purple-100 text-purple-800" },
    { id: "fine", label: "Штрафы", color: "bg-yellow-100 text-yellow-800" },
    { id: "wanted", label: "Ордера на арест", color: "bg-red-100 text-red-800" },
    { id: "system", label: "Система", color: "bg-gray-100 text-gray-800" },
    { id: "role_change", label: "Изменение роли", color: "bg-green-100 text-green-800" },
  ];

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setInfo(error.message);
      } else {
        setNotifications(data || []);
      }
    } catch (error) {
      setInfo("Ошибка при загрузке уведомлений");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (error) {
        setInfo(error.message);
      } else {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === id ? { ...notif, is_read: true } : notif
          )
        );
      }
    } catch (error) {
      setInfo("Ошибка при обновлении уведомления");
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) {
        setInfo(error.message);
      } else {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, is_read: true }))
        );
      }
    } catch (error) {
      setInfo("Ошибка при обновлении уведомлений");
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (error) {
        setInfo(error.message);
      } else {
        setNotifications(prev => prev.filter(notif => notif.id !== id));
      }
    } catch (error) {
      setInfo("Ошибка при удалении уведомления");
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === "unread" && notif.is_read) return false;
    if (filter === "read" && !notif.is_read) return false;
    if (selectedTypes.length > 0 && !selectedTypes.includes(notif.type)) return false;
    return true;
  });

  const getTypeColor = (type: string) => {
    const notifType = notificationTypes.find(t => t.id === type);
    return notifType?.color || "bg-gray-100 text-gray-800";
  };

  const getTypeLabel = (type: string) => {
    const notifType = notificationTypes.find(t => t.id === type);
    return notifType?.label || "Уведомление";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "border-l-red-500";
      case "medium": return "border-l-yellow-500";
      case "low": return "border-l-green-500";
      default: return "border-l-gray-500";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Только что";
    if (diffInHours < 24) return `${diffInHours} ч. назад`;
    if (diffInHours < 48) return "Вчера";
    return date.toLocaleDateString("ru-RU");
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-500">Загрузка уведомлений...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Уведомления</h1>
          <div className="flex items-center gap-4">
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                {unreadCount} новых
              </span>
            )}
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Отметить все как прочитанные
            </button>
          </div>
        </div>

        {info && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            {info}
          </div>
        )}

        {/* Фильтры */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Статус
              </label>
              <div className="flex gap-2">
                {[
                  { id: "all", label: "Все" },
                  { id: "unread", label: "Непрочитанные" },
                  { id: "read", label: "Прочитанные" }
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Типы уведомлений
              </label>
              <div className="flex flex-wrap gap-2">
                {notificationTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      if (selectedTypes.includes(type.id)) {
                        setSelectedTypes(selectedTypes.filter(t => t !== type.id));
                      } else {
                        setSelectedTypes([...selectedTypes, type.id]);
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedTypes.includes(type.id)
                        ? type.color
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Список уведомлений */}
        <div className="bg-white rounded-lg shadow-md">
          {filteredNotifications.length > 0 ? (
            <div className="divide-y">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 border-l-4 ${getPriorityColor(notification.priority)} ${
                    !notification.is_read ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                          {getTypeLabel(notification.type)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(notification.created_at)}
                        </span>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <h3 className="text-lg font-medium mb-2">{notification.title}</h3>
                      <p className="text-gray-600 mb-3">{notification.message}</p>
                      <div className="flex items-center gap-3">
                        {notification.url && (
                          <Link
                            href={notification.url}
                            onClick={() => markAsRead(notification.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                          >
                            Просмотреть
                          </Link>
                        )}
                        {!notification.is_read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
                          >
                            Отметить как прочитанное
                          </button>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors ml-4"
                      title="Удалить уведомление"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Уведомлений не найдено</p>
              <p className="text-gray-400">Попробуйте изменить фильтры</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
