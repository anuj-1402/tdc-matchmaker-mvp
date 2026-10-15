/**
 * Deterministic Seed Script — 220 Candidates + 6 Customers + 2 Staff
 *
 * Uses @faker-js/faker with seed 20261015 for reproducible data.
 * Generates culturally appropriate Indian names, cities, professions.
 * Idempotent: safe to run multiple times.
 *
 * Reference: plan.md §6
 */

import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

// ─── Seed Configuration ─────────────────────────────────────────────────────

faker.seed(20261015);

const DEMO_PASSWORD = "demo123";

const INDIAN_CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai",
  "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow",
  "Chandigarh", "Indore", "Coimbatore", "Kochi", "Nagpur",
  "Vadodara", "Surat", "Noida", "Gurugram", "Mysuru",
];

const MALE_FIRST_NAMES = [
  "Arjun", "Rohan", "Vikram", "Aditya", "Karan", "Rahul", "Sidharth",
  "Nikhil", "Ankit", "Varun", "Rishabh", "Sahil", "Harsh", "Yash",
  "Pranav", "Kunal", "Manish", "Deepak", "Aman", "Rajat",
  "Saurabh", "Gaurav", "Tarun", "Naveen", "Ajay",
  "Suresh", "Vikas", "Mohit", "Prashant", "Abhishek",
  "Ravi", "Alok", "Samir", "Vishal", "Ritesh",
  "Dev", "Kartik", "Neeraj", "Ashwin", "Pavan",
  "Shivam", "Vivek", "Manoj", "Sunil", "Sandeep",
  "Hemant", "Ramesh", "Sachin", "Tushar", "Akash",
  "Dhruv", "Mihir", "Raghav", "Ishaan", "Sameer",
];

const FEMALE_FIRST_NAMES = [
  "Asha", "Priya", "Neha", "Anjali", "Meera", "Pooja", "Sneha",
  "Divya", "Kavita", "Riya", "Nisha", "Shruti", "Tanvi", "Ishita",
  "Swati", "Ananya", "Pallavi", "Megha", "Kritika", "Sonal",
  "Deepika", "Rashmi", "Jyoti", "Sunita", "Preeti",
  "Komal", "Shweta", "Bhavna", "Archana", "Sapna",
  "Padma", "Lakshmi", "Geeta", "Sarita", "Kirti",
  "Nandini", "Aditi", "Anika", "Disha", "Ekta",
  "Garima", "Harsha", "Ira", "Janvi", "Khushi",
  "Lavanya", "Manvi", "Nidhi", "Oorja", "Paavni",
  "Radhika", "Sanya", "Tara", "Uma", "Varsha",
];

const LAST_NAMES = [
  "Sharma", "Patel", "Gupta", "Singh", "Kumar", "Mehta", "Shah",
  "Reddy", "Nair", "Iyer", "Verma", "Joshi", "Desai", "Rao",
  "Pillai", "Agarwal", "Chopra", "Bhatia", "Malhotra", "Kapoor",
  "Banerjee", "Mukherjee", "Das", "Ghosh", "Bose",
  "Thakur", "Chauhan", "Pandey", "Mishra", "Dubey",
  "Saxena", "Srivastava", "Tiwari", "Yadav", "Rathore",
];

const COLLEGES = [
  "IIT Bombay", "IIT Delhi", "BITS Pilani", "NIT Trichy",
  "Delhi University", "Mumbai University", "Christ University",
  "Manipal University", "Symbiosis", "VIT Vellore",
  "IIM Ahmedabad", "SRCC", "St. Xavier's", "Loyola College",
  "Jadavpur University", "Anna University", "Osmania University",
  "Fergusson College", "Presidency College", "Madras Christian College",
];

const DEGREES = [
  "B.Tech", "B.E.", "BBA", "B.Com", "B.Sc", "BA",
  "MBA", "M.Tech", "M.Sc", "MA", "MBBS", "BDS",
  "CA", "LLB", "B.Arch", "B.Des",
];

const COMPANIES = [
  "TCS", "Infosys", "Wipro", "Google", "Microsoft", "Amazon",
  "Flipkart", "Zomato", "Swiggy", "Paytm", "Reliance",
  "HDFC Bank", "ICICI Bank", "Deloitte", "EY", "McKinsey",
  "Tata Motors", "Mahindra", "PhonePe", "Razorpay",
  "Freshworks", "Zoho", "Ola", "Byju's", "Meesho",
];

