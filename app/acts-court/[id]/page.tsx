// app/acts-court/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import type { Profile } from "../../../lib/supabase/client";

type CourtAct = {
  id: string;
  title: string;
  content: string;
  judge_id: string;
  status: "draft" | "published" | "archived";
  source_url?: string;
  created_at: string;
  updated_at: string;
  judge?: {
    nickname: string;
    static_id: string;
  };
};

export default function CourtActPage() {
  const params = useParams();
  const router = useRouter();
  const [act, setAct] = useState<CourtAct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAct = async () => {
      if (!params.id) return;
      
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from("court_acts")
          .select(`
            *,
            judge:profiles!judge_id(nickname, static_id)
          `)
          .eq("id", params.id)
          .single();

        if (error) {
          setError(error.message);
          return;
        }

        setAct(data);
      } catch (err) {
        setError("Ошибка при загрузке акта");
      } finally {
        setLoading(false);
      }
    };

    loadAct();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка акта...</p>
        </div>
      </div>
    );
  }

  if (error || !act) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Ошибка</h1>
          <p className="text-gray-600 mb-6">{error || "Акт не найден"}</p>
          <button
            onClick={() => router.back()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Назад
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              ← Назад к списку
            </button>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              act.status === "published" ? "bg-green-100 text-green-800" :
              act.status === "draft" ? "bg-yellow-100 text-yellow-800" :
              "bg-gray-100 text-gray-800"
            }`}>
              {act.status === "published" ? "Опубликован" :
               act.status === "draft" ? "Черновик" : "Архив"}
            </span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{act.title}</h1>
          
          <div className="flex items-center text-sm text-gray-600 space-x-4">
            <span>Судья: {act.judge?.nickname || "Неизвестно"} ({act.judge?.static_id || "N/A"})</span>
            <span>Дата: {new Date(act.created_at).toLocaleDateString('ru-RU')}</span>
            {act.source_url && (
              <a 
                href={act.source_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 underline"
              >
                Источник
              </a>
            )}
          </div>
        </div>

        {/* Содержание */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="prose prose-lg max-w-none">
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
              {act.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
