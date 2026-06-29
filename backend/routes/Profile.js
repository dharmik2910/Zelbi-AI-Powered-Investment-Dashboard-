import express from "express"
const router = express.Router()
import { auth } from "../middleware/auth.js"
import {
  deleteAccount,
  updateProfile,
  updateDisplayPicture,
  getUserDetails,
} from "../controllers/Profile.js"

router.delete("/deleteProfile", auth, deleteAccount)
router.put("/updateProfile", auth, updateProfile)
router.put("/updateDisplayPicture", auth, updateDisplayPicture)
router.get("/getUserDetails", auth, getUserDetails)

export default router