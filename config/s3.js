const { S3Client, PutObjectCommand, DeleteObjectCommand }=require("@aws-sdk/client-s3")

const s3=new S3Client({
    region:process.env.AWS_REGION,
    credentials:{
        accessKeyId:process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY
    }
})

async function uploadToS3(file) {
    const fileName=Date.now()+"-"+file.originalname;

    const command= new PutObjectCommand({
        Bucket:process.env.S3_BUCKET_NAME,
        Key:fileName,
        Body:file.buffer,
        ContentType:file.mimetype
    })
    await s3.send(command)
    return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`
}
async function deleteFromS3(fileUrl) {
    if (!fileUrl) return;

    const key = fileUrl.split(".amazonaws.com/")[1];

    const command = new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key
    })

    await s3.send(command)
}
module.exports={uploadToS3,deleteFromS3}