const axios = require('axios');

function buildTraceHeaders(requestId) {
  const headers = {
    'X-Service-Name': 'hft-backend',
  };

  if (requestId) {
    headers['X-Request-ID'] = requestId;
  }

  return headers;
}

function createAxiosInstance(requestId) {
  return axios.create({
    timeout: 5000,
    headers: buildTraceHeaders(requestId),
  });
}

module.exports = {
  buildTraceHeaders,
  createAxiosInstance,
};
