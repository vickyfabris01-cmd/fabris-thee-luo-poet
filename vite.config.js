import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/", // ✅ REQUIRED for Netlify
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.svg",
        "MyLogo.svg",
        "profile.jpeg",
        "profile.svg",
      ],
      workbox: {
        // Cache all static assets
        globPatterns: [
          "**/*.{js,css,html,ico,png,jpg,jpeg,svg,woff,woff2,ttf,eot}",
        ],
        // Don't cache API calls or database requests
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/,
            handler: "NetworkOnly",
            options: {
              cacheName: "supabase-api",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
          {
            urlPattern: /\/api\/.*/,
            handler: "NetworkOnly",
            options: {
              cacheName: "api-calls",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
            },
          },
          // Cache images and other static assets with longer expiration
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          // Cache fonts
          {
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "fonts",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
        ],
      },
      manifest: {
        name: "Fabris Thee Luo Poet",
        short_name: "FLP",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#20201ee5",
        theme_color: "#e77c18",
        icons: [
          {
            src: "/MyLogo.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/MyLogo.svg",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