const DESIGNATIONS = [
  "Software Engineer", "Product Manager", "Data Analyst",
  "Business Analyst", "Marketing Manager", "HR Manager",
  "Consultant", "Designer", "Architect", "Doctor",
  "Lawyer", "Teacher", "Research Scientist", "Operations Manager",
  "Financial Analyst", "Content Writer", "Sales Manager",
  "Project Manager", "CTO", "Founder",
];

const PROFESSION_CATEGORIES = [
  "Technology", "Finance", "Healthcare", "Education",
  "Marketing", "Consulting", "Engineering", "Legal",
  "Creative", "Business", "Research", "Operations",
];

const LANGUAGES = [
  "Hindi", "English", "Marathi", "Tamil", "Telugu",
  "Bengali", "Gujarati", "Kannada", "Malayalam", "Punjabi",
  "Urdu", "Odia",
];

const VALUES = [
  "family", "career", "learning", "travel", "fitness",
  "spirituality", "creativity", "community", "independence",
  "ambition", "simplicity", "adventure", "tradition", "innovation",
  "empathy", "honesty",
];

const MARITAL_STATUSES = [
  "Never married", "Divorced", "Widowed", "Annulled",
];

const RELIGIONS = [
  "Hindu", "Muslim", "Christian", "Sikh", "Buddhist", "Jain",
];

const CASTES = [
  "Brahmin", "Kshatriya", "Vaishya", "General", "OBC", "SC", "ST",
];

type Tri = "YES" | "NO" | "MAYBE";

// ─── Helper Functions ────────────────────────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[faker.number.int({ min: 0, max: arr.length - 1 })];
}

function pickMultiple<T>(arr: T[], min: number, max: number): T[] {
  const count = faker.number.int({ min, max: Math.min(max, arr.length) });
  const shuffled = [...arr].sort(() => faker.number.float() - 0.5);
  return shuffled.slice(0, count);
}

function randomTri(): Tri {
  return pickRandom(["YES", "NO", "MAYBE"]) as Tri;
}

function randomTriWeighted(): Tri {
  const r = faker.number.float();
  if (r < 0.4) return "YES";
  if (r < 0.7) return "NO";
  return "MAYBE";
}

function generateDOB(minAge: number, maxAge: number): Date {
  const now = new Date();
  const year = now.getFullYear() - faker.number.int({ min: minAge, max: maxAge });
  const month = faker.number.int({ min: 0, max: 11 });
  const day = faker.number.int({ min: 1, max: 28 });
  return new Date(year, month, day);
}

function generateHeight(gender: string): number {
  if (gender === "Male") {
    return faker.number.int({ min: 160, max: 195 });
  }
  return faker.number.int({ min: 145, max: 178 });
}

function generateIncome(): number {
  // 4 LPA to 80 LPA
  const lpa = faker.number.int({ min: 4, max: 80 });
  return lpa * 100000;
}

// ─── Profile Generator ──────────────────────────────────────────────────────

