"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

export default function AuthControls() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session ?? null);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!mounted) return;
      setSession(s ?? null);
    });
    return () => { mounted = false; data.subscription.unsubscribe(); };
  }, []);

  return session ? (
    <a href="/account" className="px-3 py-2 rounded-lg text-sm border border-gray-300 bg-white hover:bg-gray-50">
      Профиль
    </a>
  ) : (
    <div className="flex items-center gap-2">
      <a href="/auth/sign-in" className="px-3 py-2 rounded-lg text-sm border border-gray-300 bg-white hover:bg-gray-50">
        Войти
      </a>
      <a href="/auth/sign-up" className="px-3 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm">
        Регистрация
      </a>
    </div>
  );
}
