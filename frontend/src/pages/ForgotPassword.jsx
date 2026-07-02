import { useState } from "react"
import { BiArrowBack } from "react-icons/bi"
import { useDispatch, useSelector } from "react-redux"
import { Link } from "react-router-dom"

import { getPasswordResetToken } from "../services/operations/authAPI"

function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [emailSent, setEmailSent] = useState(false)
  const dispatch = useDispatch()
  const { loading } = useSelector((state) => state.auth)

  const handleOnSubmit = (e) => {
    e.preventDefault()
    dispatch(getPasswordResetToken(email, setEmailSent))
  }

  return (
    <div className="grid min-h-[calc(100vh-3.5rem)] place-items-center bg-black px-4">
      {loading ? (
        <div className="spinner"></div>
      ) : (
<div className="relative z-10 w-full max-w-[380px] md:max-w-md mx-auto mt-10 md:mt-20 px-6 py-8 md:p-7 rounded-md md:rounded-md bg-gradient-to-br from-[#141414] to-[#111111] text-white">      
          <h1 className="text-3xl font-bold text-center text-[#3affa3]">
            {!emailSent ? "Reset your password" : "Check your email"}
          </h1>
          <p className="mt-3 mb-7 text-center text-sm leading-6 text-richblack-300">
            {!emailSent
              ? "Have no fear. We'll email you instructions to reset your password. If you don't have access to your email, we can try account recovery."
              : `We've sent a reset link to ${email}.`}
          </p>

          <form onSubmit={handleOnSubmit}>
            {!emailSent && (
              <label className="block">
                <p className="mb-1.5 text-sm font-medium text-white">
                  Email Address <sup className="text-pink-200">*</sup>
                </p>
                <input
                  required
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full rounded-lg bg-[#1c1c1c] border border-white/10 px-4 py-3 text-white placeholder:text-richblack-400 outline-none transition-colors focus:border-[#3affa3]/60 focus:ring-1 focus:ring-[#3affa3]/30"
                />
              </label>
            )}

            <button
              type="submit"
              className="mt-6 w-full rounded-full bg-[#3affa3] py-3 font-semibold text-black hover:bg-[#2de88f] active:scale-95 transition-all duration-200"
            >
              {!emailSent ? "Submit" : "Resend Email"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center">
            <Link to="/login">
              <p className="flex items-center gap-x-2 text-sm text-[#3affa3] hover:text-[#2de88f] transition-colors">
                <BiArrowBack /> Back To Login
              </p>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default ForgotPassword