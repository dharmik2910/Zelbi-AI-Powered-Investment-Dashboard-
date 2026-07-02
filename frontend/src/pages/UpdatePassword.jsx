import { useMemo, useState } from "react"
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai"
import { BiArrowBack } from "react-icons/bi"
import { useDispatch, useSelector } from "react-redux"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { resetPassword } from "../services/operations/authAPI"
import PasswordChecklist from "../components/PasswordChecklist"
import PasswordMatchIndicator from "../components/PasswordMatchIndicator"

function UpdatePassword() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const location = useLocation()
  const { loading } = useSelector((state) => state.auth)
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { password, confirmPassword } = formData

  const checklist = useMemo(() => {
    return [
      { key: "length", label: "At least 8 characters", met: password.length >= 8 },
      { key: "upper", label: "One uppercase letter", met: /[A-Z]/.test(password) },
      { key: "lower", label: "One lowercase letter", met: /[a-z]/.test(password) },
      { key: "number", label: "One number", met: /\d/.test(password) },
      { key: "special", label: "One special character", met: /[^A-Za-z0-9]/.test(password) },
    ]
  }, [password])

  const isStrong = checklist.every((req) => req.met)
  const passwordsMatch = password && confirmPassword && password === confirmPassword
  const canSubmit = isStrong && passwordsMatch

  const handleOnChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value,
    }))
  }

  const handleOnSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
    const token = location.pathname.split("/").at(-1)
    dispatch(resetPassword(password, confirmPassword, token, navigate))
  }

  return (
    <div className="grid min-h-[calc(100vh-3.5rem)] place-items-center">
      {loading ? (
        <div className="spinner"></div>
      ) : (
        <div className="relative z-10 w-full max-w-[380px] md:max-w-md mx-auto mt-10 md:mt-20 px-6 py-8 md:p-7 rounded-md md:rounded-md bg-gradient-to-br from-[#141414] to-[#111111] text-white">
          <h1 className="text-[1.875rem] font-semibold leading-[2.375rem] text-center text-[#3affa3] mb-2">
            Choose new password
          </h1>
          <p className="my-4 text-md leading-[1.625rem] text-richblack-100">
            Almost done. Enter your new password and you're all set.
          </p>
          <form onSubmit={handleOnSubmit}>
            <label className="relative">
              <p className="mb-1 text-[0.875rem] leading-[1.375rem] text-richblack-5">
                New Password <sup className="text-pink-200">*</sup>
              </p>
              <input
                required
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={handleOnChange}
                placeholder="Enter Password"
                // className="form-style w-full !pr-10 !bg-[#1E1E1E] text-white  hover:border-[#3affa3]" />
                className="form-style w-full !pr-10 !bg-[#1E1E1E] text-white !border-0 !shadow-none focus:!border-0 focus:!ring-0"
              />
              <span
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-[38px] z-[10] cursor-pointer"
              >
                {showPassword ? (
                  <AiOutlineEyeInvisible fontSize={24} fill="#AFB2BF" />
                ) : (
                  <AiOutlineEye fontSize={24} fill="#AFB2BF" />
                )}
              </span>
            </label>

            <PasswordChecklist password={password} checklist={checklist} isStrong={isStrong} />

            <label className="relative mt-3 block">
              <p className="mb-1 text-[0.875rem] leading-[1.375rem] text-richblack-5">
                Confirm New Password <sup className="text-pink-200">*</sup>
              </p>
              <input
                required
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={confirmPassword}
                onChange={handleOnChange}
                placeholder="Confirm Password"
                // className="form-style w-full !pr-10 !bg-[#1E1E1E] text-white  hover:border-[#3affa3] mb-2"
              className="form-style w-full !pr-10 !bg-[#1E1E1E] text-white !border-0 !shadow-none focus:!border-0 focus:!ring-0"

              />
              <span
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-[38px] z-[10] cursor-pointer"
              >
                {showConfirmPassword ? (
                  <AiOutlineEyeInvisible fontSize={24} fill="#AFB2BF" />
                ) : (
                  <AiOutlineEye fontSize={24} fill="#AFB2BF" />
                )}
              </span>
            </label>

            <div className="mt-2">
              <PasswordMatchIndicator password={password} confirmPassword={confirmPassword} />
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className={`mt-6 w-full rounded-full py-[12px] px-[12px] font-medium transition-colors ${canSubmit
                  ? "bg-[#3affa3] text-richblack-900 hover:bg-[#2de88f]"
                  : "bg-richblack-500 text-richblack-300 cursor-not-allowed"
                }`}
            >
              Reset Password
            </button>
          </form>
          <div className="mt-6 flex items-center text-center justify-center">
            <Link to="/login">
              <p className="flex items-center gap-x-2 text-sm text-[#3affa3] hover:text-[#2de88f] transition-colors">
                <BiArrowBack /> Back to Login
              </p>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default UpdatePassword