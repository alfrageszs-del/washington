export default function Page() {
  const departments = [
    "Министерство финансов",
    "Губернатор",
    "Вице-губернатор",
    "Министерство юстиции",
    "Коллегия адвокатов",
    "Аппарат правительства",
    "Министерство обороны",
    "Министерство безопасности",
    "Министерство здравоохранения",
  ];

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Запись на приём</h1>
      <div className="rounded-lg border bg-white p-4">
        <form action="#" method="post" className="space-y-3">
          <label className="block">
            <span className="text-sm">К кому записаться</span>
            <select className="mt-1 w-full rounded-md border px-3 py-2">
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm">Тема обращения</span>
            <input className="mt-1 w-full rounded-md border px-3 py-2" placeholder="Коротко опиши вопрос" />
          </label>

          <label className="block">
            <span className="text-sm">Желаемая дата и время</span>
            <input type="datetime-local" className="mt-1 w-full rounded-md border px-3 py-2" />
          </label>

          <button
            type="submit"
            className="rounded-md bg-blue-900 px-4 py-2 text-white hover:bg-blue-800"
          >
            Отправить (пока без логики)
          </button>
        </form>
      </div>
    </section>
  );
}
