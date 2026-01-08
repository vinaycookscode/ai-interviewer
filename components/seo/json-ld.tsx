export default function JsonLd() {
    const baseUrl = process.env.APP_URL || 'https://getbacktou.com';

    // Organization Schema
    const organizationSchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Get Back To U',
        url: baseUrl,
        logo: `${baseUrl}/icon.png`,
        description: 'AI-powered interview platform helping candidates master job interviews with mock practice, flashcards, and resume analysis.',
        sameAs: [
            'https://twitter.com/getbacktou',
            'https://linkedin.com/company/getbacktou',
        ],
    };

    // WebSite Schema for search engine features
    const websiteSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Get Back To U',
        url: baseUrl,
        description: 'Practice AI mock interviews, study with flashcards, and prepare for job placements',
        potentialAction: {
            '@type': 'SearchAction',
            target: `${baseUrl}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
        },
    };

    // SoftwareApplication Schema
    const softwareSchema = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Get Back To U',
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web',
        description: 'AI-powered interview practice platform with mock interviews, flashcards, and resume screening',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
        },
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            ratingCount: '1000',
        },
        featureList: [
            'AI Mock Interviews',
            'Interview Flashcards',
            'Resume Screener',
            'Behavioral Interview Practice',
            'Technical Interview Prep',
            'System Design Practice',
            'DSA Flashcards',
            'Cover Letter Generator',
        ],
    };

    // Course Schema for educational content
    const courseSchema = {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: 'AI Interview Preparation',
        description: 'Master job interviews with AI-powered practice, flashcards, and personalized feedback',
        provider: {
            '@type': 'Organization',
            name: 'Get Back To U',
            url: baseUrl,
        },
        courseMode: 'online',
        isAccessibleForFree: true,
        about: [
            'Job Interview',
            'Mock Interview',
            'Technical Interview',
            'Behavioral Interview',
            'System Design',
            'Data Structures and Algorithms',
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
            />
        </>
    );
}
