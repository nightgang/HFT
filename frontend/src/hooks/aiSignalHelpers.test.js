import assert from 'node:assert';
import { formatSignalConfidence, getSignalConfidenceClass } from './aiSignalHelpers.js';

const runTests = () => {
  assert.strictEqual(formatSignalConfidence(null), 'N/A');
  assert.strictEqual(formatSignalConfidence(undefined), 'N/A');
  assert.strictEqual(formatSignalConfidence(0.85), '85%');
  assert.strictEqual(formatSignalConfidence(1), '100%');
  assert.strictEqual(formatSignalConfidence(92), '92%');

  assert.strictEqual(getSignalConfidenceClass(null), 'bg-amber-500/20 text-amber-300');
  assert.strictEqual(getSignalConfidenceClass(0.75), 'bg-amber-500/20 text-amber-300');
  assert.strictEqual(getSignalConfidenceClass(0.85), 'bg-cyan-500/20 text-cyan-300');
  assert.strictEqual(getSignalConfidenceClass(0.9), 'bg-emerald-500/20 text-emerald-300');
  assert.strictEqual(getSignalConfidenceClass(95), 'bg-emerald-500/20 text-emerald-300');

  console.log('✅ aiSignalHelpers tests passed');
};

runTests();
