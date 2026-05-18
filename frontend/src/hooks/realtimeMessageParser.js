export const getRealtimePayload = (message) => {
  if (!message || typeof message !== 'object') return message;

  switch (message.type) {
    case 'ai-prediction':
    case 'AI_PREDICTION':
      return message.prediction || message.data || message;
    case 'ai-signal':
    case 'AI_SIGNAL':
      return message.signal || message.data || message;
    case 'arbitrage-signal':
    case 'ARBITRAGE_SIGNAL':
      return message.signal || message.data || message;
    case 'smartmoney-signal':
    case 'SMARTMONEY_SIGNAL':
      return message.signal || message.data || message;
    case 'price-update':
    case 'PRICE_UPDATE':
      return message.price || message.data || message;
    case 'trade-retry':
    case 'TRADE_RETRY':
      return message;
    default:
      return message;
  }
};
