export default function JsonLd() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Get Back To U',
        url: process.env.APP_URL || 'https://getbacktou.com',
        logo: `${process.env.APP_URL || 'https://getbacktou.com'}/icon.png`,
        description: 'AI-powered interview platform helping candidates master their job search.',
        sameAs: [
            'https://twitter.com/getbacktou',
            'https://linkedin.com/company/getbacktou',
        ],
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+1-555-555-5555',
            contactType: 'customer service',
        },
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}
