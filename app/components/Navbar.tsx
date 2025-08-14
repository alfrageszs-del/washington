// app/components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AuthControls from "./AuthControls";
import { supabase } from "../../lib/supabase/client";
import type { Profile } from "../../lib/supabase/client";

type NavLink = { href: `/${string}` | "/"; label: string };

const baseLinks: NavLink[] = [
  { href: "/", label: "Главная" },
  { href: "/acts-government", label: "Акты правительства" },
  { href: "/acts-court", label: "Акты суда" },
  { href: "/fines", label: "Штрафы" },
  { href: "/wanted", label: "Розыск" },
  { href: "/structures", label: "Госструктуры" },
  { href: "/appointment", label: "Запись на приём" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  // кто вошёл / админ ли
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    const readRole = async (userId: string | undefined) => {
      if (!userId) { setIsAdmin(false); return; }
      const { data } = await supabase
        .from("profiles")
        .select("gov_role")
        .eq("id", userId)
        .maybeSingle();
      const me = (data ?? null) as Pick<Profile, "gov_role"> | null;
      setIsAdmin(me?.gov_role === "TECH_ADMIN");
    };

    // стартовая сессия
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      const has = !!session;
      setLoggedIn(has);
      readRole(session?.user?.id);
    });

    // обновления сессии
    const { data } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!mounted) return;
      const has = !!session;
      setLoggedIn(has);
      readRole(session?.user?.id);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const links: NavLink[] = useMemo(() => {
    const out = [...baseLinks];
    if (loggedIn) out.push({ href: "/account/appointments", label: "Мои записи" });
    if (isAdmin) out.push({ href: "/admin", label: "Админ" });
    return out;
  }, [loggedIn, isAdmin]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-screen-xl items-center justify-between gap-3 px-4">
        {/* Лого */}
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 shadow" />
          <span className="text-[15px] font-semibold tracking-tight">
            Washington Gosuslugi
          </span>
        </Link>

        {/* Навигация (desktop) */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Разделы">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={[
                "px-3 py-2 rounded-lg text-sm transition shadow-sm",
                isActive(l.href)
                  ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                  : "text-gray-700 hover:bg-gray-100",
              ].join(" ")}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Правый край: Назад + Профиль/Войти/Регистрация */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-3 py-2 rounded-lg text-sm border border-gray-300 bg-white hover:bg-gray-50"
            title="Назад"
          >
            Назад
          </button>
          {/* ВАЖНО: рендерим всегда — сам AuthControls решает, что показать */}
          <AuthControls />
        </div>
      </div>

      {/* Навигация (mobile) */}
      <nav
        className="lg:hidden flex items-center gap-1 overflow-x-auto px-4 pb-2"
        aria-label="Разделы (моб.)"
      >
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={[
              "whitespace-nowrap px-3 py-2 rounded-lg text-sm",
              isActive(l.href)
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-800",
            ].join(" ")}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
