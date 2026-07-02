import { useState } from "react";
import { toast } from "react-hot-toast";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { sendOtp } from "../../../services/operations/authAPI";
import { setSignupData } from "../../../slices/authSlice";
import usePasswordValidation from "../../../hooks/usePasswordValidation";
import PasswordChecklist from "../../PasswordChecklist";
import PasswordMatchIndicator from "../../PasswordMatchIndicator";

const SignupForm = ({ onSwitchToLogin, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { email, password, confirmPassword } = formData;

  const { checklist: passwordChecklist, isStrong: isPasswordStrong } =
    usePasswordValidation(password);

  const isFormValid =
    email.trim() !== "" &&
    isPasswordStrong &&
    confirmPassword !== "" &&
    password === confirmPassword;

  const handleOnChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

const handleOnSubmit = (e) => {
    e.preventDefault();

    if (!isPasswordStrong) {
      toast.error("Password doesn't meet the requirements.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords Do Not Match");
      return;
    }

    const signupData = { ...formData };

    dispatch(setSignupData(signupData));

    dispatch(
      sendOtp(email, () => {
        navigate("/verify-email");
      })
    );
  };

  return (
<div className="relative z-10 w-full max-w-[380px] md:max-w-lg mx-auto mt-20 px-4 py-6 md:p-7 rounded-2xl md:rounded-md bg-gradient-to-br from-[#141414] to-[#111111] text-white">      <h2 className="text-2xl md:text-3xl mt-2 font-bold text-center mb-6 text-[#3affa3]">
        Join Zelbi
      </h2>

      <form onSubmit={handleOnSubmit} className="flex flex-col gap-y-5 w-full">
        {/* Email */}
        <label className="w-full">
          <p className="mb-2 text-sm text-gray-300">
            Email Address
          </p>

          <input
            required
            type="email"
            name="email"
            value={email}
            onChange={handleOnChange}
            placeholder="Enter email address"
            className="w-full rounded-lg bg-[#212121]/80 p-3 text-white focus:outline-none focus:ring-2 focus:ring-[#3affa3] transition-all duration-300"
          />
        </label>

        {/* Password */}
        <label className="w-full relative">
          <p className="mb-2 text-sm text-gray-300">
            Password
          </p>

          <input
            required
            type={showPassword ? "text" : "password"}
            name="password"
            value={password}
            onChange={handleOnChange}
            placeholder="Enter password"
            className="w-full rounded-lg bg-[#212121]/80 p-3 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-[#3affa3] transition-all duration-300"
          />

          <span
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-4 top-[42px] text-gray-400 cursor-pointer"
          >
            {showPassword ? (
              <AiOutlineEyeInvisible size={22} />
            ) : (
              <AiOutlineEye size={22} />
            )}
          </span>
        </label>

        <PasswordChecklist
          password={password}
          checklist={passwordChecklist}
          isStrong={isPasswordStrong}
        />

        {/* Confirm Password */}
        <label className="w-full relative">
          <p className="mb-2 text-sm text-gray-300">
            Confirm Password
          </p>

          <input
            required
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={confirmPassword}
            onChange={handleOnChange}
            placeholder="Confirm password"
            className="w-full rounded-lg bg-[#212121]/80 p-3 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-[#3affa3] transition-all duration-300"
          />

          <span
            onClick={() =>
              setShowConfirmPassword((prev) => !prev)
            }
            className="absolute right-4 top-[42px] text-gray-400 cursor-pointer"
          >
            {showConfirmPassword ? (
              <AiOutlineEyeInvisible size={22} />
            ) : (
              <AiOutlineEye size={22} />
            )}
          </span>
        </label>

         <PasswordMatchIndicator
          password={password}
          confirmPassword={confirmPassword}
        />

        {/* Submit */}
        <button
          type="submit"
          disabled={!isFormValid}
          className="mt-2 py-3 px-6 rounded-full font-semibold text-black bg-[#3affa3] hover:bg-[#32e092] active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#3affa3]"
        >
          Create Account
        </button>

        {/* Login Link */}
        <p className="text-center text-sm text-white mt-1">
          Already have an account?{" "}
          <span
            onClick={onSwitchToLogin}
            className="text-[#3affa3] cursor-pointer hover:underline"
          >
            Login
          </span>
        </p>
      </form>
    </div>
  );
};

export default SignupForm;