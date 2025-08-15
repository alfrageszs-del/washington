"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase/client";
import type { Office } from "../../lib/supabase/client";
import { OfficeLabel } from "../../lib/supabase/client";

const offices: Office[] = [
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
  const [department, setDepartment] = useState<Office>("GOVERNOR");
  const [subject, setSubject] = useState("");
  const [datetime, setDatetime] = useState<string>("");

  const submit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert("Нужен вход"); return; }

    const { error } = await supabase.from("appointments").insert({
      created_by: user.id,
      department,
      subject,
      preferred_datetime: datetime || null,
      status: "PENDING",
    });

    if (error) alert(error.message);
    else { setSubject(""); setDatetime(""); alert("Заявка отправлена"); }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <h1 className="text-2xl font-bold">Запись на приём</h1>

      <select
        value={department}
        onChange={(e)=>setDepartment(e.target.value as Office)}
        className="w-full rounded-md border px-3 py-2"
      >
        {offices.map(o => (
          <option key={o} value={o}>{OfficeLabel[o]}</option>
        ))}
      </select>

      <input
        value={subject}
        onChange={(e)=>setSubject(e.target.value)}
        placeholder="Коротко опиши вопрос"
        className="w-full rounded-md border px-3 py-2"
      />

      <input
        type="datetime-local"
        value={datetime}
        onChange={(e)=>setDatetime(e.target.value)}
        className="w-full rounded-md border px-3 py-2"
      />

      <button onClick={submit} className="rounded-md bg-indigo-600 px-4 py-2 text-white">
        Отправить
      </button>
    </div>
  );
}
