# TDC Matchmaker Dashboard & Matching Engine — End-to-End Implementation Blueprint

> **Status:** implementation-ready plan · **Source:** *Working Session Exercise — Build the Matchmaker Algo and Dashboard MVP* (3-page assignment PDF) · **Priority:** ship a working hosted MVP before optional polish.
>
> **Interpretation:** Sections marked **[PDF]** are explicitly requested in the assignment; **[DESIGN]** are implementation decisions; **[RESEARCH/VALIDATE]** are suggested hypotheses to check against real matchmaking practice. No live research or vendor documentation was independently verified for this plan; links below are official starting points, not evidence of user-behavior claims.

## 0. Executive brief and non-negotiable definition of done

Build an **internal, authenticated matchmaker workbench** where a staff member logs in, sees only their assigned customers, opens comprehensive verified biodata, updates each person's journey stage, records timestamped call notes, reviews ranked opposite-gender mock candidates, and clicks **Send Match** to generate a visible mock email and persistent send record. The system must include **at least 100 synthetic candidate profiles**, explainable matching rules, and **at least one genuinely AI-powered feature** (not merely a hardcoded label). Deploy a publicly accessible demonstration with sample login credentials, publish the code, and supply a short explanation of technology, algorithm, AI, and assumptions. [PDF, pp. 1–3]

**Submission-critical:** live hosted URL; GitHub repository; demo login; 2–3-paragraph write-up; send to `tech@thedatecrew.com` with subject `Full Stack Developer Internship - [Your Name] - Assignment`. [PDF, pp. 2–3]

**Definition of done:** a reviewer with no local setup can open the live URL, log in, navigate 3 seeded customers, see full profile data, change journey stage, add a note, compare ≥5 ranked suggestions with transparent reasons, trigger a simulated match-send, refresh and still see saved actions, and inspect code and tests. Candidate pool must contain ≥100 valid synthetic opposite-gender profiles. The AI feature must work when configured and degrade gracefully when the API is unavailable.

## 1. Requirement traceability (source of truth)

| ID | PDF requirement | Implementation | Acceptance evidence |
|---|---|---|---|
| R01 | Username/password login | Auth screen + secure server session | Invalid login rejected; valid login routes to dashboard |
| R02 | Customers assigned to matchmaker | Scoped `/dashboard` list | Two demo staff accounts see different customer sets |
| R03 | Name, age, city, marital status, status tag | List columns/cards | All present, responsive, age calculated from DOB |
| R04 | Customer detailed view | `/customers/[id]` | All PDF biodata fields rendered |
| R05 | Verified profiles | `verificationStatus` + badge | Unverified profiles visibly flagged/excluded by default |
| R06 | Track customer journey | Stage dropdown + event history | Change persists and audit record created |
| R07 | Quick meeting/call notes | Timestamped note composer/list | Add note, refresh, note remains |
| R08 | ≥100 opposite-gender dummy profiles | Seed 120 candidates (60 women, 60 men) | Seed validation confirms totals and no real PII |
| R09 | Male-customer matching: younger, lower income, shorter, children alignment | Configurable, **non-exclusionary** preference features with opt-in | Feature scores and exceptions shown; no blanket demographic exclusion |
| R10 | Female-customer matching: profession, values, relocation etc. | Same transparent compatibility framework + profile preferences | Reasons reflect compatibility, not stereotyped assumptions |
| R11 | Research dating/matrimonial practices | Research checklist + assumption log | Notes on market practices, tradeoffs, validation questions |
| R12 | AI in ≥1 approved mode | OpenAI-generated personalized intro drafts, with safe fallback | API-produced draft visible; mock/send never relies on AI correctness |
| R13 | “Send Match” per suggestion | Button, confirmation, mock email preview/toast | Persistent send event includes candidate summary |
| R14 | Flexible frontend/backend/data/hosting | Next.js + TypeScript + Postgres + Vercel | Deployed app and README setup |
| R15 | Clean UX, readable code, ownership | Components, tests, accessibility, demo walkthrough | Reviewer checklist and CI pass |

**Source nuance:** The assignment explicitly prescribes gender-specific comparisons for male customers, but these are **exercise assumptions**, not universal truths about users. Implement them as explainable, **user-consented, adjustable soft preferences** and document the departure from mandatory blanket filtering. Preserve the exact requested logic in tests and examples while avoiding discriminatory exclusion in a real product. Do not infer preferences solely from gender. A genuine deployment needs product/legal review for sensitive data (caste, religion, income, contact information).

## 2. Product boundaries and release strategy

### MVP IN
1. Staff-only authentication; matchmaker-scoped authorization.
2. Assigned-customer dashboard, search, filters, sorting, journey stages.
3. Complete biodata with verification indicators; optional partner preferences.
4. Notes, stage transitions, activity timeline.
5. Synthetic opposite-gender candidate pool, deterministic ranking, explanations.
6. AI-generated introduction **draft** (review before simulated send).
7. Mock-send modal, preview, activity record, success/error toast.
8. Hosted demo, reproducible seeds, automated tests, README, credentials, submission.

### MVP OUT
Real emails/SMS, payments, customer self-service, chat, photo recognition, embeddings/vector DB, autonomous outreach, scraping, identity verification vendor, production matching marketplace, multi-tenant billing, production analytics, and training custom ML models. Avoid these until the core path works.

### Working assumptions requiring confirmation
- “Assigned customers” refers to customers owned by a logged-in matchmaker, not all candidates.
- Demo supports women and men as customer genders because the PDF specifies these two matching cases; data model should not hardcode that as the only possible real-world gender identity.
- Pool is synthetic and demonstrative, not an authentic customer database.
- A match is an **internal suggestion** until a matchmaker clicks Send Match; simulated delivery is clearly labeled.
- Candidate verification is synthetic demo metadata, not an actual verified identity claim.
- AI generates wording only; numerical rank is deterministic, inspectable, and testable.

## 3. User journeys and screens

### Flow A: Matchmaker login
`/login` → validate credentials server-side → set HTTP-only secure session → redirect `/dashboard`. Error: “Invalid credentials,” no account enumeration. Add logout in top-right. Protect all server actions/API routes, not just pages.

