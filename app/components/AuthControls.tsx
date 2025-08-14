// app/components/AuthControls.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

export default function AuthControls() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    // Текущая сессия
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session ?? null);
      setLoading(false);
    });

    // Подписка на изменения сессии
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return null;

  return session ? (
    <div className="flex items-center gap-2">
      <a href="/account" className="rounded-md bg-gray-100 px-3 py-2 text-sm">
        Профиль
      </a>
      <button
        onClick={signOut}
        className="rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
      >
        Выйти
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <a href="/auth/sign-in" className="rounded-md bg-gray-100 px-3 py-2 text-sm">
        Войти
      </a>
      <a
        href="/auth/sign-up"
        className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700"
      >
        Регистрация
      </a>
    </div>
  );
}
