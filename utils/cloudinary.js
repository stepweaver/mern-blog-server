const cloudinary = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY
});

const cloudinaryUploadImg = (fileToUpload) => {
  return cloudinary.uploader.upload(fileToUpload, {
    resource_type: 'auto'
  })
    .then((data) => {
      return {
        url: data?.secure_url
      };
    })
    .catch((error) => {
      return error;
    });
};

module.exports = cloudinaryUploadImg;