import { generateSignedUrl } from "./s3Uploader.js";

/**
 * Converts a user Mongoose document or object to a plain object and
 * populates the `image` field with a temporary S3 pre-signed URL if it's an S3 key.
 * @param {Object} userDoc - The user Mongoose document or plain object
 * @returns {Promise<Object|null>} - The user object with populated pre-signed image URL
 */
export const populateUserImage = async (userDoc) => {
  if (!userDoc) return null;

  // Convert Mongoose document to plain JS object to safely modify properties
  const user = userDoc.toObject ? userDoc.toObject() : { ...userDoc };

  if (user.image) {
    // Generate pre-signed S3 URL (if it's a key, not a full external URL)
    const signedUrl = await generateSignedUrl(user.image);
    if (signedUrl) {
      user.image = signedUrl;
    }
  }

  return user;
};
