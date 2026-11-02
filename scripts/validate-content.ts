import fs from 'fs';
import path from 'path';

const validConcepts = [
  'Reflection & Plane Mirrors',
  'Spherical Mirrors (Concave/Convex)',
  "Refraction & Snell's Law",
  'Total Internal Reflection',
  'Prism & Dispersion',
  'Lens Formula & Magnification',
  'Power of a Lens',
  'Optical Instruments',
  'Refraction at Spherical Surfaces'
];

function validate() {
  const jsonPath = path.join(process.cwd(), 'public', 'ray-optics.json');
  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const questions = JSON.parse(rawData);
  let errors = 0;

  if (questions.length !== 30) {
    console.error(`❌ Expected 30 questions, found ${questions.length}`);
    errors++;
  }

  const ids = new Set();

  questions.forEach((q: any, index: number) => {
    const qNum = index + 1;

    // 1. Unique ID
    if (ids.has(q.id)) {
      console.error(`❌ Q${qNum}: Duplicate ID ${q.id}`);
      errors++;
    }
    ids.add(q.id);

    // 2. Options length
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      console.error(`❌ Q${qNum} (${q.id}): Must have exactly 4 options`);
      errors++;
    }

    // 3. correctOption range
    if (q.correctOption < 0 || q.correctOption > 3) {
      console.error(`❌ Q${qNum} (${q.id}): correctOption must be 0, 1, 2, or 3`);
      errors++;
    }

    // 4. Concept union
    if (!validConcepts.includes(q.concept)) {
      console.error(`❌ Q${qNum} (${q.id}): Invalid concept "${q.concept}"`);
      errors++;
    }

    // 5. est_time_seconds (in-band check)
    const time = q.est_time_seconds;
    if (q.difficulty === 'easy' && (time < 20 || time > 60)) {
      console.warn(`⚠️ Q${qNum} (${q.id}): Easy question has unusual est_time (${time}s)`);
    }
    if (q.difficulty === 'medium' && (time < 45 || time > 100)) {
      console.warn(`⚠️ Q${qNum} (${q.id}): Medium question has unusual est_time (${time}s)`);
    }
    if (q.difficulty === 'hard' && (time < 90 || time > 200)) {
      console.warn(`⚠️ Q${qNum} (${q.id}): Hard question has unusual est_time (${time}s)`);
    }
  });

  if (errors > 0) {
    console.error(`\n🚨 Validation failed with ${errors} errors.`);
    process.exit(1);
  }

  console.log('✅ 30 questions validated successfully!');
}

validate();