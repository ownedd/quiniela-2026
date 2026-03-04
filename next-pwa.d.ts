declare module "next-pwa" {
  import type { NextConfig } from "next";
  function createPWA(options?: {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
  }): (nextConfig: NextConfig) => NextConfig;
  export default createPWA;
}
