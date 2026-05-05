const axios = require('axios');
async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/webhooks/leads', {
      name: "Brand New Lead",
      email: "new.brand_" + Date.now() + "@example.com",
      phone: "1122334455"
    });
    console.log('SUCCESS:', res.data);
  } catch (err) {
    console.log('ERROR:', err.response?.data || err.message);
  }
}
test();
