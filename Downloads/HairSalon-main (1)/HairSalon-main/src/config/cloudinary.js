const cloudinary = require("cloudinary").v2;

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: "dg9x3f2ve",
  api_key: "198661871665961",
  api_secret: "FxDzYxAha12eny3L_a1pTsX6YjQ",
});

module.exports = cloudinary;
