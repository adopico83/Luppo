import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

// Serwist genera el service worker (app/sw.ts -> public/sw.js) al compilar.
const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Next 16 rebaja a 75 cualquier calidad que no esté en esta lista: sin 88 las ilustraciones
  // de los lugares se servían más blandas de lo pedido.
  images: { qualities: [75, 88] },
};

export default withSerwist(nextConfig);
