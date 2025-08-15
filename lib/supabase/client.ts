import {
  createClient,
  type SupabaseClient,
  type AuthChangeEvent,
  type Session,
} from "@supabase/supabase-js";

export type Faction =
  | "CIVILIAN" | "FIB" | "LSPD" | "LSCSD" | "EMS" | "WN" | "SANG" | "GOV" | "JUDICIAL";

export const FactionLabel: Record<Faction, string> = {
  CIVILIAN: "Гражданский",
  FIB: "FIB",
  LSPD: "LSPD",
  LSCSD: "LSCSD",
  EMS: "EMS",
  WN: "WN",
  SANG: "SANG",
  GOV: "GOV",
  JUDICIAL: "Судейский корпус",
};

export type GovRole =
  | "NONE"
  | "PROSECUTOR"
  | "JUDGE"
  | "TECH_ADMIN"
  | "ATTORNEY_GENERAL"  // NEW
  | "CHIEF_JUSTICE";    // NEW

export type LeaderRole =
  | "GOVERNOR"
  | "DIRECTOR_WN"
  | "DIRECTOR_FIB"
  | "CHIEF_LSPD"
  | "SHERIFF_LSCSD"
  | "CHIEF_EMS"
  | "COLONEL_SANG";

export type Department =
  | "GOVERNOR" | "VICE_GOVERNOR" | "MIN_FINANCE" | "MIN_JUSTICE"
  | "BAR" | "GOV_STAFF" | "MIN_DEFENSE" | "MIN_SECURITY" | "MIN_HEALTH";

export const DepartmentLabel: Record<Department, string> = {
  GOVERNOR: "Губернатор",
  VICE_GOVERNOR: "Вице-губернатор",
  MIN_FINANCE: "Министерство финансов",
  MIN_JUSTICE: "Министерство юстиции",
  BAR: "Коллегия адвокатов",
  GOV_STAFF: "Аппарат правительства",
  MIN_DEFENSE: "Министерство обороны",
  MIN_SECURITY: "Министерство безопасности",
  MIN_HEALTH: "Министерство здравоохранения",
};

export type AppointmentStatus = "PENDING" | "APPROVED" | "REJECTED" | "DONE" | "CANCELLED";
export type VerificationKind =
  | "PROSECUTOR"
  | "JUDGE"
  | "ACCOUNT"
  | "OFFICE"          // NEW: назначение в департамент/офис
  | "FACTION_MEMBER"; // NEW: вступление в фракцию
export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type Profile = {
  id: string;
  nickname: string;
  static_id: string;
  discord: string | null;
  faction: Faction;
  gov_role: GovRole;
  is_verified: boolean;
  leader_role?: LeaderRole | null;   // NEW
  office_role?: Department | null;   // NEW
  created_at?: string;
  updated_at?: string;
};


export type Appointment = {
  id: string;
  created_by: string;
  department: Department;
  subject: string;
  details: string | null;
  preferred_datetime: string | null;
  status: AppointmentStatus;
  created_at?: string;
  updated_at?: string;
};

export type VerificationRequest = {
  id: string;
  created_by: string;
  kind: VerificationKind;
  comment: string | null;
  status: VerificationStatus;
  target_department?: Department | null; // NEW (для OFFICE)
  target_faction?: Faction | null;       // NEW (для FACTION_MEMBER)
  created_at?: string;
  updated_at?: string;
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const SUPABASE_CONFIGURED = Boolean(URL && ANON);

function makeThrowingClient(): SupabaseClient {
  const handler: ProxyHandler<any> = {
    get() {
      throw new Error(
        "Supabase не сконфигурирован: задайте NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    },
    apply() {
      throw new Error(
        "Supabase не сконфигурирован: задайте NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    },
  };
  return new Proxy({}, handler) as SupabaseClient;
}

export const supabase: SupabaseClient = SUPABASE_CONFIGURED
  ? createClient(URL, ANON, { auth: { persistSession: true, autoRefreshToken: true } })
  : makeThrowingClient();

export type { SupabaseClient, AuthChangeEvent, Session };
