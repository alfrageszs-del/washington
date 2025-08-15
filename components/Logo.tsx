// components/Logo.tsx
export default function Logo() {
  return (
    <div className="flex items-center gap-2 select-none">
      {/* значок – «капля» с градиентом и белой «точкой» */}
      <div className="relative h-7 w-7">
        <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#FF3B52] to-[#2751FF]" />
        <span className="absolute -right-1 -bottom-1 h-3.5 w-3.5 rounded-lg bg-white shadow-[0_2px_8px_rgba(0,0,0,.18)]" />
      </div>
      {/* вордмарк с градиентом «Госуслуги» */}
      <span className="text-base leading-none font-semibold tracking-tight">
        <span className="text-transparent bg-clip-text bg-[linear-gradient(90deg,#FF3B52,#2751FF)]">
          Госуслуги
        </span>{" "}
        <span className="text-slate-800">Вашингтон</span>
      </span>
    </div>
  );
}
