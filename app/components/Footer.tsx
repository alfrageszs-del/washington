export default function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="text-sm text-slate-700">
          <div className="font-semibold mb-2">Контактная информация</div>
          <ul className="space-y-1">
            <li>Ruslan Donetskii — Discord: <span className="font-medium">@maniakalniideviant</span></li>
            <li>Kasper Montello — Discord: <span className="font-medium">@ghost_kasper</span></li>
            <li>Lucas Liebert — Discord: <span className="font-medium">@lucasliebert</span></li>
          </ul>
        </div>
        <div className="mt-6 text-xs text-slate-500">© {new Date().getFullYear()} Госуслуги Вашингтон</div>
      </div>
    </footer>
  );
}
