// app/appointment/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import type { Office, AppointmentStatus } from "../../lib/supabase/client";
import { OfficeLabel } from "../../lib/supabase/client";

const OFFICES: Office[] = [
  "GOVERNOR",
  "VICE_GOVERNOR",
  "MIN_FINANCE",
  "MIN_JUSTICE",
  "BAR_ASSOCIATION",
  "GOV_STAFF",
  "MIN_DEFENSE",
  "MIN_SECURITY",
  "MIN_HEALTH",
  "OTHER",
];

export default function AppointmentPage() {
  const [meId, setMeId] = useState<string | null>(null);
  const [dept, setDept] = useState<Office>("GOVERNOR");
  const [subject, setSubject] = useState("");
  const [dt, setDt] = useState<string>(""); // ISO local
  const [info, setInfo] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setMeId(session?.user?.id ?? null);
    })();
  }, []);

  const submit = async () => {
    setInfo("");
    if (!meId) { setInfo("Нужно войти."); return; }
    if (!subject.trim()) { setInfo("Укажите тему обращения."); return; }

    const payload = {
      department: dept,
      subject: subject.trim(),
      preferred_datetime: dt ? new Date(dt).toISOString() : null,
      status: "PENDING" as AppointmentStatus,
    };

    const { error } = await supabase.from("appointments").insert(payload);
    if (error) { setInfo(error.message); return; }
    setSubject("");
    setDt("");
    setDept("GOVERNOR");
    setInfo("Заявка отправлена.");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <h1 className="text-2xl font-bold">Запись на приём</h1>

      <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-3">
        <label className="block text-sm">
          Подразделение
          <select
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={dept}
            onChange={(e) => setDept(e.target.value as Office)}
          >
            {OFFICES.map((o) => (
              <option key={o} value={o}>{OfficeLabel[o]}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          Тема обращения
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Кратко опишите вопрос"
          />
        </label>

        <label className="block text-sm">
          Желаемая дата/время (необязательно)
          <input
            type="datetime-local"
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={dt}
            onChange={(e) => setDt(e.target.value)}
          />
        </label>

        <div className="flex items-center justify-between">
          <button
            onClick={submit}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Отправить
          </button>
          <span className="text-sm text-gray-600">{info}</span>
        </div>
      </div>
    </div>
  );
}
