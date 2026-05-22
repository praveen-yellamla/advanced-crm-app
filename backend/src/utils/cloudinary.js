const cloudinary = require("cloudinary").v2;

const uploadToCloudinary = async (fileBuffer) => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
  });

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "crm_profiles" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    ).end(fileBuffer);
  });
};

module.exports = { cloudinary, uploadToCloudinary };
