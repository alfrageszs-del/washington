"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import type { Profile } from "../../../lib/supabase/client";

export default function NewCasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({
    title: "",
    case_number: "",
    type: "criminal" as "criminal" | "civil" | "administrative",
    description: "",
    start_date: new Date().toISOString().split('T')[0]
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

  const canCreateCase = () => {
    if (!userProfile) return false;
    return ["PROSECUTOR", "JUDGE", "ATTORNEY_GENERAL", "CHIEF_JUSTICE"].includes(userProfile.gov_role);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !canCreateCase()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("cases")
        .insert({
          title: form.title,
          case_number: form.case_number,
          type: form.type,
          status: "pending",
          start_date: form.start_date,
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
          description: form.description || "Дело было создано в системе"
        });

      // Перенаправляем на страницу дел
      router.push("/cases");
    } catch (error) {
      console.error("Ошибка при создании дела:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!canCreateCase()) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Доступ запрещен</h1>
          <p className="text-gray-600">У вас нет прав для создания дел.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Создать новое дело</h1>
        <p className="text-gray-600">Заполните форму для создания нового дела</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Название дела *
          </label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({...form, title: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Введите название дела"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Номер дела *
          </label>
          <input
            type="text"
            required
            value={form.case_number}
            onChange={(e) => setForm({...form, case_number: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Введите номер дела"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Тип дела *
          </label>
          <select
            required
            value={form.type}
            onChange={(e) => setForm({...form, type: e.target.value as any})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="criminal">Уголовное</option>
            <option value="civil">Гражданское</option>
            <option value="administrative">Административное</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Дата начала *
          </label>
          <input
            type="date"
            required
            value={form.start_date}
            onChange={(e) => setForm({...form, start_date: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            placeholder="Краткое описание дела"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Создание..." : "Создать дело"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/cases")}
            className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