### Flow B: Customer worklist
`/dashboard`: top header (logo, logged-in staff, logout); summary tiles (Assigned, Active, Awaiting Feedback, Matched); searchable table: full name, computed age, city, marital status, journey tag, verification. Filters: stage, city, verification; sorting by recently updated/name; row opens detail. Mobile layout uses cards. Empty/error/loading states included.

### Flow C: Customer detail
`/customers/[id]`: breadcrumb; hero (name, age, city, stage, verified flag); tabs or sections: **Biodata**, **Preferences**, **Suggested Matches**, **Notes & Timeline**. Biodata MUST display first name, last name, gender, DOB, country, city, height, email, phone, undergraduate college, degree, income, current company, designation, marital status, languages, siblings, caste, religion, want kids, open to relocate, open to pets. Show `Not provided` rather than hiding missing fields. Contact details visible only to authorized staff.

### Flow D: Stage update + note
Select stage; save; timeline event contains old/new stage, actor, timestamp. Enter meeting/call note (up to 2,000 chars), save, show newest first. Do not overwrite previous notes. Guard empty notes and display clear success/errors.

### Flow E: Suggestions → AI intro → mock send
Customer detail → `Find Matches` → deterministic eligible pool → score and rank → candidate cards with name, age, city, height, job, children preference, total score, 3 strongest reasons, 1–2 tradeoffs → `Draft Intro with AI` (optional) → review/edit draft → `Send Match` → confirmation modal shows customer/candidate and email preview → `Confirm Mock Send` → create event and toast `Mock email recorded — no real email sent`. Disable duplicate sends or mark already sent.

### Wireframe (desktop)
```text
┌──────────────────────────────────────────────────────────────────────────┐
│ TDC Matchmaker                              Search...      Staff | Exit  │
├──────────────────────────────────────────────────────────────────────────┤
│ Assigned Customers       Active 12   Awaiting 4   Matched 3              │
│ [Search] [Stage ▼] [City ▼] [Verified ▼]                              │
│ Name              Age  City       Marital status     Journey             │
│ Asha Mehta         28   Mumbai     Never married      In Matching   >     │
├──────────────────────────────────────────────────────────────────────────┤
│ Customer > Asha Mehta           [Verified (demo)] [Stage: In Matching ▼] │
│ [Biodata] [Preferences] [Suggested Matches] [Notes & Timeline]           │
│ Suggestion #1  Arjun Shah   88/100   [Why this match?] [Draft AI Intro]  │
│ Reasons: kids aligned · compatible relocation · shared values           │
│ Tradeoff: different cities                     [Send Match]             │
└──────────────────────────────────────────────────────────────────────────┘
```

## 4. Technology choices and architectural decision record

**Recommended stack:** Next.js App Router + React + TypeScript; Tailwind CSS + shadcn/ui components; PostgreSQL via Prisma ORM; Zod validation; Auth.js credentials or a small audited authentication implementation using Argon2id and server-side sessions; OpenAI API on server only; Vitest for unit/integration; Playwright for E2E; Vercel hosting + managed PostgreSQL. This is a **recommendation**, not a PDF mandate.

**Why:** one TypeScript codebase minimizes intern coordination, relational tables naturally capture assignment and send history, deterministic scoring is easy to test, and Vercel supports simple deployment. For a strict 1–2 day time box, Supabase Auth + Postgres is a viable alternative, but do not mix both architectures halfway through.

**System diagram**
```text
Browser (Next.js UI)
  └── HTTPS → Next.js server routes/actions (session + RBAC + Zod)
                 ├── Prisma → PostgreSQL (customers, candidates, notes, sends)
                 ├── Pure matching engine (no DB/LLM calls)
                 └── AI adapter → OpenAI (server key; redacted fields)
```

