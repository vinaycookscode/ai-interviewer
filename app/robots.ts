import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/dashboard/', '/admin/', '/candidate/'],
        },
        sitemap: `${process.env.APP_URL || "https://getbacktou.com"}/sitemap.xml`,
    };
}
