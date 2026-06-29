import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import path from "path";

// Initialize S3 Client using environment variables
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Uploads a file to S3 and returns the S3 object key.
 * @param {Object} file - The file object from express-fileupload (req.files.file)
 * @param {string} folder - The folder/prefix in the S3 bucket
 * @returns {Promise<string>} - The S3 object key
 */
export const uploadFile = async (file, folder) => {
  try {
    const fileStream = fs.createReadStream(file.tempFilePath);
    const fileExtension = path.extname(file.name);
    // Generate a unique S3 object key
    const key = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 15)}${fileExtension}`;

    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: fileStream,
      ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    return key; // Return only the S3 key
  } catch (error) {
    console.error("Error in S3 uploadFile:", error);
    throw error;
  }
};

/**
 * Deletes a file from S3 using its object key.
 * @param {string} key - The S3 object key
 * @returns {Promise<void>}
 */
export const deleteFile = async (key) => {
  try {
    if (!key) return;
    
    // Skip deleting if it's a full URL (like default profile avatars or external OAuth images)
    if (key.startsWith("http")) return;

    const deleteParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    };
    
    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);
    console.log(`Successfully deleted file from S3: ${key}`);
  } catch (error) {
    console.error(`Error in S3 deleteFile for key ${key}:`, error);
    // Do not throw, just log to prevent breaking the flow if S3 delete fails
  }
};

/**
 * Generates a pre-signed GET URL for an S3 object key (1-hour expiry).
 * @param {string} key - The S3 object key
 * @returns {Promise<string|null>} - The pre-signed URL or null
 */
export const generateSignedUrl = async (key) => {
  try {
    if (!key) return null;
    
    // If the key is already a full external URL, return it as is
    if (key.startsWith("http")) {
      return key;
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });

    // Generate pre-signed URL with 3600 seconds (1 hour) expiry
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return signedUrl;
  } catch (error) {
    console.error(`Error generating signed URL for key ${key}:`, error);
    return null;
  }
};
