// app/layout.tsx
// import "./globals.css";
import Navbar from "./components/Navbar";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata = {
  title: "Washington Gosuslugi",
  description: "RP-портал: госуслуги Вашингтона",
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        {/* DEV ONLY: Tailwind через CDN (уберём, когда починим lightningcss) */}
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                theme: {
                  extend: {
                    boxShadow: { card: "0 2px 12px rgba(0,0,0,.06)" },
                    borderRadius: { xl: "14px", "2xl": "18px" }
                  }
                }
              }
            `,
          }}
        />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased">
        {/* твой Navbar тут */}
        {/* ... */}
        <main className="mx-auto max-w-screen-xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}

