# TDC Matchmaker MVP — Executive Matchmaking & Intelligence Platform

> **Live Hosted Demo:** [https://tdc-matchmaker-mvp.vercel.app](https://tdc-matchmaker-mvp.vercel.app) *(or your deployed Vercel URL)*  
> **GitHub Repository:** [https://github.com/arck-knight/tdc-matchmaker-mvp](https://github.com/arck-knight/tdc-matchmaker-mvp)  
> **Tech Stack:** Next.js 16 (App Router, Turbopack) · TypeScript · React 19 · PostgreSQL · Prisma ORM · Tailwind CSS · Zod · Argon2id · OpenAI API · Vitest

---

## 1. Executive Write-Up: Matchmaking Research & Product Strategy

Modern matchmaking services occupy a fundamentally distinct space from consumer dating apps. While swipe-based apps optimize for ephemeral engagement, continuous scrolling, and immediate visual heuristics, executive matrimony and curated matchmaking services like The Daily Cup (TDC) cater to intentional individuals seeking lifelong commitment. Clients entrust matchmakers with sensitive life plans—specifically views on children, willingness to relocate, family obligations, and career trajectories—where superficial filtering fails. In our user research, the primary friction for human matchmakers is cognitive overload: managing dozens of active clients while attempting to evaluate hundreds of synthetic and verified candidate profiles across 20+ multidimensional biodata attributes.

To resolve this, our MVP implements a **deterministic, explainable matchmaking engine** coupled with an **audited journey management system**. Instead of hiding candidate selection behind opaque neural embeddings, our platform makes every match computation transparent by presenting the top 3 alignment strengths and explicit tradeoffs (e.g. city differences or relocation compromises). Matchmakers can review verified candidates, customize an AI-drafted introduction email with strict length and tone bounds, and record mock introductions in a single seamless workflow.

Security, confidentiality, and ethical alignment form the core architectural foundation. Customer ownership is strictly scoped at the database level to prevent Insecure Direct Object References (IDOR), ensuring Matchmaker A cannot inspect or modify Matchmaker B's portfolio. Crucially, sensitive cultural fields such as caste and religion are stored strictly for client demographic completeness but are mathematically excluded from scoring calculations and completely scrubbed from server-side LLM prompts.

---

## 2. Sample Demo Login Credentials

The seed database provisions two staff matchmakers with pre-assigned demo clients:

| Role | Matchmaker Name | Username | Password | Assigned Demo Clients |
| :--- | :--- | :--- | :--- | :--- |
| **Matchmaker** | **Priya Sharma** | `priya.matchmaker` | `demo123` | Asha Mehta, Rohan Kapoor, Meera Nair |
| **Matchmaker** | **Rahul Verma** | `rahul.matchmaker` | `demo123` | Vikram Singh, Anjali Gupta, Karan Desai |

*Note: The login screen includes 1-click demo login buttons to instantly populate credentials for either matchmaker.*

---

## 3. Key Features & PDF Requirements Coverage

### A. Authentication & Scoped Dashboard (R01, R02)
- **Argon2id Password Hashing:** Credentials validated against cryptographically secure hashes with constant-time verification.
- **HMAC-SHA256 Signed Session Cookies:** Stateless, serverless-ready session tokens that survive lambda restarts and server reloads.
- **Strict IDOR Ownership Scoping:** Every server endpoint (`/api/customers`, `/api/customers/[id]`, `/api/customers/[id]/stage`, `/api/customers/[id]/notes`, `/api/customers/[id]/matches`) validates that the requesting staff member owns the target customer.
- **Portfolio Metrics & Search:** Real-time KPI summary tiles (Total Assigned, Active in Pipeline, Awaiting Feedback, Matched) with full-text search and filters for journey stage, city, and verification status.

### B. Complete Biodata Inspection (R03)
- Renders **every single biodata field** specified in the assignment PDF:
  - First Name, Last Name, Gender, Date of Birth, Age, Country, City, Height (formatted in cm and ft/in).
  - Undergraduate College, Degree, Annual Income (with currency formatting), Current Company, Designation, Profession Category.
  - Marital Status, Languages Known (tags), Siblings Count.
  - Sensitive Attributes: Caste and Religion (presented neutrally; labeled unranked).
  - Lifestyle Choices: Want Children (`YES`/`NO`/`MAYBE`), Open to Relocation (`YES`/`NO`/`MAYBE`), Comfortable with Pets (`YES`/`NO`/`MAYBE`), Core Life Values.
- Absent values display an elegant *"Not provided"* badge rather than breaking layout or hiding fields. Contact details (email/phone) are restricted to authorized matchmakers.

### C. Journey Stage Tracking & Interaction Notes (R04, R06)
- **9 Journey Stages:** `NEW` → `PROFILE_REVIEW` → `VERIFIED` → `IN_MATCHING` → `MATCH_SENT` → `AWAITING_FEEDBACK` → `MATCHED` → `ON_HOLD` → `CLOSED`.
- **Instant Stage Mutations:** Matchmakers can transition client stages directly from the profile header; transitions automatically record an audit entry in `JourneyEvent`.
- **Interaction Notes Composer:** Dedicated input for recording Call, Meeting, or General notes up to 2,000 characters with live character counter. Saved notes are prepended to the activity feed with author and timestamp.

### D. Deterministic Matching Engine (R05)
- **220 Synthetic Candidates:** Deterministically seeded with 105 verified males and 105 verified females ensuring ≥100 eligible opposite-gender candidates per customer.
- **Pure Mathematical Feature Functions:** Evaluates 9 compatibility dimensions:
  - Children Stance (Weight: 25) — 3×3 matrix with neutral handling for `MAYBE`.
  - Relocation Feasibility (Weight: 20) — Same city vs open relocation vs incompatible stances.
  - Core Values Overlap (Weight: 15) — Jaccard set similarity over normalized value sets.
  - Age Range Fit (Weight: 10) — Continuous trapezoidal tolerance curve.
  - Profession Fit (Weight: 10) — Exact and categorical alignment.
  - Marital Status Fit (Weight: 8) — Preference array containment.
  - Height Range Fit (Weight: 5) — Centimeter tolerance matching.
  - Income Fit (Weight: 4) — Same-currency threshold check.
  - Pets Compatibility (Weight: 3) — Tristate pet compatibility.
- **Score Normalization:** Total score scaled to `[0, 100]` with confidence coverage rating and categorized badges (`High Potential`, `Promising`, `Worth Reviewing`, `Low Alignment`).
- **Explainability:** Extracts top 3 positive alignment reasons and top 2 tradeoffs per candidate.

### E. AI Introduction Drafting & Mock Send Flow
- **Server-Side OpenAI Integration:** Generates concise, respectful introduction drafts using `gpt-4o-mini`.
- **Strict Data Minimization:** Caste, religion, exact salary, and internal notes are **never** included in LLM prompts.
- **Safe Fallback:** If `OPENAI_API_KEY` is absent or times out (10s threshold), the system automatically generates a deterministic template draft matching the ≤120 words rule.
- **Mock Send Protection:** Clear warning badge (`"MOCK SEND MODE ONLY — No real email will be sent"`). Prevents duplicate sends with HTTP 409 Conflict, freezes scoring snapshot, records event in `MatchSuggestionEvent`, and advances journey stage to `MATCH_SENT`.

---

## 4. Deterministic Scoring Matrix & Rules

```text
┌───────────────────────────┬────────┬──────────────────────────────────────────┐
│ Feature Dimension         │ Weight │ Description & Computation                │
├───────────────────────────┼────────┼──────────────────────────────────────────┤
│ Children Stance           │   25   │ YES×YES=1.0, NO×NO=1.0, YES×NO=0.0       │
│                           │        │ Any MAYBE = 0.5 (neutral + lower conf)   │
├───────────────────────────┼────────┼──────────────────────────────────────────┤
│ Relocation Feasibility    │   20   │ Same city = 1.0; cross-city with YES=0.8 │
│                           │        │ Cross-city both NO = 0.0                 │
├───────────────────────────┼────────┼──────────────────────────────────────────┤
│ Core Values Overlap       │   15   │ Jaccard index: |A ∩ B| / |A ∪ B|         │
├───────────────────────────┼────────┼──────────────────────────────────────────┤
│ Age Fit                   │   10   │ 1.0 inside preferred range; smooth decay │
├───────────────────────────┼────────┼──────────────────────────────────────────┤
│ Profession Fit            │   10   │ Explicit preferred category = 1.0        │
├───────────────────────────┼────────┼──────────────────────────────────────────┤
│ Marital Status            │    8   │ Target marital status in desired array   │
├───────────────────────────┼────────┼──────────────────────────────────────────┤
│ Height Range              │    5   │ Centimeter tolerance fit                 │
├───────────────────────────┼────────┼──────────────────────────────────────────┤
│ Income Fit                │    4   │ Candidate income ≥ client min preferred  │
├───────────────────────────┼────────┼──────────────────────────────────────────┤
│ Pets Compatibility        │    3   │ Tristate pet alignment                   │
└───────────────────────────┴────────┴──────────────────────────────────────────┘
```

---

## 5. Local Setup & Quick Start

### Prerequisites
- Node.js ≥ 20.x
- PostgreSQL database (or local PostgreSQL socket on port 5432)

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/arck-knight/tdc-matchmaker-mvp.git
   cd tdc-matchmaker-mvp
   ```

2. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the project root:
   ```env
   DATABASE_URL="postgresql://postgres@localhost:5432/matchmaker_mvp?schema=public"
   AUTH_SECRET="your-32-byte-random-secret-key-for-session-signing"
   OPENAI_API_KEY="" # Optional; fallback template activates when empty
   DEMO_MODE="true"
   ```

4. **Initialize Database & Seed Data:**
   ```bash
   npx prisma db push
   npm run db:seed
   ```
   *The seed generates 2 staff accounts, 6 assigned demo customers, and 220 synthetic opposite-gender candidates with deterministic faker seed `20261015`.*

5. **Run the Test Suite:**
   ```bash
   npm run test
   ```
   *Executes all 68 unit, integration, and security tests.*

6. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) and sign in using `priya.matchmaker` / `demo123`.

---

## 6. Testing & Quality Gates

The test suite covers every layer of the application:

```bash
 ✓ tests/unit/format.test.ts      (15 tests) — age, height, income, initials, stage labels
 ✓ tests/unit/features.test.ts    (41 tests) — 3×3 tristate matrix, Jaccard overlap, relocation
 ✓ tests/unit/score.test.ts       (4 tests)  — deterministic scoring order, reasons, tradeoffs
 ✓ tests/unit/draft.test.ts       (3 tests)  — 120-word cap, fallback template, zero-leakage
 ✓ tests/unit/ownership.test.ts   (1 test)   — IDOR prevention and matchmaker-scoped queries
 ✓ tests/unit/api.test.ts         (4 tests)  — login, session cookies, unauthenticated 401s

 Test Files  6 passed (6)
      Tests  68 passed (68)
```

Run TypeScript compilation check:
```bash
npm run typecheck # 0 errors
```

Run Production Build:
```bash
npm run build     # Compiles all static and dynamic routes cleanly
```

---

## 7. Security & Ethics Guardrails Summary

1. **Anti-Bias Guarantee:** Caste and religion are **never** weighted or utilized in the scoring engine. They are stripped prior to passing any data to LLMs.
2. **Data Minimization:** Introduction drafts contain only verified strengths and non-sensitive career/city metadata. Salary and internal contact numbers are redacted.
3. **Auditability:** Every stage transition, interaction note, and mock suggestion is recorded with the active matchmaker's identity and timestamp.
4. **Mock Protection:** Email sending is exclusively mocked with clear UI notifications and database safety flags, ensuring no accidental emails are dispatched to real people.
