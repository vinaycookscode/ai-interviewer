/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        const path = require('path');
        config.resolve.alias['get-nonce'] = path.resolve(__dirname, 'node_modules/get-nonce/dist/es5/index.js');
        return config;
    },
    experimental: {
        // Disable Turbopack to allow custom webpack config
        turbopack: false,
    },
};

module.exports = nextConfig;
