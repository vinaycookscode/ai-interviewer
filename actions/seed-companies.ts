"use server";

import { db } from "@/lib/db";

/**
 * Seeds Company Prep Kits with real interview data
 */
export async function seedCompanyPrepKits() {
    const companies = [
        {
            company: "TCS",
            slug: "tcs",
            logo: "/companies/tcs.png",
            description: `Tata Consultancy Services (TCS) is India's largest IT services company and a global leader in digital transformation. Known for its structured interview process and focus on aptitude, TCS recruits heavily from engineering colleges across India.`,
            difficulty: "MEDIUM",
            rounds: [
                { name: "Online Test", type: "APTITUDE", duration: 180, tips: "Focus on quantitative aptitude, verbal ability, and basic programming. Time management is key." },
                { name: "Technical Interview", type: "TECHNICAL", duration: 30, tips: "Expect questions on OOP, DBMS, OS basics. Know your resume projects well." },
                { name: "Managerial Round", type: "BEHAVIORAL", duration: 20, tips: "They assess your fitment for TCS values. Be positive and enthusiastic." },
                { name: "HR Round", type: "HR", duration: 15, tips: "Standard HR questions. Know about TCS history, services, and recent news." }
            ],
            salaryRange: { min: 350000, max: 700000, currency: "INR" },
            questions: [
                // Aptitude
                { question: "A train 150m long passes a pole in 15 seconds. Find the speed of the train in km/h.", type: "APTITUDE", difficulty: "EASY", frequency: 9, answer: "36 km/h. Speed = Distance/Time = 150/15 = 10 m/s = 36 km/h", tags: ["speed", "distance", "time"] },
                { question: "If the ratio of ages of A and B is 4:3 and the sum of their ages is 35, find their ages.", type: "APTITUDE", difficulty: "EASY", frequency: 8, answer: "A = 20, B = 15. 4x + 3x = 35, x = 5", tags: ["ratio", "ages"] },
                { question: "Find the next number in the series: 2, 6, 12, 20, 30, ?", type: "APTITUDE", difficulty: "MEDIUM", frequency: 8, answer: "42. Pattern: n(n+1), so 6×7 = 42", tags: ["series", "pattern"] },

                // Technical
                { question: "What is the difference between process and thread?", type: "CODING", difficulty: "EASY", frequency: 9, answer: "Process is an independent execution unit with its own memory. Thread is a lightweight unit within a process sharing memory.", tags: ["os", "basics"] },
                { question: "What are the four pillars of OOP?", type: "CODING", difficulty: "EASY", frequency: 10, answer: "Abstraction, Encapsulation, Inheritance, Polymorphism", tags: ["oop", "concepts"] },
                { question: "Write a program to reverse a string without using built-in functions.", type: "CODING", difficulty: "EASY", frequency: 8, tags: ["strings", "programming"] },

                // HR
                { question: "Why do you want to join TCS?", type: "HR", difficulty: "EASY", frequency: 10, tips: "Mention TCS's global presence, learning opportunities, and work culture." },
                { question: "Are you willing to relocate?", type: "HR", difficulty: "EASY", frequency: 9, tips: "TCS expects flexibility. Be open to relocation." },
            ]
        },
        {
            company: "Infosys",
            slug: "infosys",
            logo: "/companies/infosys.png",
            description: `Infosys is a global leader in digital services and consulting. Known for their rigorous InfyTQ platform and emphasis on continuous learning, Infosys offers excellent training programs for freshers through their Mysore campus.`,
            difficulty: "MEDIUM",
            rounds: [
                { name: "Online Assessment", type: "APTITUDE", duration: 150, tips: "Three sections: Reasoning, Quantitative, Verbal. Practice InfyTQ previous papers." },
                { name: "Technical Interview", type: "TECHNICAL", duration: 45, tips: "Deep dive into DSA, DBMS, and one programming language. Coding questions on paper." },
                { name: "HR Round", type: "HR", duration: 20, tips: "Focus on communication skills and cultural fit. Know Infosys values." }
            ],
            salaryRange: { min: 350000, max: 600000, currency: "INR" },
            questions: [
                { question: "If 20% of a number is 50, what is 40% of that number?", type: "APTITUDE", difficulty: "EASY", frequency: 8, answer: "100. Number = 50/0.2 = 250. 40% of 250 = 100", tags: ["percentage"] },
                { question: "What is normalization in DBMS?", type: "CODING", difficulty: "MEDIUM", frequency: 9, answer: "Process of organizing data to reduce redundancy. Includes 1NF, 2NF, 3NF, BCNF.", tags: ["dbms", "normalization"] },
                { question: "Explain the difference between SQL and NoSQL databases.", type: "CODING", difficulty: "MEDIUM", frequency: 7, tags: ["database", "sql"] },
                { question: "What do you know about Infosys?", type: "HR", difficulty: "EASY", frequency: 10, tips: "Mention founders (Narayana Murthy), Mysore campus, digital transformation focus." },
            ]
        },
        {
            company: "Wipro",
            slug: "wipro",
            logo: "/companies/wipro.png",
            description: `Wipro Limited is a leading global IT, consulting, and business process services company. Known for their focus on sustainability and innovation, Wipro offers diverse career paths and strong campus hiring programs.`,
            difficulty: "MEDIUM",
            rounds: [
                { name: "Online Test", type: "APTITUDE", duration: 120, tips: "Focus on aptitude, verbal, and basic coding MCQs. Essay writing is important." },
                { name: "Technical Interview", type: "TECHNICAL", duration: 30, tips: "Basic programming concepts, resume-based questions, simple coding." },
                { name: "HR Round", type: "HR", duration: 15, tips: "Standard questions about goals, relocation, and Wipro knowledge." }
            ],
            salaryRange: { min: 350000, max: 550000, currency: "INR" },
            questions: [
                { question: "What is the difference between abstract class and interface?", type: "CODING", difficulty: "MEDIUM", frequency: 9, answer: "Abstract class can have implementation, interface is pure contract. Class can extend one abstract class but implement multiple interfaces.", tags: ["oop", "java"] },
                { question: "Write an essay on 'Technology in Education'", type: "HR", difficulty: "MEDIUM", frequency: 8, tips: "Essay should be 200-250 words, well-structured with intro, body, conclusion." },
                { question: "Where do you see yourself in 5 years?", type: "HR", difficulty: "EASY", frequency: 10, tips: "Show ambition while being realistic. Mention growth within Wipro." },
            ]
        },
        {
            company: "Amazon",
            slug: "amazon",
            logo: "/companies/amazon.png",
            description: `Amazon is the world's largest e-commerce and cloud computing company. Known for their rigorous bar raiser interviews and Leadership Principles, Amazon offers challenging roles with significant growth potential and competitive compensation.`,
            difficulty: "HARD",
            rounds: [
                { name: "Online Assessment", type: "CODING", duration: 90, tips: "2-3 coding problems on HackerRank. Focus on arrays, strings, trees. Optimal solutions expected." },
                { name: "Phone Screen", type: "TECHNICAL", duration: 45, tips: "1-2 coding problems with live coding. Think aloud. Ask clarifying questions." },
                { name: "Onsite Loop", type: "TECHNICAL", duration: 240, tips: "4-5 rounds: System Design, Coding, Leadership Principles. Bar Raiser present." }
            ],
            salaryRange: { min: 1500000, max: 4000000, currency: "INR" },
            questions: [
                { question: "Find the longest substring without repeating characters", type: "CODING", difficulty: "MEDIUM", frequency: 9, tags: ["sliding-window", "strings", "leetcode"] },
                { question: "Design a URL shortening service like bit.ly", type: "CODING", difficulty: "HARD", frequency: 8, tags: ["system-design", "high-level"] },
                { question: "Tell me about a time you disagreed with your manager (LP: Have Backbone)", type: "HR", difficulty: "MEDIUM", frequency: 10, tips: "Use STAR format. Show you can respectfully disagree with data." },
                { question: "Describe a situation where you had to deliver results under tight deadlines (LP: Deliver Results)", type: "HR", difficulty: "MEDIUM", frequency: 9, tips: "Emphasize prioritization and execution." },
                { question: "Implement LRU Cache", type: "CODING", difficulty: "MEDIUM", frequency: 8, tags: ["data-structures", "design", "leetcode"] },
            ]
        }
    ];

    let created = 0;

    for (const companyData of companies) {
        // Check if exists
        const existing = await db.companyPrepKit.findUnique({
            where: { slug: companyData.slug }
        });

        if (existing) continue;

        // Create company
        const kit = await db.companyPrepKit.create({
            data: {
                company: companyData.company,
                slug: companyData.slug,
                logo: companyData.logo,
                description: companyData.description,
                difficulty: companyData.difficulty,
                rounds: companyData.rounds,
                salaryRange: companyData.salaryRange
            }
        });

        // Create questions
        for (const q of companyData.questions) {
            await db.companyQuestion.create({
                data: {
                    kitId: kit.id,
                    question: q.question,
                    type: q.type,
                    difficulty: q.difficulty,
                    frequency: q.frequency,
                    answer: q.answer || null,
                    tips: q.tips || null,
                    tags: q.tags || []
                }
            });
        }

        created++;
    }

    return { success: true, companiesCreated: created };
}
