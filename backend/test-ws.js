const WebSocket = require('ws');
const axios = require('axios');

async function testWebSocket() {
  try {
    // Login first to get token
    const loginRes = await axios.post('http://localhost:3001/auth/login', {
      username: 'admin',
      password: 'admin'
    });
    
    const token = loginRes.data.token;
    console.log('✅ Got auth token');
    
    // Connect to WebSocket with token
    const ws = new WebSocket(`ws://localhost:3002?token=${token}`);
    
    ws.on('open', () => {
      console.log('✅ WebSocket connected');
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data);
      console.log('📨 WebSocket message received:', message.type);
      
      if (message.type === 'AUTH_SUCCESS') {
        console.log('✅ WebSocket authenticated successfully');
        ws.close();
        process.exit(0);
      }
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
      process.exit(1);
    });
    
    setTimeout(() => {
      console.error('❌ WebSocket test timeout');
      process.exit(1);
    }, 5000);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testWebSocket();
