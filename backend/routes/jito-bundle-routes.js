const express = require('express');
const router = express.Router();
const JitoBundleModel = require('../models/jito-bundle.model');

// Create a new Jito bundle
router.post('/jito-bundles', async (req, res) => {
  try {
    const bundle = await JitoBundleModel.create(req.body);
    res.status(201).json(bundle);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get bundles for a specific wallet (wallet_id passed as query param)
router.get('/jito-bundles', async (req, res) => {
  try {
    const { wallet_id } = req.query;
    if (wallet_id) {
      const bundles = await JitoBundleModel.getByWallet(wallet_id);
      return res.json(bundles);
    }
    // If no wallet_id, return pending bundles
    const pending = await JitoBundleModel.getPendingBundles();
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a bundle by its ID
router.get('/jito-bundles/:id', async (req, res) => {
  try {
    const bundle = await JitoBundleModel.getById(req.params.id);
    if (!bundle) return res.status(404).json({ error: 'Bundle not found' });
    res.json(bundle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get bundle statistics for a wallet (wallet_id query param required)
router.get('/jito-bundles/:id/stats', async (req, res) => {
  try {
    const { wallet_id } = req.query;
    if (!wallet_id) return res.status(400).json({ error: 'wallet_id query param required' });
    const stats = await JitoBundleModel.getBundleStats(wallet_id);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;