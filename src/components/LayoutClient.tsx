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
  hasGroup: boolean;
  groupName?: string | null;
};

const LayoutContext = createContext<LayoutContextValue>({
  isAdmin: undefined,
  predictionsLocked: false,
  hasGroup: false,
  groupName: null,
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
  const viewer = useQuery(api.users.getViewerContext);
  const settings = useQuery(api.tournamentSettings.get, viewer?.hasGroup ? {} : "skip");
  const isAdmin = viewer?.isAdmin;
  const hasGroup = viewer?.hasGroup ?? false;
  const groupName = viewer?.group?.name ?? null;
  const predictionsLocked = settings?.predictionsLocked ?? false;

  return (
    <LayoutContext.Provider value={{ isAdmin, predictionsLocked, hasGroup, groupName }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">
        <header className="flex items-center justify-between gap-4 mb-6 sm:mb-8 md:mb-12 border-b border-white/5 pb-4 sm:pb-6 md:pb-8">
          <Link href="/" className="group">
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-black gradient-text tracking-tight uppercase">
              Quiniela 2026
            </h1>
          </Link>

          <div className="flex items-center gap-4 sm:gap-6 md:gap-8">
            <nav className="hidden md:flex gap-6 font-body font-medium text-gray-400">
              {hasGroup ? (
                <>
                  <Link href="/dashboard" className="nav-link hover:text-gold transition-colors">
                    Dashboard
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
                </>
              ) : (
                <Link href="/" className="nav-link hover:text-gold transition-colors">
                  Home
                </Link>
              )}
            </nav>

            <div className="hidden md:block h-6 w-px bg-white/10" />

            {hasGroup && groupName ? (
              <div className="hidden md:block text-right">
                <p className="text-[10px] uppercase tracking-[0.18em] text-gold/60 font-display">Grupo</p>
                <p className="text-sm text-gray-300 font-medium">{groupName}</p>
              </div>
            ) : null}

            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="btn-gold px-5 py-2 rounded-full text-sm cursor-pointer">
                  Ingresar
                </button>
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
