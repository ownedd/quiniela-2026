import type { Metadata, Viewport } from "next";
import { LayoutClient } from "@/components/LayoutClient";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quiniela 2026",
  description: "Predice los resultados del Mundial 2026 y compite con tus amigos.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
