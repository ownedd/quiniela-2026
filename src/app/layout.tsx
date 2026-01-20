"use client";

import { useEffect, useState } from "react";
import { User, LogOut } from "lucide-react";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import Link from "next/link";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    setUserName(localStorage.getItem("game_user_name"));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("game_user_name");
    localStorage.removeItem("game_user_id");
    window.location.href = "/login";
  };

  return (
    <html lang="es">
      <body className="antialiased">
        <ConvexClientProvider>
          <div className="max-w-4xl mx-auto px-4 py-8">
            <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 border-b border-white/5 pb-8">
              <Link href="/">
                <h1 className="text-4xl font-black gradient-text tracking-tighter">QUINIELA 2026</h1>
              </Link>
              
              <div className="flex items-center gap-8">
                <nav className="flex gap-6 font-medium text-gray-400">
                  <Link href="/" className="hover:text-blue-400 transition-colors">Inicio</Link>
                  <Link href="/predictions" className="hover:text-blue-400 transition-colors">Mis Predicciones</Link>
                </nav>

                <div className="h-6 w-px bg-white/10 hidden md:block" />

                {userName ? (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                      <User className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-semibold">{userName}</span>
                    </div>
                    <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 transition-colors">
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <Link href="/login" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-full font-bold text-sm transition-all shadow-lg shadow-blue-500/20">
                    Ingresar
                  </Link>
                )}
              </div>
            </header>
            <main>{children}</main>
          </div>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
