/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@homescope/contract", "@homescope/config"],
};

export default nextConfig;
