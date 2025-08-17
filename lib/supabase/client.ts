// lib/supabase/client.ts
import { createClient } from "@supabase/supabase-js";

/* ----------------------------- Supabase client ----------------------------- */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // не кидаем ошибку при сборке, но будет видно в консоли браузера
  // eslint-disable-next-line no-console
  console.warn(
    "[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY не заданы"
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/* ---------------------------------- Типы ---------------------------------- */

/** Департаменты (куда граждане записываются на приём) */
export type Department =
  | "GOVERNOR"
  | "VICE_GOVERNOR"
  | "MIN_FINANCE"
  | "MIN_JUSTICE"
  | "BAR_ASSOCIATION"
  | "GOV_STAFF"
  | "MIN_DEFENSE"
  | "MIN_SECURITY"
  | "MIN_HEALTH"
  | "OTHER";

/** Человеко-читаемые названия департаментов */
export const DepartmentLabel: Record<Department, string> = {
  GOVERNOR: "Губернатор",
  VICE_GOVERNOR: "Вице-губернатор",
  MIN_FINANCE: "Министерство финансов",
  MIN_JUSTICE: "Министерство юстиции",
  BAR_ASSOCIATION: "Коллегия адвокатов",
  GOV_STAFF: "Аппарат правительства",
  MIN_DEFENSE: "Министерство обороны",
  MIN_SECURITY: "Министерство безопасности",
  MIN_HEALTH: "Министерство здравоохранения",
  OTHER: "Другое",
};

/** Фракции игрока (в профиле) */
export type Faction =
  | "CIVILIAN"
  | "GOV"
  | "COURT"   // судейский корпус
  | "WN"
  | "FIB"
  | "LSPD"
  | "LSCSD"
  | "EMS"
  | "SANG";

/** Лейблы фракций */
export const FactionLabel: Record<Faction, string> = {
  CIVILIAN: "Гражданский",
  GOV: "Правительство",
  COURT: "Судейский корпус",
  WN: "WN",
  FIB: "FIB",
  LSPD: "LSPD",
  LSCSD: "LSCSD",
  EMS: "EMS",
  SANG: "SANG",
};

/** Гос-роль (для доступа к отдельным панелям/функциям) */
export type GovRole =
  | "NONE"
  | "PROSECUTOR"
  | "JUDGE"
  | "TECH_ADMIN"
  | "ATTORNEY_GENERAL" // Генеральный прокурор
  | "CHIEF_JUSTICE";   // Председатель Верховного суда

export const GovRoleLabel: Record<GovRole, string> = {
  NONE: "Нет",
  PROSECUTOR: "Прокурор",
  JUDGE: "Судья",
  TECH_ADMIN: "Тех. администратор",
  ATTORNEY_GENERAL: "Генеральный прокурор",
  CHIEF_JUSTICE: "Председатель Верховного суда",
};

/** Лидерская роль во фракции */
export type LeaderRole =
  | "GOVERNOR"        // Губернатор
  | "DIRECTOR_WN"     // Директор WN
  | "DIRECTOR_FIB"    // Директор FIB
  | "CHIEF_LSPD"      // Шеф LSPD
  | "SHERIFF_LSCSD"   // Шериф LSCSD
  | "CHIEF_EMS"       // Главный врач EMS
  | "COLONEL_SANG";   // Полковник SANG

export const LeaderRoleLabel: Record<LeaderRole, string> = {
  GOVERNOR: "Губернатор",
  DIRECTOR_WN: "Директор WN",
  DIRECTOR_FIB: "Директор FIB",
  CHIEF_LSPD: "Шеф LSPD",
  SHERIFF_LSCSD: "Шериф LSCSD",
  CHIEF_EMS: "Главный врач EMS",
  COLONEL_SANG: "Полковник SANG",
};

/** Профиль пользователя */
export type Profile = {
  id: string;
  nickname: string;
  static_id: string;
  discord: string | null;
  faction: Faction;
  gov_role: GovRole;
  is_verified: boolean;
  leader_role?: LeaderRole | null;     // лидер фракции (если назначен)
  office_role?: Department | null;     // «кабинет» (министерство/офис)
  created_at?: string;
  updated_at?: string;
};

/** Заявка на приём */
export type AppointmentStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "DONE"
  | "CANCELLED";

export type Appointment = {
  id: string;
  user_id: string;                 // id пользователя, который записался
  created_by: string;              // id из auth.users
  department: Department;
  position: string;                 // тема/должность
  status: AppointmentStatus;
  reason?: string;                  // подробности
  preferred_datetime: string | null; // ISO или null
  reviewed_by?: string;             // id того, кто рассмотрел
  reviewed_at?: string;             // когда рассмотрели
  created_at?: string;
  updated_at?: string;
};

/** Правительственные акты (если используешь) */
export type GovernmentAct = {
  id: string;
  author_id: string;
  title: string;
  summary: string | null;
  content: string;
  source_url: string | null;
  is_published: boolean;
  published_at: string;
  updated_at?: string;
};

/** Судебные акты */
export type CourtAct = {
  id: string;
  author_id: string;
  title: string;
  summary: string | null;
  content: string;
  source_url: string | null;
  is_published: boolean;
  published_at: string;
  updated_at?: string;
};

/** Заявки на верификацию/роль */
export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type VerificationKind =
  | "ACCOUNT"         // подтверждение аккаунта
  | "PROSECUTOR"      // роль прокурора
  | "JUDGE"           // роль судьи
  | "OFFICE"          // кабинет (департамент)
  | "FACTION_MEMBER"; // вступление в фракцию

export type VerificationRequest = {
  id: string;
  created_by: string;                 // id из auth.users
  kind: VerificationKind;
  comment: string | null;
  status: VerificationStatus;
  target_department?: Department | null; // для kind='OFFICE'
  target_faction?: Faction | null;       // для kind='FACTION_MEMBER'
  created_at?: string;
  updated_at?: string;
};

/* ------------------------------ Удобные мапы ------------------------------ */

export const VerificationStatusLabel: Record<VerificationStatus, string> = {
  PENDING: "Ожидает",
  APPROVED: "Одобрено",
  REJECTED: "Отклонено",
};

export const AppointmentStatusLabel: Record<AppointmentStatus, string> = {
  PENDING: "Ожидает",
  APPROVED: "Одобрено",
  REJECTED: "Отклонено",
  DONE: "Завершено",
  CANCELLED: "Отменено",
};
export type { Session, AuthChangeEvent } from "@supabase/supabase-js";

// Дополнительные типы для таблиц, которые используются в проекте
export type Inspection = {
  id: string;
  created_by: string;
  target_id: string;
  target_name: string;
  inspection_type: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type Case = {
  id: string;
  case_number: string;
  title: string;
  description: string;
  status: string;
  created_by: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
};

export type CaseEvent = {
  id: string;
  case_id: string;
  event_type: string;
  description: string;
  created_by: string;
  created_at: string;
};

export type CourtSession = {
  id: string;
  session_date: string;
  title: string;
  description: string;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Lawyer = {
  id: string;
  user_id: string;
  license_number: string;
  specialization: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type LawyerRequest = {
  id: string;
  user_id: string;
  request_type: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type LawyerContract = {
  id: string;
  lawyer_id: string;
  client_id: string;
  case_id: string;
  status: string;
  created_at: string;
  updated_at: string;
};


export type FineStatus = "UNPAID" | "PAID" | "CANCELLED";

export type Fine = {
  id: string;
  created_by: string;
  offender_id?: string | null;
  offender_static_id: string;
  offender_name: string;
  issuer_faction: Faction;        // используем уже существующий Faction
  amount: number;
  reason: string;
  status: FineStatus;
  issued_at?: string;
  paid_at?: string | null;
  updated_at?: string;
};

export const FineStatusLabel: Record<FineStatus, string> = {
  UNPAID: "Не оплачен",
  PAID: "Оплачен",
  CANCELLED: "Отменён",
};

export type WarrantType = "AS" | "S" | "A";
export type WarrantStatus = "active" | "executed" | "expired" | "cancelled";

export type Warrant = {
  id: string;
  warrant_number: string;
  target_name: string;
  target_static_id: string;
  warrant_type: WarrantType;
  reason: string;
  articles: string[];
  issued_by: string;
  issuer_name?: string; // Добавляем поле для имени издателя
  status: WarrantStatus;
  valid_until: string;
  source_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export const WarrantTypeLabel: Record<WarrantType, string> = {
  AS: "Arrest & Search",
  S: "Search",
  A: "Arrest",
};

export const WarrantStatusLabel: Record<WarrantStatus, string> = {
  active: "Активен",
  executed: "Исполнен",
  expired: "Истек",
  cancelled: "Отменен",
};

/** Запросы на изменение ролей */
export type RoleChangeRequestType = "FACTION" | "GOV_ROLE" | "LEADER_ROLE" | "OFFICE_ROLE";

export type RoleChangeRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

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

export const RoleChangeRequestTypeLabel: Record<RoleChangeRequestType, string> = {
  FACTION: "Фракция",
  GOV_ROLE: "Государственная роль",
  LEADER_ROLE: "Лидерская роль",
  OFFICE_ROLE: "Офисная роль",
};

export const RoleChangeRequestStatusLabel: Record<RoleChangeRequestStatus, string> = {
  PENDING: "Ожидает рассмотрения",
  APPROVED: "Одобрено",
  REJECTED: "Отклонено",
};

/** Типы уведомлений */
export type NotificationType = "document" | "court" | "fine" | "wanted" | "system" | "role_change";

/** Приоритеты уведомлений */
export type NotificationPriority = "low" | "medium" | "high";

/** Уведомления */
export type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  url?: string;
  priority: NotificationPriority;
  is_read: boolean;
  created_at: string;
  updated_at: string;
};

/** Лейблы типов уведомлений */
export const NotificationTypeLabel: Record<NotificationType, string> = {
  document: "Документы",
  court: "Суд",
  fine: "Штрафы",
  wanted: "Ордера на арест",
  system: "Система",
  role_change: "Изменение роли",
};

/** Лейблы приоритетов уведомлений */
export const NotificationPriorityLabel: Record<NotificationPriority, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
};