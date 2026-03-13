import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/predictions(.*)", "/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  // Solo ejecutar en rutas protegidas para reducir invocaciones Edge
  matcher: ["/predictions(.*)", "/admin(.*)"],
};
