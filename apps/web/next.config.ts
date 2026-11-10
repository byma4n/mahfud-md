import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone: satu build untuk npm dan Docker (blueprint Bab 7).
  output: "standalone",
};

export default nextConfig;
