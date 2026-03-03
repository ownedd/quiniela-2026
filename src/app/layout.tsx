import type { Metadata, Viewport } from "next";
import { LayoutClient } from "@/components/LayoutClient";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quiniela 2026",
  description: "Predice los resultados del Mundial 2026 y compite con tus amigos.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Quiniela",
  },
  other: {
    "msapplication-navbutton-color": "#0f172a",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="msapplication-navbutton-color" content="#0f172a" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="antialiased">
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
