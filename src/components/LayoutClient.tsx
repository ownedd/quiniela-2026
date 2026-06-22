"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { SignedIn, SignedOut, SignInButton, useClerk } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { SyncUser } from "@/components/SyncUser";
import { JoinGroupGate } from "@/components/JoinGroupGate";
import { BottomNav } from "@/components/BottomNav";
import { PwaRegister } from "@/components/PwaRegister";
import Link from "next/link";
import { usePathname } from "next/navigation";

type LayoutContextValue = {
  isAdmin: boolean | undefined;
  predictionsLocked: boolean | undefined;
};

const LayoutContext = createContext<LayoutContextValue>({
  isAdmin: undefined,
  predictionsLocked: undefined,
});

type NavigationContextValue = {
  pendingPath: string | null;
  startNavigation: (href: string) => void;
};

const NavigationContext = createContext<NavigationContextValue>({
  pendingPath: null,
  startNavigation: () => {},
});

export function useLayoutContext() {
  return useContext(LayoutContext);
}

export function useNavigationFeedback() {
  return useContext(NavigationContext);
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
  const pathname = usePathname();
  const isAdmin = useQuery(api.users.isAdmin);
  const settings = useQuery(api.tournamentSettings.get);
  const predictionsLocked = settings?.predictionsLocked;
  const predictionsLabel = predictionsLocked === false ? "Mis Predicciones" : "Predicciones";
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const visiblePendingPath = pendingPath === pathname ? null : pendingPath;

  useEffect(() => {
    if (!pendingPath) return;

    const timeout = window.setTimeout(() => {
      setPendingPath(null);
    }, 10000);

    return () => window.clearTimeout(timeout);
  }, [pendingPath]);

  const startNavigation = (href: string) => {
    const targetPath = href.split("#")[0] || "/";
    if (targetPath !== pathname) {
      setPendingPath(targetPath);
    }
  };

  return (
    <LayoutContext.Provider value={{ isAdmin, predictionsLocked }}>
      <NavigationContext.Provider value={{ pendingPath: visiblePendingPath, startNavigation }}>
      {visiblePendingPath ? <RouteTransitionIndicator /> : null}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">
        <header className="flex items-center justify-between gap-4 mb-5 sm:mb-6 md:mb-8 border-b border-white/5 pb-4 sm:pb-6 md:pb-8">
          <NavigationLink href="/" className="group">
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-black gradient-text tracking-tight uppercase">Quiniela 2026</h1>
          </NavigationLink>

          <div className="flex items-center gap-4 sm:gap-6 md:gap-8">
            <nav className="hidden md:flex gap-6 font-body font-medium text-gray-400">
              <NavigationLink href="/" className="nav-link hover:text-gold transition-colors">
                Inicio
              </NavigationLink>
              <NavigationLink href="/predictions" className="nav-link hover:text-gold transition-colors">
                {predictionsLabel}
              </NavigationLink>
              <NavigationLink href="/profile" className="nav-link hover:text-gold transition-colors">
                Perfil
              </NavigationLink>
              {isAdmin && (
                <NavigationLink href="/admin/results" className="nav-link hover:text-gold-light transition-colors">
                  Admin
                </NavigationLink>
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

        <main className="pb-24 md:pb-0">
          <JoinGroupGate>{children}</JoinGroupGate>
        </main>

        <BottomNav />
      </div>
      </NavigationContext.Provider>
    </LayoutContext.Provider>
  );
}

function NavigationLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  const { startNavigation } = useNavigationFeedback();

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    startNavigation(href);
  };

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}

function RouteTransitionIndicator() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] hidden md:block">
      <div className="h-1 w-full overflow-hidden bg-gold/10">
        <div className="h-full w-1/2 animate-pulse bg-gradient-to-r from-gold/40 via-gold to-gold/40 shadow-[0_0_18px_rgba(212,168,67,0.55)]" />
      </div>
      <div className="mx-auto mt-3 flex max-w-4xl justify-center px-4">
        <div className="rounded-full border border-gold/20 bg-[#080c16]/90 px-3 py-1 text-xs font-semibold text-gold shadow-lg shadow-black/30 backdrop-blur-xl">
          Cargando...
        </div>
      </div>
    </div>
  );
}
