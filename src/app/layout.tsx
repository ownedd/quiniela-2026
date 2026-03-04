import type { Metadata, Viewport } from "next";
import { LayoutClient } from "@/components/LayoutClient";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quiniela 2026",
  description: "Predice los resultados del Mundial 2026 y compite con tus amigos.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
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
      </head>
      <body className="antialiased">
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
