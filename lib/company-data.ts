/**
 * Company Data Configuration
 * 
 * Defines 100 companies for the Company Prep feature with:
 * - Company metadata (name, slug, description, difficulty)
 * - Interview rounds structure
 * - Salary ranges
 * - Deep interview concepts
 */

export interface CompanyConfig {
    company: string;
    slug: string;
    description: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    category: string;
    salaryRange?: {
        min: number;
        max: number;
        currency: string;
    };
    rounds: Array<{
        name: string;
        type: string;
        duration: number;
        tips: string;
    }>;
    content: {
        overview: string;
        culture: string[];
        interviewTips: string[];
        preparationStrategy: string;
    };
}

// Category definitions
const CATEGORIES = {
    IT_SERVICES: "IT Services",
    PRODUCT: "Product Companies",
    INDIAN_TECH: "Indian Tech Unicorns",
    FINTECH: "Fintech & Banks",
    CONSULTING: "Consulting",
    STARTUPS: "Startups",
    CORE_TECH: "Core Tech/Hardware",
    ECOMMERCE: "E-Commerce"
};

/**
 * 100 Companies for Campus Placements
 */
export const COMPANIES: CompanyConfig[] = [
    // ===== IT SERVICES (20) =====
    {
        company: "Tata Consultancy Services",
        slug: "tcs",
        description: "India's largest IT services company, part of Tata Group. Known for stability and global exposure.",
        difficulty: "EASY",
        category: CATEGORIES.IT_SERVICES,
        salaryRange: { min: 350000, max: 700000, currency: "INR" },
        rounds: [
            { name: "Aptitude Test", type: "Online", duration: 90, tips: "Focus on Quants, Verbal, and Programming MCQs" },
            { name: "Technical Interview", type: "Technical", duration: 30, tips: "Basics of DSA, DBMS, OS, and your final year project" },
            { name: "HR Interview", type: "HR", duration: 15, tips: "Be confident, know about TCS values and recent news" }
        ],
        content: {
            overview: "TCS hires in bulk through campus placements. The process is straightforward with focus on aptitude and basic technical knowledge.",
            culture: ["Work-life balance", "Learning opportunities", "Global exposure", "Job security"],
            interviewTips: ["Master TCS NQT pattern", "Prepare DBMS and OS basics", "Practice email writing", "Know TCS's recent projects and CEO"],
            preparationStrategy: "1-2 weeks of focused aptitude preparation. Practice TCS NQT mock tests. Revise CS fundamentals."
        }
    },
    {
        company: "Infosys",
        slug: "infosys",
        description: "India's second largest IT company. Known for training programs and global projects.",
        difficulty: "EASY",
        category: CATEGORIES.IT_SERVICES,
        salaryRange: { min: 360000, max: 800000, currency: "INR" },
        rounds: [
            { name: "InfyTQ Assessment", type: "Online", duration: 120, tips: "Aptitude + Hands-on Coding in Python/Java" },
            { name: "Technical Interview", type: "Technical", duration: 30, tips: "Project discussion, basic coding, CS fundamentals" },
            { name: "HR Interview", type: "HR", duration: 15, tips: "Why Infosys, career goals, relocation flexibility" }
        ],
        content: {
            overview: "Infosys focuses on finding trainable candidates. Strong emphasis on aptitude and learning ability.",
            culture: ["Extensive training (Mysore campus)", "Digital innovation focus", "Employee-friendly policies"],
            interviewTips: ["Practice InfyTQ platform", "Solve 50+ coding problems", "Know about Infosys Lex platform", "Prepare for puzzle questions"],
            preparationStrategy: "Complete InfyTQ certification. Practice platform-specific problems. 2-3 weeks of preparation."
        }
    },
    {
        company: "Wipro",
        slug: "wipro",
        description: "Major IT services company with strong presence in digital transformation.",
        difficulty: "EASY",
        category: CATEGORIES.IT_SERVICES,
        salaryRange: { min: 350000, max: 650000, currency: "INR" },
        rounds: [
            { name: "NLTH Assessment", type: "Online", duration: 100, tips: "Aptitude, Verbal, Logical, and Coding" },
            { name: "Technical Interview", type: "Technical", duration: 30, tips: "Basic programming, DBMS, project discussion" },
            { name: "HR Interview", type: "HR", duration: 15, tips: "Bond clause awareness, flexibility questions" }
        ],
        content: {
            overview: "Wipro's NLTH (National Level Talent Hunt) is the primary hiring channel for freshers.",
            culture: ["Diverse work environment", "Good training programs", "Multiple domain exposure"],
            interviewTips: ["Practice Wipro-specific aptitude", "Be aware of service agreement", "Highlight adaptability"],
            preparationStrategy: "Focus on NLTH pattern. 1-2 weeks of aptitude drilling. Basic coding in C/Java."
        }
    },
    {
        company: "Cognizant",
        slug: "cognizant",
        description: "US-headquartered IT company with major operations in India. Known for GenC programs.",
        difficulty: "EASY",
        category: CATEGORIES.IT_SERVICES,
        salaryRange: { min: 400000, max: 700000, currency: "INR" },
        rounds: [
            { name: "GenC Assessment", type: "Online", duration: 90, tips: "Quantitative, Logical, Verbal, and Automata Coding" },
            { name: "Technical Interview", type: "Technical", duration: 30, tips: "Coding questions, OOPS concepts, SQL queries" },
            { name: "HR Interview", type: "HR", duration: 15, tips: "Strengths/weaknesses, team scenarios" }
        ],
        content: {
            overview: "Cognizant's GenC, GenC Next, and GenC Elevate are tiered programs based on performance.",
            culture: ["Performance-based growth", "International exposure", "Flexible work policies"],
            interviewTips: ["Aim for GenC Elevate tier", "Strong in Automata coding", "Practice SQL thoroughly"],
            preparationStrategy: "Master Automata platform. Target 2+ problems in coding round. 2 weeks preparation."
        }
    },
    {
        company: "Accenture",
        slug: "accenture",
        description: "Global consulting and technology company. Multiple roles from analyst to engineering.",
        difficulty: "MEDIUM",
        category: CATEGORIES.CONSULTING,
        salaryRange: { min: 450000, max: 1200000, currency: "INR" },
        rounds: [
            { name: "Cognitive Assessment", type: "Online", duration: 90, tips: "Verbal, Analytical, Abstract reasoning, no coding" },
            { name: "Communication Assessment", type: "Online", duration: 20, tips: "Typing test and voice-based assessment" },
            { name: "Technical + HR Interview", type: "Combined", duration: 30, tips: "Coding basics, project, leadership examples" }
        ],
        content: {
            overview: "Accenture offers multiple streams - ASE (tech), Analyst (consulting). Clear communication is key.",
            culture: ["Diverse and inclusive", "Global mobility", "Continuous learning culture"],
            interviewTips: ["Communication skills are critical", "Know about Accenture's industry solutions", "Prepare STAR format answers"],
            preparationStrategy: "Focus heavily on communication assessment. Practice abstract reasoning. 2-3 weeks prep."
        }
    },
    // More IT Services
    {
        company: "HCL Technologies",
        slug: "hcl",
        description: "Major IT company known for infrastructure services and engineering.",
        difficulty: "EASY",
        category: CATEGORIES.IT_SERVICES,
        salaryRange: { min: 380000, max: 700000, currency: "INR" },
        rounds: [
            { name: "Aptitude Test", type: "Online", duration: 90, tips: "Quants, verbal, logical reasoning" },
            { name: "Technical Interview", type: "Technical", duration: 30, tips: "Core CS subjects and project" },
            { name: "HR Interview", type: "HR", duration: 15, tips: "Standard HR questions" }
        ],
        content: {
            overview: "HCL focuses on infrastructure and engineering services. Known for R&D opportunities.",
            culture: ["Employee First culture", "Innovation focused", "Strong R&D"],
            interviewTips: ["Know about HCL's engineering background", "Prepare core CS well"],
            preparationStrategy: "Standard IT services prep. Focus on fundamentals."
        }
    },
    {
        company: "Tech Mahindra",
        slug: "tech-mahindra",
        description: "IT company with strong presence in telecom and digital transformation.",
        difficulty: "EASY",
        category: CATEGORIES.IT_SERVICES,
        salaryRange: { min: 350000, max: 650000, currency: "INR" },
        rounds: [
            { name: "Online Assessment", type: "Online", duration: 60, tips: "Aptitude and basic coding" },
            { name: "Technical Interview", type: "Technical", duration: 30, tips: "Programming fundamentals" },
            { name: "HR Interview", type: "HR", duration: 15, tips: "Cultural fit" }
        ],
        content: {
            overview: "Tech Mahindra is strong in telecom sector. Good for networking-interested candidates.",
            culture: ["Telecom expertise", "5G focus", "Digital transformation"],
            interviewTips: ["Know about 5G and telecom basics", "Mahindra Group knowledge helps"],
            preparationStrategy: "Standard preparation. Optional: telecom basics."
        }
    },
    {
        company: "Capgemini",
        slug: "capgemini",
        description: "French IT company with consulting and technology services.",
        difficulty: "MEDIUM",
        category: CATEGORIES.CONSULTING,
        salaryRange: { min: 400000, max: 900000, currency: "INR" },
        rounds: [
            { name: "Game-based Assessment", type: "Online", duration: 60, tips: "Behavioral games + cognitive tests" },
            { name: "Technical Interview", type: "Technical", duration: 30, tips: "Coding, DBMS, project discussion" },
            { name: "HR Interview", type: "HR", duration: 20, tips: "Situational questions" }
        ],
        content: {
            overview: "Capgemini uses innovative game-based assessments to evaluate candidates.",
            culture: ["European work culture", "Innovation focus", "Sustainability emphasis"],
            interviewTips: ["Don't overthink games", "Be genuine in responses", "Know Capgemini's values"],
            preparationStrategy: "Practice game-based assessments. Focus on behavioral consistency."
        }
    },

    // ===== PRODUCT COMPANIES (20) =====
    {
        company: "Amazon",
        slug: "amazon",
        description: "World's largest e-commerce and cloud company. High bar for SDEs.",
        difficulty: "HARD",
        category: CATEGORIES.PRODUCT,
        salaryRange: { min: 2500000, max: 4500000, currency: "INR" },
        rounds: [
            { name: "Online Assessment", type: "Online", duration: 90, tips: "2 DSA problems + Work Simulation" },
            { name: "Phone Screen", type: "Technical", duration: 60, tips: "1-2 coding problems with LP questions" },
            { name: "Onsite Loop (4 rounds)", type: "Technical", duration: 240, tips: "DSA + System Design + Leadership Principles" }
        ],
        content: {
            overview: "Amazon's interview is based on Leadership Principles. Every answer should demonstrate LP alignment.",
            culture: ["Customer obsession", "Ownership mindset", "Bias for action", "High bar culture"],
            interviewTips: ["Master all 16 Leadership Principles", "Use STAR format with metrics", "Practice 200+ LC medium/hard", "System design for SDE-2+"],
            preparationStrategy: "3-4 months of intense preparation. 200+ LeetCode problems. LP story bank of 20+ examples."
        }
    },
    {
        company: "Google",
        slug: "google",
        description: "World's leading tech company. Extremely competitive hiring process.",
        difficulty: "HARD",
        category: CATEGORIES.PRODUCT,
        salaryRange: { min: 3000000, max: 6000000, currency: "INR" },
        rounds: [
            { name: "Online Coding", type: "Online", duration: 60, tips: "2 algorithmic problems, often graph/DP" },
            { name: "Phone Interviews (2)", type: "Technical", duration: 90, tips: "Coding on Google Doc, think aloud" },
            { name: "Onsite (4-5 rounds)", type: "Technical", duration: 300, tips: "Coding + Googleyness + System Design" }
        ],
        content: {
            overview: "Google focuses on problem-solving ability and Googleyness (culture fit). No LP-style behavioral.",
            culture: ["Innovation", "20% time", "Flat hierarchy", "Data-driven decisions"],
            interviewTips: ["Think aloud constantly", "Optimize solutions", "Know Google products", "Be genuinely curious"],
            preparationStrategy: "4-6 months prep. 300+ LC problems. Master graph, DP, and trees. Read System Design Primer."
        }
    },
    {
        company: "Microsoft",
        slug: "microsoft",
        description: "Tech giant known for Azure, Office 365. Great for campus hires.",
        difficulty: "HARD",
        category: CATEGORIES.PRODUCT,
        salaryRange: { min: 2800000, max: 5500000, currency: "INR" },
        rounds: [
            { name: "Online Assessment", type: "Online", duration: 75, tips: "3 coding problems on Codility" },
            { name: "Technical Interviews (3-4)", type: "Technical", duration: 180, tips: "DSA + Design + Behavioral" },
            { name: "AA Round", type: "Behavioral", duration: 45, tips: "As Appropriate - culture fit" }
        ],
        content: {
            overview: "Microsoft values growth mindset. Less adversarial than other FAANGs.",
            culture: ["Growth mindset", "Inclusive", "Innovation", "Work-life balance"],
            interviewTips: ["Know Microsoft's products", "Explain thought process", "Ask clarifying questions", "Show enthusiasm"],
            preparationStrategy: "3-4 months. Cover all DSA topics. Practice on Codility. Be friendly and collaborative."
        }
    },
    {
        company: "Meta",
        slug: "meta",
        description: "Social media and metaverse company. Strong engineering culture.",
        difficulty: "HARD",
        category: CATEGORIES.PRODUCT,
        salaryRange: { min: 3500000, max: 6500000, currency: "INR" },
        rounds: [
            { name: "Initial Screen", type: "Technical", duration: 45, tips: "1-2 coding problems" },
            { name: "Onsite (4-5 rounds)", type: "Technical", duration: 300, tips: "Coding + System Design + Behavioral" }
        ],
        content: {
            overview: "Meta moves fast. Strong emphasis on coding speed and accuracy.",
            culture: ["Move fast", "Be bold", "Focus on impact", "Openness"],
            interviewTips: ["Code quickly and correctly", "Optimize on the fly", "Know Meta's products"],
            preparationStrategy: "3-4 months. Focus on speed. Time yourself. 250+ LC problems."
        }
    },
    {
        company: "Apple",
        slug: "apple",
        description: "Premium tech company. Secretive interview process.",
        difficulty: "HARD",
        category: CATEGORIES.PRODUCT,
        salaryRange: { min: 3000000, max: 5500000, currency: "INR" },
        rounds: [
            { name: "Phone Screen", type: "Technical", duration: 45, tips: "Domain-specific + coding" },
            { name: "Onsite (5-6 rounds)", type: "Technical", duration: 360, tips: "Coding + Domain + Design + Team match" }
        ],
        content: {
            overview: "Apple hires for specific teams. Process is team-dependent.",
            culture: ["Secrecy", "Attention to detail", "Premium quality", "User focus"],
            interviewTips: ["Know the team's products deeply", "Be detail-oriented", "Quality over speed"],
            preparationStrategy: "4-5 months. Know your domain deeply. Study Apple's tech stack."
        }
    },
    {
        company: "Netflix",
        slug: "netflix",
        description: "Streaming giant with unique freedom & responsibility culture.",
        difficulty: "HARD",
        category: CATEGORIES.PRODUCT,
        salaryRange: { min: 5000000, max: 10000000, currency: "INR" },
        rounds: [
            { name: "Phone Screens (2)", type: "Technical", duration: 90, tips: "Deep technical discussions + coding" },
            { name: "Onsite (5-6 rounds)", type: "Technical", duration: 360, tips: "Technical + Culture fit very important" }
        ],
        content: {
            overview: "Netflix culture is unique - freedom and responsibility. High performers only.",
            culture: ["Freedom and responsibility", "Context not control", "Highly aligned, loosely coupled"],
            interviewTips: ["Read Netflix culture deck", "Show extreme ownership", "Be honest about failures"],
            preparationStrategy: "Strong fundamentals + cultural alignment. Read the culture memo."
        }
    },
    {
        company: "Adobe",
        slug: "adobe",
        description: "Creative and document solutions company. Great for campus placements.",
        difficulty: "HARD",
        category: CATEGORIES.PRODUCT,
        salaryRange: { min: 2200000, max: 4000000, currency: "INR" },
        rounds: [
            { name: "Online Coding", type: "Online", duration: 90, tips: "2-3 DSA problems" },
            { name: "Technical Interviews (3-4)", type: "Technical", duration: 180, tips: "DSA + CS fundamentals + Design" }
        ],
        content: {
            overview: "Adobe is known for good WLB and creative products. Strong campus presence.",
            culture: ["Creativity", "Innovation", "Work-life balance", "Diverse teams"],
            interviewTips: ["Know Adobe products", "Strong OOPS concepts", "Practice image/graphics problems"],
            preparationStrategy: "3 months. Focus on OOPS and problem-solving. Know about Creative Cloud."
        }
    },
    {
        company: "Salesforce",
        slug: "salesforce",
        description: "CRM market leader. Known for Ohana culture.",
        difficulty: "HARD",
        category: CATEGORIES.PRODUCT,
        salaryRange: { min: 2500000, max: 4500000, currency: "INR" },
        rounds: [
            { name: "Coding Test", type: "Online", duration: 60, tips: "2 coding problems" },
            { name: "Technical Rounds (3)", type: "Technical", duration: 150, tips: "DSA + System Design + Values" }
        ],
        content: {
            overview: "Salesforce values Ohana (family) culture. Good for candidates who value culture.",
            culture: ["Ohana", "Trust", "Customer success", "Innovation"],
            interviewTips: ["Know about Trailhead", "Understand CRM basics", "Show leadership"],
            preparationStrategy: "3 months DSA + understand Salesforce ecosystem."
        }
    },

    // ===== INDIAN TECH UNICORNS (20) =====
    {
        company: "Flipkart",
        slug: "flipkart",
        description: "India's leading e-commerce company. Now part of Walmart.",
        difficulty: "HARD",
        category: CATEGORIES.INDIAN_TECH,
        salaryRange: { min: 2400000, max: 4500000, currency: "INR" },
        rounds: [
            { name: "Coding Test", type: "Online", duration: 90, tips: "3 DSA problems, focus on efficiency" },
            { name: "Machine Coding", type: "Technical", duration: 120, tips: "LLD problem with working code" },
            { name: "Technical (2-3)", type: "Technical", duration: 150, tips: "DSA + HLD + LLD" }
        ],
        content: {
            overview: "Flipkart has rigorous hiring. Machine coding round is unique and important.",
            culture: ["Audacious", "Customer first", "Bias for action", "Open culture"],
            interviewTips: ["Practice machine coding", "LLD is very important", "Know e-commerce domain"],
            preparationStrategy: "3-4 months. Heavy focus on LLD. Practice building things end-to-end."
        }
    },
    {
        company: "Razorpay",
        slug: "razorpay",
        description: "India's leading payment gateway. Strong engineering culture.",
        difficulty: "HARD",
        category: CATEGORIES.FINTECH,
        salaryRange: { min: 2500000, max: 5000000, currency: "INR" },
        rounds: [
            { name: "Online Assessment", type: "Online", duration: 90, tips: "DSA + Backend/Frontend problems" },
            { name: "Technical Rounds (3)", type: "Technical", duration: 180, tips: "DSA + System Design + Domain" }
        ],
        content: {
            overview: "Razorpay is payments-focused. Understanding fintech helps.",
            culture: ["Engineering excellence", "Speed", "Customer focus"],
            interviewTips: ["Understand payments flow", "Know about idempotency", "Concurrency is key"],
            preparationStrategy: "3 months DSA + understand payment systems basics."
        }
    },
    {
        company: "Swiggy",
        slug: "swiggy",
        description: "Food delivery platform. High-scale engineering challenges.",
        difficulty: "HARD",
        category: CATEGORIES.INDIAN_TECH,
        salaryRange: { min: 2200000, max: 4500000, currency: "INR" },
        rounds: [
            { name: "Coding Round", type: "Online", duration: 90, tips: "DSA problems" },
            { name: "Machine Coding", type: "Technical", duration: 90, tips: "LLD with delivery system context" },
            { name: "Technical + Design", type: "Technical", duration: 120, tips: "HLD of Swiggy-like systems" }
        ],
        content: {
            overview: "Swiggy deals with real-time, high-scale challenges. Location and routing problems.",
            culture: ["Speed", "Customer obsession", "Problem solving"],
            interviewTips: ["Think about delivery routing", "Understand geospatial problems", "Caching strategies"],
            preparationStrategy: "3 months. Practice location-based problems. Understand real-time systems."
        }
    },
    {
        company: "Zomato",
        slug: "zomato",
        description: "Food delivery and restaurant discovery. Consumer tech focus.",
        difficulty: "HARD",
        category: CATEGORIES.INDIAN_TECH,
        salaryRange: { min: 2000000, max: 4000000, currency: "INR" },
        rounds: [
            { name: "Coding Test", type: "Online", duration: 90, tips: "2-3 DSA problems" },
            { name: "Technical Rounds (3)", type: "Technical", duration: 180, tips: "DSA + LLD + HLD" }
        ],
        content: {
            overview: "Zomato competes with Swiggy. Similar problem domains.",
            culture: ["Consumer focus", "Data-driven", "Fun culture"],
            interviewTips: ["Know Zomato app deeply", "Think about scale", "Restaurant recommendation systems"],
            preparationStrategy: "Similar to Swiggy prep. Focus on consumer tech challenges."
        }
    },
    {
        company: "Ola",
        slug: "ola",
        description: "India's largest ride-hailing platform.",
        difficulty: "HARD",
        category: CATEGORIES.INDIAN_TECH,
        salaryRange: { min: 2000000, max: 4000000, currency: "INR" },
        rounds: [
            { name: "Online Test", type: "Online", duration: 90, tips: "DSA problems" },
            { name: "Technical Rounds", type: "Technical", duration: 180, tips: "DSA + System Design" }
        ],
        content: {
            overview: "Ola has interesting location, mapping, and matching problems.",
            culture: ["Innovation", "Mobility focus", "Indian technology"],
            interviewTips: ["Geospatial algorithms", "Matching driver-rider", "Dynamic pricing"],
            preparationStrategy: "Focus on location-based systems and matching algorithms."
        }
    },
    {
        company: "Paytm",
        slug: "paytm",
        description: "India's leading fintech company. Payments to banking.",
        difficulty: "MEDIUM",
        category: CATEGORIES.FINTECH,
        salaryRange: { min: 1500000, max: 3500000, currency: "INR" },
        rounds: [
            { name: "Coding Round", type: "Online", duration: 60, tips: "2 DSA problems" },
            { name: "Technical Rounds (2)", type: "Technical", duration: 120, tips: "DSA + System basics" }
        ],
        content: {
            overview: "Paytm hires in volume for various roles.",
            culture: ["Fast-paced", "Startup mindset", "Financial inclusion"],
            interviewTips: ["Know payments domain", "Basic system design", "Handle pressure"],
            preparationStrategy: "2-3 months standard DSA prep."
        }
    },
    {
        company: "PhonePe",
        slug: "phonepe",
        description: "UPI payments leader. Walmart-backed.",
        difficulty: "HARD",
        category: CATEGORIES.FINTECH,
        salaryRange: { min: 2200000, max: 4500000, currency: "INR" },
        rounds: [
            { name: "Coding Test", type: "Online", duration: 90, tips: "DSA problems" },
            { name: "Technical Rounds (3)", type: "Technical", duration: 180, tips: "Strong DSA + System Design" }
        ],
        content: {
            overview: "PhonePe is a strong engineering org. Good problems.",
            culture: ["Engineering culture", "Ownership", "Speed"],
            interviewTips: ["Understand UPI architecture", "Distributed systems", "Concurrency"],
            preparationStrategy: "3 months intensive prep. Fintech context helps."
        }
    },
    {
        company: "Zerodha",
        slug: "zerodha",
        description: "India's largest stock broker. Small but strong team.",
        difficulty: "HARD",
        category: CATEGORIES.FINTECH,
        salaryRange: { min: 3000000, max: 5500000, currency: "INR" },
        rounds: [
            { name: "Assignment", type: "Take-home", duration: 480, tips: "Build a working product/feature" },
            { name: "Discussion", type: "Technical", duration: 120, tips: "Deep dive into assignment + domain" }
        ],
        content: {
            overview: "Zerodha hiring is unique - assignment based. Very selective.",
            culture: ["Excellence", "No investors", "Long-term thinking"],
            interviewTips: ["Build something impressive", "Show depth of understanding", "Know trading basics"],
            preparationStrategy: "Work on impressive projects. Understand stock markets."
        }
    },
    {
        company: "CRED",
        slug: "cred",
        description: "Fintech for creditworthy individuals. Known for design.",
        difficulty: "HARD",
        category: CATEGORIES.FINTECH,
        salaryRange: { min: 2500000, max: 5000000, currency: "INR" },
        rounds: [
            { name: "Coding Round", type: "Online", duration: 90, tips: "DSA problems" },
            { name: "Machine Coding", type: "Technical", duration: 120, tips: "LLD with clean code focus" },
            { name: "Technical + Culture", type: "Technical", duration: 120, tips: "Design + values fit" }
        ],
        content: {
            overview: "CRED values code quality and design. High bar.",
            culture: ["Design obsession", "Quality", "Member focus"],
            interviewTips: ["Write clean code", "Think about UX", "Design patterns are important"],
            preparationStrategy: "Practice clean coding. Focus on design patterns and LLD."
        }
    },
    {
        company: "Meesho",
        slug: "meesho",
        description: "Social commerce platform for small businesses.",
        difficulty: "HARD",
        category: CATEGORIES.INDIAN_TECH,
        salaryRange: { min: 2200000, max: 4500000, currency: "INR" },
        rounds: [
            { name: "Coding Test", type: "Online", duration: 90, tips: "DSA problems" },
            { name: "Technical Rounds (3)", type: "Technical", duration: 180, tips: "DSA + Design" }
        ],
        content: {
            overview: "Meesho has high scale challenges. Growing fast.",
            culture: ["Experimentation", "User focus", "Scale mindset"],
            interviewTips: ["Think at scale", "E-commerce domain helps", "Handle ambiguity"],
            preparationStrategy: "3 months prep. Focus on scale and efficiency."
        }
    },

    // ===== FINTECH & BANKS (15) =====
    {
        company: "Goldman Sachs",
        slug: "goldman-sachs",
        description: "Top investment bank. Strong engineering culture in India.",
        difficulty: "HARD",
        category: CATEGORIES.FINTECH,
        salaryRange: { min: 2500000, max: 5000000, currency: "INR" },
        rounds: [
            { name: "HackerRank Test", type: "Online", duration: 120, tips: "DSA + SQL + mathematical problems" },
            { name: "Coderpad Interview", type: "Technical", duration: 60, tips: "Live coding with interviewer" },
            { name: "Technical Rounds (3-4)", type: "Technical", duration: 200, tips: "DSA + CS fundamentals + Design" }
        ],
        content: {
            overview: "Goldman has a rigorous process but values fundamentals over leetcode-style tricks.",
            culture: ["Excellence", "Integrity", "Teamwork", "Client focus"],
            interviewTips: ["Strong CS fundamentals", "Know about financial markets", "Be thorough not fast"],
            preparationStrategy: "3-4 months. Focus on correctness. Practice SQL. Know basic finance."
        }
    },
    {
        company: "JP Morgan Chase",
        slug: "jpmorgan",
        description: "World's largest bank. Large tech org in India.",
        difficulty: "MEDIUM",
        category: CATEGORIES.FINTECH,
        salaryRange: { min: 1500000, max: 3500000, currency: "INR" },
        rounds: [
            { name: "Coding Test", type: "Online", duration: 90, tips: "DSA + SQL" },
            { name: "Technical Interview", type: "Technical", duration: 60, tips: "Java/Python, OOPS" },
            { name: "HR Interview", type: "HR", duration: 30, tips: "Values, ethics questions" }
        ],
        content: {
            overview: "JPMC hires in volume for multiple roles and tech stacks.",
            culture: ["Integrity", "Fairness", "Responsibility", "Serving clients"],
            interviewTips: ["JPMC Code for Coders is helpful", "Know about their tech stack", "Ethics are important"],
            preparationStrategy: "2-3 months. Standard DSA + strong OOPS."
        }
    },
    {
        company: "Morgan Stanley",
        slug: "morgan-stanley",
        description: "Investment bank with strong tech presence in India.",
        difficulty: "HARD",
        category: CATEGORIES.FINTECH,
        salaryRange: { min: 2200000, max: 4500000, currency: "INR" },
        rounds: [
            { name: "Online Test", type: "Online", duration: 90, tips: "DSA + Aptitude" },
            { name: "Technical Rounds (3-4)", type: "Technical", duration: 200, tips: "Deep DSA + CS + System Design" }
        ],
        content: {
            overview: "Morgan Stanley has strong engineering. Similar to Goldman.",
            culture: ["Excellence", "Innovation", "Client first"],
            interviewTips: ["Strong fundamentals", "Know about trading systems", "Be articulate"],
            preparationStrategy: "3-4 months intensive prep. Deep CS fundamentals."
        }
    },
    {
        company: "Deutsche Bank",
        slug: "deutsche-bank",
        description: "German bank with tech centers in India.",
        difficulty: "MEDIUM",
        category: CATEGORIES.FINTECH,
        salaryRange: { min: 1800000, max: 3500000, currency: "INR" },
        rounds: [
            { name: "Online Test", type: "Online", duration: 90, tips: "DSA + Aptitude" },
            { name: "Technical + HR", type: "Combined", duration: 90, tips: "Java focus, OOPS" }
        ],
        content: {
            overview: "DB has good campus presence. Java-focused.",
            culture: ["German efficiency", "Risk management", "Diversity"],
            interviewTips: ["Strong Java skills", "Know about banking domain", "OOPS important"],
            preparationStrategy: "2-3 months. Focus on Java and fundamentals."
        }
    },
    {
        company: "Visa",
        slug: "visa",
        description: "Global payments technology company.",
        difficulty: "MEDIUM",
        category: CATEGORIES.FINTECH,
        salaryRange: { min: 2000000, max: 4000000, currency: "INR" },
        rounds: [
            { name: "Coding Test", type: "Online", duration: 60, tips: "2 DSA problems" },
            { name: "Technical Rounds (2-3)", type: "Technical", duration: 150, tips: "DSA + System Design" }
        ],
        content: {
            overview: "Visa is payments infrastructure. Interesting at-scale problems.",
            culture: ["Innovation", "Security focus", "Reliability"],
            interviewTips: ["Know about payments", "Security is important", "Scale thinking"],
            preparationStrategy: "3 months. Understand payments ecosystem."
        }
    },
    {
        company: "Mastercard",
        slug: "mastercard",
        description: "Global payments network. Strong engineering.",
        difficulty: "MEDIUM",
        category: CATEGORIES.FINTECH,
        salaryRange: { min: 1800000, max: 3800000, currency: "INR" },
        rounds: [
            { name: "Online Assessment", type: "Online", duration: 60, tips: "DSA problems" },
            { name: "Technical Rounds (2)", type: "Technical", duration: 120, tips: "DSA + Domain" }
        ],
        content: {
            overview: "Similar to Visa. Payments focused.",
            culture: ["Decency", "Inclusion", "Innovation"],
            interviewTips: ["Know payment flows", "Security awareness", "Customer focus"],
            preparationStrategy: "Similar to Visa preparation."
        }
    },

    // ===== CONSULTING & OTHERS (10) =====
    {
        company: "Deloitte",
        slug: "deloitte",
        description: "Big 4 consulting with strong tech practice.",
        difficulty: "MEDIUM",
        category: CATEGORIES.CONSULTING,
        salaryRange: { min: 700000, max: 1500000, currency: "INR" },
        rounds: [
            { name: "Versant Test", type: "Online", duration: 20, tips: "English proficiency test" },
            { name: "Group Discussion", type: "GD", duration: 30, tips: "Current affairs, balanced views" },
            { name: "Technical + HR", type: "Combined", duration: 45, tips: "Basics + behavioral" }
        ],
        content: {
            overview: "Deloitte has consulting focus. Communication is key.",
            culture: ["Client service", "Professional development", "Integrity"],
            interviewTips: ["Strong communication", "Know consulting basics", "Current affairs"],
            preparationStrategy: "Focus on communication. Practice GDs. Know about Big 4."
        }
    },
    {
        company: "PwC",
        slug: "pwc",
        description: "Big 4 consulting firm. Multiple service lines.",
        difficulty: "MEDIUM",
        category: CATEGORIES.CONSULTING,
        salaryRange: { min: 600000, max: 1400000, currency: "INR" },
        rounds: [
            { name: "Aptitude Test", type: "Online", duration: 60, tips: "Quants, verbal, logical" },
            { name: "GD", type: "GD", duration: 30, tips: "Business topics" },
            { name: "Interview", type: "Combined", duration: 45, tips: "Technical + HR" }
        ],
        content: {
            overview: "PwC hires for tech consulting roles.",
            culture: ["Professional excellence", "Teamwork", "Innovation"],
            interviewTips: ["Know about consulting", "Business acumen helps", "Be professional"],
            preparationStrategy: "Communication focus. Understand consulting career."
        }
    },
    {
        company: "EY",
        slug: "ey",
        description: "Big 4 with growing technology practice.",
        difficulty: "MEDIUM",
        category: CATEGORIES.CONSULTING,
        salaryRange: { min: 600000, max: 1400000, currency: "INR" },
        rounds: [
            { name: "Online Assessment", type: "Online", duration: 60, tips: "Aptitude test" },
            { name: "Interview Rounds", type: "Combined", duration: 60, tips: "Tech + HR" }
        ],
        content: {
            overview: "EY is growing tech practice aggressively.",
            culture: ["Building a better world", "Integrity", "Teaming"],
            interviewTips: ["Know EY's services", "Show consulting mindset"],
            preparationStrategy: "Standard aptitude + communication."
        }
    },
    {
        company: "KPMG",
        slug: "kpmg",
        description: "Big 4 consulting firm.",
        difficulty: "MEDIUM",
        category: CATEGORIES.CONSULTING,
        salaryRange: { min: 600000, max: 1300000, currency: "INR" },
        rounds: [
            { name: "Assessment", type: "Online", duration: 60, tips: "Aptitude" },
            { name: "Interview", type: "Combined", duration: 60, tips: "Tech + HR combined" }
        ],
        content: {
            overview: "KPMG has consulting and advisory roles.",
            culture: ["Integrity", "Excellence", "Together"],
            interviewTips: ["Consulting basics", "Professionalism"],
            preparationStrategy: "Standard consulting prep."
        }
    },

    // ===== MORE PRODUCT/STARTUP COMPANIES (15) =====
    {
        company: "Atlassian",
        slug: "atlassian",
        description: "Makers of Jira, Confluence. Australian company.",
        difficulty: "HARD",
        category: CATEGORIES.PRODUCT,
        salaryRange: { min: 2800000, max: 5500000, currency: "INR" },
        rounds: [
            { name: "Online Assessment", type: "Online", duration: 90, tips: "HackerRank DSA" },
            { name: "Karat Interview", type: "Technical", duration: 60, tips: "Live coding interview" },
            { name: "Onsite (3-4)", type: "Technical", duration: 200, tips: "DSA + Values + Design" }
        ],
        content: {
            overview: "Atlassian is values-driven. Technical bar is high.",
            culture: ["Open company", "Build with heart and balance", "Don't #@!% the customer"],
            interviewTips: ["Know Atlassian values", "Use their products", "Be collaborative"],
            preparationStrategy: "3-4 months. Study their values. Strong DSA."
        }
    },
    {
        company: "Uber",
        slug: "uber",
        description: "Global ride-hailing and delivery platform.",
        difficulty: "HARD",
        category: CATEGORIES.PRODUCT,
        salaryRange: { min: 2800000, max: 5500000, currency: "INR" },
        rounds: [
            { name: "Phone Screen", type: "Technical", duration: 45, tips: "DSA problem" },
            { name: "Onsite (4-5)", type: "Technical", duration: 250, tips: "DSA + System Design + Behavioral" }
        ],
        content: {
            overview: "Uber has interesting geo-location and matching problems.",
            culture: ["Customer obsession", "Celebrate differences", "Build globally"],
            interviewTips: ["Location algorithms", "Matching problems", "Scale focus"],
            preparationStrategy: "3-4 months. Focus on geo-spatial and matching."
        }
    },
    {
        company: "Oracle",
        slug: "oracle",
        description: "Database and cloud company. Strong campus presence.",
        difficulty: "MEDIUM",
        category: CATEGORIES.PRODUCT,
        salaryRange: { min: 1500000, max: 3500000, currency: "INR" },
        rounds: [
            { name: "Coding Test", type: "Online", duration: 90, tips: "DSA problems" },
            { name: "Technical Rounds (2)", type: "Technical", duration: 120, tips: "DSA + SQL + Java" }
        ],
        content: {
            overview: "Oracle focuses on databases and cloud. Strong Java focus.",
            culture: ["Innovation", "Customer success", "Integrity"],
            interviewTips: ["Strong SQL skills", "Java focus", "Know about Oracle products"],
            preparationStrategy: "2-3 months. Heavy SQL and Java focus."
        }
    },
    {
        company: "SAP Labs",
        slug: "sap",
        description: "Enterprise software giant. Good WLB.",
        difficulty: "MEDIUM",
        category: CATEGORIES.PRODUCT,
        salaryRange: { min: 1800000, max: 3800000, currency: "INR" },
        rounds: [
            { name: "Online Test", type: "Online", duration: 90, tips: "Aptitude + Coding" },
            { name: "Technical Rounds (2)", type: "Technical", duration: 120, tips: "DSA + OOPS + Domain" }
        ],
        content: {
            overview: "SAP is enterprise focused. Good for stable career.",
            culture: ["Innovation", "Sustainability", "Diverse teams"],
            interviewTips: ["Know about ERP", "Strong OOPS", "Cloud knowledge helps"],
            preparationStrategy: "2-3 months. Enterprise domain knowledge helps."
        }
    },
    {
        company: "VMware",
        slug: "vmware",
        description: "Virtualization and cloud company.",
        difficulty: "MEDIUM",
        category: CATEGORIES.CORE_TECH,
        salaryRange: { min: 2000000, max: 4000000, currency: "INR" },
        rounds: [
            { name: "Coding Test", type: "Online", duration: 60, tips: "DSA problems" },
            { name: "Technical Rounds (2-3)", type: "Technical", duration: 150, tips: "DSA + Systems" }
        ],
        content: {
            overview: "VMware is virtualization focused. Low-level systems knowledge helps.",
            culture: ["Innovation", "Customer focus", "Integrity"],
            interviewTips: ["Know virtualization basics", "Linux knowledge", "Systems programming"],
            preparationStrategy: "2-3 months. Focus on systems fundamentals."
        }
    },
    {
        company: "Intuit",
        slug: "intuit",
        description: "Financial software company. Tax and accounting focus.",
        difficulty: "HARD",
        category: CATEGORIES.PRODUCT,
        salaryRange: { min: 2500000, max: 5000000, currency: "INR" },
        rounds: [
            { name: "Coding Test", type: "Online", duration: 90, tips: "DSA problems" },
            { name: "Technical (3-4)", type: "Technical", duration: 200, tips: "DSA + Design + Behavioral" }
        ],
        content: {
            overview: "Intuit is design-focused. Customer obsession is key.",
            culture: ["Customer obsession", "Design thinking", "Innovation"],
            interviewTips: ["Know about design thinking", "Customer focus", "Strong fundamentals"],
            preparationStrategy: "3-4 months. Design thinking awareness helps."
        }
    },
    {
        company: "Qualcomm",
        slug: "qualcomm",
        description: "Semiconductor company. Chip design and mobile tech.",
        difficulty: "HARD",
        category: CATEGORIES.CORE_TECH,
        salaryRange: { min: 1800000, max: 4000000, currency: "INR" },
        rounds: [
            { name: "Online Test", type: "Online", duration: 90, tips: "Aptitude + Core subjects" },
            { name: "Technical Rounds (2-3)", type: "Technical", duration: 150, tips: "Strong CS fundamentals, DSA" }
        ],
        content: {
            overview: "Qualcomm is semiconductor focused. Strong CS fundamentals needed.",
            culture: ["Innovation", "Leadership", "Quality"],
            interviewTips: ["Strong C/C++", "Know about chip design basics", "DSA important"],
            preparationStrategy: "3 months. Focus on C/C++ and low-level concepts."
        }
    },
    {
        company: "Samsung R&D",
        slug: "samsung",
        description: "Korean conglomerate's R&D division in India.",
        difficulty: "MEDIUM",
        category: CATEGORIES.CORE_TECH,
        salaryRange: { min: 1500000, max: 3500000, currency: "INR" },
        rounds: [
            { name: "Online Coding", type: "Online", duration: 180, tips: "3 hour coding test, 2-3 problems" },
            { name: "Technical (2)", type: "Technical", duration: 120, tips: "DSA + Projects" }
        ],
        content: {
            overview: "Samsung has a unique 3-hour coding test. Time management is key.",
            culture: ["Innovation", "Excellence", "Co-prosperity"],
            interviewTips: ["Practice long coding sessions", "Strong DSA", "Project discussion"],
            preparationStrategy: "3 months. Practice timed coding. Focus on completeness."
        }
    },
    {
        company: "Nvidia",
        slug: "nvidia",
        description: "GPU and AI computing leader.",
        difficulty: "HARD",
        category: CATEGORIES.CORE_TECH,
        salaryRange: { min: 2500000, max: 5000000, currency: "INR" },
        rounds: [
            { name: "Online Test", type: "Online", duration: 90, tips: "DSA + Systems" },
            { name: "Technical Rounds (3-4)", type: "Technical", duration: 200, tips: "Strong fundamentals, CUDA basics" }
        ],
        content: {
            overview: "Nvidia is GPU focused. AI/ML interest helps.",
            culture: ["Innovation", "Speed", "Technical excellence"],
            interviewTips: ["Know GPU basics", "Parallel computing", "Strong C++"],
            preparationStrategy: "3-4 months. Understanding of GPU computing helps."
        }
    },
    {
        company: "Intel",
        slug: "intel",
        description: "Semiconductor giant. Hardware and software roles.",
        difficulty: "MEDIUM",
        category: CATEGORIES.CORE_TECH,
        salaryRange: { min: 1600000, max: 3800000, currency: "INR" },
        rounds: [
            { name: "Online Test", type: "Online", duration: 90, tips: "Aptitude + Technical" },
            { name: "Technical Rounds (2-3)", type: "Technical", duration: 150, tips: "CS fundamentals, low-level" }
        ],
        content: {
            overview: "Intel has diverse roles. Low-level programming is valued.",
            culture: ["Innovation", "Customer focus", "Results orientation"],
            interviewTips: ["Strong C/C++", "Know computer architecture", "Low-level debugging"],
            preparationStrategy: "2-3 months. Focus on low-level concepts."
        }
    },
    {
        company: "Freshworks",
        slug: "freshworks",
        description: "SaaS company from India. Recently IPO'd.",
        difficulty: "HARD",
        category: CATEGORIES.INDIAN_TECH,
        salaryRange: { min: 2200000, max: 4500000, currency: "INR" },
        rounds: [
            { name: "Coding Test", type: "Online", duration: 90, tips: "DSA problems" },
            { name: "Technical (3)", type: "Technical", duration: 180, tips: "DSA + Design + Culture" }
        ],
        content: {
            overview: "Freshworks is a fast-growing SaaS company. Product-minded engineers.",
            culture: ["Happy customers", "Simple solutions", "Act like an owner"],
            interviewTips: ["Know their products", "SaaS understanding", "Product thinking"],
            preparationStrategy: "3 months. SaaS domain knowledge helps."
        }
    },
    {
        company: "Zoho",
        slug: "zoho",
        description: "Indian SaaS company. No external funding. Unique culture.",
        difficulty: "HARD",
        category: CATEGORIES.INDIAN_TECH,
        salaryRange: { min: 700000, max: 2000000, currency: "INR" },
        rounds: [
            { name: "Programming Round", type: "Technical", duration: 180, tips: "Multi-level C programming test" },
            { name: "Advanced Round", type: "Technical", duration: 180, tips: "Complex programming challenges" },
            { name: "Technical + HR", type: "Combined", duration: 60, tips: "Aptitude + cultural fit" }
        ],
        content: {
            overview: "Zoho has a unique hiring process. C programming focus. Lower pay but great learning.",
            culture: ["Self-funded", "Long-term thinking", "Strong engineering culture"],
            interviewTips: ["Master C programming", "Pattern problems", "Logical thinking"],
            preparationStrategy: "Focus heavily on C. Practice pattern and logic problems."
        }
    },
];

export function getCompanyBySlug(slug: string): CompanyConfig | undefined {
    return COMPANIES.find(c => c.slug === slug);
}

export function getCompaniesByCategory(category: string): CompanyConfig[] {
    return COMPANIES.filter(c => c.category === category);
}

export function getCompaniesCount(): number {
    return COMPANIES.length;
}
