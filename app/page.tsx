import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* HERO */}
      <section className="card overflow-hidden">
        <div className="relative isolate">
          <div className="absolute -inset-2 opacity-70 blur-2xl"
               style={{ background: "radial-gradient(60% 60% at 20% 20%, #2b56ff33, transparent 60%), radial-gradient(50% 50% at 80% 20%, #ff3b5233, transparent 60%)" }}
          />
          <div className="relative p-6 md:p-10">
            <h1 className="text-2xl md:text-3xl font-bold">Единый портал государственных услуг Вашингтона</h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              Публикация актов правительства и суда, розыск, штрафы и электронные обращения для граждан
              и сотрудников госструктур.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/appointment" className="btn-primary">Записаться на приём</Link>
              <a href="#sections" className="btn-ghost">Перейти к разделам</a>
            </div>
          </div>
        </div>
      </section>

      {/* GRID of sections */}
      <section id="sections" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/acts-government" className="card p-5 hover:shadow-lg transition">
          <div className="font-semibold">Акты правительства</div>
          <p className="mt-1 text-sm text-slate-600">
            Публикации уполномоченных сотрудников (прокуроры).
          </p>
        </Link>

        <Link href="/acts-court" className="card p-5 hover:shadow-lg transition">
          <div className="font-semibold">Акты суда</div>
          <p className="mt-1 text-sm text-slate-600">
            Решения и определения, публикуемые судьями.
          </p>
        </Link>

        <Link href="/fines" className="card p-5 hover:shadow-lg transition">
          <div className="font-semibold">Штрафные санкции</div>
          <p className="mt-1 text-sm text-slate-600">
            Реестр штрафов со ссылками на постановления.
          </p>
        </Link>

        <Link href="/wanted" className="card p-5 hover:shadow-lg transition">
          <div className="font-semibold">Федеральный розыск</div>
          <p className="mt-1 text-sm text-slate-600">
            Список разыскиваемых с основаниями.
          </p>
        </Link>

        <Link href="/structures" className="card p-5 hover:shadow-lg transition">
          <div className="font-semibold">Госструктуры</div>
          <p className="mt-1 text-sm text-slate-600">
            FIB, LSPD, LSCS, EMS, WN, SANG — заявки и обращения.
          </p>
        </Link>

        <Link href="/appointment" className="card p-5 hover:shadow-lg transition">
          <div className="font-semibold text-brand-blue">Запись на приём</div>
          <p className="mt-1 text-sm text-slate-600">
            Выберите адресата и удобное время.
          </p>
        </Link>
      </section>
    </div>
  );
}
