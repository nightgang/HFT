const { z } = require('zod');

const tokenDetectionSchema = z.object({
  mint: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, 'Invalid Solana address'),
  name: z.string().min(1).max(100).default('Unknown'),
  symbol: z.string().min(1).max(20).default('UNK'),
  decimals: z.number().int().min(0).max(18).default(6),
  supply: z.string().regex(/^\d+$/, 'Invalid token supply').default('0'),
  creator: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/).optional(),
  timestamp: z.number().int().positive().default(() => Date.now()),
});

const tradeBuyRequestSchema = z.object({
  tokenMint: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/),
  amount: z.number().positive().optional(),
  slippageBps: z.number().int().min(0).max(10000).optional(),
});

const tradeSellRequestSchema = z.object({
  tokenMint: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/),
  amount: z.number().positive(),
  slippageBps: z.number().int().min(0).max(10000).optional(),
});

const walletSchema = z.object({
  publicKey: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/),
  privateKey: z.string().optional(), // Only for internal wallets
});

module.exports = {
  tokenDetectionSchema,
  tradeBuyRequestSchema,
  tradeSellRequestSchema,
  walletSchema,
};