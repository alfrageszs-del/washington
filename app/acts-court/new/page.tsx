"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import type { Profile } from "../../../lib/supabase/client";

export default function NewCourtActPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({
    title: "",
    content: "",
    status: "draft"
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

  const canCreateAct = () => {
    if (!userProfile) return false;
    return ["JUDGE", "CHIEF_JUSTICE", "TECH_ADMIN"].includes(userProfile.gov_role);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !canCreateAct()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("court_acts")
        .insert({
          act_number: `CA-${Date.now()}`,
          title: form.title,
          content: form.content,
          status: form.status.toUpperCase(),
          created_by: userProfile.id
        })
        .select()
        .single();

      if (error) {
        console.error("Ошибка при создании акта:", error);
        return;
      }

      // Перенаправляем на страницу актов
      router.push("/acts-court");
    } catch (error) {
      console.error("Ошибка при создании акта:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!canCreateAct()) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Доступ запрещен</h1>
          <p className="text-gray-600">У вас нет прав для создания судебных актов.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Создать новый судебный акт</h1>
        <p className="text-gray-600">Заполните форму для создания нового судебного акта</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Название акта *
          </label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({...form, title: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Введите название судебного акта"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Содержание акта *
          </label>
          <textarea
            required
            value={form.content}
            onChange={(e) => setForm({...form, content: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={15}
            placeholder="Введите содержание судебного акта"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Статус *
          </label>
          <select
            required
            value={form.status}
            onChange={(e) => setForm({...form, status: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="draft">Черновик</option>
            <option value="published">Опубликован</option>
          </select>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Создание..." : "Создать акт"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/acts-court")}
            className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
