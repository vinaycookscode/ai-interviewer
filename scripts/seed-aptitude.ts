// The ready-made "General aptitude" test (AIIN-169): 30 minutes, 10 questions from each section's pool of 15.
// Safe to run again: it updates the same rows. Each answer has its working in the explanation; have a person check
// them before production. Grow each pool towards 50 so attempts differ more.
//
//   DATABASE_URL="postgresql://postgres@localhost:5433/build_check" npx tsx scripts/seed-aptitude.ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL ?? "";
if (!url) throw new Error("Set DATABASE_URL");
const local = (() => {
    try {
        return ["localhost", "127.0.0.1", "::1"].includes(new URL(url).hostname);
    } catch {
        return false;
    }
})();
if (!local && process.env.ALLOW_SEED !== "1") {
    console.error("Refusing to seed a non-local database without ALLOW_SEED=1.");
    process.exit(1);
}
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

type Q = [text: string, options: string[], correct: number, why: string];
const SECTIONS: { id: string; name: string; questions: Q[] }[] = [
    {
        id: "general-quant",
        name: "Quantitative",
        questions: [
            ["A train 240 m long passes a pole in 12 seconds. How long does it take to cross a platform 360 m long?", ["24 seconds", "30 seconds", "36 seconds", "18 seconds"], 1, "Speed = 240 / 12 = 20 m/s. It covers 240 + 360 = 600 m: 600 / 20 = 30 s."],
            ["What is 15% of 240?", ["32", "36", "40", "24"], 1, "0.15 × 240 = 36."],
            ["A shirt marked ₹800 is sold at a 20% discount. What does it sell for?", ["₹600", "₹640", "₹660", "₹720"], 1, "800 − 20% of 800 = 800 − 160 = 640."],
            ["What is the average of 12, 18, 24 and 30?", ["20", "21", "22", "24"], 1, "(12 + 18 + 24 + 30) / 4 = 84 / 4 = 21."],
            ["What is the simple interest on ₹5,000 at 8% a year for 3 years?", ["₹1,000", "₹1,200", "₹1,400", "₹1,500"], 1, "5,000 × 8 × 3 / 100 = 1,200."],
            ["A can finish a job in 12 days and B in 6 days. Working together, how many days do they take?", ["3", "4", "6", "9"], 1, "1/12 + 1/6 = 3/12 = 1/4 of the job a day, so 4 days."],
            ["Two numbers are in the ratio 3 : 5 and add up to 64. What is the larger number?", ["24", "36", "40", "45"], 2, "64 / 8 = 8 per part; 5 × 8 = 40."],
            ["What is 25 × 24?", ["580", "600", "620", "625"], 1, "25 × 24 = 25 × 4 × 6 = 100 × 6 = 600."],
            ["A number increased by 20% becomes 96. What is the number?", ["76", "78", "80", "84"], 2, "1.2 × n = 96, so n = 80."],
            ["A car travels 180 km in 3 hours. What is its speed in metres per second?", ["15 m/s", "16.7 m/s", "18 m/s", "20 m/s"], 1, "60 km/h × 1000 / 3600 = 16.67 m/s."],
            ["An item bought for ₹400 is sold for ₹500. What is the profit percentage?", ["20%", "25%", "30%", "100%"], 1, "Profit 100 on cost 400: 100 / 400 = 25%."],
            ["What comes next: 3, 9, 27, 81, …?", ["162", "243", "324", "486"], 1, "Each term is 3 times the last: 81 × 3 = 243."],
            ["What is 3/4 of 1/2 of 96?", ["24", "32", "36", "48"], 2, "1/2 of 96 = 48; 3/4 of 48 = 36."],
            ["One pipe fills a tank in 6 hours and another empties it in 12 hours. With both open, how long to fill it?", ["8 hours", "10 hours", "12 hours", "18 hours"], 2, "1/6 − 1/12 = 1/12 of the tank an hour, so 12 hours."],
            ["What is the least common multiple of 12 and 18?", ["6", "36", "72", "216"], 1, "12 = 2² × 3, 18 = 2 × 3²; LCM = 2² × 3² = 36."],
        ],
    },
    {
        id: "general-logical",
        name: "Logical",
        questions: [
            ["All roses are flowers. Some flowers fade quickly. Which must be true?", ["All roses fade quickly", "Some roses fade quickly", "No rose fades quickly", "None of these must be true"], 3, "The flowers that fade quickly may or may not include roses."],
            ["What comes next: 2, 6, 12, 20, 30, …?", ["40", "42", "44", "48"], 1, "The differences are 4, 6, 8, 10, so the next is 12: 30 + 12 = 42."],
            ["If CAT is written as DBU, how is DOG written?", ["EPH", "CNF", "EOH", "DPH"], 0, "Each letter moves one forward: D→E, O→P, G→H."],
            ["Riya says of a man: “He is the son of my mother's only son.” How is he related to Riya?", ["Brother", "Nephew", "Son", "Cousin"], 1, "Her mother's only son is Riya's brother; his son is her nephew."],
            ["Which number doesn't belong: 9, 16, 25, 32, 36?", ["16", "25", "32", "36"], 2, "All the others are perfect squares."],
            ["A is taller than B, and C is taller than A. Who is the shortest?", ["A", "B", "C", "Can't tell"], 1, "C > A > B, so B is shortest."],
            ["Which doesn't belong: apple, mango, carrot, banana?", ["Apple", "Mango", "Carrot", "Banana"], 2, "Carrot is a vegetable; the others are fruits."],
            ["What comes next: A, C, F, J, O, …?", ["S", "T", "U", "V"], 2, "The gaps are +2, +3, +4, +5, so next is +6: O → U."],
            ["You face north, turn right, turn right again, then turn left. Which way do you face?", ["North", "East", "South", "West"], 1, "North → East → South → (left) East."],
            ["If 5 machines make 5 widgets in 5 minutes, how long do 100 machines take to make 100 widgets?", ["1 minute", "5 minutes", "20 minutes", "100 minutes"], 1, "Each machine makes one widget in 5 minutes, whatever the number of machines."],
            ["Book is to reading as fork is to …", ["cooking", "eating", "kitchen", "spoon"], 1, "You use a book to read and a fork to eat."],
            ["Some students are athletes. All athletes are disciplined. Which follows?", ["All students are disciplined", "Some students are disciplined", "No student is disciplined", "All disciplined people are athletes"], 1, "The students who are athletes are disciplined."],
            ["Find the missing number: 1, 4, 9, 16, …, 36", ["20", "24", "25", "30"], 2, "These are 1², 2², 3², 4², so 5² = 25."],
            ["A clock shows 3:15. What is the angle between the hands?", ["0°", "7.5°", "15°", "22.5°"], 1, "Minute hand at 90°; hour hand at 90° + 15 × 0.5° = 97.5°. The difference is 7.5°."],
            ["In a row, Ravi is 7th from the left and 12th from the right. How many people are in the row?", ["17", "18", "19", "20"], 1, "7 + 12 − 1 = 18 (Ravi is counted twice)."],
        ],
    },
    {
        id: "general-verbal",
        name: "Verbal",
        questions: [
            ["Which word means the same as “abundant”?", ["Scarce", "Plentiful", "Hidden", "Brief"], 1, "Abundant means existing in large amounts."],
            ["Which word means the opposite of “expand”?", ["Enlarge", "Contract", "Extend", "Spread"], 1, "To contract is to become smaller."],
            ["Choose the right word: “She ___ to the office every day.”", ["go", "goes", "going", "gone"], 1, "A singular subject in the simple present takes “goes”."],
            ["Choose the right word: “He has been working here ___ 2020.”", ["for", "since", "from", "by"], 1, "“Since” goes with a point in time."],
            ["Which is spelt correctly?", ["Acommodate", "Accomodate", "Accommodate", "Acomodate"], 2, "Two c's and two m's: accommodate."],
            ["Which word means the same as “candid”?", ["Frank", "Careful", "Secret", "Rude"], 0, "Candid means open and honest."],
            ["Which word means the opposite of “scarce”?", ["Rare", "Abundant", "Small", "Limited"], 1, "Scarce means in short supply; abundant is the opposite."],
            ["Which sentence is punctuated correctly?", ["Its raining, so take an umbrella.", "It's raining, so take an umbrella.", "Its' raining, so take an umbrella.", "It is' raining, so take an umbrella."], 1, "“It's” is short for “it is”."],
            ["One word for “a person who speaks many languages”:", ["Polyglot", "Philatelist", "Optimist", "Novelist"], 0, "A philatelist collects stamps."],
            ["Choose the right word: “Neither the manager nor the employees ___ ready.”", ["was", "were", "is", "be"], 1, "With neither…nor, the verb agrees with the nearer subject, “employees”."],
            ["What does “break the ice” mean?", ["Damage something", "Start a conversation in an awkward situation", "Cool down quickly", "Give up a plan"], 1, "It means easing the first awkwardness of meeting."],
            ["Which word means the same as “meticulous”?", ["Careless", "Thorough", "Quick", "Loud"], 1, "Meticulous means very careful about detail."],
            ["Which word means the opposite of “reluctant”?", ["Unwilling", "Eager", "Slow", "Tired"], 1, "Reluctant means unwilling; eager is the opposite."],
            ["Choose the right article: “She is ___ honest person.”", ["a", "an", "the", "no article"], 1, "“Honest” starts with a vowel sound, so “an”."],
            ["Which is the passive form of “The chef cooked the meal”?", ["The meal is cooked by the chef.", "The meal was cooked by the chef.", "The meal has cooked the chef.", "The chef was cooked by the meal."], 1, "Past simple active becomes “was cooked” in the passive."],
        ],
    },
];

async function main() {
    const testId = "general-aptitude";
    await db.aptitudeTest.upsert({
        where: { id: testId },
        update: { name: "General aptitude", durationMinutes: 30, shuffle: true, ownerId: null },
        create: { id: testId, name: "General aptitude", durationMinutes: 30, shuffle: true },
    });
    for (const [order, s] of SECTIONS.entries()) {
        await db.aptitudeSection.upsert({ where: { id: s.id }, update: { name: s.name, askCount: 10, order }, create: { id: s.id, testId, name: s.name, askCount: 10, order } });
        for (const [i, [text, options, correctIndex, explanation]] of s.questions.entries()) {
            const id = `${s.id}-${i + 1}`;
            const data = { testId, sectionId: s.id, text, options, correctIndex, explanation, checked: true };
            await db.aptitudeQuestion.upsert({ where: { id }, update: data, create: { id, ...data } });
        }
    }
    console.log(`Seeded General aptitude: ${SECTIONS.reduce((n, s) => n + s.questions.length, 0)} questions in ${SECTIONS.length} sections.`);
}

main().finally(() => db.$disconnect());
