// app/page.tsx
import Link from "next/link";

const cards = [
  { href: "/acts-government", title: "Акты правительства", desc: "Публикации для верифицированных прокуроров." },
  { href: "/acts-court",      title: "Акты суда",         desc: "Решения и определения. Только для судей." },
  { href: "/fines",           title: "Штрафные санкции",  desc: "Записи со ссылками на постановления." },
  { href: "/wanted",          title: "Федеральный розыск",desc: "Список разыскиваемых с основаниями." },
  { href: "/structures",      title: "Госструктуры",      desc: "FIB, LSPD, LSCSD, EMS, WN, SANG." },
  { href: "/appointment",     title: "Запись на приём",   desc: "Выберите адресата и время встречи." },
];

export default function Home() {
  return (
    <section className="space-y-12">
      {/* HERO */}
      <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-sm">
        <div className="grid items-center gap-6 p-8 md:grid-cols-2 md:p-12">
          <div className="space-y-4 text-white">
            <h1 className="text-3xl font-bold leading-tight md:text-4xl">
              Портал государственных услуг Вашингтона
            </h1>
            <p className="text-white/90">
              Единая точка входа для граждан и сотрудников госструктур: акты, розыск, штрафы и электронные обращения.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/appointment" className="btn-primary">
                Записаться на приём
              </Link>
              <Link href="/structures" className="btn-outline">
                Перейти к разделам
              </Link>
            </div>
          </div>

          {/* Декор */}
          <div className="hidden md:block">
            <div className="mx-auto h-44 w-44 rotate-6 rounded-2xl bg-white/95 shadow-2xl ring-1 ring-black/5" />
          </div>
        </div>
      </div>

      {/* БЫСТРЫЕ РАЗДЕЛЫ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <h3 className="mb-1 text-base font-semibold text-gray-900 group-hover:text-indigo-700">
              {c.title}
            </h3>
            <p className="text-sm text-gray-600">{c.desc}</p>
          </Link>
        ))}
      </div>

      {/* ИНФО */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">Что дальше</h2>
        <p className="text-sm text-gray-600">
          Подключим Supabase, регистрацию (ник, static ID, фракция), роли (судья/прокурор/фракции/тех.админ) и начнём делать рабочие формы.
        </p>
      </div>
    </section>
  );
}
