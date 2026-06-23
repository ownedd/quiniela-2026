import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/", "/predictions(.*)", "/profile(.*)", "/admin(.*)", "/join-group(.*)", "/api/predictions/export(.*)"]);

const signInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/login";
const signUpUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? "/login";

export default clerkMiddleware(
  async (auth, req) => {
    if (!isProtectedRoute(req)) {
      return;
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL(signInUrl, req.url));
    }
  },
  { signInUrl, signUpUrl }
);

export const config = {
  matcher: ["/", "/login(.*)", "/predictions(.*)", "/profile(.*)", "/admin(.*)", "/join-group(.*)", "/api/predictions/export(.*)"],
};
