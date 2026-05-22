require('dotenv').config();
const { uploadToCloudinary } = require('./src/utils/cloudinary');

async function test() {
  try {
    const fakeBuffer = Buffer.from("fake image data");
    const url = await uploadToCloudinary(fakeBuffer);
    console.log("Success:", url);
  } catch (err) {
    console.error("Cloudinary Error:", err);
  }
}

test();
