import fs from 'fs';
import path from 'path';

const COVERAGE_FILE = path.resolve(process.cwd(), 'coverage', 'coverage-summary.json');
const MIN_PCT = 80;
const EPS = 1e-9;

if (!fs.existsSync(COVERAGE_FILE)) {
  console.error('Coverage summary not found. Run tests with coverage first.');
  process.exit(2);
}

const data = JSON.parse(fs.readFileSync(COVERAGE_FILE, 'utf8'));
const totals = data.total || data[''] || data;

const statements = totals.statements && totals.statements.pct;
const branches = totals.branches && totals.branches.pct;
const functions = totals.functions && totals.functions.pct;
const lines = totals.lines && totals.lines.pct;

function check(name, pct) {
  if (pct == null) return true;
  const num = Number(pct);
  console.log(`${name} coverage: ${num}% (threshold ${MIN_PCT}%)`);
  if (Number.isNaN(num)) return false;
  if (num + EPS < MIN_PCT) {
    console.error(`${name} coverage ${num}% is below threshold ${MIN_PCT}%`);
    return false;
  }
  console.log(`${name} coverage OK: ${num}%`);
  return true;
}

const ok = [
  check('statements', statements),
  check('branches', branches),
  check('functions', functions),
  check('lines', lines),
].every(Boolean);

if (!ok) process.exit(3);
console.log('Coverage checks passed');
process.exit(0);
