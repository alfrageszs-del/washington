// app/layout.tsx
import type { ReactNode } from "react";
import Navbar from "./components/Navbar";

export const metadata = {
  title: "Washington Gosuslugi",
  description: "RP-портал: госуслуги Вашингтона",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head>
        {/* CDN Tailwind — так у тебя сейчас и работает стиль */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased">
        {/* ВРЕМЕННАЯ отладочная полоска — чтобы точно видеть, что layout работает */}
        <div className="bg-black/80 px-3 py-1 text-[11px] font-medium text-white">
          layout.tsx активен • ниже должен быть NAVBAR
        </div>

        <Navbar />

        <main className="mx-auto max-w-screen-xl px-4 py-8">{children}</main>

        <footer className="mt-16 border-t bg-white/70 backdrop-blur">
          <div className="mx-auto max-w-screen-xl px-4 py-6 text-sm text-gray-500">
            © {new Date().getFullYear()} Washington Gosuslugi
          </div>
        </footer>
      </body>
    </html>
  );
}
