# ChapWisePYQ — Chapter-wise KCET PYQ Test Engine

A mobile-first KCET Physics PYQ practice platform designed to help students understand not just **what they got wrong, but why they got it wrong.**

ChapWisePYQ explores a simple idea: can we identify a student's underlying learning gaps through their test-taking behaviour?

Built as a pilot project to validate that idea.

## Features

- **Chapter-wise Practice:** Practice KCET Physics previous-year questions chapter by chapter.
- **Confidence Tracking:** Mark every answer as Sure, Unsure, or Guess.
- **Time Tracking:** Track time spent on individual questions.
- **Diagnostic Reports:** Identify potential knowledge gaps, misconceptions, lucky guesses, and confidence issues.
- **Pacing Analysis:** Detect rushed answers and questions that take unusually long.
- **Actionable Recommendations:** Get improvement suggestions based on your test performance.
- **Answer Review:** Revisit questions with explanations and provide feedback.
- **Attempt History:** View previous attempts for each chapter.

## Chapters

| Chapter | Questions | Duration | Status |
|---|---:|---:|---|
| Ray Optics | 30 | 40 min | Live |
| Electrostatics | 30 | 35 min | Live |
| Motion in a Straight Line | 11 | 15 min | Coming Soon |

## The Mirror Report

Every submitted test generates a report designed to provide more insight than a conventional scorecard.

The report includes:

- **Performance Overview:** Score, accuracy, and time taken.
- **Diagnosis Breakdown:** Understand the patterns behind incorrect and correct answers.
- **Pacing Analysis:** Identify potential rushing and overthinking patterns.
- **Action Plan:** Get recommendations based on the severity of identified weaknesses.
- **Question Review:** Revisit individual answers with detailed explanations.
- **Student Feedback:** Submit feedback on individual questions.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.4 (App Router, Turbopack) |
| Language | TypeScript 5 (Strict Mode) |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui |
| Icons | Lucide React, Material Symbols |
| State Management | Zustand 5 |
| Mathematics Rendering | KaTeX |
| Notifications | Sonner |
| Database | Supabase (PostgreSQL) |
| Hosting | Vercel |
| Testing | Vitest |

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- A Supabase project (free tier is sufficient)

### 1. Clone the repository

```bash
git clone <repo-url>
cd chapwisepyq
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Find these values in:

Supabase Dashboard → Project Settings → API.

Use the anon/publishable key. Never expose your `service_role` key in client-side code.

### 3. Configure Supabase

Create the required database tables using the SQL setup provided in the project.

**Note:** This pilot uses email-based identification rather than full authentication. Row Level Security (RLS) is currently disabled.

Do not use real or sensitive student data in this configuration.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript checks |
| `npm run test` | Run Vitest tests |
| `npm run validate:content` | Validate question JSON files |

## Project Structure

```text
src/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx
│   ├── chapters/
│   ├── home/
│   ├── test/
│   ├── result/
│   └── review/
│
├── components/
│   ├── ui/
│   ├── testPage/
│   ├── result/
│   ├── review/
│   └── MathText.tsx
│
├── lib/
│   ├── chapters.ts
│   ├── engine.ts
│   ├── scoring.ts
│   ├── report.ts
│   └── supabase.ts
│
├── store/
│   └── useTestStore.ts
│
└── types/
    └── index.ts

public/
├── ray-optics.json
├── electrostatics.json
└── images/
    ├── ray-optics/
    └── electrostatics/
```

## Question Content Format

Questions are stored as static JSON files inside the `public/` directory.

Each question follows this structure:

```json
{
  "id": "RO-KCET-PHY-2026-Q1",
  "question": "With reference to the figure...",
  "imageUrl": "/images/ray-optics/KCET-PHY-2026-Q1.png",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctOption": 2,
  "explanation": "Step 1: ...\n\nStep 2: ...",
  "difficulty": "easy",
  "concept": "Reflection & Plane Mirrors",
  "year": 2026,
  "est_time_seconds": 45
}
```

### Content Guidelines

| Field | Description |
|---|---|
| `id` | Unique question ID |
| `question` | Question text; supports KaTeX using `$...$` |
| `imageUrl` | Image path or `null` |
| `options` | Four answer options |
| `correctOption` | Correct option index (0–3) |
| `explanation` | Detailed solution |
| `difficulty` | `easy`, `medium`, or `hard` |
| `concept` | Must match an existing concept tag |
| `year` | KCET examination year |
| `est_time_seconds` | Estimated time to solve the question |

Question IDs use chapter-specific prefixes:

- `RO-` — Ray Optics
- `ES-` — Electrostatics
- `MS-` — Motion in a Straight Line

Question images should ideally use a 1280 × 720 resolution (16:9).

### Adding a New Chapter

1. Add a new JSON question file inside `public/`.
2. Add the corresponding question images inside `public/images/<chapter>/`.
3. Register the chapter in `src/lib/chapters.ts`.
4. Add its display metadata in `src/app/chapters/page.tsx`.
5. Run the content validation and test scripts.

## Current Limitations

This is an early-stage pilot. Some capabilities are intentionally limited:

- Email-only identification; no full authentication.
- Row Level Security is disabled.
- Test progress is stored locally in the browser.
- No cross-device test resumption.
- Result pages are not publicly shareable.
- Question content is maintained through static JSON files.
- No content management system.

## Roadmap

- [ ] Complete Motion in a Straight Line.
- [ ] Add Motion in a Plane.
- [ ] Implement Supabase Authentication.
- [ ] Enable Row Level Security and database policies.
- [ ] Add bookmarks and saved questions.
- [ ] Support cross-device attempt history.
- [ ] Introduce shareable result pages.
- [ ] Build a student performance dashboard.
- [ ] Add streaks and progress tracking.

## License

Private. Not for redistribution.

---

**Built by a student, for students.**