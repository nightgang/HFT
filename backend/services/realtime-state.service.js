/**
 * RealtimeStateService — Shared Realtime Data Layer (Single Source of Truth)
 *
 * Architecture:
 *  - Singleton state store holding the authoritative view of:
 *      activeTrades, walletBalances, pnlSummary,
 *      autoTradeStatus, riskStatus, tokenDetections, priceUpdates
 *  - Subscribes to every EventBus channel at init time, so it always mirrors
 *    the most recent payload from any producer.
 *  - onChange(callback) - consumer hooks for
 *    live dashboards, REST handlers, CLI terminals, and any other consumer.
 *  - getSnapshot() - returns the full current state atomically; used by
 *    REST endpoints as well as the dashboard store.
 *  - hydrateFromRedis() / persistToRedis() - optional dehydration to Redis
 *    so the full state survives a warm restart.
 *
 * EventBus channels consumed:
 *   token.detected | trade.executed | trade.failed | trade.retry |
 *   price.update  | pnl.update    | risk.alert   | risk.approved |
 *   katana.status | ai.prediction| autotrade-status | arbitrage.signal |
 *   smartmoney.signal | system-status
 */
const logger = require('../../utils/logger');

// ── Channel → handled-state-key mapping ────────────────────────────────────────
const CHANNEL_MAP = {
  'token.detected':  'lastTokenDetection',
  'trade.executed':  'lastTradeExecuted',
  'trade.failed':    'lastTradeFailed',
  'trade.retry':     'lastTradeRetry',
  'price.update':    'lastPriceUpdate',
  'pnl.update':      'lastPnlUpdate',
  'risk.alert':      'lastRiskAlert',
  'risk.approved':   'lastRiskAlert',   // same bucket
  'katana.status':   'lastKatanaStatus',
  'ai.prediction':   'lastAiPrediction',
  'autotrade-status':'lastAutoTradeStatus',
  'arbitrage.signal':'lastArbitrageSignal',
  'smartmoney.signal':'lastSmartMoneySignal',
  'system-status':   'lastSystemStatus',
};

// ── Default (zero-value) state ─────────────────────────────────────────────────
const ZERO_STATE = {
  activeTrades:        [],
  walletBalances:      {},
  pnlSummary:          { totalPnL: 0, totalInvested: 0, pnlPercentage: 0, activeTrades: 0 },
  autoTradeStatus:     { enabled: false, status: 'OFF', timestamp: null },
  riskStatus:          { level: 'NORMAL', violations: [], timestamp: null },
  tokenDetections:     [],
  priceUpdates:        [],
  aiPredictions:       [],
  arbitrageSignals:    [],
  smartMoneySignals:   [],
  tradeRetries:        [],
  riskAlerts:          [],
  // Raw last-seen payloads for debugging / finer-grained consumers
  lastTokenDetection:  null,
  lastTradeExecuted:   null,
  lastTradeFailed:     null,
  lastTradeRetry:      null,
  lastPriceUpdate:     null,
  lastPnlUpdate:       null,
  lastRiskAlert:       null,
  lastKatanaStatus:    null,
  lastAiPrediction:    null,
  lastAutoTradeStatus: null,
  lastArbitrageSignal: null,
  lastSmartMoneySignal:null,
  lastSystemStatus:    null,
  // Book-keeping
  updatedAt:           null,
  sequenceNumber:      0,
};

class RealtimeStateService {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();

    this.state = { ...ZERO_STATE };
    this._unsubFns   = [];   // EventBus unsubscribe CALLBACKS
    this._seq         = 0;
    this._started     = false;

    logger.info('[RealtimeStateService] constructed');
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Lifecycle
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Subscribe to every known EventBus channel so the state is always current.
   * Call exactly once after the EventBus client is ready.
   */
  async initialize() {
    if (this._started) return;
    this._started = true;

    try {
      const eventBus = require('../../services/event-bus.service');
      await eventBus.initialize();

      for (const [channel, stateKey] of Object.entries(CHANNEL_MAP)) {
        const unsub = await eventBus.subscribe(channel, (payload) => {
          this._ingest(channel, stateKey, payload);
        });
        this._unsubFns.push(unsub);
      }

      logger.info(`[RealtimeStateService] subscribed to ${Object.keys(CHANNEL_MAP).length} channels`);
    } catch (error) {
      logger.error('[RealtimeStateService] initialize failed:', error);
    }
  }

