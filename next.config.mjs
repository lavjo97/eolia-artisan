import withPWA from 'next-pwa';

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Configuration pour les packages ESM comme @react-pdf/renderer
  experimental: {
    esmExternals: 'loose',
  },
  // Transpiler les packages ESM
  transpilePackages: ['@react-pdf/renderer'],
  webpack: (config) => {
    // Résoudre les problèmes d'alias pour les packages ESM
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

export default pwaConfig(nextConfig);
