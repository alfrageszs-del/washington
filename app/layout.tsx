import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export const metadata = {
  title: "Госуслуги Вашингтон",
  description: "Единый портал государственных услуг Вашингтона",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
