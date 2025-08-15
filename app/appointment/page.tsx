"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase/client";
import type { Department } from "../../lib/supabase/client";
import { DepartmentLabel } from "../../lib/supabase/client";

const departments: Department[] = [
  "MIN_FINANCE","GOVERNOR","VICE_GOVERNOR","MIN_JUSTICE","BAR","GOV_STAFF","MIN_DEFENSE","MIN_SECURITY","MIN_HEALTH",
];

const toIso = (v: string): string | null => (v ? new Date(v).toISOString() : null);

export default function AppointmentPage() {
  const [department, setDepartment] = useState<Department>("MIN_FINANCE");
  const [subject, setSubject] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  const [when, setWhen] = useState<string>("");
  const [info, setInfo] = useState<string>("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfo("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setInfo("Нужно войти."); return; }

    const { error } = await supabase.from("appointments").insert({
      created_by: user.id,
      department,
      subject: subject.trim(),
      details: details.trim() || null,
      preferred_datetime: toIso(when),
    });

    if (error) { setInfo(error.message); return; }
    setSubject(""); setDetails(""); setWhen("");
    setInfo("Заявка отправлена! Смотреть: /account/appointments");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">Запись на приём</h1>

      <form onSubmit={submit} className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
        <label className="block">
          <span className="mb-1 block text-sm">К кому записаться</span>
          <select
            value={department}
            onChange={(e)=>setDepartment(e.target.value as Department)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          >
            {departments.map(d=>(
              <option key={d} value={d}>{DepartmentLabel[d]}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm">Тема обращения</span>
          <input
            value={subject}
            onChange={(e)=>setSubject(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            placeholder="Коротко опиши вопрос"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm">Подробности (необязательно)</span>
          <textarea
            value={details}
            onChange={(e)=>setDetails(e.target.value)}
            className="min-h-[90px] w-full rounded-lg border px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            placeholder="Опиши детали"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm">Желаемая дата и время</span>
          <input
            type="datetime-local"
            value={when}
            onChange={(e)=>setWhen(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Отправить
        </button>
      </form>

      {info && <p className="text-sm text-gray-700">{info}</p>}
    </div>
  );
}