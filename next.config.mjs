/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Use the project's own .eslintrc.json, not the workspace root's config
    ignoreDuringBuilds: false,
    dirs: ['src', 'app'],
  },
  // Prevent Next.js from walking up to the monorepo root for file tracing
  outputFileTracingRoot: new URL('.', import.meta.url).pathname,
}

export default nextConfig
