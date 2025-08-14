// app/components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import AuthControls from "./AuthControls";

type NavLink = {
  href: `/${string}` | "/";
  label: string;
  /** Если true — активным считается и сам путь, и все его подстраницы */
  matchPrefix?: boolean;
};

const links: NavLink[] = [
  { href: "/", label: "Главная" },
  { href: "/acts-government", label: "Акты правительства" },
  { href: "/acts-court", label: "Акты суда" },
  { href: "/fines", label: "Штрафы" },
  { href: "/wanted", label: "Розыск" },
  { href: "/structures", label: "Госструктуры", matchPrefix: true },
  { href: "/appointment", label: "Запись на приём" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState<boolean>(false);

  const isActive = (l: NavLink): boolean =>
    pathname === l.href ||
    (!!l.matchPrefix && pathname.startsWith(l.href + "/"));

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-screen-xl items-center justify-between gap-3 px-4">
        {/* Лого + имя портала */}
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-indigo-600" />
          <span className="text-base font-semibold tracking-tight">
            Washington Gosuslugi
          </span>
        </Link>

        {/* Десктоп-меню */}
        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Главная навигация"
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-md px-3 py-2 text-sm transition ${
                isActive(l)
                  ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Правый блок: авторизация (desktop) */}
        <div className="hidden md:block">
          <AuthControls />
        </div>

        {/* Кнопка бургера (mobile) */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 md:hidden"
          aria-label="Открыть меню"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {!open ? (
            // icon: menu
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            // icon: close
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Мобильное выпадающее меню */}
      <div className={`md:hidden ${open ? "block" : "hidden"}`}>
        <div className="border-t bg-white">
          <nav className="mx-auto flex max-w-screen-xl flex-col gap-1 px-4 py-3" aria-label="Мобильная навигация">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-2 text-sm ${
                  isActive(l) ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-800"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-2">
              <AuthControls />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
