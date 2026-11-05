# `README.md`

Complete, paste-ready at project root.

```markdown
# ChapWisePYQ — Chapter-wise PYQ Test Engine

A mobile-first, chapter-wise KCET Physics PYQ test platform with **confidence-tagged diagnostics**, **8-case mirror reports**, and **pacing analysis**.

Built as a pilot to validate the diagnosis engine: *can we tell a student **why** they got a question wrong, not just that they got it wrong?*

---

## What It Does

1. Student enters email → picks a chapter → takes a timed test.
2. Every answer is tagged **Sure / Unsure / Guess**.
3. Every question's time is tracked.
4. On submit, the **diagnosis engine** classifies each question into 1 of 8 categories (Blind Guess, Misconception, Concept Gap, Lucky Guess, Needs Confidence, Mastered, Marked Skipped, Unattempted).
5. The **mirror report** surfaces:
   - Score donut + accuracy + time
   - Diagnosis breakdown (where the student's real weaknesses are)
   - Pacing flags (rushed / overthinking)
   - Action plan grouped by severity
6. **Answer review** shows per-question explanations with inline feedback (was this diagnosis accurate?).

---

## Chapters Available

| Chapter | Questions | Timer | Status |
|---|---|---|---|
| Ray Optics | 30 | 40 min | ✅ Live |
| Electrostatics | 30 | 35 min | ✅ Live |
| Motion in a Straight Line | 11 | 15 min | 🚧 Coming Soon |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.4 (App Router, Turbopack) |
| Language | TypeScript 5 (strict + `noUncheckedIndexedAccess`) |
| Styling | Tailwind CSS v4 (`@theme` tokens, no JS config) |
| UI components | shadcn/ui (button, input, dialog, accordion, textarea, badge) |
| State | Zustand 5 + `persist` (localStorage) |
| Math rendering | KaTeX (direct, not `react-katex`) |
| Icons | Lucide React + Material Symbols Outlined |
| Toasts | Sonner |
| Backend / DB | Supabase (Postgres + JS client, RLS off for pilot) |
| Hosting | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- A Supabase project (free tier is fine)

### Install

```bash
git clone <repo>
cd chapwisepyq
npm install
```

### Environment Variables

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

Both are found in **Supabase Dashboard → Project Settings → API**. Use the `anon` / `public` key — never `service_role` in a client app.

### Supabase Setup

Run this in **Supabase → SQL Editor**:

```sql
-- 1. Users
CREATE TABLE pilot_users (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Attempts
CREATE TABLE attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT REFERENCES pilot_users(email),
  chapter_id TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  time_taken_seconds INTEGER,
  score INTEGER,
  accuracy INTEGER,
  diagnosis_summary JSONB
);

-- 3. Per-question answers
CREATE TABLE attempt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES attempts(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  selected_option INTEGER,
  is_correct BOOLEAN,
  self_report TEXT,
  time_on_question_ms INTEGER,
  time_to_first_select_ms INTEGER,
  option_changes_count INTEGER,
  is_marked_for_review BOOLEAN DEFAULT false
);

