"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";

export default function AuthControls() {
  const [loggedIn, setLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setLoggedIn(!!data.user);
    });

    const { data } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!mounted) return;
      setLoggedIn(!!session?.user);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  if (loggedIn) {
    return (
      <a
        href="/account"
        className="px-3 py-2 rounded-lg text-sm border border-gray-300 bg-white hover:bg-gray-50"
      >
        Профиль
      </a>
    );
  }

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
