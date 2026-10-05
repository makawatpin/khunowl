import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KhunOwl — MheeTang Life OS",
    short_name: "KhunOwl",
    description: "เว็บแอปจัดการชีวิตส่วนตัวแบบครบวงจร",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F6F4",
    theme_color: "#F2658A",
    lang: "th",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
