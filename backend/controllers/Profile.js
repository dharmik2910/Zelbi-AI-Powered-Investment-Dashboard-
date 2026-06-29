import Profile from "../models/Profile.js"
import User from "../models/User.js"
import { uploadFile, deleteFile } from "../utils/s3Uploader.js"
import { populateUserImage } from "../utils/userHelper.js"
import mongoose from "mongoose"

export const updateProfile = async (req, res) => {
  try {
    const {
      firstName = "",
      lastName = "",
      dateOfBirth = "",
      about = "",
      contactNumber = "",
      gender = "",
    } = req.body
    const id = req.user.id

    // Find the profile by id
    const userDetails = await User.findById(id)
    const profile = await Profile.findById(userDetails.additionalDetails)

    const user = await User.findByIdAndUpdate(id, {
      firstName,
      lastName,
    })
    await user.save()

    // Update the profile fields
    profile.dateOfBirth = dateOfBirth
    profile.about = about
    profile.contactNumber = contactNumber
    profile.gender = gender

    // Save the updated profile
    await profile.save()

    // Find the updated user details
    const updatedUserDetailsDoc = await User.findById(id)
      .populate("additionalDetails")
      .exec()

    // Populate user image with pre-signed S3 URL before returning
    const updatedUserDetails = await populateUserImage(updatedUserDetailsDoc)

    return res.json({
      success: true,
      message: "Profile updated successfully",
      updatedUserDetails,
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

export const deleteAccount = async (req, res) => {
  try {
    const id = req.user.id
    console.log(id)
    const user = await User.findById({ _id: id })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Delete the S3 profile image if it exists
    if (user.image) {
      await deleteFile(user.image)
    }

    // Delete Associated Profile with the User
    await Profile.findByIdAndDelete({
      _id: new mongoose.Types.ObjectId(user.additionalDetails),
    })
    
    // Now Delete User
    await User.findByIdAndDelete({ _id: id })
    
    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    console.log(error)
    res
      .status(500)
      .json({ success: false, message: "User Cannot be deleted successfully" })
  }
}

export const updateDisplayPicture = async (req, res) => {
  try {
    const displayPicture = req.files.displayPicture
    const userId = req.user.id

    // 1. Get the current user to find their old S3 image key
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // 2. Delete the old image from S3 if it exists and is an S3 key
    if (user.image) {
      await deleteFile(user.image)
    }

    // 3. Upload the new image to S3 and get the key
    const imageKey = await uploadFile(
      displayPicture,
      process.env.FOLDER_NAME
    )
    console.log("Uploaded new S3 key:", imageKey)

    // 4. Update the user's image key in MongoDB
    const updatedProfileDoc = await User.findByIdAndUpdate(
      { _id: userId },
      { image: imageKey },
      { new: true }
    )

    // 5. Populate the user's image with a pre-signed URL for the response
    const updatedProfile = await populateUserImage(updatedProfileDoc)

    res.send({
      success: true,
      message: `Image Updated successfully`,
      data: updatedProfile,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export const getUserDetails = async (req, res) => {
  try {
    const id = req.user.id
    const userDetailsDoc = await User.findById(id)
      .populate("additionalDetails")
      .exec()
    if (!userDetailsDoc) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }
    const userDetails = await populateUserImage(userDetailsDoc)
    return res.status(200).json({
      success: true,
      message: "User data fetched successfully",
      data: userDetails,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}
