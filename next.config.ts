import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vdfoetlxzfcwgyqnqixw.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/profile-photos/**",
        search: "",
      },
      {
        protocol: "https",
        hostname: "vdfoetlxzfcwgyqnqixw.supabase.co",
        port: "",
        pathname: "/storage/v1/object/sign/caption-drafts/**",
      },
      {
        protocol: "https",
        hostname: "media.giphy.com",
        port: "",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "vdfoetlxzfcwgyqnqixw.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/caption-media/**",
        search: "",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
        search: "",
      },
    ],
  },
};

export default nextConfig;
