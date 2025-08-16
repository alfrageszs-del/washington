"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase/client";
import type { 
  RoleChangeRequestType, 
  RoleChangeRequest, 
  Faction, 
  GovRole, 
  LeaderRole, 
  Department,
  FactionLabel,
  GovRoleLabel,
  LeaderRoleLabel,
  DepartmentLabel
} from "../../lib/supabase/client";

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

      const { error } = await supabase
        .from("role_change_requests")
        .insert({
          user_id: userId,
          requested_by: user.id,
          request_type: requestType,
          current_value: currentValue,
          requested_value: requestedValue,
          reason: reason.trim(),
        });

      if (error) {
        throw error;
      }

      onSuccess?.();
    } catch (err) {
      console.error("Ошибка при создании запроса:", err);
      setError("Произошла ошибка при отправке запроса");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentValue = getCurrentValue(requestType);
  const options = getOptions(requestType);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Запрос на изменение роли
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Тип запроса */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Тип роли для изменения
          </label>
          <select
            value={requestType}
            onChange={(e) => {
              setRequestType(e.target.value as RoleChangeRequestType);
              setRequestedValue("");
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="FACTION">Фракция</option>
            <option value="GOV_ROLE">Государственная роль</option>
            <option value="LEADER_ROLE">Лидерская роль</option>
            <option value="OFFICE_ROLE">Офисная роль</option>
          </select>
        </div>

        {/* Текущее значение */}
        {currentValue && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Текущее значение
            </label>
            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-600">
              {options.find(opt => opt.value === currentValue)?.label || currentValue}
            </div>
          </div>
        )}

        {/* Запрашиваемое значение */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Запрашиваемое значение
          </label>
          <select
            value={requestedValue}
            onChange={(e) => setRequestedValue(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Выберите новое значение</option>
            {options
              .filter(option => option.value !== currentValue)
              .map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </select>
        </div>

        {/* Причина */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Причина запроса
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Объясните, почему необходимо изменить роль..."
            required
          />
        </div>

        {/* Ошибка */}
        {error && (
          <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
            {error}
          </div>
        )}

        {/* Кнопки */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Отправка..." : "Отправить запрос"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
            >
              Отмена
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
