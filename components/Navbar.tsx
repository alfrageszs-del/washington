"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase/client";
import type { Profile } from "../lib/supabase/client";
import NotificationBadge from "../app/components/NotificationBadge";

type MenuItem = { 
  href: string; 
  label: string; 
  icon?: string;
  description?: string;
};

type DropdownMenu = {
  label: string;
  icon: string;
  items: MenuItem[];
  show?: boolean;
};

const mainMenu: MenuItem[] = [
  { href: "/", label: "Главная", icon: "🏠" },
  { href: "/search", label: "Поиск документов", icon: "🔍", description: "Поиск по StaticID или nickname" },
];

const documentsMenu: MenuItem[] = [
  { href: "/acts-government", label: "Акты правительства", icon: "📜" },
  { href: "/acts-court", label: "Акты суда", icon: "⚖️" },
  { href: "/fines", label: "Штрафы", icon: "💰" },
  { href: "/wanted", label: "Розыск", icon: "🚨" },
];

const legalSystemMenu: MenuItem[] = [
  { href: "/cases", label: "Дела", icon: "📁", description: "Управление делами" },
  { href: "/court-sessions", label: "Заседания", icon: "🏛️", description: "Реестр заседаний" },
  { href: "/lawyers", label: "Адвокаты", icon: "👨‍💼", description: "Управление адвокатами" },
  { href: "/inspections", label: "Проверки", icon: "🔍", description: "Прокуратура и EMS" },
];

const servicesMenu: MenuItem[] = [
  { href: "/structures", label: "Госструктуры", icon: "🏢" },
  { href: "/appointment", label: "Запись на приём", icon: "📅" },
];

const adminMenu: MenuItem[] = [
  { href: "/admin", label: "Панель управления", icon: "⚙️" },
  { href: "/admin/justice", label: "Юстиция", icon: "⚖️" },
  { href: "/admin/factions", label: "Фракции", icon: "👥" },
  { href: "/admin/roles", label: "Роли", icon: "🎭" },
  { href: "/admin/appointments", label: "Заявки", icon: "📋" },
];

const pill = "inline-flex h-10 items-center rounded-full px-4 text-sm font-medium transition-colors " +
  "border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300";

const pillActive = "inline-flex h-10 items-center rounded-full px-4 text-sm font-medium " +
  "border border-blue-600 bg-blue-600 text-white";

const buttonPrimary = "inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-white " +
  "bg-blue-600 hover:bg-blue-700 transition-colors";

const buttonSecondary = "inline-flex h-10 items-center rounded-full px-4 text-sm font-medium " +
  "border border-slate-200 bg-white hover:bg-slate-50 transition-colors";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Profile | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

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

  // Определяем права доступа
  const isAdmin = me?.gov_role === "TECH_ADMIN";
  const isJustice = me?.gov_role === "TECH_ADMIN" || me?.gov_role === "ATTORNEY_GENERAL" || me?.gov_role === "CHIEF_JUSTICE";
  const hasOfficeRole = !!me?.office_role;
  const hasLeaderRole = !!me?.leader_role;
  const isLoggedIn = !!me;

  const dropdowns: DropdownMenu[] = [
    {
      label: "Документы",
      icon: "📄",
      items: documentsMenu,
      show: true
    },
    {
      label: "Правовая система",
      icon: "⚖️",
      items: legalSystemMenu,
      show: isLoggedIn
    },
    {
      label: "Услуги",
      icon: "🏛️",
      items: servicesMenu,
      show: true
    },
    {
      label: "Администрирование",
      icon: "⚙️",
      items: adminMenu,
      show: isAdmin
    }
  ];

  const DropdownMenu = ({ menu }: { menu: DropdownMenu }) => {
    const isOpen = openDropdown === menu.label;
    
    return (
      <div className="relative">
        <button
          onClick={() => setOpenDropdown(isOpen ? null : menu.label)}
          className={`${pill} ${isOpen ? 'border-blue-300 bg-blue-50' : ''}`}
        >
          <span className="mr-2">{menu.icon}</span>
          {menu.label}
          <svg 
            className={`ml-2 h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-lg z-50">
            <div className="p-2">
              {menu.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center p-3 rounded-md hover:bg-slate-50 transition-colors"
                  onClick={() => setOpenDropdown(null)}
                >
                  <span className="text-lg mr-3">{item.icon}</span>
                  <div>
                    <div className="font-medium text-slate-900">{item.label}</div>
                    {item.description && (
                      <div className="text-sm text-slate-500">{item.description}</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const NavLink = ({ href, label, icon }: MenuItem) => {
    const active = pathname === href;
    return (
      <Link href={href} className={active ? pillActive : pill}>
        {icon && <span className="mr-2">{icon}</span>}
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4">
        {/* Логотип */}
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-7 w-7">
            <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#FF3B52] to-[#2751FF]" />
            <span className="absolute -right-1 -bottom-1 h-3.5 w-3.5 rounded-lg bg-white shadow-[0_2px_8px_rgba(0,0,0,.18)]" />
          </div>
          <div className="leading-tight">
            <div className="text-[11px] uppercase tracking-wider text-slate-500">портал</div>
            <div className="text-base font-bold">
              <span className="text-transparent bg-clip-text bg-[linear-gradient(90deg,#FF3B52,#2751FF)]">
                Госуслуги
              </span>{" "}
              <span className="text-slate-800">Вашингтон</span>
            </div>
          </div>
        </Link>

        {/* Основная навигация */}
        <nav className="hidden lg:flex items-center gap-2">
          {mainMenu.map((item) => <NavLink key={item.href} {...item} />)}
          
          {dropdowns.filter(menu => menu.show).map((menu) => (
            <DropdownMenu key={menu.label} menu={menu} />
          ))}
        </nav>

        {/* Правая часть - кнопки */}
        <div className="flex items-center gap-2">
          {/* Уведомления (только для залогиненных) */}
          {isLoggedIn && <NotificationBadge />}
          
          {/* Кнопка "Назад" */}
          <button onClick={() => router.back()} className={buttonSecondary}>
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Назад
          </button>

          {/* Кнопки для незалогиненных */}
          {!isLoggedIn && (
            <>
              <Link href="/auth/sign-in" className={buttonSecondary}>
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Войти
              </Link>
              <Link href="/auth/sign-up" className={buttonPrimary}>
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Регистрация
              </Link>
            </>
          )}

          {/* Кнопки для залогиненных */}
          {isLoggedIn && (
            <>
              {/* Кабинет (если есть офисная роль) */}
              {hasOfficeRole && (
                <Link href="/office" className={buttonSecondary}>
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Кабинет
                </Link>
              )}

              {/* Админ (если есть права) */}
              {isAdmin && (
                <Link href="/admin" className={buttonSecondary}>
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Админ
                </Link>
              )}

              {/* Профиль */}
              <Link href="/account" className={buttonSecondary}>
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Профиль
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Мобильное меню (упрощенная версия) */}
      <div className="lg:hidden border-t border-slate-200 bg-white">
        <div className="px-4 py-2">
          <div className="flex items-center gap-2 overflow-x-auto">
            {mainMenu.map((item) => <NavLink key={item.href} {...item} />)}
            {documentsMenu.map((item) => <NavLink key={item.href} {...item} />)}
            {isLoggedIn && legalSystemMenu.map((item) => <NavLink key={item.href} {...item} />)}
            {servicesMenu.map((item) => <NavLink key={item.href} {...item} />)}
          </div>
        </div>
      </div>

      {/* Затемнение при открытом дропдауне */}
      {openDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setOpenDropdown(null)}
        />
      )}
    </header>
  );
}
