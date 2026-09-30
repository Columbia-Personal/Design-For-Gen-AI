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
    ],
  },
};

export default nextConfig;
