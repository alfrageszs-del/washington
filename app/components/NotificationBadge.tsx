"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function NotificationBadge() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Здесь будет загрузка количества непрочитанных уведомлений из API
    // Пока используем моковые данные
    setUnreadCount(3);
  }, []);

  if (unreadCount === 0) return null;

  return (
    <Link href="/notifications" className="relative">
      <div className="relative">
        <svg className="w-6 h-6 text-gray-600 hover:text-gray-800 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.5 3.75a6 6 0 0 1 6 6v3.75l2.25 2.25V12a8.25 8.25 0 0 0-16.5 0v3.75l2.25-2.25V9.75a6 6 0 0 1 6-6z" />
        </svg>
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      </div>
    </Link>
  );
}
