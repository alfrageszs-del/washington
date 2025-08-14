// app/components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = { href: string; label: string };

const links: NavLink[] = [
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

  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur shadow-sm">
      <div className="mx-auto flex h-14 w-full max-w-screen-xl items-center justify-between gap-3 px-4">
        {/* Лого + имя портала */}
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-indigo-600" />
          <span className="text-base font-semibold tracking-tight">
            Washington Gosuslugi
          </span>
        </Link>

        {/* Десктоп-меню */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-md px-3 py-2 text-sm transition ${
                  active
                    ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Моб. меню: компактно, со скроллом */}
        <nav className="md:hidden -mx-2 flex items-center gap-1 overflow-x-auto px-2">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap rounded-md px-3 py-2 text-sm ${
                  active ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-800"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
