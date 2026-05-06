const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('https://advanced-crm-app.onrender.com/api/admin/invites', {
      name: 'praveen',
      email: 'yp.yadav0786@gmail.com',
      role: 'AGENT'
    });
    console.log("Success:", res.data);
  } catch (err) {
    if (err.response) {
      console.log("Status:", err.response.status);
      console.log("Data:", err.response.data);
    } else {
      console.log("Error:", err.message);
    }
  }
}

test();
