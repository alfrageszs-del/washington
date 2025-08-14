// app/components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type NavLink = { href: `/${string}` | "/"; label: string };

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
  const router = useRouter();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-[9999] border-b bg-white">
      <div className="mx-auto flex h-14 w-full max-w-screen-xl items-center justify-between gap-2 px-4">
        {/* Лого + имя портала */}
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-indigo-600" />
          <span className="text-base font-semibold tracking-tight">
            Washington Gosuslugi
          </span>
        </Link>

        {/* Меню разделов — ВСЕГДА видно */}
        <nav className="flex flex-wrap items-center gap-1" aria-label="Разделы">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-md px-3 py-2 text-sm transition ${
                isActive(l.href)
                  ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Кнопки справа — ВСЕГДА видно */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
            title="Назад"
          >
            Назад
          </button>

          <Link
            href="/auth/sign-in"
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
          >
            Войти
          </Link>

          <Link
            href="/auth/sign-up"
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Регистрация
          </Link>

          <Link
            href="/account"
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
          >
            Профиль
          </Link>
        </div>
      </div>
    </header>
  );
}
