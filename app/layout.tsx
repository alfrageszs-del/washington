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
        {/* CDN Tailwind — так сейчас идёт стиль, без сборки CSS */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased">
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
