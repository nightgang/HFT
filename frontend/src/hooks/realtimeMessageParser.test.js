import assert from 'node:assert';
import { getRealtimePayload } from './realtimeMessageParser.js';

const runTests = () => {
  const aiMessage = { type: 'ai-prediction', prediction: { tokenMint: 'SOL', score: 0.9 } };
  assert.deepEqual(getRealtimePayload(aiMessage), { tokenMint: 'SOL', score: 0.9 });

  const arbMessage = { type: 'arbitrage-signal', signal: { tokenMint: 'SOL', spread: 0.012 } };
  assert.deepEqual(getRealtimePayload(arbMessage), { tokenMint: 'SOL', spread: 0.012 });

  const smartMessage = { type: 'smartmoney-signal', signal: { walletAddress: 'WALLET1', score: 80 } };
  assert.deepEqual(getRealtimePayload(smartMessage), { walletAddress: 'WALLET1', score: 80 });

  const signalMessage = { type: 'ai-signal', signal: { tokenMint: 'SOL', signalType: 'buy', score: 78 } };
  assert.deepEqual(getRealtimePayload(signalMessage), { tokenMint: 'SOL', signalType: 'buy', score: 78 });

  const signalMessageUpper = { type: 'AI_SIGNAL', signal: { tokenMint: 'SOL', signalType: 'buy', score: 78 } };
  assert.deepEqual(getRealtimePayload(signalMessageUpper), { tokenMint: 'SOL', signalType: 'buy', score: 78 });

  const priceMessage = { type: 'price-update', price: { tokenMint: 'SOL', price: 34.2 } };
  assert.deepEqual(getRealtimePayload(priceMessage), { tokenMint: 'SOL', price: 34.2 });

  const retryMessage = { type: 'trade-retry', data: { trade: { id: 't1' }, reason: 'timeout' } };
  assert.deepEqual(getRealtimePayload(retryMessage), retryMessage);

  const unsupportedMessage = { type: 'unknown-event', data: { foo: 'bar' } };
  assert.deepEqual(getRealtimePayload(unsupportedMessage), unsupportedMessage);

  console.log('✅ realtimeMessageParser test passed');
};

runTests();
