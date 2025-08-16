// =====================================================
// ТИПЫ ДЛЯ СИСТЕМЫ ЗАПРОСОВ НА ИЗМЕНЕНИЕ РОЛЕЙ
// =====================================================

/** Типы запросов на изменение ролей */
export type RoleChangeRequestType = "FACTION" | "GOV_ROLE" | "LEADER_ROLE" | "OFFICE_ROLE";

/** Статусы запросов на изменение ролей */
export type RoleChangeRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

/** Основной тип запроса на изменение роли */
export type RoleChangeRequest = {
  id: string;
  user_id: string;                    // пользователь, для которого запрашивается изменение
  requested_by: string;               // пользователь, который создал запрос
  request_type: RoleChangeRequestType;
  current_value: string | null;       // текущее значение роли
  requested_value: string;            // запрашиваемое значение роли
  reason: string;                     // причина запроса
  status: RoleChangeRequestStatus;
  reviewed_by?: string | null;        // администратор, который рассмотрел запрос
  review_comment?: string | null;     // комментарий администратора
  reviewed_at?: string | null;        // время рассмотрения
  created_at?: string;
  updated_at?: string;
};

/** Лейблы для типов запросов */
export const RoleChangeRequestTypeLabel: Record<RoleChangeRequestType, string> = {
  FACTION: "Фракция",
  GOV_ROLE: "Государственная роль",
  LEADER_ROLE: "Лидерская роль",
  OFFICE_ROLE: "Офисная роль",
};

/** Лейблы для статусов запросов */
export const RoleChangeRequestStatusLabel: Record<RoleChangeRequestStatus, string> = {
  PENDING: "Ожидает рассмотрения",
  APPROVED: "Одобрено",
  REJECTED: "Отклонено",
};

// =====================================================
// ВСПОМОГАТЕЛЬНЫЕ ТИПЫ (если нужны)
// =====================================================

/** Профиль пользователя (минимальный набор полей) */
export type Profile = {
  id: string;
  nickname: string;
  static_id: string;
  faction: string;
  gov_role: string;
  leader_role?: string | null;
  office_role?: string | null;
};

/** Пропсы для компонента формы запроса */
export type RoleChangeRequestFormProps = {
  userId: string;
  currentProfile: {
    faction: string;
    gov_role: string;
    leader_role?: string | null;
    office_role?: string | null;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
};

/** Пропсы для компонента списка запросов */
export type RoleChangeRequestsListProps = {
  requests: RoleChangeRequest[];
  profiles: Record<string, Profile>;
  onRefresh?: () => void;
};

// =====================================================
// УТИЛИТЫ
// =====================================================

/** Получение человеко-читаемого названия для значения роли */
export function getRoleValueLabel(type: RoleChangeRequestType, value: string): string {
  // Здесь можно добавить маппинг значений на человеко-читаемые названия
  // Например, для фракций, ролей и т.д.
  
  const factionLabels: Record<string, string> = {
    'CIVILIAN': 'Гражданский',
    'GOV': 'Правительство',
    'COURT': 'Судейский корпус',
    'WN': 'WN',
    'FIB': 'FIB',
    'LSPD': 'LSPD',
    'LSCSD': 'LSCSD',
    'EMS': 'EMS',
    'SANG': 'SANG',
  };

  const govRoleLabels: Record<string, string> = {
    'NONE': 'Нет',
    'PROSECUTOR': 'Прокурор',
    'JUDGE': 'Судья',
    'TECH_ADMIN': 'Тех. администратор',
    'ATTORNEY_GENERAL': 'Генеральный прокурор',
    'CHIEF_JUSTICE': 'Председатель Верховного суда',
  };

  const leaderRoleLabels: Record<string, string> = {
    'GOVERNOR': 'Губернатор',
    'DIRECTOR_WN': 'Директор WN',
    'DIRECTOR_FIB': 'Директор FIB',
    'CHIEF_LSPD': 'Шеф LSPD',
    'SHERIFF_LSCSD': 'Шериф LSCSD',
    'CHIEF_EMS': 'Главный врач EMS',
    'COLONEL_SANG': 'Полковник SANG',
  };

  const officeRoleLabels: Record<string, string> = {
    'GOVERNOR': 'Губернатор',
    'VICE_GOVERNOR': 'Вице-губернатор',
    'MIN_FINANCE': 'Министерство финансов',
    'MIN_JUSTICE': 'Министерство юстиции',
    'BAR_ASSOCIATION': 'Коллегия адвокатов',
    'GOV_STAFF': 'Аппарат правительства',
    'MIN_DEFENSE': 'Министерство обороны',
    'MIN_SECURITY': 'Министерство безопасности',
    'MIN_HEALTH': 'Министерство здравоохранения',
    'OTHER': 'Другое',
  };

  switch (type) {
    case 'FACTION':
      return factionLabels[value] || value;
    case 'GOV_ROLE':
      return govRoleLabels[value] || value;
    case 'LEADER_ROLE':
      return leaderRoleLabels[value] || value;
    case 'OFFICE_ROLE':
      return officeRoleLabels[value] || value;
    default:
      return value;
  }
}

/** Проверка, может ли пользователь изменять роли */
export function canManageRoleRequests(userRole: string): boolean {
  return ['TECH_ADMIN', 'ATTORNEY_GENERAL', 'CHIEF_JUSTICE'].includes(userRole);
}

/** Получение CSS класса для статуса */
export function getStatusClass(status: RoleChangeRequestStatus): string {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'APPROVED':
      return 'bg-green-100 text-green-800';
    case 'REJECTED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
