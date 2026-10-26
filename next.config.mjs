/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't write an AGENTS.md into the project on `next dev`
  agentRules: false,
  devIndicators: false,
  images: {
    // Sellers can paste image URLs from any HTTPS host
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