**Official implementation references:** [Next.js App Router](https://nextjs.org/docs/app), [Next.js deployment](https://nextjs.org/docs/app/getting-started/deploying), [TypeScript](https://www.typescriptlang.org/docs/), [Prisma](https://www.prisma.io/docs), [PostgreSQL](https://www.postgresql.org/docs/), [Zod](https://zod.dev/), [Tailwind](https://tailwindcss.com/docs), [shadcn/ui](https://ui.shadcn.com/docs), [Auth.js](https://authjs.dev/), [OpenAI API](https://platform.openai.com/docs/overview), [Vitest](https://vitest.dev/guide/), [Playwright](https://playwright.dev/docs/intro), [Vercel](https://vercel.com/docs).

## 5. Data modeling: implement before UI

### Relational entities
- `Matchmaker`: id UUID, username unique, displayName, passwordHash, role (`MATCHMAKER`/`ADMIN`), createdAt.
- `Customer`: id, assignedMatchmakerId FK, profile fields below, verificationStatus, journeyStage, createdAt, updatedAt.
- `Candidate`: id, profile fields below, verificationStatus, active, synthetic=true, createdAt.
- `PartnerPreferences`: id, customerId unique, min/maxAge nullable, min/maxHeightCm nullable, minIncome nullable, desiredCities text[], desiredCountries text[], desiredMaritalStatuses text[], preferredRelocation (`YES/NO/MAYBE/ANY`), kidsPreference, petsPreference, desiredValues text[], professionPreferences text[], strictConstraints JSON optional; all preference fields user-entered, not inferred.
- `CustomerNote`: id, customerId FK, authorId FK, body, interactionType (`CALL/MEETING/OTHER`), createdAt.
- `JourneyEvent`: id, customerId FK, actorId FK, fromStage, toStage, createdAt.
- `MatchSuggestionEvent`: id, customerId FK, candidateId FK, actorId FK, scoreSnapshot JSON, introDraft nullable, channel=`MOCK_EMAIL`, status=`MOCK_SENT`, createdAt; unique `(customerId,candidateId,channel)` if duplicate sends are disallowed.
- Optional `AuditEvent`: actor, action, entity, entityId, sanitized metadata, timestamp.

### Exact biodata field specification
| Field | Storage / validation | Display |
|---|---|---|
| firstName, lastName | nonempty trimmed strings | full name |
| gender | enum/string, do not guess | label |
| dateOfBirth | date; must be adult (18+) | date + derived age |
| country, city | nonempty strings | locality |
| heightCm | integer, plausible 120–230 | cm / optional ft-in |
| email, phoneNumber | validated; synthetic only in seed | staff-only |
| undergraduateCollege, degree | strings nullable | education |
| incomeAnnual, incomeCurrency | nonnegative integer + ISO currency | e.g. ₹18 LPA; comparable only after normalization |
| currentCompany, designation | strings nullable | employment |
| maritalStatus | enum/string | badge |
| languagesKnown | string[] | chips |
| siblings | integer nullable or text details | count/description |
| caste, religion | optional sensitive strings | privacy-protected; never ranking by default |
| wantKids, openToRelocate, openToPets | `YES/NO/MAYBE` | three-state badge |
| values | optional string[] (added) | compatibility |
| professionCategory | optional enum/string (added) | profession similarity |
| verificationStatus | `DEMO_VERIFIED/UNVERIFIED` | explicit demo badge |
| journeyStage | enum | progress tag |

**Important:** `MAYBE` is neither `YES` nor `NO`; avoid implicit Boolean coercion. Currency values require comparable units: for MVP seed everyone with `INR` annual income, and reject/omit cross-currency income comparisons until exchange-rate conversion is implemented. Age is calculated at runtime, not stored.

### Journey stages
`NEW → PROFILE_REVIEW → VERIFIED → IN_MATCHING → MATCH_SENT → AWAITING_FEEDBACK → MATCHED` plus `ON_HOLD` and `CLOSED`. Permit legitimate backtracking and audit every change; don't force an irreversible linear state machine. Example validation: only a verified customer may enter `IN_MATCHING`; only authorized matchmakers may update stages.

### Data constraints and indexes
Index `Customer(assignedMatchmakerId,journeyStage)`, `Candidate(gender,active,verificationStatus)`, `CustomerNote(customerId,createdAt DESC)`, `MatchSuggestionEvent(customerId,candidateId)`. Foreign keys restrict dangling records. Soft-delete/archive customers rather than silently deleting activity. DB migration checked into repository.

## 6. Synthetic seed-data plan

Generate **120 opposite-gender candidates total: 60 women and 60 men**, plus 6 assigned customers (3 women, 3 men) split across 2 staff accounts. This ensures ≥100 candidates in the aggregate pool and ≥60 opposite-gender candidates for each demo customer. **Potential ambiguity:** the PDF could be interpreted as ≥100 opposite-gender candidates *per customer*. To be unambiguously safe, generate **200 candidates (100 women + 100 men)** instead; this is the recommended final seed target.

Use deterministic pseudorandom generator seed `20261015` with `@faker-js/faker` (India locale where supported), curated Indian city list, culturally varied synthetic names, realistic profession/education combinations, adult ages 23–45, incomes 4–80 LPA, heights 145–195 cm, meaningful distribution of `YES/NO/MAYBE` preferences, and some intentional edge cases. Use `example.com` addresses, `+91`-style fictional non-dialable placeholders (or null phone) and no actual people's contact details. **Do not scrape real matrimonial profiles.** Seed should be repeatable/idempotent using stable IDs or upsert.

**Distribution targets:** at least 20 `MAYBE` values across kids/relocation/pets; 15 cross-city pairs; 10 same-city pairs; 10 income/height/age edge cases; 10 unverified candidates (excluded from default suggestions); 5 missing optional values; 5 incompatible kids preferences; 5 very strong matches. Assert at least 100 eligible opposite-gender candidates for each of the six customer profiles if you adopt the strict 200-person interpretation **before** excluding unverified entries; to preserve ≥100 eligible per gender after verification filtering, seed **220 (110 per gender)** with at least 100 verified per gender.

**Recommendation:** seed **220 candidates, 110 per gender, at least 105 verified per gender**; tests assert each demo customer has ≥100 verified opposite-gender candidates before preference filters. This exceeds the assignment minimum and removes ambiguity at minimal cost.

## 7. Matching engine: transparent deterministic baseline

### 7.1 Design principles
1. Hard filters only for safety and explicit **mutual** dealbreakers; never secretly discard someone based on demographic stereotypes.
2. Rank with **mutual compatibility** (customer → candidate and candidate → customer where preference data exists), not one-sided desirability.
3. Handle missing data neutrally, reduce confidence, and show “information missing”; never silently treat missing as agreement.
4. Make scores reproducible and inspectable. The LLM does **not** decide eligibility or numerical scores.
5. Treat gender-specific examples in the PDF as **configurable preference signals**, not inherent gender rules; demonstrate requested age/income/height comparison for consenting male-customer example profiles, and profession/values/relocation for female-customer examples.
6. Do not use caste/religion as implicit ranking inputs; these are sensitive and require explicit policy, consent and review if ever supported.

### 7.2 Candidate generation / eligibility
For customer `u`, pool candidate `v` if:
- `v.active && v.verificationStatus == DEMO_VERIFIED`;
- `u.id != v.id` and no previously rejected/blocked pairing;
- `v.gender` is in `u.partnerGenderPreferences` (explicit, default seeded according to PDF's opposite-gender demo), and `u.gender` is in candidate's preferences when known;
- both adults; optionally apply explicit dealbreakers (e.g. no relocation and cities differ **only if** living in same city is explicitly mandatory).

Do **not** use `income <`, `height <`, or `age <` as automatic hard exclusions. Report candidate count before and after filtering to explain coverage.

### 7.3 Feature-level scoring
All feature functions return `{score: 0..1, confidence: 0..1, reason, tradeoff}`. Weight only present/meaningful features; neutral unknown value = 0.5, confidence=0.25. Suggested weights (sum 100):

| Feature | Weight | Example rule |
|---|---:|---|
| Children alignment | 22 | YES↔YES or NO↔NO = 1; MAYBE with either = 0.65; YES↔NO = 0 |
| Values overlap | 18 | Jaccard overlap for normalized user-provided values; no values → neutral |
| Relocation/city feasibility | 16 | same city = 1; cross-city if either willing = 0.75; both NO = 0.1 |
| Age preference fit | 12 | within explicitly preferred range = 1; decay with distance; default neutral |
| Profession/lifestyle fit | 10 | category compatibility or shared work-style preferences; avoid job prestige rankings |
| Marital-status preference fit | 8 | stated acceptable statuses = 1; unknown = neutral |
| Height preference fit | 5 | within explicitly preferred range = 1; otherwise gradual decay |
| Income preference fit | 5 | within explicit range = 1; otherwise gradual decay; INR annual only |
| Pets alignment | 4 | YES/NO/MAYBE matrix analogous to kids, lower weight |

**Formula:** `rawScore = Σ(w_i × s_i) / Σ(w_i)`, `displayScore = round(100 × rawScore)`. Track `coverage = Σ(w_i × confidence_i) / Σ(w_i)` separately and label Low/Medium/High confidence; **do not** inflate a score by dropping missing low-scoring features. Optional penalty for explicit mismatch is already encoded by low feature scores. Display top positive and negative feature contributions; do not show a fabricated “AI certainty” percentage.

**Important calibration:** weights are MVP hypotheses; not statistically validated relationship predictors. Add unit tests and later solicit matchmaker feedback before interpreting rank as effectiveness.

### 7.4 Explicit PDF demo logic, implemented without universalizing it
For a seeded **male** customer who has explicitly selected preferences for younger partner, lower income, shorter height and same views on children:
- `ageGap = age(u) - age(v)`; positive means candidate younger. Age feature gives 1 if within the user's preferred age range; if opted into younger preference, give up to 1 for positive gap, smoothly decay around equality, never blanket exclude older candidates.
- `incomeGap = incomeAnnual(u) - incomeAnnual(v)`; positive means candidate earns less. Apply only with explicit income preference and comparable currency; low feature weight (5).
- `heightGap = heightCm(u) - heightCm(v)`; positive means candidate shorter. Apply only with explicit height preference; low feature weight (5).
- Children preference compatibility is a high-weight signal for **all** customers.

For a seeded **female** customer: use explicit profession preferences, values overlap, relocation willingness and city compatibility as demonstrative primary reasons. Use the **same general scoring function for all genders**; profile preferences control which features are meaningful. This both demonstrates the exercise and avoids implementing gender as a proxy for user intent.

### 7.5 Concrete feature functions
```ts
type Tri = 'YES' | 'NO' | 'MAYBE';
type Feature = { score: number; confidence: number; reason: string; tradeoff?: string };
const weights = { kids:22, values:18, relocation:16, age:12,
  profession:10, marital:8, height:5, income:5, pets:4 } as const;

function triCompatibility(a?: Tri, b?: Tri): Feature {
  if (!a || !b) return { score:0.5, confidence:0.25, reason:'Preference not provided' };
  if (a === b) return { score:1, confidence:1, reason:'Preferences align' };
  if (a === 'MAYBE' || b === 'MAYBE')
    return { score:0.65, confidence:1, reason:'One person is flexible' };
  return { score:0, confidence:1, reason:'Different preferences', tradeoff:'Discuss this difference' };
}
function overlap(a?: string[], b?: string[]): Feature {
  if (!a?.length || !b?.length)
    return {score:0.5,confidence:0.25,reason:'Values not fully specified'};
  const A = new Set(a.map(x=>x.trim().toLowerCase()));
  const B = new Set(b.map(x=>x.trim().toLowerCase()));
  const intersection = [...A].filter(x=>B.has(x)).length;
  return {score:intersection/new Set([...A,...B]).size,confidence:1,
    reason:`${intersection} shared values`};
}
function rank(features: Record<keyof typeof weights, Feature>) {
  const keys = Object.keys(weights) as (keyof typeof weights)[];
  const totalWeight = keys.reduce((sum,k)=>sum+weights[k],0);
  const score = Math.round(100*keys.reduce((sum,k)=>sum+weights[k]*features[k].score,0)/totalWeight);
  const coverage = keys.reduce((sum,k)=>sum+weights[k]*features[k].confidence,0)/totalWeight;
  return {score, coverage, reasons: keys.map(k=>({key:k,weight:weights[k],...features[k]}))};
}
```

**Numeric preference fit:** For range `[min,max]`, score 1 within range; otherwise `max(0, 1 - distanceToRange / tolerance)` with age tolerance 8 years, height tolerance 20 cm, income tolerance ₹20 LPA (only if preference is explicit). These are tunable demo parameters, not scientifically validated values. If no range, score 0.5 and confidence 0.25. For reciprocal preferences, compute both directional scores and use `0.5 × (A→B + B→A)` where both exist; if candidate-side preferences are absent, mark confidence accordingly.

### 7.6 Ranking procedure and complexity
```text
getSuggestions(customerId, limit=20):
  authenticate user and authorize ownership of customerId
  fetch customer + explicit preferences
  fetch active verified candidates of compatible genders
  exclude blocked/previously rejected candidates
  for candidate in candidates:
    features = evaluateFeatures(customer, candidate)
    ranked = weightedScore(features)
    build explanation from actual highest contributions and strongest tradeoffs
  stable sort by score descending, coverage descending, candidateId ascending
  return top limit with reason codes and metadata
```
For N candidates and F=9 features, scoring O(NF), sorting O(N log N), memory O(N). With 220 candidates this is trivial. At scale, prefilter in SQL and paginate/calculate cached scores with invalidation on profile/preference updates; do not prematurely add vector infrastructure.

### 7.7 Score labels and transparency
`85–100 High potential`, `70–84 Promising`, `50–69 Worth reviewing`, `<50 Low alignment`; label thresholds are product conventions, not empirical relationship-success probabilities. Show reason chips tied to computed features; show coverage/confidence separately; never claim a “guaranteed match.”

### 7.8 Worked example
Customer: 30 years old, 175 cm, ₹24 LPA, wants kids YES, relocation MAYBE, values `family, learning`; candidate: 28, 165 cm, ₹16 LPA, kids YES, relocation YES, values `family, learning`. If customer has explicitly selected younger/shorter/lower-income preferences, those features can score 1. Profession/marital/pets depend on actual data; do not invent their compatibility. Illustrative feature scores `[kids 1, values 1, relocation .75, age 1, profession .5, marital 1, height 1, income 1, pets .5]` give `(22+18+12+12+5+8+5+5+2)/100 = 89`. Explanations: “Aligned on children,” “Two shared values,” “Open to relocation”; tradeoff: “Different cities; confirm logistics.” The 89 is illustrative, not a model prediction.

## 8. AI feature: personalized introduction drafting (mandatory requirement)

**Chosen AI capability:** use an LLM to create a short **editable introduction draft** for a suggested pair, based solely on authorized, non-sensitive, minimized facts and deterministic compatibility reasons. This satisfies the PDF's mandatory AI use without allowing a model to make opaque ranking decisions.

### Safe server-side pipeline
1. User selects candidate and clicks `Draft Intro with AI`.
2. Server validates session, ownership, candidate eligibility, and rate limit.
3. Server computes canonical compatibility; **never accept client-submitted scores/reasons as truth**.
4. Construct minimal payload: first names, approximate age (optional), city, profession category, shared values, kids/relocation alignment **only if permitted for sharing**; exclude email, phone, income, caste, religion, exact DOB, internal notes, and verification documents.
5. Call OpenAI server-side using env `OPENAI_API_KEY`, bounded output length, explicit instructions not to fabricate, and structured JSON output when supported.
6. Validate JSON via Zod, cap 120 words, sanitize output, show editable preview with `AI draft — review before sending`.
7. On timeout/rate-limit/API failure, generate a deterministic template and show `Template fallback` badge. Log only request ID, duration, success/failure, no PII.
8. Mock-send saves the **reviewed final text** and profile summary; it does not actually contact anyone.

**Prompt contract:**
```text
SYSTEM: You draft respectful, concise matchmaking introduction emails for an internal
matchmaker. Use ONLY supplied facts. Never invent achievements, personality traits,
compatibility guarantees, or consent. Avoid caste/religion, salary, personal contact,
internal notes, and exact birth dates. Keep it warm and neutral. Return JSON:
{"subject": string, "body": string}. Maximum 120 words in body.
USER: {"customerFirstName":"...", "candidateFirstName":"...",
       "candidateCity":"...", "candidateProfession":"...",
       "verifiedReasons":["..."], "approvedForSharing":["..."]}
```

**Suggested draft example:** “Subject: Potential introduction — Asha and Arjun. Hi Asha, I wanted to share Arjun's profile for your consideration. You both expressed interest in building a family and share an interest in learning. Arjun is based in Pune and is open to discussing relocation. Please review his profile and let us know whether you'd like to explore an introduction.” Do not assert candidate consent unless recorded.

**API details:** follow [OpenAI API overview](https://platform.openai.com/docs/overview), [Responses API](https://platform.openai.com/docs/api-reference/responses), [structured outputs](https://platform.openai.com/docs/guides/structured-outputs), [API key safety](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety), [usage and pricing](https://openai.com/api/pricing/). Select a currently supported low-cost model at implementation time; model availability/pricing changes. Set low max output tokens, 8–12s timeout, concurrency and per-user quota; no model call on every list render.

### AI evaluation rubric
Test 20 fixed input pairs: 0 fabricated details; 0 sensitive fields leaked; all drafts ≤120 words; all include at least one real reason; reasonable tone; graceful fallback on 429/500/timeout; prompts cannot be overridden by profile text (“ignore instructions”). AI drafts must be labeled as suggestions and reviewed by staff.

## 9. API / server-action contracts

| Method | Endpoint | Input | Output | Security |
|---|---|---|---|---|
| POST | `/api/auth/login` (or Auth.js equivalent) | username/password | session | rate-limit; no plaintext password storage |
| POST | `/api/auth/logout` | none | success | CSRF/session handling |
| GET | `/api/customers` | page, query, stage, city | scoped list | matchmaker ownership enforced in DB query |
| GET | `/api/customers/:id` | path id | customer + preferences | 404 if not owned (avoid existence leak) |
| PATCH | `/api/customers/:id/stage` | `{stage}` | updated stage + event | Zod + ownership + transaction |
| GET/POST | `/api/customers/:id/notes` | `{body,interactionType}` | notes/new note | ownership; length cap |
| GET | `/api/customers/:id/matches` | `limit`, `cursor` optional | ranked candidate cards | scoped; server-side ranking |
| POST | `/api/customers/:id/matches/:candidateId/draft` | none | `{subject,body,source}` | rate-limit; no sensitive payload |
| POST | `/api/customers/:id/matches/:candidateId/send` | `{subject,body}` | mock send event | idempotency + authorization + audit |

Use typed DTOs. `GET` is read-only; mutations must be POST/PATCH with CSRF protection where cookie auth applies. Return `{error:{code,message}}` with appropriate 400/401/403/404/409/429/500 codes. Use pagination on lists, never return all contacts from the candidate pool to the browser unnecessarily. For repeated send requests, return 409 or prior event consistently; choose and document one behavior.

## 10. Suggested repository layout

```text
matchmaker-mvp/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (app)/dashboard/page.tsx
│   ├── (app)/customers/[id]/page.tsx
│   └── api/{customers,auth}/...route.ts
├── components/
│   ├── ui/; dashboard/; customer/; matching/; shared/
├── lib/
│   ├── auth/; db/; validation/; permissions.ts
│   ├── matching/{eligibility,features,score,explain,rank}.ts
│   ├── ai/{client,prompt,draft,fallback}.ts
│   └── utils/{age,currency,format}.ts
├── prisma/{schema.prisma,migrations/,seed.ts}
├── tests/{unit,integration,e2e,fixtures}/
├── docs/{DECISIONS.md,RESEARCH.md,DEMO.md,ASSUMPTIONS.md}
├── .env.example
├── README.md
├── AGENTS.md
├── plan.md
└── package.json
```

Separate pure domain logic from database and UI. Keep environment keys server-only; never prefix secret keys with `NEXT_PUBLIC_`.

## 11. Step-by-step execution plan with exit gates

### Phase 0 — Research and scope (2–3 hours)
- [ ] Read all three PDF pages; translate into the traceability table above.
- [ ] Study product flows and public help/product pages of Indian matrimonial and dating services; distinguish **observed features** from assumptions.
- [ ] Record 10 design observations: biodata density, privacy, verification badges, matchmaker workflows, preference specificity, family context, consent, matchmaking stages, introduction etiquette, explanation UX.
- [ ] Create `docs/RESEARCH.md`: source URL, observation, date accessed, implication, confidence.
- [ ] Confirm no real user data is needed; choose mock send and synthetic data.
- [ ] Write `docs/ASSUMPTIONS.md`, especially gender-rule interpretation and sensitive-data policy.
**Gate:** documented scope and screenshot-level wireframes; no coding without deciding primary user flow.

**Research starting points (review manually; do not treat as verified claims):** [Shaadi](https://www.shaadi.com/), [Jeevansathi](https://www.jeevansathi.com/), [BharatMatrimony](https://www.bharatmatrimony.com/), [Bumble Safety](https://bumble.com/en/the-buzz/category/safety), [Hinge](https://hinge.co/), [OWASP privacy risks](https://owasp.org/www-project-top-10-privacy-risks/). Respect terms and never scrape personal profiles.

### Phase 1 — Scaffold and quality tools (1–2 hours)
- [ ] Initialize Next.js TypeScript project with App Router and Tailwind.
- [ ] Configure ESLint, Prettier, path aliases, strict TypeScript, Vitest, Playwright.
- [ ] Add `.env.example` (`DATABASE_URL`, `AUTH_SECRET`, `OPENAI_API_KEY`, `DEMO_MODE=true`).
- [ ] Create Git repo, branch protection optional, initial commit.
- [ ] Add CI for lint, typecheck, unit tests, build.
**Gate:** fresh clone installs and builds; no secrets committed.

### Phase 2 — Database and synthetic data (3–5 hours)
- [ ] Create Prisma models and migration; use nullable fields where appropriate.
- [ ] Implement deterministic 220-candidate seed with ≥105 verified per gender.
- [ ] Seed 2 staff users and 6 customers, complete biodata, explicit preferences.
- [ ] Seed example notes, stage events, and varied journey stages.
- [ ] Validate age ≥18, email syntax, `YES/NO/MAYBE`, plausible numeric values, gender coverage, all required fields.
- [ ] Make seeding idempotent and safe to rerun.
**Gate:** `npm run db:seed` succeeds twice; scripted seed assertions pass.

### Phase 3 — Authentication and scoped worklist (3–5 hours)
- [ ] Add credentials login, hashed passwords, secure session cookies, logout.
- [ ] Build `/dashboard` and query only assigned customers.
- [ ] Add search, stage/city filter, sort, responsive states.
- [ ] Write unauthorized/IDOR tests (matchmaker A cannot view B's customers).
**Gate:** demo user logs in; scoped list is correct; invalid access denied.

### Phase 4 — Full profile and workflow (3–5 hours)
- [ ] Render every PDF biodata field and optional extra fields.
- [ ] Add stage select with validation and event history.
- [ ] Add note composer and list, timestamps, interaction type.
- [ ] Add verification label with explicit demo semantics.
- [ ] Handle absent values and narrow screens.
**Gate:** profile, stage, notes survive refresh; no required field omitted.

### Phase 5 — Matching engine (4–7 hours)
- [ ] Implement `eligibleCandidates()` with tests.
- [ ] Implement feature functions, `MAYBE` matrix, numeric range fit, mutual preference handling.
- [ ] Implement score, confidence, stable ranking, reasons/tradeoffs.
- [ ] Seed male/female showcase cases to demonstrate PDF examples.
- [ ] Expose ranked API and UI cards with `Why this match?` disclosure.
- [ ] Test missing data, exact ties, impossible preferences, all-unverified pool, cross-city cases.
**Gate:** same inputs produce same order; reasons match computations; ≥5 visible matches for showcase customers.

### Phase 6 — AI draft and mock-send (3–5 hours)
- [ ] Build OpenAI server adapter and schema-validated response.
- [ ] Minimize prompt data and add prompt-injection tests.
- [ ] Add explicit `Draft Intro` action, editable draft modal, template fallback.
- [ ] Add mock-send preview and persistent event; prevent duplicates.
- [ ] Show clear “no real email sent” notice.
**Gate:** with API key, actual model produces safe draft; without key, app still completes mock-send flow.

### Phase 7 — Polish, accessibility, security (3–5 hours)
- [ ] Consistent typography, spacing, calm trustworthy palette, responsive table/cards.
- [ ] Keyboard navigation, labels, focus indicators, dialog focus management, sufficient contrast.
- [ ] Loading/skeleton/empty/error/toast states; friendly error recovery.
- [ ] Validate all mutations server-side; session expiry; security headers; avoid logging PII.
- [ ] Test desktop and mobile; test cold-start behavior.
**Gate:** reviewer can finish primary flow without instructions or console errors.

### Phase 8 — Deploy, document, submit (2–4 hours)
- [ ] Create managed Postgres, apply migrations, seed demo database.
- [ ] Deploy Vercel and configure env vars; ensure auth cookies work over HTTPS.
- [ ] Smoke-test **hosted** URL in incognito and on mobile.
- [ ] Publish GitHub repo (verify `.env` not committed); include README and screenshots.
- [ ] Add sample login, feature overview, architecture, algorithm explanation, AI limits, local setup, tests, hosted link.
- [ ] Write requested 2–3 paragraphs; send submission email with subject exactly as specified.
**Gate:** all four required deliverables included and every acceptance case tested against production URL.

**Estimated effort:** 24–41 focused hours. Compress to a 2-day MVP by reducing polish, not removing mandatory fields, AI, seeds, or deployment. Time estimates are planning guesses.

## 12. Test strategy and explicit acceptance cases

### Unit tests (Vitest)
- Age on birthday and leap-day boundary; adult threshold.
- Kids/pets `YES/NO/MAYBE` 3×3 matrix; missing neutral handling.
- Values overlap empty/disjoint/identical; case normalization.
- Range-fit inside/below/above and null.
- INR income comparison and unsupported currency neutral.
- Score exactly within 0–100; weights sum 100; stable tie-breaker.
- Younger/shorter/lower-income explicit preferences increase relevant feature score without excluding other candidates.
- No caste/religion feature imported into ranker.
- Explanations use computed features; no hallucinated reasons.

### Integration tests
- Login valid/invalid; session/logout.
- Staff A cannot read/update Staff B customer (`404` preferred).
- List only assigned customers; filters/sort/pagination correct.
- Note saved with correct author and timestamp; empty rejected.
- Stage transition creates event transactionally.
- Mock send persisted once; repeated click returns expected conflict/idempotent result.
- AI error and malformed JSON trigger fallback; API key never in response.

### E2E tests (Playwright)
1. Login as sample matchmaker.
2. Dashboard shows required columns and assigned customers.
3. Open customer and verify every biodata label.
4. Change stage, add note, reload, confirm persistence.
5. Open suggestions, inspect reason/tradeoff, ensure 5+ cards.
6. Generate intro (AI mocked in CI, real in manual staging).
7. Click Send Match, inspect email preview, confirm mock send, check history.
8. Log out; direct protected URL redirects to login.
9. Test mobile 375px and desktop 1440px; keyboard-only critical path.
10. Open deployed URL incognito and run smoke scenario.

### Demo acceptance checklist
- [ ] All PDF biodata fields visible.
- [ ] ≥100 **verified opposite-gender** seed candidates per demo customer.
- [ ] Stage and notes persist.
- [ ] Matching explains kids, values, relocation, profession, age, height, income where available.
- [ ] AI uses an actual LLM when configured, fallback otherwise.
- [ ] Send Match records a mock event and includes candidate basics.
- [ ] Demo login, GitHub, live link, write-up ready.

## 13. Security, privacy, ethics, and reliability

This is a **demo involving sensitive matrimonial biodata**, so privacy and consent are product requirements, not stretch goals. Only use synthetic profiles; mark fake verification clearly. Protect sensitive contact and demographic fields with server-side authorization. Avoid ranking based on caste/religion; never log these or send them to the LLM. Require explicit consent and a product policy before real introductions. Do not publish demo credentials to an environment containing real customer data. If ever converting to production: conduct legal/privacy review (including applicable Indian data-protection requirements), retention/deletion policy, incident response, encryption/backups, consent flows, access audits, and security assessment.

**Threat checklist:** credential stuffing → login rate limiting; IDOR → DB-scoped authorization; CSRF → session framework protections; XSS → React escaping and no raw HTML; SQL injection → Prisma parameterization; prompt injection → treat profile strings as untrusted data; PII leakage → redaction; accidental real email → mock-only adapter; replayed sends → idempotency; overbroad logs → structured sanitized logs; exposed keys → server-only env and secret scanning.

References: [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/), [OWASP Top 10](https://owasp.org/www-project-top-ten/), [OWASP Cheat Sheet: Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html), [OWASP Cheat Sheet: Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html), [OWASP Cheat Sheet: LLM Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/), [India Digital Personal Data Protection Act (official portal)](https://www.meity.gov.in/).

## 14. Observability and product metrics

Record server errors with request IDs (not personal details). Track anonymized counters: assigned customers, profiles opened, suggestions generated, match cards expanded, AI draft success/fallback, mock sends, stage changes. Do not claim a conversion metric from synthetic data. Add error boundary and retry actions. Health check should verify app can query DB; show a non-PII error if unavailable. Set API request timeouts and budget controls.

## 15. UI design specification

**Tone:** warm, professional, discreet, relationship-centered rather than swipe/gamified. Palette: off-white background, dark slate text, restrained plum/rose accent, sage success; maintain WCAG contrast. Typography: readable sans, 14–16px body; 24–32px headings. Use badges with text, never color alone. Main content max-width ~1280px, sidebar or tabs for navigation. Candidate cards show concise compatibility signals and a clear primary action. Do not expose salary/contact on match cards by default; show only authorized profile summary. Use a `Why this match?` expandable panel with weighted features and uncertainty.

**Critical UI states:** initial loading, zero assigned customers, no candidates, missing profile values, AI loading, AI failure/template fallback, duplicate mock send, unauthorized access, expired session, unsaved note, and network failure. Use optimistic UI only if rollback is implemented; otherwise await confirmed mutation before showing success.

## 16. Local setup and deployment runbook

```bash
# Example commands; align exact scripts with package.json
npx create-next-app@latest matchmaker-mvp --typescript --tailwind --eslint --app
cd matchmaker-mvp
npm install prisma @prisma/client zod @faker-js/faker
npm install -D vitest @playwright/test
npx prisma init
# set DATABASE_URL, AUTH_SECRET, OPENAI_API_KEY in .env (never commit)
npx prisma migrate dev --name init
npm run db:seed
npm run dev
npm run lint && npm run typecheck && npm run test && npm run build
```

**Deployment sequence:** push repo → provision Postgres → configure production `DATABASE_URL`, `AUTH_SECRET`, `OPENAI_API_KEY`, `DEMO_MODE` → run migrations with `prisma migrate deploy` in controlled deploy step → run seed once against demo DB → deploy on Vercel → inspect function logs → open hosted link in private browser → login, edit stage, add note, rank, draft, mock send → capture screenshots and URLs. Avoid running destructive seed on every deployment. Check provider connection pooling settings and Prisma compatibility.

**Suggested scripts:** `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:e2e`, `db:migrate`, `db:seed`, `db:validate`. Pin Node runtime and dependency versions in repo; use `.env.example` with placeholder values.

## 17. Reviewer demo script (5–7 minutes)

1. **0:00–0:40:** open live hosted URL; log in with provided demo account.
2. **0:40–1:30:** show assigned customers, status tags, filters, verified demo badges.
3. **1:30–2:20:** open a customer; scroll complete biodata; update stage and add note.
4. **2:20–3:50:** open suggestions; show 3 reasons, tradeoffs, numerical weights; explain male and female seeded examples without claiming gender stereotypes are universal.
5. **3:50–5:10:** generate AI intro, edit preview, click Send Match, confirm mock send, show history.
6. **5:10–6:20:** show repository architecture, matching unit tests, 220-candidate seed, README.
7. **6:20–7:00:** discuss security, privacy, limitations and production next steps.

## 18. Required README structure and final write-up template

README sections: product overview; screenshot/GIF; **LIVE DEMO URL**; **DEMO USERNAME/PASSWORD** (demo-only); features mapped to PDF; tech stack; local setup; environment variables; database migration/seed; algorithm with weights and examples; AI flow and fallback; tests; security/privacy assumptions; known limitations; architecture; roadmap.

**Sample 3-paragraph submission write-up (edit after implementation):**

> I built an internal matchmaking workbench with Next.js, TypeScript, PostgreSQL and Prisma. Matchmakers can securely log in, view their assigned customers, inspect complete biodata, update journey stages, record meeting notes, and review a seeded synthetic pool of candidate profiles. The dashboard prioritizes fast navigation, verification visibility, and a clear activity trail.
>
> The matching engine first applies basic eligibility and explicit user-defined constraints, then ranks candidates using a transparent weighted compatibility score. Children preferences, values, relocation feasibility, age preferences, profession, marital status, height, income, and pets contribute to an explainable result. The assignment's male/female examples are demonstrated using seeded explicit preferences rather than treating demographic assumptions as universal rules. Every suggestion displays concrete reasons, tradeoffs, and missing-data uncertainty.
>
> AI is used to draft concise personalized introduction emails based on verified, shareable compatibility facts. Drafts are editable and reviewed by the matchmaker, with a deterministic fallback if the AI service is unavailable. Sending is deliberately simulated and recorded in the app; no real people are contacted. All sample profiles are synthetic, and sensitive fields are excluded from AI prompts and default ranking. [Replace this paragraph's implementation claims if your shipped behavior differs.]

**Submission email template:**
```text
To: tech@thedatecrew.com
Subject: Full Stack Developer Internship - [Your Name] - Assignment

Hello TDC Team,

Please find my Matchmaker Dashboard & Matching Engine MVP submission:
Live demo: [URL]
GitHub: [URL]
Demo login: [username] / [password]

[Paste final 2–3 paragraph write-up or link to README section.]

Thank you,
[Your Name]
```

## 19. Risk register and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Spending too long on algorithm before deploying | No hosted deliverable | Deploy scaffold by end of Phase 3; smoke-test each milestone |
| AI key unavailable or quota exceeded | Mandatory AI demonstration weak | Implement actual API integration + show documented configured path; fallback alone does **not** prove AI usage; test live once |
| Seed lacks 100 eligible opposite-gender profiles | Fails rubric | 220 seed, ≥105 verified per gender, assertions per customer |
| Gender rule seems discriminatory | Trust/product risk | Explicit user preferences, transparent soft signals, never categorical gender exclusion |
| Fake “verified” badge misleads | Reviewer confusion | Label `Demo verified (synthetic)` |
| Data exposed between staff accounts | Serious security flaw | Scoped DB queries + IDOR integration tests |
| Missing field in long biodata | Fails requirement | Field-level checklist + E2E assertions |
| Duplicate mock send | Confusing activity | Unique constraint + idempotent UX |
| Hosted app breaks after local success | Fails most important deliverable | Incognito production smoke test and deployed seed validation |
| LLM fabricates details | Trust/privacy failure | Minimal facts, structured validation, human review, template fallback |

## 20. Milestones, prioritization, and fallback plan

**Milestone A (end of first work block):** live login + assigned list + seeded DB. **Milestone B:** full profile + stages + notes. **Milestone C:** ranked explainable suggestions with tests. **Milestone D:** AI intro + mock send + production smoke test. **Milestone E:** README and submission. Keep app deployable after each milestone.

If behind schedule, cut advanced search, animations, analytics, additional dashboards, multiple role types, and extra AI features. **Never cut:** login, assigned list, complete biodata, 100+ opposite-gender seed pool, PDF-relevant matching, one real AI feature, Send Match, hosted link, GitHub, credentials, and write-up.

## 21. Agent collaboration rules (`AGENTS.md` guidance)

For coding assistants: read `plan.md` and the PDF before modifying code; implement in milestone order; avoid unrequested scope; maintain strict TypeScript and server-side auth; never insert real personal data; never invent candidate facts; keep scoring deterministic; require explicit preferences for gender-example features; add tests with each feature; run lint/typecheck/tests/build before PR; document schema and env changes; keep demo deployed; never commit API keys. For every completed task, report files changed, commands run, test results, open risks, and the next task. If an instruction conflicts with security or privacy, raise it and choose the safer implementation.

### Suggested incremental agent prompts

**Prompt 1:** “Read plan.md. Implement Phase 1–2 only: scaffold, Prisma schema, idempotent 220-profile seed, validation script and tests. Do not implement UI beyond placeholder. Run checks and report results.”

**Prompt 2:** “Implement Phase 3–4: credentials auth, assigned-customer dashboard, complete biodata, journey stage transitions and notes. Add ownership integration tests and responsive states.”

**Prompt 3:** “Implement Phase 5 exactly as specified: pure deterministic scoring functions, explicit preference handling, confidence, reasons, stable ranking, test fixtures and suggestion cards. No LLM ranking.”

**Prompt 4:** “Implement Phase 6: secure OpenAI intro drafting with schema validation and fallback, editable preview, mock send event and duplicate prevention. Do not send real email.”

**Prompt 5:** “Run full acceptance checklist against deployed URL, fix failures, finish README, demo credentials, screenshots and submission write-up. Report verified URLs and remaining limitations.”

## 22. References and provenance

**Primary source:** user-supplied *Working Session Exercise — “Build the Matchmaker Algo and Dashboard MVP”*, pp. 1–3. All PDF-specific requirements in Sections 0–1 are transcribed or faithfully paraphrased from that file; architecture, scoring weights, timeline, seed strategy, safety decisions, and test plan are proposed implementation choices.

**Official technical docs:** [Next.js](https://nextjs.org/docs), [React](https://react.dev/learn), [TypeScript](https://www.typescriptlang.org/docs/), [Prisma](https://www.prisma.io/docs), [PostgreSQL](https://www.postgresql.org/docs/), [Zod](https://zod.dev/), [Auth.js](https://authjs.dev/), [OpenAI](https://platform.openai.com/docs/overview), [OpenAI Responses](https://platform.openai.com/docs/api-reference/responses), [Vercel](https://vercel.com/docs), [Playwright](https://playwright.dev/docs/intro), [Vitest](https://vitest.dev/guide/), [OWASP](https://owasp.org/www-project-top-ten/).

**Market research starting points (not independently validated findings):** [Shaadi](https://www.shaadi.com/), [Jeevansathi](https://www.jeevansathi.com/), [BharatMatrimony](https://www.bharatmatrimony.com/), [Bumble](https://bumble.com/), [Hinge](https://hinge.co/). Capture observations and access dates in `docs/RESEARCH.md` during Phase 0; do not claim competitor feature details without checking.

---

**Final ship rule:** A small, complete, safe, explainable and **working live demo** beats a broad prototype that cannot be tested by the reviewer.
