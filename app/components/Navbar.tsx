"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import type { Profile } from "../../lib/supabase/client";

type Item = { href: string; label: string };

const main: Item[] = [
  { href: "/", label: "Главная" },
  { href: "/acts-government", label: "Акты правительства" },
  { href: "/acts-court", label: "Акты суда" },
  { href: "/fines", label: "Штрафы" },
  { href: "/wanted", label: "Розыск" },
  { href: "/structures", label: "Госструктуры" },
  { href: "/appointment", label: "Запись на приём" },
];

const pill =
  "inline-flex h-10 items-center rounded-full px-4 text-sm font-medium transition-colors " +
  "border border-slate-200 bg-white hover:bg-slate-50";

const pillActive =
  "inline-flex h-10 items-center rounded-full px-4 text-sm font-medium " +
  "border border-blue-600 bg-blue-600 text-white";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Profile | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) { if (alive) setMe(null); return; }
      const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      if (alive) setMe((data ?? null) as Profile | null);
    })();
    return () => { alive = false; };
  }, []);

  const showJustice  = me?.gov_role === "TECH_ADMIN" || me?.gov_role === "ATTORNEY_GENERAL" || me?.gov_role === "CHIEF_JUSTICE";
  const showOffice   = !!me?.office_role;
  const showFactions = !!me?.leader_role;
  const showAdmin    = me?.gov_role === "TECH_ADMIN";

  const NavLink = ({ href, label }: Item) => {
    const active = pathname === href;
    return (
      <Link href={href} className={active ? pillActive : pill}>
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.svg" alt="Логотип" width={28} height={28} />
          <div className="leading-tight">
            <div className="text-[11px] uppercase tracking-wider text-slate-500">портал</div>
            <div className="text-base font-bold">Госуслуги Вашингтон</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-2">
          {main.map((i) => <NavLink key={i.href} {...i} />)}
          {showJustice  && <NavLink href="/admin/justice"  label="Юстиция" />}
          {showFactions && <NavLink href="/admin/factions" label="Фракции" />}
          {showOffice   && <NavLink href="/office"         label="Кабинет" />}
          {showAdmin    && <NavLink href="/admin"          label="Админ" />}
        </nav>

        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className={pill}>Назад</button>
          {!me && (
            <>
              <Link href="/auth/sign-in" className={pill}>Войти</Link>
              <Link href="/auth/sign-up" className="inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700">
                Регистрация
              </Link>
            </>
          )}
          {me && <Link href="/account" className={pill}>Профиль</Link>}
        </div>
      </div>
    </header>
  );
}
