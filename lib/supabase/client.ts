// lib/supabase/client.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Доменные типы (строго, без any)
export type Faction = "CIVILIAN" | "FIB" | "LSPD" | "LSCSD" | "EMS" | "WN" | "SANG";
export type GovRole = "NONE" | "PROSECUTOR" | "JUDGE" | "TECH_ADMIN";

export interface Profile {
  id: string;
  nickname: string;
  static_id: string;
  faction: Faction;
  gov_role: GovRole;
  is_verified: boolean;
  created_at: string | null;
  updated_at: string | null;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Не указываем генерацию типов базы, чтобы избежать any. 
// Общение идёт через строго типизированные интерфейсы выше.
export const supabase: SupabaseClient = createClient(url, anon);
