// app/components/AuthControls.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

export default function AuthControls() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    // начальная сессия
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session ?? null);
      setReady(true);
    });

    // подписка на изменения сессии
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession ?? null);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  // пока не знаем — ничего не показываем, чтобы не мигало
  if (!ready) return null;

  // если авторизован — ТОЛЬКО «Профиль»
  if (session) {
    return (
      <a
        href="/account"
        className="px-3 py-2 rounded-lg text-sm border border-gray-300 bg-white hover:bg-gray-50"
      >
        Профиль
      </a>
    );
  }

  // если не авторизован — «Войти» + «Регистрация»
  return (
    <div className="flex items-center gap-2">
      <a
        href="/auth/sign-in"
        className="px-3 py-2 rounded-lg text-sm border border-gray-300 bg-white hover:bg-gray-50"
      >
        Войти
      </a>
      <a
        href="/auth/sign-up"
        className="px-3 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
      >
        Регистрация
      </a>
    </div>
  );
}
