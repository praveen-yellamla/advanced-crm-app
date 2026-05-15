const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/invite/accept', {
      token: 'e43487cf-3cd3-44ec-acfa-957842dfeda5',
      password: 'password123',
      name: 'New Agent',
      phone: '1234567890'
    });
    console.log('SUCCESS:', res.data);
  } catch (err) {
    console.error('FAILURE:', err.response?.status, err.response?.data);
  }
}

test();
