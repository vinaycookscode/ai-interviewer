import { MetadataRoute } from 'next';

// Icons are generated from public/brand/u-mark.svg by scripts/generate-brand-assets.mjs.
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Get Back To U',
        short_name: 'GetBackToU',
        description: 'AI mock interviews, scored and explained',
        start_url: '/',
        display: 'standalone',
        background_color: '#f6f2ee',
        theme_color: '#f6f2ee',
        icons: [
            { src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/brand/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
    };
}
