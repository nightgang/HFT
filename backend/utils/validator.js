const { z } = require('zod');
const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const tokenDetectionSchema = z.object({
  mint: z.string().regex(base58Regex, 'Invalid Solana address'),
  name: z.string().min(1).max(100).default('Unknown'),
  symbol: z.string().min(1).max(20).default('UNK'),
  decimals: z.number().int().min(0).max(18).default(6),
  supply: z.string().regex(/^\d+$/, 'Invalid token supply').default('0'),
  creator: z.string().regex(base58Regex).optional(),
  timestamp: z.number().int().positive().default(() => Date.now()),
});

const tradeBuyRequestSchema = z.object({
  tokenMint: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/),
  amount: z.number().positive().optional(),
  slippageBps: z.number().int().min(0).max(10000).optional(),
  mode: z.enum(['live', 'paper', 'shadow']).optional(),
});

const tradeSellRequestSchema = z.object({
  tokenMint: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/),
  amount: z.number().positive(),
  slippageBps: z.number().int().min(0).max(10000).optional(),
  mode: z.enum(['live', 'paper', 'shadow']).optional(),
});

const walletSchema = z.object({
  publicKey: z.string().regex(base58Regex),
  privateKey: z.string().optional(), // Only for internal wallets
});

const createWalletSchema = z.object({
  name: z.string().min(1),
  deterministic: z.boolean().optional(),
});

const connectWalletSchema = z.object({
  publicKey: z.string().regex(base58Regex),
  name: z.string().min(1).optional(),
});

const multisigWalletSchema = z.object({
  name: z.string().min(1),
  signers: z.array(z.string().regex(base58Regex)).min(2),
  threshold: z.number().int().min(2),
  multisigAddress: z.string().regex(base58Regex).optional(),
  notes: z.string().max(500).optional(),
});

const taxExportRequestSchema = z.object({
  format: z.enum(['csv', 'pdf']).default('csv'),
  year: z.number().int().min(2000).max(2100).default(new Date().getFullYear()),
});

const walletHierarchySchema = z.object({
  childWalletAddress: z.string().regex(base58Regex),
  parentWalletAddress: z.string().regex(base58Regex),
});

const walletLimitsSchema = z.object({
  walletAddress: z.string().regex(base58Regex),
  spendingLimitUsd: z.number().nonnegative(),
  dailySpendingUsd: z.number().nonnegative().optional(),
});

const walletRecoverySchema = z.object({
  walletAddress: z.string().regex(base58Regex),
  targetWalletAddress: z.string().regex(base58Regex).optional(),
  execute: z.boolean().optional(),
});

const addressListSchema = z.object({
  walletAddress: z.string().regex(base58Regex),
  addresses: z.array(z.string().regex(base58Regex)).min(1).max(50),
});

module.exports = {
  tokenDetectionSchema,
  tradeBuyRequestSchema,
  tradeSellRequestSchema,
  walletSchema,
  createWalletSchema,
  connectWalletSchema,
  multisigWalletSchema,
  taxExportRequestSchema,
  walletHierarchySchema,
  walletLimitsSchema,
  walletRecoverySchema,
  addressListSchema,
};