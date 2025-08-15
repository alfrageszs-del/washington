// components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";

const links: { href: string; label: string }[] = [
  { href: "/",               label: "Главная" },
  { href: "/acts-government",label: "Акты правительства" },
  { href: "/acts-court",     label: "Акты суда" },
  { href: "/fines",          label: "Штрафы" },
  { href: "/wanted",         label: "Розыск" },
  { href: "/structures",     label: "Госструктуры" },
  { href: "/appointment",    label: "Запись" },
  // ⚠️ УДАЛЕНО: { href: "/justice", label: "Юстиция" },
  // ⚠️ УДАЛЕНО: { href: "/factions", label: "Фракции" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-screen-2xl items-center justify-between gap-3 px-4">
        <Link href="/" className="shrink-0" aria-label="Госуслуги Вашингтон — на главную">
          <Logo />
        </Link>

        {/* desktop */}
        <nav className="hidden md:flex flex-wrap items-center gap-2" aria-label="Основная навигация">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link key={l.href} href={l.href} className={active ? "pill-active" : "pill"}>
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* right controls */}
        <div className="flex items-center gap-2">
          <button
            className="pill"
            onClick={() => (typeof window !== "undefined" ? window.history.back() : null)}
            type="button"
          >
            Назад
          </button>
          <Link href="/account" className="pill">Кабинет</Link>
          <Link href="/admin" className="pill">Админ</Link>
        </div>
      </div>

      {/* mobile scroller */}
      <div className="md:hidden border-t bg-white">
        <div className="mx-auto max-w-screen-2xl overflow-x-auto px-4 py-2 flex gap-2" aria-label="Навигация (моб.)">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link key={l.href} href={l.href} className={active ? "pill-active" : "pill"}>
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
