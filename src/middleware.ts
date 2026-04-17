import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { NextResponse } from "next/server";
import { api } from "../convex/_generated/api";

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
]);

const signInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/login";
const signUpUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? "/login";

export default clerkMiddleware(
  async (auth, req) => {
    const { userId, getToken } = await auth();
    const pathname = req.nextUrl.pathname;
    const isRootPage = pathname === "/";
    const isLoginPage = pathname === "/login";
    const isJoinGroupPage = pathname.startsWith("/join-group");

    if (isRootPage && !userId) {
      const url = new URL("/login", req.url);
      return NextResponse.redirect(url);
    }

    if ((isRootPage || isLoginPage) && userId) {
      const token = await getToken({ template: "convex" });
      if (!token) {
        await auth.protect();
        return;
      }

      const viewer = await fetchQuery(api.users.getViewerContext, {}, { token });
      const url = new URL(viewer.hasGroup ? "/dashboard" : "/join-group", req.url);
      return NextResponse.redirect(url);
    }

    if (isPublicRoute(req)) {
      return;
    }

    if (!userId) {
      await auth.protect();
      return;
    }

    const token = await getToken({ template: "convex" });
    if (!token) {
      await auth.protect();
      return;
    }

    const viewer = await fetchQuery(api.users.getViewerContext, {}, { token });
    if (!viewer.hasGroup && !isJoinGroupPage) {
      const url = new URL("/join-group", req.url);
      return NextResponse.redirect(url);
    }

    if (viewer.hasGroup && isJoinGroupPage) {
      const url = new URL("/dashboard", req.url);
      return NextResponse.redirect(url);
    }
  },
  { signInUrl, signUpUrl },
);

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