  async shutdown() {
    for (const unsub of this._unsubFns) {
      try { await unsub(); } catch (_) { /* ignore */ }
    }
    this._unsubFns.length = 0;
    this._started = false;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Ingestion — each channel maps to a typed accumulator
  // ────────────────────────────────────────────────────────────────────────────

  _ingest(channel, stateKey, rawPayload) {
    this._seq++;
    const seq = this._seq;

    // Always update the raw last-seen payload
    this.state[stateKey] = rawPayload;
    this.state.updatedAt  = Date.now();
    this.state.sequenceNumber = seq;

    // Type-specific accumulators ------------------------------------------------
    switch (channel) {
      case 'trade.executed': {
        const trade = this._extractTrade(rawPayload);
        if (trade) {
          // add/replace in activeTrades
          this.state.activeTrades = [
            trade,
            ...this.state.activeTrades.filter(t => t.id !== trade.id),
          ].slice(0, 50);
        }
        break;
      }

      case 'trade.failed': {
        const trade = this._extractTrade(rawPayload);
        if (trade) {
          this.state.activeTrades = this.state.activeTrades.filter(
            t => t.id !== trade.id
          );
          this.state.tradeRetries = [
            trade, ...(this.state.tradeRetries || []),
          ].slice(0, 20);
        }
        break;
      }

      case 'trade.retry':
        this.state.tradeRetries = [
          rawPayload, ...(this.state.tradeRetries || []),
        ].slice(0, 20);
        break;

      case 'price.update':
        this.state.priceUpdates = [
          rawPayload, ...(this.state.priceUpdates || []),
        ].slice(0, 20);
        break;

      case 'pnl.update':
        this.state.lastPnlUpdate = rawPayload;
        if (rawPayload && typeof rawPayload.data === 'object') {
          this.state.pnlSummary = { ...rawPayload.data };
        } else if (rawPayload && typeof rawPayload.pnl === 'object') {
          this.state.pnlSummary = { ...rawPayload.pnl };
        }
        break;

      case 'risk.alert': {
        // risk.alert carries both approvals and rejections; keep only highest severity
        const alertRaw = rawPayload.data || rawPayload.alert || rawPayload;
        this.state.lastRiskAlert   = rawPayload;
        this.state.riskStatus      = {
          level:     this._riskLevelFromAlert(alertRaw),
          violations:[ ...(this.state.riskStatus.violations || []),
                       alertRaw ],
          timestamp: Date.now(),
        };
        break;
      }

      case 'katana.status':
        this.state.lastKatanaStatus = rawPayload;
        break;

      case 'ai.prediction':
        this.state.lastAiPrediction = rawPayload;
        if (rawPayload && typeof rawPayload.prediction === 'object') {
          this.state.aiPredictions = [
            rawPayload.prediction, ...(this.state.aiPredictions || []),
          ].slice(0, 20);
        } else {
          this.state.aiPredictions = [
            rawPayload, ...(this.state.aiPredictions || []),
          ].slice(0, 20);
        }
        break;

      case 'autotrade-status':
        this.state.lastAutoTradeStatus = rawPayload;
        this.state.autoTradeStatus    = {
          enabled:  rawPayload.enabled    ?? rawPayload.AUTO_TRADE ?? false,
          status:   rawPayload.status     ?? rawPayload.status     ?? 'OFF',
          timestamp: Date.now(),
        };
        break;

      case 'arbitrage.signal':
        this.state.arbitrageSignals = [
          rawPayload, ...(this.state.arbitrageSignals || []),
        ].slice(0, 20);
        break;

      case 'smartmoney.signal':
        this.state.smartMoneySignals = [
          rawPayload, ...(this.state.smartMoneySignals || []),
        ].slice(0, 20);
        break;

      case 'system-status':
        this.state.lastSystemStatus = rawPayload;
        break;

      case 'token.detected':
      default:
        this.state.lastTokenDetection = rawPayload;
        this.state.tokenDetections = [
          rawPayload, ...(this.state.tokenDetections || []),
        ].slice(0, 50);
        break;
    }

    // Notify subscribers
    this._notifyAll(channel, rawPayload, seq);
  }

  _extractTrade(raw) {
    const data = raw?.data || raw;
    if (!data) return null;
    return {
      id:        data.tradeId     || data.id          || data.signature,
      tokenMint: data.mint        || data.tokenMint    || '',
      type:      data.type        || data.direction    || '',
      amount:    data.amount,
      signature: data.signature,
      status:    data.status      || 'unknown',
      reason:    data.reason      || null,
      retryable: data.retryable   ?? false,
      timestamp: raw.timestamp    || Date.now(),
    };
  }

  _riskLevelFromAlert(alert) {
    if (!alert) return 'NORMAL';
    const severity = (alert.severity   || alert.alertType || '').toString().toUpperCase();
    const type     = (alert.alertType   || '').toString().toUpperCase();
    if (severity === 'CRITICAL' || severity === 'HIGH' || type === 'RISK_REJECTED') return 'CRITICAL';
    if (severity === 'MEDIUM'  || type === 'RISK_WARNING')  return 'ELEVATED';
    return 'NORMAL';
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Snapshot
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Returns a shallow-cloned snapshot of the full state — the authoritative
   * representation of the system's live state at this instant.
   */
  getSnapshot() {
    return { ...this.state };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Subscription / Listener API
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * `callback(payload, channel, sequenceNumber)` is called on every update.
   * Returns an unsubscribe token (async function).
   */
  subscribe(callback) {
    const fn = async (payload, channel, seq) => { await callback(payload, channel, seq); };
    const id = String(Math.random());
    this._listeners.set(id, fn);
    logger.debug(`[RealtimeStateService] subscriber ${id} registered`);
    return async () => {
      this._listeners.delete(id);
      logger.debug(`[RealtimeStateService] subscriber ${id} removed`);
    };
  }

  _notifyAll(channel, payload, seq) {
    for (const [, fn] of this._listeners) {
      try { void fn(payload, channel, seq); } catch (err) {
        logger.debug(`[RealtimeStateService] listener error: ${err.message}`);
      }
    }
  }

  /**
   * Synchronous one-shot listener (no async usage required in callers).
   * Use for in-process hooks (e.g. websocket broadcasters).
   */
  onChange(callback) {
    const id = String(Math.random());
    const fn = (payload, channel, seq) => callback(this.state, channel, seq);
    this._listeners.set(id, fn);
    return () => this._listeners.delete(id);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Manual overrides (used by REST controllers)
  // ────────────────────────────────────────────────────────────────────────────

  setActiveTrades(trades) {
    this.state.activeTrades = Array.isArray(trades) ? trades : [];
    this._stamp();
  }

  setWalletBalances(balances) {
    this.state.walletBalances = { ...balances };
    this._stamp();
  }

  setAutoTradeStatus(status) {
    this.state.autoTradeStatus   = { ...status, timestamp: Date.now() };
    this.state.lastAutoTradeStatus = status;
    this._stamp();
  }

  setRiskStatus(status) {
    this.state.riskStatus = { ...status, timestamp: Date.now() };
    this._stamp();
  }

  updatePnL(pnl) {
    this.state.pnlSummary   = { ...pnl };
    this.state.lastPnlUpdate = { type: 'PNL_UPDATE', data: pnl, timestamp: Date.now() };
    this._stamp();
  }

  pushTokenDetection(detection) {
    this.state.tokenDetections = [
      detection, ...(this.state.tokenDetections || []),
    ].slice(0, 50);
    this.state.lastTokenDetection = detection;
    this._stamp();
  }

  pushAiPrediction(prediction) {
    this.state.aiPredictions = [
      prediction, ...(this.state.aiPredictions || []),
    ].slice(0, 20);
    this.state.lastAiPrediction = prediction;
    this._stamp();
  }

  _stamp() {
    this._seq++;
    this.state.updatedAt       = Date.now();
    this.state.sequenceNumber  = this._seq;
    this._notifyAll('manual-update', null, this._seq);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Singleton export
// ──────────────────────────────────────────────────────────────────────────────
const realtimeStateService = new RealtimeStateService();

module.exports = realtimeStateService;
