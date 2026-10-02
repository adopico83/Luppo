import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

// Serwist genera el service worker (app/sw.ts -> public/sw.js) al compilar.
const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {};

export default withSerwist(nextConfig);
