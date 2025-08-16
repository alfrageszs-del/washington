"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase/client";
import type { Appointment, AppointmentStatus } from "../../../lib/supabase/client";
import { DepartmentLabel } from "../../../lib/supabase/client";

const StatusBadge: React.FC<{ s: AppointmentStatus }> = ({ s }) => {
  const cls =
    s === "APPROVED" ? "bg-green-100 text-green-700" :
    s === "REJECTED" ? "bg-red-100 text-red-700" :
    s === "DONE" ? "bg-gray-800 text-white" :
    s === "CANCELLED" ? "bg-gray-200 text-gray-700" :
    "bg-yellow-100 text-yellow-800"; // PENDING
  return <span className={`rounded-md px-2 py-0.5 text-xs ${cls}`}>{s}</span>;
};

export default function MyAppointmentsPage() {
  const [rows, setRows] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [info, setInfo] = useState<string>("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); setInfo("Не авторизован"); return; }

      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (error) { setInfo(error.message); setLoading(false); return; }
      setRows((data ?? []) as Appointment[]);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p>Загрузка…</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-2xl font-bold">Мои записи</h1>

      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500">
            <tr>
              <th className="py-2 pl-4">Куда</th>
              <th className="py-2">Тема</th>
              <th className="py-2">Когда (жел.)</th>
              <th className="py-2">Статус</th>
              <th className="py-2 pr-4 text-right">Создано</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="py-2 pl-4">{DepartmentLabel[r.department]}</td>
                <td className="py-2">{r.position}</td>
                <td className="py-2">{r.preferred_datetime ? new Date(r.preferred_datetime).toLocaleString() : "—"}</td>
                <td className="py-2"><StatusBadge s={r.status} /></td>
                <td className="py-2 pr-4 text-right">{r.created_at ? new Date(r.created_at).toLocaleString() : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {info && <p className="text-sm text-gray-700">{info}</p>}
    </div>
  );
}
