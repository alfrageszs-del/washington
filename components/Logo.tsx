export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      {/* Простая «капля» в фирменных цветах */}
      <div className="relative h-6 w-6">
        <span className="absolute inset-0 rounded-lg bg-gradient-to-br from-brand-red to-brand-blue" />
      </div>
      <span className="text-sm font-semibold">Госуслуги Вашингтон</span>
    </div>
  );
}
