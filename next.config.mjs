/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't write an AGENTS.md into the project on `next dev`
  agentRules: false,
  devIndicators: false,
  images: {
    // Sellers can paste image URLs from any HTTPS host
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    // Store monogram logos are SVG. Served as sandboxed downloads so an SVG can never run script.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
