// app/components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import type { Profile } from "../../lib/supabase/client";

type NavLink = { href: string; label: string };

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

  const [me, setMe] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) { if (alive) { setMe(null); setLoading(false); } return; }
      const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      if (alive) { setMe((data ?? null) as Profile | null); setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const showJustice  = me?.gov_role === "TECH_ADMIN" || me?.gov_role === "ATTORNEY_GENERAL" || me?.gov_role === "CHIEF_JUSTICE";
  const showOffice   = !!me?.office_role;
  const showFactions = !!me?.leader_role;
  const showAdmin    = me?.gov_role === "TECH_ADMIN";

  const LinkBtn = ({ href, label }: NavLink) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`rounded-md px-3 py-2 text-sm transition ${
          active
            ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
            : "text-gray-700 hover:bg-gray-100"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur shadow-sm">
      <div className="mx-auto flex h-14 w-full max-w-screen-xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-indigo-600" />
          <span className="text-base font-semibold tracking-tight">Washington Gosuslugi</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {baseLinks.map((l) => <LinkBtn key={l.href} {...l} />)}
          {showJustice  && <LinkBtn href="/admin/justice"  label="Юстиция" />}
          {showFactions && <LinkBtn href="/admin/factions" label="Фракции" />}
          {showOffice   && <LinkBtn href="/office"         label="Кабинет" />}
          {showAdmin    && <LinkBtn href="/admin"          label="Админ" />}
        </nav>

        <div className="flex items-center gap-2">
          <button onClick={()=>router.back()} className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">
            Назад
          </button>

          {!loading && !me && (
            <>
              <Link href="/auth/sign-in" className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">Войти</Link>
              <Link href="/auth/sign-up" className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                Регистрация
              </Link>
            </>
          )}

          {!!me && (
            <Link href="/account" className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">Профиль</Link>
          )}
        </div>
      </div>

      {/* Моб. меню можешь оставить как было, либо скопировать логику сверху */}
    </header>
  );
}
