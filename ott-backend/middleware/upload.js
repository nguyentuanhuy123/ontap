const multer = require("multer");
const { Upload } = require("@aws-sdk/lib-storage");
const { s3Client } = require("../config/awsConfig");

const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadToS3 = async (file) => {
  const key = `avatars/${Date.now()}-${file.originalname}`;

  const parallelUpload = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    },
  });

  await parallelUpload.done();

  return `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

module.exports = { upload, uploadToS3 };