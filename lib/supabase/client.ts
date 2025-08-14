// lib/supabase/client.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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
  GOV: "Правительство",
  JUDICIAL: "Судейский корпус",
};

export type GovRole = "NONE" | "PROSECUTOR" | "JUDGE" | "TECH_ADMIN";

export interface Profile {
  id: string;
  nickname: string;
  static_id: string;
  faction: Faction;
  gov_role: GovRole;
  is_verified: boolean;
  discord: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export type Department =
  | "GOVERNOR" | "VICE_GOVERNOR" | "MIN_FINANCE" | "MIN_JUSTICE" | "BAR"
  | "GOV_STAFF" | "MIN_DEFENSE" | "MIN_SECURITY" | "MIN_HEALTH";

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

export interface Appointment {
  id: string;
  created_by: string;
  department: Department;
  subject: string;
  details: string | null;
  preferred_datetime: string | null; // ISO
  status: AppointmentStatus;
  created_at: string | null;
  updated_at: string | null;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase: SupabaseClient = createClient(url, anon);
