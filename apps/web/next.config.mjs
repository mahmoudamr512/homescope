/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@homescope/contract", "@homescope/config", "@homescope/db"],
};

export default nextConfig;
