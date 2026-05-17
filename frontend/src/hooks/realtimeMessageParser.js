export const getRealtimePayload = (message) => {
  if (!message || typeof message !== 'object') return message;

  switch (message.type) {
    case 'ai-prediction':
      return message.prediction || message.data || message;
    case 'arbitrage-signal':
      return message.signal || message.data || message;
    case 'smartmoney-signal':
      return message.signal || message.data || message;
    case 'price-update':
      return message.price || message.data || message;
    case 'trade-retry':
      return message;
    default:
      return message;
  }
};
