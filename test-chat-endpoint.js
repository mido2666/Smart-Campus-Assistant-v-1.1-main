// Quick test script to verify chat endpoint is working
import fetch from 'node-fetch';

const testChat = async () => {
  try {
    console.log('Testing chat endpoint...');
    
    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello',
        lang: 'en'
      }),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ Chat endpoint is working!');
    } else {
      console.log('❌ Chat endpoint returned error');
    }
  } catch (error) {
    console.error('❌ Error testing chat endpoint:', error.message);
    console.log('\n💡 Make sure the server is running:');
    console.log('   node server/simple-auth-server.js');
  }
};

testChat();

