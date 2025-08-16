"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import type { Profile } from "../../../lib/supabase/client";

export default function NewCourtSessionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({
    title: "",
    case_number: "",
    date: "",
    time: "",
    type: "open" as "open" | "closed",
    description: "",
    courtroom: "",
    participants: ""
  });

  useEffect(() => {
    loadUserProfile();
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

  const canCreateSession = () => {
    if (!userProfile) return false;
    // Align with RLS: TECH_ADMIN, ATTORNEY_GENERAL, CHIEF_JUSTICE
    return ["TECH_ADMIN", "ATTORNEY_GENERAL", "CHIEF_JUSTICE"].includes(userProfile.gov_role);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !canCreateSession()) return;

    setLoading(true);
    try {
      const participantsArray = form.participants
        .split(",")
        .map(p => p.trim())
        .filter(p => p.length > 0);

      const sessionDate = new Date(`${form.date}T${form.time || '00:00'}:00Z`).toISOString();
      const { error } = await supabase
        .from("court_sessions")
        .insert({
          title: form.title,
          session_date: sessionDate,
          description: form.description || null,
          status: "scheduled",
          created_by: userProfile.id
        });

      if (error) {
        console.error("Ошибка при создании заседания:", error);
        return;
      }

      // Перенаправляем на страницу заседаний
      router.push("/court-sessions");
    } catch (error) {
      console.error("Ошибка при создании заседания:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!canCreateSession()) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Доступ запрещен</h1>
          <p className="text-gray-600">У вас нет прав для создания судебных заседаний.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Создать новое заседание</h1>
        <p className="text-gray-600">Заполните форму для создания нового судебного заседания</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Название заседания *
          </label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({...form, title: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Введите название заседания"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Номер дела (необязательно)
          </label>
          <input
            type="text"
            value={form.case_number}
            onChange={(e) => setForm({...form, case_number: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Введите номер дела"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Дата *
            </label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({...form, date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Время *
            </label>
            <input
              type="time"
              required
              value={form.time}
              onChange={(e) => setForm({...form, time: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Тип заседания *
            </label>
            <select
              required
              value={form.type}
              onChange={(e) => setForm({...form, type: e.target.value as any})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="open">Открытое</option>
              <option value="closed">Закрытое</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Зал суда
            </label>
            <input
              type="text"
              value={form.courtroom}
              onChange={(e) => setForm({...form, courtroom: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Номер зала"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Участники (через запятую)
          </label>
          <input
            type="text"
            value={form.participants}
            onChange={(e) => setForm({...form, participants: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Имя 1, Имя 2, Имя 3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Описание
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({...form, description: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Краткое описание заседания"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Создание..." : "Создать заседание"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/court-sessions")}
            className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
