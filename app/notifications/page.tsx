"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Notification {
  id: string;
  type: "document" | "court" | "fine" | "wanted" | "system";
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  url?: string;
  priority: "low" | "medium" | "high";
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const notificationTypes = [
    { id: "document", label: "Документы", color: "bg-blue-100 text-blue-800" },
    { id: "court", label: "Суд", color: "bg-purple-100 text-purple-800" },
    { id: "fine", label: "Штрафы", color: "bg-yellow-100 text-yellow-800" },
    { id: "wanted", label: "Ордера", color: "bg-red-100 text-red-800" },
    { id: "system", label: "Система", color: "bg-gray-100 text-gray-800" },
  ];

  useEffect(() => {
    // Загрузка уведомлений из API
    const mockNotifications: Notification[] = [
      {
        id: "1",
        type: "document",
        title: "Новый акт суда",
        message: "В отношении вас вынесено постановление о возбуждении уголовного дела",
        date: "2024-01-15T10:30:00",
        isRead: false,
        url: "/acts-court/1",
        priority: "high"
      },
      {
        id: "2",
        type: "court",
        title: "Судебное заседание",
        message: "Вас вызывают на судебное заседание 20 января 2024 года в 14:00",
        date: "2024-01-14T15:45:00",
        isRead: false,
        url: "/court-sessions/1",
        priority: "high"
      },
      {
        id: "3",
        type: "fine",
        title: "Новый штраф",
        message: "Вам выписан штраф за нарушение ПДД на сумму 5000$",
        date: "2024-01-13T09:15:00",
        isRead: true,
        url: "/fines/3",
        priority: "medium"
      },
      {
        id: "4",
        type: "wanted",
        title: "Ордер на арест",
        message: "В отношении вас выдан ордер на арест",
        date: "2024-01-12T16:20:00",
        isRead: true,
        url: "/wanted/4",
        priority: "high"
      }
    ];
    setNotifications(mockNotifications);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === "unread" && notif.isRead) return false;
    if (filter === "read" && !notif.isRead) return false;
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

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
                    !notification.isRead ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                          {getTypeLabel(notification.type)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(notification.date)}
                        </span>
                        {!notification.isRead && (
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
                        {!notification.isRead && (
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
