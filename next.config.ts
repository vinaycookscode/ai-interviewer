import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import path from 'path';

const withNextIntl = createNextIntlPlugin(
  path.resolve('./i18n/request.ts')
);

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // reactCompiler: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  webpack: (config) => {
    config.resolve.alias['get-nonce'] = path.resolve(__dirname, 'node_modules/get-nonce/dist/es5/index.js');
    return config;
  },
};

export default withNextIntl(nextConfig);

// Forced restart for Prisma Client update
