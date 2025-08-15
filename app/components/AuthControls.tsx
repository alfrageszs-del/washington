// app/components/AuthControls.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase, type AuthChangeEvent, type Session } from "../../lib/supabase/client";

export default function AuthControls() {
  const [state, setState] = useState<"checking" | "in" | "out">("checking");

  useEffect(() => {
    let alive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setState(data.session ? "in" : "out");
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_evt: AuthChangeEvent, session: Session | null) => {
        if (!alive) return;
        setState(session ? "in" : "out");
      }
    );

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (state !== "in") {
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

  return (
    <a
      href="/account"
      className="px-3 py-2 rounded-lg text-sm border border-gray-300 bg-white hover:bg-gray-50"
    >
      Профиль
    </a>
  );
}
