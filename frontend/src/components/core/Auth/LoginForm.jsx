import { useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../../services/operations/authAPI";

function LoginForm() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const { email, password } = formData;

  const onSwitchToSignup = () => {
    navigate("/signup");
  };

  const handleOnChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value,
    }));
  };

  const handleOnSubmit = (e) => {
    e.preventDefault();
    dispatch(login(email, password, navigate));
  };

  return (
<div className="relative z-10 w-full max-w-[380px] md:max-w-lg mx-auto mt-40 md:mt-20 px-6 py-8 md:p-7 rounded-2xl md:rounded-md bg-gradient-to-br from-[#141414] to-[#111111] text-white">      <h2 className="text-2xl md:text-3xl mt-2 font-bold text-center mb-6 text-[#3affa3]">
        Welcome Back
      </h2>

      <form onSubmit={handleOnSubmit} className="flex flex-col gap-y-5 w-full">
        {/* Email */}
        <label className="w-full">
          <p className="mb-2 text-sm text-gray-300">
            Email Address <span className="text-pink-400">*</span>
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
            Password <span className="text-pink-400">*</span>
          </p>

          <input
            required
            type={showPassword ? "text" : "password"}
            name="password"
            value={password}
            onChange={handleOnChange}
            placeholder="Enter Password"
            className="w-full rounded-lg bg-[#212121]/80 p-3 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-[#3affa3] transition-all duration-300"
          />

          <span
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-4 top-[42px] text-gray-400 cursor-pointer"
          >
            {showPassword ? (
              <AiOutlineEyeInvisible fontSize={22} />
            ) : (
              <AiOutlineEye fontSize={22} />
            )}
          </span>

          <Link to="/forgot-password">
            <p className="mt-2 ml-auto max-w-max text-sm text-[#3affa3] hover:underline">
              Forgot Password?
            </p>
          </Link>
        </label>

        {/* Login Button */}
        <button
          type="submit"
          className="mt-2 py-3 px-6 rounded-full font-semibold text-black bg-[#3affa3] hover:bg-[#32e092] active:scale-95 transition-all duration-300"
        >
          Sign In
        </button>

        {/* Signup Link */}
        <p className="text-center text-sm text-white">
          Don't Have An Account?{" "}
          <span
            onClick={onSwitchToSignup}
            className="text-[#3affa3] cursor-pointer hover:underline"
          >
            Sign Up
          </span>
        </p>
      </form>
    </div>
  );
}

export default LoginForm;