-- 4. Inline feedback (S4)
CREATE TABLE pilot_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES attempts(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  thumb TEXT NOT NULL,
  student_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS OFF (pilot only — auth out of scope)
ALTER TABLE pilot_users      DISABLE ROW LEVEL SECURITY;
ALTER TABLE attempts         DISABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_answers  DISABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_feedback   DISABLE ROW LEVEL SECURITY;
```

### Run

```bash
npm run dev
# → http://localhost:3000
```

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest (engine + scoring tests) |
| `npm run test:watch` | Vitest watch mode |
| `npm run validate:content` | Validate JSON question files |

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Inter + Material Symbols + Toaster
│   ├── globals.css             # Tokens + component classes (Tailwind v4)
│   ├── page.tsx                # S0 — Email capture
│   ├── chapters/page.tsx       # Chapter picker
│   ├── home/page.tsx           # Rules + past attempts
│   ├── test/page.tsx           # S1 — Test engine
│   ├── result/page.tsx         # S3 — Mirror report
│   └── review/page.tsx         # S4 — Answer review
├── components/
│   ├── ui/                     # shadcn primitives
│   ├── MathText.tsx            # KaTeX renderer
│   ├── testPage/               # TestHeader, QuestionCard, ConfidencePanel, QuestionPalette, SubmitModal
│   ├── result/                 # ScoreDonut, MetricsBar, DiagnosisPills, etc.
│   └── review/                 # ReviewCard, ExplanationAccordion, InlineFeedback
├── hooks/
│   └── useTimer.ts             # Countdown + auto-submit
├── lib/
│   ├── chapters.ts             # Chapter registry (single source of truth)
│   ├── engine.ts               # 10-case diagnosis + pacing
│   ├── scoring.ts              # Score + aggregation
│   ├── report.ts               # Report aggregations for /result
│   ├── supabase.ts             # Client (env-guarded)
│   └── utils.ts                # cn()
├── store/
│   └── useTestStore.ts         # Zustand + persist
└── types/
    └── index.ts                # Question, AnswerState, ConceptTag, ...
```

---

## The Brain — Diagnosis Engine

### 8-Case Classification (per question)

| Correctness | Self-Report | Diagnosis |
|---|---|---|
| Wrong | Guess | 🚨 Blind Guess |
| Wrong | Sure | 🧠 Misconception |
| Wrong | Unsure / null | 📖 Concept Gap |
| Correct | Guess / null | 🍀 Lucky Guess |
| Correct | Unsure | 💪 Needs Confidence |
| Correct | Sure | ✅ Mastered |
| Unattempted | Marked | ⏳ Marked Skipped |
| Unattempted | Not Marked | ⬜ Unattempted |

### Pacing Flags (per question)

```
ratio = timeOnQuestionMs / (est_time_seconds * 1000)
  ratio < 0.4  → RUSHED
  ratio > 2.5  → OVERTHINKING
  else         → NORMAL
```

### Severity Mapping (drives Action Plan)

- Any P1/P2 → 🔴 **Rebuild from scratch**
- Any P3/P4/P7 → 🟡 **Review specific topic**
- Any P5 → 🟢 **Brush Up / Practice**
- Else → ✅ **Mastered**

---

## Question JSON Schema

Files live in `public/` — one per chapter (`ray-optics.json`, `electrostatics.json`, `motion-straight-line.json`).

```json
{
  "id": "RO-KCET-PHY-2026-Q1",
  "question": "With reference to the figure...",
  "imageUrl": "/images/ray-optics/KCET-PHY-2026-Q1.png",
  "options": ["A", "B", "C", "D"],
  "correctOption": 2,
  "explanation": "Step 1: ... Step 2: ...",
  "difficulty": "easy",
  "concept": "Reflection & Plane Mirrors",
  "year": 2026,
  "est_time_seconds": 45
}
```

| Field | Notes |
|---|---|
| `id` | Must be globally unique. Prefix with chapter (`RO-`, `ES-`, `MS-`). |
| `question` | Math wrapped in `$...$` for KaTeX |
| `imageUrl` | Either `null` or a path under `/images/<chapter>/...` |
| `options` | Exactly 4 strings |
| `correctOption` | `0`–`3` |
| `difficulty` | `"easy"` / `"medium"` / `"hard"` |
| `concept` | Must match the chapter's `ConceptTag` union |
| `est_time_seconds` | Drives pacing threshold |

### Concept Tags — Ray Optics (9)

`Reflection & Plane Mirrors`, `Spherical Mirrors (Concave/Convex)`, `Refraction & Snell's Law`, `Total Internal Reflection`, `Prism & Dispersion`, `Optical Instruments`, `Refraction at Spherical Surfaces`, `Lens Formula & Magnification`, `Power of a Lens`

### Concept Tags — Electrostatics (6)

`Electric Charge & Coulomb's Law`, `Electric Field & Field Lines`, `Electric Dipole`, `Gauss's Law & Electric Flux`, `Electric Potential & Potential Energy`, `Dielectric Materials & Susceptibility`

### Concept Tags — Motion in a Straight Line (4)

`Distance, Displacement & Average Velocity`, `Kinematic Equations (Uniform Acceleration)`, `Kinematic Graphs (x-t, v-t, a-t)`, `Calculus in Kinematics`

---

## Adding a New Chapter

1. Add JSON to `public/<chapter>.json` (30 questions, following schema above).
2. Add images under `public/images/<chapter>/`.
3. Open `src/lib/chapters.ts` and append:

   ```ts
   {
     id: 'new-chapter',
     title: 'New Chapter',
     jsonPath: '/new-chapter.json',
     timeLimitMinutes: 30,
   },
   ```

4. Open `src/app/chapters/page.tsx` and add to `chapterMeta`:

   ```ts
   'new-chapter': { desc: 'Class 12 Physics', questions: 30, difficulty: 'Medium' },
   ```

5. Done. Everything else (`/home`, `/test`, `/result`, `/review`) reads from `lib/chapters.ts` and works automatically.

---

## Data Flow

```
S0 (/)            → pilot_users.upsert(email)
S2 (/chapters)    → setChapter() → timer initialized
S2b (/home)       → filter past attempts by chapter_id
S1 (/test)        → attempts.insert → attempt_answers bulk insert
S3 (/result)      → reads store or attempts row by ?attemptId
S4 (/review)      → reads attempt_answers + shows explanations
```

Local state (`localStorage` key: `chapwise-test-storage`) holds **the current attempt only** — email, chapter, answers, timer, index. Refresh-safe during the test. Past attempts live exclusively in Supabase.

---

## Known Limitations (Pilot)

- **No authentication** — email-only, no password. RLS is off.
- **No cross-device resume** — localStorage is per-browser.
- **No shareable result links** — `/result?attemptId=...` works but requires the same browser session.
- **No CMS** — questions live in static JSON.
- **`service_role` key not used** — client-side Supabase client only.
- **Motion in a Straight Line** is flagged `comingSoon: true`.

---

## Roadmap

- [ ] Finish Motion in a Straight Line (images + enable)
- [ ] Add Motion in a Plane
- [ ] Real auth (Supabase Auth or Clerk)
- [ ] Re-enable RLS with proper policies
- [ ] Bookmarks ("Saved questions" — like YT Watch Later)
- [ ] Cross-device attempt history
- [ ] Shareable result URLs
- [ ] Dashboard / streaks / analytics

---

## License

Private. Not for redistribution.

---

**Built by a student, for students.**
```

---

## Where to put it

```
chapwisepyq/
├── README.md          ← paste here (project root)
├── package.json
├── public/
└── src/
```

---

## One note

If your repo is ever **public** on GitHub, add this to `.gitignore` (should already be there by default from `create-next-app`):

```gitignore
.env*.local
```

Otherwise the Supabase keys leak. The **anon key** is technically designed for client exposure, but you don't want it in git history if you can avoid it — keeps the attack surface auditable.

Also update the `git clone <repo>` line in the README once you know the actual URL.