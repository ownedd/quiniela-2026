"use client";

import { useMutation, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export function SyncUser() {
  const { user, isLoaded: clerkLoaded } = useUser();
  const { isAuthenticated, isLoading: convexLoading } = useConvexAuth();
  const storeUser = useMutation(api.users.store);

  useEffect(() => {
    // Solo sincronizar si Clerk cargó, hay usuario, y Convex ya validó la autenticación
    if (clerkLoaded && user && isAuthenticated) {
      console.log("Convex autenticado. Sincronizando usuario...");
      storeUser();
    }
  }, [clerkLoaded, user, isAuthenticated, storeUser]);

  return null;
}

