const axios = require('axios');
const FormData = require('form-data');

async function run() {
  try {
    const imgBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
    const form = new FormData();
    form.append('avatar', imgBuffer, { filename: 'test.png', contentType: 'image/png' });

    const response = await axios.post('http://localhost:5001/upload', form, {
      headers: form.getHeaders()
    });
    console.log("Success:", response.data);
  } catch (err) {
    if (err.response) {
      console.log("Error:", err.response.data);
    } else {
      console.log("Req Error:", err.message);
    }
  }
}
run();
