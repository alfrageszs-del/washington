"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase/client";
import type { 
  RoleChangeRequest, 
  RoleChangeRequestStatus,
  Profile,
  FactionLabel,
  GovRoleLabel,
  LeaderRoleLabel,
  DepartmentLabel
} from "../../../lib/supabase/client";

export default function RoleRequestsPage() {
  const [requests, setRequests] = useState<RoleChangeRequest[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RoleChangeRequestStatus | "ALL">("ALL");
  const [reviewComment, setReviewComment] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      // Загружаем все запросы
      const { data: requestsData } = await supabase
        .from("role_change_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (requestsData) {
        setRequests(requestsData as RoleChangeRequest[]);

        // Загружаем профили пользователей
        const userIds = [...new Set([
          ...requestsData.map(r => r.user_id),
          ...requestsData.map(r => r.requested_by),
          ...requestsData.map(r => r.reviewed_by).filter(Boolean)
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
      console.error("Ошибка при загрузке запросов:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (requestId: string, status: "APPROVED" | "REJECTED") => {
    if (!reviewComment.trim() && status === "REJECTED") {
      alert("При отклонении запроса необходимо указать причину");
      return;
    }

    setProcessingId(requestId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Пользователь не авторизован");

      // Обновляем статус запроса
      const { error: updateError } = await supabase
        .from("role_change_requests")
        .update({
          status,
          reviewed_by: user.id,
          review_comment: reviewComment.trim() || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) throw updateError;

      // Если запрос одобрен, обновляем профиль пользователя
      if (status === "APPROVED") {
        const request = requests.find(r => r.id === requestId);
        if (request) {
          const updateData: any = {};
          
          switch (request.request_type) {
            case "FACTION":
              updateData.faction = request.requested_value;
              break;
            case "GOV_ROLE":
              updateData.gov_role = request.requested_value;
              break;
            case "LEADER_ROLE":
              updateData.leader_role = request.requested_value;
              break;
            case "OFFICE_ROLE":
              updateData.office_role = request.requested_value;
              break;
          }

          if (Object.keys(updateData).length > 0) {
            const { error: profileError } = await supabase
              .from("profiles")
              .update(updateData)
              .eq("id", request.user_id);

            if (profileError) throw profileError;
          }
        }
      }

      setReviewComment("");
      await loadRequests();
    } catch (error) {
      console.error("Ошибка при обработке запроса:", error);
      alert("Произошла ошибка при обработке запроса");
    } finally {
      setProcessingId(null);
    }
  };

  const getValueLabel = (type: string, value: string): string => {
    switch (type) {
      case "FACTION":
        return FactionLabel[value as keyof typeof FactionLabel] || value;
      case "GOV_ROLE":
        return GovRoleLabel[value as keyof typeof GovRoleLabel] || value;
      case "LEADER_ROLE":
        return LeaderRoleLabel[value as keyof typeof LeaderRoleLabel] || value;
      case "OFFICE_ROLE":
        return DepartmentLabel[value as keyof typeof DepartmentLabel] || value;
      default:
        return value;
    }
  };

  const filteredRequests = requests.filter(request => 
    filter === "ALL" || request.status === filter
  );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Управление запросами на изменение ролей</h1>
        <div className="text-center py-8">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Управление запросами на изменение ролей</h1>

      {/* Фильтры */}
      <div className="mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === "ALL" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Все ({requests.length})
          </button>
          <button
            onClick={() => setFilter("PENDING")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === "PENDING" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Ожидают ({requests.filter(r => r.status === "PENDING").length})
          </button>
          <button
            onClick={() => setFilter("APPROVED")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === "APPROVED" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Одобренные ({requests.filter(r => r.status === "APPROVED").length})
          </button>
          <button
            onClick={() => setFilter("REJECTED")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === "REJECTED" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Отклоненные ({requests.filter(r => r.status === "REJECTED").length})
          </button>
        </div>
      </div>

      {/* Список запросов */}
      <div className="space-y-4">
        {filteredRequests.map((request) => {
          const userProfile = profiles[request.user_id];
          const requesterProfile = profiles[request.requested_by];
          const reviewerProfile = request.reviewed_by ? profiles[request.reviewed_by] : null;

          return (
            <div key={request.id} className="bg-white rounded-lg border p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    {request.request_type === "FACTION" && "Изменение фракции"}
                    {request.request_type === "GOV_ROLE" && "Изменение гос. роли"}
                    {request.request_type === "LEADER_ROLE" && "Изменение лидерской роли"}
                    {request.request_type === "OFFICE_ROLE" && "Изменение офисной роли"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Пользователь: {userProfile?.nickname || "Неизвестно"} ({userProfile?.static_id || "N/A"})
                  </p>
                  <p className="text-sm text-gray-600">
                    Запросил: {requesterProfile?.nickname || "Неизвестно"}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  request.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                  request.status === "APPROVED" ? "bg-green-100 text-green-800" :
                  "bg-red-100 text-red-800"
                }`}>
                  {request.status === "PENDING" ? "Ожидает" :
                   request.status === "APPROVED" ? "Одобрено" : "Отклонено"}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Детали запроса</h4>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-gray-600">Текущее значение:</span>{" "}
                      <span className="font-medium">
                        {getValueLabel(request.request_type, request.current_value || "не указано")}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Запрашиваемое значение:</span>{" "}
                      <span className="font-medium">
                        {getValueLabel(request.request_type, request.requested_value)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Причина:</span>{" "}
                      <span className="font-medium">{request.reason}</span>
                    </div>
                  </div>
                </div>

                {request.status !== "PENDING" && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Решение</h4>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-gray-600">Рассмотрел:</span>{" "}
                        <span className="font-medium">
                          {reviewerProfile?.nickname || "Неизвестно"}
                        </span>
                      </div>
                      {request.review_comment && (
                        <div>
                          <span className="text-gray-600">Комментарий:</span>{" "}
                          <span className="font-medium">{request.review_comment}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-600">Дата:</span>{" "}
                        <span className="font-medium">
                          {request.reviewed_at ? new Date(request.reviewed_at).toLocaleDateString("ru-RU") : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Действия для ожидающих запросов */}
              {request.status === "PENDING" && (
                <div className="border-t pt-4">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Комментарий (обязательно при отклонении)"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleReview(request.id, "APPROVED")}
                      disabled={processingId === request.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingId === request.id ? "Обработка..." : "Одобрить"}
                    </button>
                    <button
                      onClick={() => handleReview(request.id, "REJECTED")}
                      disabled={processingId === request.id}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingId === request.id ? "Обработка..." : "Отклонить"}
                    </button>
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500 mt-4">
                Создан: {request.created_at ? new Date(request.created_at).toLocaleDateString("ru-RU") : ""}
              </div>
            </div>
          );
        })}
      </div>

      {filteredRequests.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {filter === "ALL" ? "Нет запросов на изменение ролей" : `Нет запросов со статусом "${filter}"`}
        </div>
      )}
    </div>
  );
}
