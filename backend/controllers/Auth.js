import bcrypt from "bcryptjs";
import User from "../models/User.js";
import OTP from "../models/OTP.js";
import jwt from "jsonwebtoken";
import otpGenerator from "otp-generator";
import mailSender from "../utils/mailSender.js";
import passwordUpdated from "../mail/templates/passwordUpdate.js";
import Profile from "../models/Profile.js";
import dotenv from "dotenv";
import { populateUserImage } from "../utils/userHelper.js";
import { refreshSubscriptionState } from "../utils/subscription.js";

dotenv.config();

export const signup = async (req, res) => {
  try {
    console.log("inside Signup");
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      otp,
      acceptedTerms,
    } = req.body;

    if (
      !email ||
      !password ||
      !confirmPassword ||
      !otp
    ) {
      return res.status(403).json({
        success: false,
        message: "All Fields are required",
      });
    }

    if (!acceptedTerms) {
      return res.status(400).json({
        success: false,
        message: "You must accept the Terms & Conditions.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Password and Confirm Password do not match. Please try again.",
      })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists. Please sign in to continue.",
      })
    }

    const response = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);

    if (response.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Enter correct OTP",
      })
    } else if (otp !== response[0].otp) {
      return res.status(400).json({
        success: false,
        message: "Enter correct OTP",
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null,
    })
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      additionalDetails: profileDetails._id,
      acceptedTerms: true,
      acceptedTermsAt: new Date(),
      termsVersion: "v1.0",
    })

    const populatedUser = await populateUserImage(user);
    return res.status(200).json({
      success: true,
      user: populatedUser,
      message: "User registered successfully",
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      success: false,
      message: "User cannot be registered. Please try again.",
    })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: `Please Fill up All the Required Fields`,
      })
    }

    const user = await User.findOne({ email }).populate("additionalDetails")

    if (!user) {
      return res.status(401).json({
        success: false,
        message: `User is not Registered`,
      })
    }

    if (user.password && await bcrypt.compare(password, user.password)) {
      await refreshSubscriptionState(user)
      const token = jwt.sign(
        { email: user.email, id: user._id, role: user.role },
        process.env.JWT_SECRET,
        {
          expiresIn: "24h",
        }
      )

      user.token = token
      user.password = undefined

      const options = {
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      }
      const populatedUser = await populateUserImage(user);
      res.cookie("token", token, options).status(200).json({
        success: true,
        token,
        user: populatedUser,
        message: `User Login Success`,
      })
    } else {
      return res.status(401).json({
        success: false,
        message: `Password is incorrect`,
      })
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      success: false,
      message: `Login Failure Please Try Again`,
    })
  }
}

export const sendotp = async (req, res) => {
  try {
    const { email } = req.body

    const checkUserPresent = await User.findOne({ email })

    if (checkUserPresent) {
      return res.status(401).json({
        success: false,
        message: `User is Already Registered`,
      })
    }

    // OTPs are looked up by email, so they don't need to be globally unique
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    })

    await OTP.create({ email, otp })
    res.status(200).json({
      success: true,
      message: `OTP Sent Successfully`,
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({ success: false, error: error.message })
  }
}

