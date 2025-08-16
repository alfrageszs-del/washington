"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";

const links: { href: string; label: string }[] = [
  { href: "/",               label: "Главная" },
  { href: "/acts-government",label: "Акты правительства" },
  { href: "/acts-court",     label: "Акты суда" },
  { href: "/fines",          label: "Штрафы" },
  { href: "/wanted",         label: "Ордера" },
  { href: "/structures",     label: "Госструктуры" },
  { href: "/appointment",    label: "Запись" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/50">
      <div className="mx-auto w-full max-w-screen-2xl px-4">
        {/* верхняя строка: логотип — меню — кнопки */}
        <div className="h-16 flex items-center justify-between gap-3">
          <Link href="/" className="shrink-0" aria-label="На главную">
            <Logo />
          </Link>

          {/* desktop-меню */}
          <nav
            aria-label="Основная навигация"
            className="hidden md:flex flex-wrap items-center gap-2"
          >
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link key={l.href} href={l.href} className={active ? "pill-active" : "pill"}>
                  {l.label}
                </Link>
              );
            })}
          </nav>

          {/* действия справа */}
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={() => (typeof window !== "undefined" ? window.history.back() : null)}
              className="btn-outline"
              aria-label="Назад"
            >
              Назад
            </button>
            <Link href="/account" className="btn-primary">Кабинет</Link>
            <Link href="/admin" className="btn-ghost">Админ</Link>
          </div>
        </div>

        {/* мобильная лента-пилюля + действия */}
        <div className="md:hidden pb-3 flex items-center gap-2">
          <div className="flex-1 overflow-x-auto no-scrollbar flex gap-2">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link key={l.href} href={l.href} className={active ? "pill-active" : "pill"}>
                  {l.label}
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-2 pl-1">
            <button
              type="button"
              onClick={() => (typeof window !== "undefined" ? window.history.back() : null)}
              className="pill"
              aria-label="Назад"
            >
              Назад
            </button>
            <Link href="/account" className="pill">Кабинет</Link>
            <Link href="/admin" className="pill">Админ</Link>
          </div>
        </div>
      </div>
    </header>
  );
}
