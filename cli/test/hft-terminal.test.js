const assert = require('node:assert');
const HFTSystemTerminal = require('../hft-terminal.js');

const runTests = async () => {
  const terminal = new HFTSystemTerminal({ demo: true });
  terminal.rl = { prompt: () => {} };
  const logs = [];
  const originalConsoleLog = console.log;
  console.log = (...args) => logs.push(args.join(' '));

  try {
    const signal = {
      tokenMint: 'Token123',
      signalType: 'strong_buy',
      score: 92,
      confidence: 0.93,
      riskLevel: 'Low',
    };

    terminal.displayAiSignal(signal);
    assert.strictEqual(terminal.latestAiSignal, signal);
    assert.strictEqual(terminal.aiSignals.length, 1);
    assert.strictEqual(logs.some((line) => line.includes('AI SIGNAL')), true);
    assert.strictEqual(logs.some((line) => line.includes('High confidence AI signal detected')), true);

    logs.length = 0;
    await terminal.showAiSignals();
    assert.strictEqual(logs.some((line) => line.includes('AI SIGNALS')), true);
    assert.strictEqual(logs.some((line) => line.includes('High Confidence')), true);
    assert.strictEqual(logs.some((line) => line.includes('Token123')), true);
  } finally {
    console.log = originalConsoleLog;
  }

  console.log('✅ hft-terminal CLI AI signal tests passed');
};

runTests().catch((error) => {
  console.error(error);
  process.exit(1);
});