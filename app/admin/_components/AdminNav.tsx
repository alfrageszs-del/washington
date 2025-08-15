"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const base =
  "inline-flex h-9 items-center rounded-full px-3 text-sm border border-slate-200 bg-white hover:bg-slate-50";
const active =
  "inline-flex h-9 items-center rounded-full px-3 text-sm bg-blue-600 text-white border-blue-600";

export default function AdminNav() {
  const pathname = usePathname();
  const Item = (href: string, label: string) => (
    <Link key={href} href={href} className={pathname === href ? active : base}>
      {label}
    </Link>
  );

  return (
    <nav className="mb-4 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-3">
      {Item("/admin", "Все заявки")}
      {Item("/admin/roles", "Роли и доступы")}
      {Item("/admin/appointments", "Заявки на приём")}
      {Item("/admin/justice", "Юстиция")}
      {Item("/admin/factions", "Фракции")}
    </nav>
  );
}
