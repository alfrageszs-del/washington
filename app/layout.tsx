import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "../components/Navbar";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Госуслуги Вашингтон",
  description: "Единый портал госуслуг: акты, розыск, штрафы и записи на приём.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <div className="min-h-screen grid grid-rows-[auto,1fr,auto]">
          <Navbar />
          <main className="mx-auto w-full max-w-screen-2xl px-4 py-8">{children}</main>

          {/* Футер с контактами */}
          <footer className="mt-10 border-t bg-white">
            <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 text-sm text-slate-600">
              <div className="font-semibold mb-2">Контактная информация</div>
              <ul className="list-disc pl-5 space-y-1">
                <li>Ruslan Donetskii — Discord: <span className="font-medium">@maniakalniideviant</span></li>
                <li>Kasper Montello — Discord: <span className="font-medium">@ghost_kasper</span></li>
                <li>Lucas Liebert — Discord: <span className="font-medium">@lucasliebert</span></li>
              </ul>
              <div className="mt-4 text-xs text-slate-500">
                © {new Date().getFullYear()} Госуслуги Вашингтон
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