function generateProfile(
  gender: string,
  index: number,
  options?: { verified?: boolean; missingFields?: boolean }
) {
  const firstNames = gender === "Male" ? MALE_FIRST_NAMES : FEMALE_FIRST_NAMES;
  const firstName = firstNames[index % firstNames.length];
  const lastName = pickRandom(LAST_NAMES);
  const city = pickRandom(INDIAN_CITIES);
  const hasMissing = options?.missingFields ?? false;

  return {
    firstName,
    lastName,
    gender,
    dateOfBirth: generateDOB(23, 45),
    country: "India",
    city,
    heightCm: generateHeight(gender),
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${index}@example.com`,
    phoneNumber: hasMissing ? null : `+91${faker.string.numeric(10)}`,
    undergraduateCollege: hasMissing && faker.number.float() < 0.3 ? null : pickRandom(COLLEGES),
    degree: hasMissing && faker.number.float() < 0.3 ? null : pickRandom(DEGREES),
    incomeAnnual: hasMissing && faker.number.float() < 0.3 ? null : generateIncome(),
    incomeCurrency: "INR",
    currentCompany: hasMissing && faker.number.float() < 0.3 ? null : pickRandom(COMPANIES),
    designation: hasMissing && faker.number.float() < 0.3 ? null : pickRandom(DESIGNATIONS),
    maritalStatus: pickRandom(MARITAL_STATUSES),
    languagesKnown: pickMultiple(LANGUAGES, 1, 4),
    siblings: faker.number.int({ min: 0, max: 5 }),
    caste: faker.number.float() < 0.7 ? pickRandom(CASTES) : null,
    religion: faker.number.float() < 0.7 ? pickRandom(RELIGIONS) : null,
    wantKids: randomTriWeighted() as Tri,
    openToRelocate: randomTri() as Tri,
    openToPets: randomTri() as Tri,
    values: pickMultiple(VALUES, 2, 5),
    professionCategory: pickRandom(PROFESSION_CATEGORIES),
    verificationStatus: (options?.verified ?? true)
      ? ("DEMO_VERIFIED" as const)
      : ("UNVERIFIED" as const),
  };
}

// ─── Main Seed Function ──────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting seed...");

  // Reset seed for determinism
  faker.seed(20261015);

  // ── 1. Create Staff / Matchmakers ──────────────────────────────────────

  const passwordHash = await argon2.hash(DEMO_PASSWORD, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  const staff1 = await prisma.matchmaker.upsert({
    where: { username: "priya.matchmaker" },
    update: {},
    create: {
      username: "priya.matchmaker",
      displayName: "Priya Sharma",
      passwordHash,
      role: "MATCHMAKER",
    },
  });

  const staff2 = await prisma.matchmaker.upsert({
    where: { username: "rahul.matchmaker" },
    update: {},
    create: {
      username: "rahul.matchmaker",
      displayName: "Rahul Verma",
      passwordHash,
      role: "MATCHMAKER",
    },
  });

  console.log(`✅ Staff: ${staff1.displayName}, ${staff2.displayName}`);

  // ── 2. Create Demo Customers ──────────────────────────────────────────
  // 6 customers: 3 women, 3 men split across 2 staff accounts

  const customerConfigs = [
    // Staff 1's customers
    {
      assignedTo: staff1.id,
      profile: {
        firstName: "Asha", lastName: "Mehta", gender: "Female",
        dateOfBirth: new Date(1998, 3, 15), country: "India", city: "Mumbai",
        heightCm: 163, email: "asha.mehta@example.com", phoneNumber: "+919876543210",
        undergraduateCollege: "Mumbai University", degree: "MBA",
        incomeAnnual: 1800000, incomeCurrency: "INR",
        currentCompany: "Deloitte", designation: "Consultant",
        maritalStatus: "Never married",
        languagesKnown: ["Hindi", "English", "Marathi"],
        siblings: 1, caste: "Brahmin", religion: "Hindu",
        wantKids: "YES" as Tri, openToRelocate: "MAYBE" as Tri, openToPets: "YES" as Tri,
        values: ["family", "career", "learning", "travel"],
        professionCategory: "Consulting",
        verificationStatus: "DEMO_VERIFIED" as const,
        journeyStage: "IN_MATCHING" as const,
      },
      preferences: {
        minAge: 28, maxAge: 35, minHeightCm: 170, maxHeightCm: 195,
        minIncome: 1500000,
        desiredCities: ["Mumbai", "Pune", "Bangalore"],
        desiredCountries: ["India"],
        desiredMaritalStatuses: ["Never married"],
        preferredRelocation: "MAYBE" as Tri,
        kidsPreference: "YES" as Tri,
        petsPreference: "YES" as Tri,
        desiredValues: ["family", "career", "learning"],
        professionPreferences: ["Technology", "Consulting", "Finance"],
      },
    },
    {
      assignedTo: staff1.id,
      profile: {
        firstName: "Rohan", lastName: "Kapoor", gender: "Male",
        dateOfBirth: new Date(1995, 7, 22), country: "India", city: "Delhi",
        heightCm: 178, email: "rohan.kapoor@example.com", phoneNumber: "+919876543211",
        undergraduateCollege: "IIT Delhi", degree: "B.Tech",
        incomeAnnual: 2400000, incomeCurrency: "INR",
        currentCompany: "Google", designation: "Software Engineer",
        maritalStatus: "Never married",
        languagesKnown: ["Hindi", "English", "Punjabi"],
        siblings: 2, caste: "Kshatriya", religion: "Hindu",
        wantKids: "YES" as Tri, openToRelocate: "YES" as Tri, openToPets: "MAYBE" as Tri,
        values: ["career", "fitness", "travel", "innovation"],
        professionCategory: "Technology",
        verificationStatus: "DEMO_VERIFIED" as const,
        journeyStage: "VERIFIED" as const,
      },
      preferences: {
        minAge: 23, maxAge: 30, minHeightCm: 155, maxHeightCm: 172,
        minIncome: null,
        desiredCities: ["Delhi", "Gurugram", "Noida", "Bangalore"],
        desiredCountries: ["India"],
        desiredMaritalStatuses: ["Never married"],
        preferredRelocation: "YES" as Tri,
        kidsPreference: "YES" as Tri,
        petsPreference: "MAYBE" as Tri,
        desiredValues: ["career", "fitness", "travel"],
        professionPreferences: ["Technology", "Creative", "Marketing"],
      },
    },
    {
      assignedTo: staff1.id,
      profile: {
        firstName: "Meera", lastName: "Nair", gender: "Female",
        dateOfBirth: new Date(1993, 11, 5), country: "India", city: "Bangalore",
        heightCm: 158, email: "meera.nair@example.com", phoneNumber: "+919876543212",
        undergraduateCollege: "Christ University", degree: "B.Com",
        incomeAnnual: 1200000, incomeCurrency: "INR",
        currentCompany: "Flipkart", designation: "Product Manager",
        maritalStatus: "Never married",
        languagesKnown: ["English", "Malayalam", "Hindi"],
        siblings: 0, caste: null, religion: "Hindu",
        wantKids: "MAYBE" as Tri, openToRelocate: "NO" as Tri, openToPets: "YES" as Tri,
        values: ["independence", "creativity", "learning", "empathy"],
        professionCategory: "Business",
        verificationStatus: "DEMO_VERIFIED" as const,
        journeyStage: "NEW" as const,
      },
      preferences: {
        minAge: 30, maxAge: 40, minHeightCm: 165, maxHeightCm: 190,
        minIncome: 1000000,
        desiredCities: ["Bangalore", "Mysuru"],
        desiredCountries: ["India"],
        desiredMaritalStatuses: ["Never married", "Divorced"],
        preferredRelocation: "NO" as Tri,
        kidsPreference: "MAYBE" as Tri,
        petsPreference: "YES" as Tri,
        desiredValues: ["independence", "creativity", "empathy"],
        professionPreferences: ["Technology", "Creative", "Research"],
      },
    },
    // Staff 2's customers
    {
      assignedTo: staff2.id,
      profile: {
        firstName: "Vikram", lastName: "Singh", gender: "Male",
        dateOfBirth: new Date(1992, 1, 10), country: "India", city: "Pune",
        heightCm: 182, email: "vikram.singh@example.com", phoneNumber: "+919876543213",
        undergraduateCollege: "BITS Pilani", degree: "B.E.",
        incomeAnnual: 3500000, incomeCurrency: "INR",
        currentCompany: "Microsoft", designation: "Architect",
        maritalStatus: "Divorced",
        languagesKnown: ["Hindi", "English"],
        siblings: 1, caste: "Rajput", religion: "Hindu",
        wantKids: "NO" as Tri, openToRelocate: "MAYBE" as Tri, openToPets: "YES" as Tri,
        values: ["ambition", "fitness", "simplicity", "honesty"],
        professionCategory: "Technology",
        verificationStatus: "DEMO_VERIFIED" as const,
        journeyStage: "IN_MATCHING" as const,
      },
      preferences: {
        minAge: 25, maxAge: 35, minHeightCm: 155, maxHeightCm: 175,
        minIncome: null,
        desiredCities: ["Pune", "Mumbai", "Bangalore"],
        desiredCountries: ["India"],
        desiredMaritalStatuses: ["Never married", "Divorced"],
        preferredRelocation: "MAYBE" as Tri,
        kidsPreference: "NO" as Tri,
        petsPreference: "YES" as Tri,
        desiredValues: ["fitness", "honesty", "ambition"],
        professionPreferences: ["Technology", "Finance", "Consulting"],
      },
    },
    {
      assignedTo: staff2.id,
      profile: {
        firstName: "Anjali", lastName: "Gupta", gender: "Female",
        dateOfBirth: new Date(1997, 5, 28), country: "India", city: "Hyderabad",
        heightCm: 165, email: "anjali.gupta@example.com", phoneNumber: "+919876543214",
        undergraduateCollege: "IIM Ahmedabad", degree: "MBA",
        incomeAnnual: 2800000, incomeCurrency: "INR",
        currentCompany: "McKinsey", designation: "Consultant",
        maritalStatus: "Never married",
        languagesKnown: ["Hindi", "English", "Telugu"],
        siblings: 2, caste: "Vaishya", religion: "Hindu",
        wantKids: "YES" as Tri, openToRelocate: "YES" as Tri, openToPets: "NO" as Tri,
        values: ["ambition", "career", "tradition", "family"],
        professionCategory: "Consulting",
        verificationStatus: "DEMO_VERIFIED" as const,
        journeyStage: "PROFILE_REVIEW" as const,
      },
      preferences: {
        minAge: 28, maxAge: 35, minHeightCm: 172, maxHeightCm: 195,
        minIncome: 2000000,
        desiredCities: ["Hyderabad", "Bangalore", "Mumbai"],
        desiredCountries: ["India"],
        desiredMaritalStatuses: ["Never married"],
        preferredRelocation: "YES" as Tri,
        kidsPreference: "YES" as Tri,
        petsPreference: "NO" as Tri,
        desiredValues: ["ambition", "career", "family"],
        professionPreferences: ["Consulting", "Finance", "Technology"],
      },
    },
    {
      assignedTo: staff2.id,
      profile: {
        firstName: "Karan", lastName: "Desai", gender: "Male",
        dateOfBirth: new Date(1994, 9, 3), country: "India", city: "Ahmedabad",
        heightCm: 175, email: "karan.desai@example.com", phoneNumber: "+919876543215",
        undergraduateCollege: "NIT Trichy", degree: "B.Tech",
        incomeAnnual: 1600000, incomeCurrency: "INR",
        currentCompany: "Razorpay", designation: "Product Manager",
        maritalStatus: "Never married",
        languagesKnown: ["Hindi", "English", "Gujarati"],
        siblings: 3, caste: "General", religion: "Hindu",
        wantKids: "MAYBE" as Tri, openToRelocate: "YES" as Tri, openToPets: "MAYBE" as Tri,
        values: ["innovation", "travel", "community", "learning"],
        professionCategory: "Technology",
        verificationStatus: "DEMO_VERIFIED" as const,
        journeyStage: "AWAITING_FEEDBACK" as const,
      },
      preferences: {
        minAge: 22, maxAge: 32, minHeightCm: 150, maxHeightCm: 170,
        minIncome: null,
        desiredCities: ["Ahmedabad", "Mumbai", "Pune", "Bangalore"],
        desiredCountries: ["India"],
        desiredMaritalStatuses: ["Never married"],
        preferredRelocation: "YES" as Tri,
        kidsPreference: "MAYBE" as Tri,
        petsPreference: "MAYBE" as Tri,
        desiredValues: ["innovation", "travel", "learning"],
        professionPreferences: ["Technology", "Creative", "Business"],
      },
    },
  ];

  // Delete existing data for idempotency
  await prisma.matchSuggestionEvent.deleteMany();
  await prisma.journeyEvent.deleteMany();
  await prisma.customerNote.deleteMany();
  await prisma.partnerPreferences.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.customer.deleteMany();

  const customerIds: string[] = [];

  for (const config of customerConfigs) {
    const customer = await prisma.customer.create({
      data: {
        assignedMatchmakerId: config.assignedTo,
        ...config.profile,
      },
    });

    await prisma.partnerPreferences.create({
      data: {
        customerId: customer.id,
        ...config.preferences,
      },
    });

    customerIds.push(customer.id);
    console.log(`  ✅ Customer: ${config.profile.firstName} ${config.profile.lastName} (${config.profile.gender})`);
  }

  // ── 3. Create Sample Notes and Journey Events ─────────────────────────

  // Add notes for first customer (Asha)
  await prisma.customerNote.create({
    data: {
      customerId: customerIds[0],
      authorId: staff1.id,
      body: "Initial call with Asha. She is looking for a partner who values family and career equally. Prefers someone from Mumbai or willing to relocate. Very articulate and clear about expectations.",
      interactionType: "CALL",
    },
  });

  await prisma.customerNote.create({
    data: {
      customerId: customerIds[0],
      authorId: staff1.id,
      body: "Follow-up meeting. Discussed her preferences in detail. She is open to meeting candidates from Pune as well. Interested in someone with a tech or consulting background.",
      interactionType: "MEETING",
    },
  });

  // Add a journey event
  await prisma.journeyEvent.create({
    data: {
      customerId: customerIds[0],
      actorId: staff1.id,
      fromStage: "NEW",
      toStage: "IN_MATCHING",
    },
  });

  console.log("  ✅ Sample notes and events created");

  // ── 4. Generate 220 Candidates (110 per gender) ──────────────────────

  console.log("\n🔄 Generating 220 candidates...");

  let verifiedMale = 0;
  let verifiedFemale = 0;
  let unverifiedCount = 0;

  for (let i = 0; i < 220; i++) {
    const gender = i < 110 ? "Female" : "Male";
    const index = i < 110 ? i : i - 110;

    // First 105 per gender are verified; next 5 are unverified
    const isVerified = index < 105;
    const hasMissing = index >= 100 && index < 105; // 5 with missing fields

    if (isVerified) {
      if (gender === "Male") verifiedMale++;
      else verifiedFemale++;
    } else {
      unverifiedCount++;
    }

    const profile = generateProfile(gender, index, {
      verified: isVerified,
      missingFields: hasMissing,
    });

    // Create edge cases
    let overrides: Record<string, unknown> = {};

    // Incompatible kids preferences (indices 95–99)
    if (index >= 95 && index < 100) {
      overrides.wantKids = "NO";
    }

    // Very strong matches (indices 90–94, designed for showcase)
    if (index >= 90 && index < 95) {
      overrides.values = ["family", "career", "learning", "travel", "fitness"];
      overrides.wantKids = "YES";
      overrides.openToRelocate = "YES";
    }

    // Cross-city pairs (indices 80–89)
    if (index >= 80 && index < 90) {
      overrides.openToRelocate = "YES";
    }

    // Some MAYBE values for distribution (indices 60–79)
    if (index >= 60 && index < 80) {
      overrides.wantKids = "MAYBE";
    }

    await prisma.candidate.create({
      data: {
        ...profile,
        ...overrides,
        active: true,
        synthetic: true,
        // Add candidate preferences for mutual matching
        preferredMinAge: 23,
        preferredMaxAge: 45,
        preferredMinHeightCm: gender === "Female" ? 160 : 145,
        preferredMaxHeightCm: gender === "Female" ? 195 : 180,
        preferredMinIncome: null,
        preferredCities: pickMultiple(INDIAN_CITIES, 2, 5),
        preferredMaritalStatuses: ["Never married", "Divorced"],
        preferredRelocation: randomTri() as Tri,
        preferredKids: profile.wantKids,
      },
    });
  }

  console.log(`\n📊 Seed Summary:`);
  console.log(`  Staff accounts:     2`);
  console.log(`  Customers:          ${customerConfigs.length}`);
  console.log(`  Total candidates:   220`);
  console.log(`  Verified males:     ${verifiedMale}`);
  console.log(`  Verified females:   ${verifiedFemale}`);
  console.log(`  Unverified:         ${unverifiedCount}`);
  console.log(`  Demo password:      ${DEMO_PASSWORD}`);
  console.log(`\n✅ Seed complete!`);

  // ── 5. Assertions ─────────────────────────────────────────────────────

  const totalCandidates = await prisma.candidate.count();
  const verifiedFemales = await prisma.candidate.count({
    where: { gender: "Female", verificationStatus: "DEMO_VERIFIED", active: true },
  });
  const verifiedMales = await prisma.candidate.count({
    where: { gender: "Male", verificationStatus: "DEMO_VERIFIED", active: true },
  });

  console.log(`\n🔍 Validation:`);
  console.log(`  Total candidates: ${totalCandidates} (need ≥200)`);
  console.log(`  Verified females: ${verifiedFemales} (need ≥100)`);
  console.log(`  Verified males:   ${verifiedMales} (need ≥100)`);

  if (totalCandidates < 200) throw new Error("Not enough candidates!");
  if (verifiedFemales < 100) throw new Error("Not enough verified females!");
  if (verifiedMales < 100) throw new Error("Not enough verified males!");

  console.log("  ✅ All assertions passed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
