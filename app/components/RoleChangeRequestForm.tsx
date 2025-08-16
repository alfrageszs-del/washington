"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase/client";
import type { 
  Faction, 
  GovRole, 
  LeaderRole, 
  Department
} from "../../lib/supabase/client";

// Импортируем типы и константы из отдельного файла
import type { 
  RoleChangeRequestType,
  RoleChangeRequestStatus 
} from "../../role_change_types";

import {
  FactionLabel,
  GovRoleLabel,
  LeaderRoleLabel,
  DepartmentLabel
} from "../../role_change_types";

type RoleChangeRequestFormProps = {
  userId: string;
  currentProfile: {
    faction: Faction;
    gov_role: GovRole;
    leader_role?: LeaderRole | null;
    office_role?: Department | null;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function RoleChangeRequestForm({ 
  userId, 
  currentProfile, 
  onSuccess, 
  onCancel 
}: RoleChangeRequestFormProps) {
  const [requestType, setRequestType] = useState<RoleChangeRequestType>("FACTION");
  const [requestedValue, setRequestedValue] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const getCurrentValue = (type: RoleChangeRequestType): string | null => {
    switch (type) {
      case "FACTION":
        return currentProfile.faction;
      case "GOV_ROLE":
        return currentProfile.gov_role;
      case "LEADER_ROLE":
        return currentProfile.leader_role || null;
      case "OFFICE_ROLE":
        return currentProfile.office_role || null;
      default:
        return null;
    }
  };

  const getOptions = (type: RoleChangeRequestType): { value: string; label: string }[] => {
    switch (type) {
      case "FACTION":
        return Object.entries(FactionLabel).map(([value, label]) => ({ value, label }));
      case "GOV_ROLE":
        return Object.entries(GovRoleLabel).map(([value, label]) => ({ value, label }));
      case "LEADER_ROLE":
        return Object.entries(LeaderRoleLabel).map(([value, label]) => ({ value, label }));
      case "OFFICE_ROLE":
        return Object.entries(DepartmentLabel).map(([value, label]) => ({ value, label }));
      default:
        return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!requestedValue || !reason.trim()) {
      setError("Пожалуйста, заполните все поля");
      return;
    }

    const currentValue = getCurrentValue(requestType);
    if (currentValue === requestedValue) {
      setError("Запрашиваемое значение должно отличаться от текущего");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Пользователь не авторизован");
      }

      const { error: insertError } = await supabase
        .from("role_change_requests")
        .insert({
          user_id: userId,
          request_type: requestType,
          current_value: currentValue,
          requested_value: requestedValue,
          reason: reason.trim(),
          status: "PENDING"
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Сброс формы
      setRequestType("FACTION");
      setRequestedValue("");
      setReason("");
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка при отправке запроса");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold mb-4">Запрос на изменение роли</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Тип изменения
          </label>
          <select
            value={requestType}
            onChange={(e) => {
              setRequestType(e.target.value as RoleChangeRequestType);
              setRequestedValue("");
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="FACTION">Фракция</option>
            <option value="GOV_ROLE">Государственная роль</option>
            <option value="LEADER_ROLE">Роль лидера</option>
            <option value="OFFICE_ROLE">Офисная роль</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Текущее значение
          </label>
          <input
            type="text"
            value={getCurrentValue(requestType) || "Не установлено"}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Запрашиваемое значение
          </label>
          <select
            value={requestedValue}
            onChange={(e) => setRequestedValue(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Выберите новое значение</option>
            {getOptions(requestType).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Причина изменения
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Укажите причину для изменения роли..."
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Отправка..." : "Отправить запрос"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
            >
              Отмена
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
