import Link from "next/link";

const card =
  "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition";

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 space-y-10">
      {/* hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 text-white">
        <div className="p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold">Единый портал государственных услуг Вашингтона</h1>
          <p className="mt-3 max-w-2xl text-blue-100">
            Публикация актов правительства и суда, розыск, штрафы и электронные обращения для граждан и сотрудников госструктур.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/appointment" className="inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-blue-700 hover:bg-blue-50">
              Записаться на приём
            </Link>
            <Link href="/structures" className="inline-flex h-11 items-center rounded-full border border-white/40 px-5 text-sm font-semibold hover:bg-white/10">
              Перейти к разделам
            </Link>
          </div>
        </div>
      </section>

      {/* быстрые карточки */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/acts-government" className={card}>
          <h3 className="font-semibold">Акты правительства</h3>
          <p className="mt-1 text-sm text-slate-600">Публикации уполномоченных сотрудников (прокуроры).</p>
        </Link>
        <Link href="/acts-court" className={card}>
          <h3 className="font-semibold">Акты суда</h3>
          <p className="mt-1 text-sm text-slate-600">Решения и определения, публикуемые судьями.</p>
        </Link>
        <Link href="/fines" className={card}>
          <h3 className="font-semibold">Штрафные санкции</h3>
          <p className="mt-1 text-sm text-slate-600">Реестр штрафов со ссылками на постановления.</p>
        </Link>
        <Link href="/wanted" className={card}>
          <h3 className="font-semibold">Федеральный розыск</h3>
          <p className="mt-1 text-sm text-slate-600">Список разыскиваемых с основаниями.</p>
        </Link>
        <Link href="/structures" className={card}>
          <h3 className="font-semibold">Госструктуры</h3>
          <p className="mt-1 text-sm text-slate-600">FIB, LSPD, LSCSD, EMS, WN, SANG — заявки и обращения.</p>
        </Link>
        <Link href="/appointment" className={card}>
          <h3 className="font-semibold">Запись на приём</h3>
          <p className="mt-1 text-sm text-slate-600">Выберите адресата и удобное время.</p>
        </Link>
      </section>
    </main>
  );
}
