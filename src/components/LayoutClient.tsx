"use client";

import { createContext, useContext } from "react";
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { SyncUser } from "@/components/SyncUser";
import { BottomNav } from "@/components/BottomNav";
import { PwaRegister } from "@/components/PwaRegister";
import Link from "next/link";

type LayoutContextValue = {
  isAdmin: boolean | undefined;
  predictionsLocked: boolean;
};

const LayoutContext = createContext<LayoutContextValue>({
  isAdmin: undefined,
  predictionsLocked: false,
});

export function useLayoutContext() {
  return useContext(LayoutContext);
}

export function LayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <ConvexClientProvider>
      <PwaRegister />
      <SyncUser />
      <LayoutContent>{children}</LayoutContent>
    </ConvexClientProvider>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const isAdmin = useQuery(api.users.isAdmin);
  const settings = useQuery(api.tournamentSettings.get);
  const predictionsLocked = settings?.predictionsLocked ?? false;

  return (
    <LayoutContext.Provider value={{ isAdmin, predictionsLocked }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">
        <header className="flex items-center justify-between gap-4 mb-6 sm:mb-8 md:mb-12 border-b border-white/5 pb-4 sm:pb-6 md:pb-8">
        <Link href="/">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black gradient-text tracking-tighter">QUINIELA 2026</h1>
        </Link>

        <div className="flex items-center gap-4 sm:gap-6 md:gap-8">
          <nav className="hidden md:flex gap-6 font-medium text-gray-400">
            <Link href="/" className="hover:text-blue-400 transition-colors">
              Inicio
            </Link>
            <Link href="/predictions" className="hover:text-blue-400 transition-colors">
              {predictionsLocked ? "Predicciones" : "Mis Predicciones"}
            </Link>
            <Link href="/profile" className="hover:text-blue-400 transition-colors">
              Perfil
            </Link>
            {isAdmin && (
              <Link href="/admin/results" className="hover:text-amber-400 transition-colors">
                Admin
              </Link>
            )}
          </nav>

          <div className="hidden md:block h-6 w-px bg-white/10" />

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 sm:px-5 py-2 rounded-full font-bold text-sm transition-all shadow-lg shadow-blue-500/20">
                Ingresar
              </button>
            </SignInButton>
          </SignedOut>
        </div>
        </header>

        <main className="pb-20 md:pb-0">{children}</main>

        <BottomNav />
      </div>
    </LayoutContext.Provider>
  );
}
