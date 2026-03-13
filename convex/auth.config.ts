import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      // Usa CLERK_JWT_ISSUER_DOMAIN del Convex Dashboard
      // Dev: https://clean-asp-24.clerk.accounts.dev
      // Prod: https://clerk.quiniela.edpelaez.com (Frontend API URL)
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
