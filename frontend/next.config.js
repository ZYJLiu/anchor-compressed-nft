/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: ["cdn.helius.services", "arweave.net"],
  },
}

module.exports = nextConfig
