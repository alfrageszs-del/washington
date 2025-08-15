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

// 3D-кнопка (light, с пресс-эффектом)
const btn3d =
  "relative inline-flex items-center rounded-xl border border-indigo-200 " +
  "bg-gradient-to-b from-white to-indigo-50 text-gray-800 " +
  "shadow-[0_1px_0_#ffffff_inset,0_2px_0_rgba(0,0,0,0.05)] " +
  "hover:from-white hover:to-indigo-100 " +
  "active:translate-y-[1px] active:shadow-[0_1px_0_rgba(0,0,0,0.08)_inset] " +
  "transition px-3 py-2 text-sm";

const btn3dPrimary =
  "rounded-xl border border-indigo-300 bg-gradient-to-b from-indigo-500 to-indigo-600 " +
  "text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_3px_0_rgba(0,0,0,0.15)] " +
  "hover:from-indigo-500 hover:to-indigo-700 active:translate-y-[1px] active:shadow-[0_1px_0_rgba(0,0,0,0.25)_inset]";

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
        className={
          active
            ? `${btn3d} ring-1 ring-indigo-200 border-indigo-300 text-indigo-700`
            : btn3d
        }
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-screen-xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-indigo-600 shadow" />
          <span className="text-base font-semibold tracking-tight">
            Washington Gosuslugi
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-2">
          {baseLinks.map((l) => <LinkBtn key={l.href} {...l} />)}
          {showJustice  && <LinkBtn href="/admin/justice"  label="Юстиция" />}
          {showFactions && <LinkBtn href="/admin/factions" label="Фракции" />}
          {showOffice   && <LinkBtn href="/office"         label="Кабинет" />}
          {showAdmin    && <LinkBtn href="/admin"          label="Админ" />}
        </nav>

        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className={btn3d}>Назад</button>

          {!loading && !me && (
            <>
              <Link href="/auth/sign-in" className={btn3d}>Войти</Link>
              <Link href="/auth/sign-up" className={btn3dPrimary}>Регистрация</Link>
            </>
          )}

          {!!me && (
            <Link href="/account" className={btn3d}>Профиль</Link>
          )}
        </div>
      </div>
    </header>
  );
}
