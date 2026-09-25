import type { Metadata, Viewport } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestión Ecuestre | Plataforma de Pesebreras y Centros Ecuestres",
  description: "Plataforma profesional para la administración de pesebreras y centros ecuestres.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col antialiased selection:bg-emerald-200 selection:text-emerald-900 bg-[#fafaf9] dark:bg-[#0c0a09] text-stone-900 dark:text-stone-100 transition-colors duration-200">
        <Header />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
