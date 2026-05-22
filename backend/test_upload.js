const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const prisma = require('./src/config/prisma');
const jwt = require('jsonwebtoken');

require('dotenv').config();

async function testUpload() {
  try {
    // Get a real active token
    const session = await prisma.session.findFirst({ where: { isActive: true } });
    if (!session) return console.error("No active session found");
    const token = session.token;

    // Create a 1x1 png image
    const imgBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
    
    const form = new FormData();
    form.append('avatar', imgBuffer, { filename: 'test.png', contentType: 'image/png' });

    const response = await axios.post('http://localhost:5000/api/profile/avatar', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });

    console.log("Success:", response.data);
  } catch (error) {
    if (error.response) {
      console.error("HTTP Error:", error.response.status, error.response.data);
    } else {
      console.error("Network Error:", error.message);
    }
  }
}

testUpload();
