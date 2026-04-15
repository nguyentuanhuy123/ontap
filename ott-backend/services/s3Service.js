const multer = require("multer");
const multerS3 = require("multer-s3");
const { s3 } = require("../config/awsConfig");

const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.S3_BUCKET,
    acl: "public-read",
    key: (req, file, cb) => {
      cb(null, `avatars/${Date.now()}-${file.originalname}`);
    }
  })
});

module.exports = { upload };