"use client";

import { createContext, useContext, useState } from "react";
import { SignedIn, SignedOut, SignInButton, useClerk } from "@clerk/nextjs";
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

function HeaderSignOutButton() {
  const { signOut, session } = useClerk();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      // Refresh the session first to avoid stale auth state during redirect.
      await session?.reload();
      await signOut({ redirectUrl: "/login" });
    } catch {
      setIsSigningOut(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isSigningOut}
      className="text-sm font-medium text-gray-300 hover:text-gold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isSigningOut ? "Saliendo..." : "Cerrar sesion"}
    </button>
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
          <Link href="/" className="group">
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-black gradient-text tracking-tight uppercase">Quiniela 2026</h1>
          </Link>

          <div className="flex items-center gap-4 sm:gap-6 md:gap-8">
            <nav className="hidden md:flex gap-6 font-body font-medium text-gray-400">
              <Link href="/" className="nav-link hover:text-gold transition-colors">
                Inicio
              </Link>
              <Link href="/predictions" className="nav-link hover:text-gold transition-colors">
                {predictionsLocked ? "Predicciones" : "Mis Predicciones"}
              </Link>
              <Link href="/profile" className="nav-link hover:text-gold transition-colors">
                Perfil
              </Link>
              {isAdmin && (
                <Link href="/admin/results" className="nav-link hover:text-gold-light transition-colors">
                  Admin
                </Link>
              )}
            </nav>

            <div className="hidden md:block h-6 w-px bg-white/10" />

            <SignedIn>
              <HeaderSignOutButton />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="btn-gold px-5 py-2 rounded-full text-sm cursor-pointer">Ingresar</button>
              </SignInButton>
            </SignedOut>
          </div>
        </header>

        <main className="pb-24 md:pb-0">{children}</main>

        <BottomNav />
      </div>
    </LayoutContext.Provider>
  );
}
