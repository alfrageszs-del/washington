import Link from "next/link";

const units = [
  { href: "/structures/fib", label: "FIB" },
  { href: "/structures/lspd", label: "LSPD" },
  { href: "/structures/lscsd", label: "LSCSD" },
  { href: "/structures/ems", label: "EMS" },
  { href: "/structures/wn", label: "WN" },
  { href: "/structures/sang", label: "SANG" },
];

export default function Page() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Госструктуры</h1>
      <p className="text-sm text-gray-600">
        Здесь граждане смогут подавать электронные заявки на трудоустройство. Для FIB/LSPD/LSCSD — также заявления на нарушения.
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {units.map((u) => (
          <Link
            key={u.href}
            href={u.href}
            className="rounded-lg border bg-white p-4 hover:shadow"
          >
            {u.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
