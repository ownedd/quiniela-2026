"use client";

import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { SyncUser } from "@/components/SyncUser";
import Link from "next/link";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <ConvexClientProvider>
          <SyncUser />
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

                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-full font-bold text-sm transition-all shadow-lg shadow-blue-500/20">
                      Ingresar
                    </button>
                  </SignInButton>
                </SignedOut>
              </div>
            </header>
            <main>{children}</main>
          </div>
        </ConvexClientProvider>
      </body>
    </html>
  );
}

