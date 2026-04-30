import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/",
  "/predictions(.*)",
  "/admin(.*)",
  "/api/predictions/export(.*)",
]);

const signInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/login";
const signUpUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? "/login";

export default clerkMiddleware(
  async (auth, req) => {
    if (isProtectedRoute(req)) await auth.protect();
  },
  { signInUrl, signUpUrl },
);

export const config = {
  matcher: ["/", "/predictions(.*)", "/admin(.*)", "/api/predictions/export(.*)"],
};
