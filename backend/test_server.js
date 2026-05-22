require('dotenv').config();
const express = require('express');
const { uploadToCloudinary } = require('./src/utils/cloudinary');
const multer = require('multer');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.post('/upload', upload.single('avatar'), async (req, res) => {
  try {
    const url = await uploadToCloudinary(req.file.buffer);
    res.json({ url });
  } catch (err) {
    console.error("DEBUG ERROR:", err);
    res.status(500).json({ error: String(err), stack: err.stack, details: err });
  }
});

app.listen(5001, () => console.log('Test server running on 5001'));