export const googleAuth = async (req, res) => {
  try {
    const {
      access_token,        // was: token
      acceptedTerms,
    } = req.body;

    if (!access_token) {   // was: if (!token)
      return res.status(400).json({
        success: false,
        message: "Google token is required",
      });
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      console.error("GOOGLE_CLIENT_ID is not set");
      return res.status(500).json({
        success: false,
        message: "Google sign in is not configured",
      });
    }

    // Make sure the token was issued to our app, not to some other Google client
    const tokenInfoResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(access_token)}`
    );
    const tokenInfo = tokenInfoResponse.ok ? await tokenInfoResponse.json() : null;
    if (!tokenInfo || tokenInfo.aud !== googleClientId) {
      return res.status(401).json({
        success: false,
        message: "Invalid Google token",
      });
    }

    // Fetch the user's profile with the verified access token
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    if (!response.ok) {
      return res.status(401).json({
        success: false,
        message: "Invalid Google token",
      });
    }

    const googleData = await response.json();

    // Extract user information from Google
    const { email, email_verified, given_name, family_name, picture, sub } = googleData;

    if (!email || !email_verified || sub !== tokenInfo.sub) {
      return res.status(401).json({
        success: false,
        message: "Your Google email address is not verified",
      });
    }

    let user = await User.findOne({ email }).populate("additionalDetails");
    const isNewLink = Boolean(user && !user.googleId);

    if (user) {
      // Existing user
      if (user.googleId && user.googleId !== sub) {
        return res.status(401).json({
          success: false,
          message: "This email is linked to a different Google account",
        });
      }
      if (!user.googleId) {
        user.googleId = sub;
        user.image = picture || user.image;
        await user.save();
      }
    } else {
      // New user — create account, terms not yet accepted
      const profileDetails = await Profile.create({
        gender: null,
        dateOfBirth: null,
        about: null,
        contactNumber: null,
      });

      user = await User.create({
        email,
        firstName: given_name || "",
        lastName: family_name || "",
        googleId: sub,
        image: picture,
        additionalDetails: profileDetails._id,
        acceptedTerms: Boolean(acceptedTerms),
        acceptedTermsAt: acceptedTerms ? new Date() : null,
        termsVersion: acceptedTerms ? "v1.0" : null,
      });
    }

    await refreshSubscriptionState(user);

    // Generate JWT token
    const jwtToken = jwt.sign(
      { email: user.email, id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    user.token = jwtToken;
    user.password = undefined;

    const options = {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    };

    const populatedUser = await populateUserImage(user);
    res.cookie("token", jwtToken, options).status(200).json({
      success: true,
      token: jwtToken,
      user: populatedUser,
      requiresTermsAcceptance: !user.acceptedTerms,
      message: isNewLink ? "Google Account Linked Successfully" : "Google Sign In Success",
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    return res.status(500).json({
      success: false,
      message: "Google authentication failed. Please try again.",
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userDetails = await User.findById(req.user.id)
    if (!userDetails) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    const { oldPassword, newPassword } = req.body
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" })
    }

    if (!userDetails.password) {
      return res.status(400).json({
        success: false,
        message: "This account uses Google sign in. Use \"Forgot password\" to set a password.",
      })
    }

    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      userDetails.password
    )
    if (!isPasswordMatch) {
      return res
        .status(401)
        .json({ success: false, message: "The password is incorrect" })
    }

    const encryptedPassword = await bcrypt.hash(newPassword, 10)
    const updatedUserDetails = await User.findByIdAndUpdate(
      req.user.id,
      { password: encryptedPassword },
      { new: true }
    )

    try {
      const emailResponse = await mailSender(
        updatedUserDetails.email,
        "Password for your account has been updated",
        passwordUpdated(
          updatedUserDetails.email,
          `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
        )
      )
      console.log("Email sent successfully:", emailResponse.response)
    } catch (error) {
      // The password is already changed, so don't report failure to the user
      console.error("Error occurred while sending email:", error)
    }

    return res
      .status(200)
      .json({ success: true, message: "Password updated successfully" })
  } catch (error) {
    console.error("Error occurred while updating password:", error)
    return res.status(500).json({
      success: false,
      message: "Error occurred while updating password",
      error: error.message,
    })
  }
}

export const acceptTerms = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        acceptedTerms: true,
        acceptedTermsAt: new Date(),
        termsVersion: "v1.0",
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const populatedUser = await populateUserImage(user);

    return res.status(200).json({
      success: true,
      user: populatedUser,
      message: "Terms accepted successfully",
    });
  } catch (error) {
    console.error("Accept Terms Error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not update terms acceptance",
    });
  }
};