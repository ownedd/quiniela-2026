"use client";

import { useMutation, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export function SyncUser() {
  const { user, isLoaded: clerkLoaded } = useUser();
  const { isAuthenticated } = useConvexAuth();
  const storeUser = useMutation(api.users.store);
  const userImageUrl = user?.imageUrl;
  const userFullName = user?.fullName;
  const userPrimaryEmail = user?.primaryEmailAddress?.emailAddress;

  useEffect(() => {
    // Solo sincronizar si Clerk cargó, hay usuario, y Convex ya validó la autenticación
    if (clerkLoaded && user && isAuthenticated) {
      void storeUser({
        name: user.fullName ?? user.username ?? undefined,
        email: user.primaryEmailAddress?.emailAddress ?? undefined,
        image: user.imageUrl ?? undefined,
      });
    }
  }, [clerkLoaded, user, isAuthenticated, storeUser, userImageUrl, userFullName, userPrimaryEmail]);

  return null;
}

