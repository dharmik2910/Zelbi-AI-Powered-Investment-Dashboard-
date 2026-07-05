import { useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../../services/operations/authAPI";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { toast } from "react-hot-toast";
import { setToken } from "../../../slices/authSlice";
import { setUser } from "../../../slices/profileSlice";
import { endpoints } from "../../../services/apis";

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

  const handleOnSubmit = async (e) => {
    e.preventDefault();
    
    const result = await dispatch(login(email, password, navigate));
    
    // If login failed, clear only password
    if (result && !result.success) {
      setFormData((prevData) => ({
        ...prevData,
        password: "", // Clear only password, keep email
      }));
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const token = credentialResponse.credential;
      
      const response = await axios.post(
        endpoints.GOOGLE_AUTH_API,
        { token },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        toast.success("Google Sign In Successful");
        
        // Store token in Redux and localStorage
        dispatch(setToken(response.data.token));
        
        const userImage = response.data?.user?.image
          ? response.data.user.image
          : `https://api.dicebear.com/5.x/initials/svg?seed=${response.data.user.firstName} ${response.data.user.lastName}`
        dispatch(setUser({ ...response.data.user, image: userImage }))
        
        localStorage.setItem("token", JSON.stringify(response.data.token))
        localStorage.setItem("user", JSON.stringify(response.data.user))
        
        // Navigate to main page
        navigate("/");
      }
    } catch (error) {
      console.error("Google Sign In Error:", error);
      toast.error(error.response?.data?.message || "Google Sign In failed. Please try again.");
    }
  };

  const handleGoogleError = () => {
    console.error("Google Sign In Failed");
    toast.error("Google Sign In failed. Please try again.");
  };

  return (
    <div className="relative z-10 w-full max-w-[380px] md:max-w-md mx-auto mt-10 md:mt-20 px-6 py-8 md:p-7 rounded-md md:rounded-md bg-gradient-to-br from-[#141414] to-[#111111] text-white">
      <h2 className="text-2xl md:text-3xl mt-2 font-bold text-center mb-6 text-[#3affa3]">
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

        <div className="flex items-center gap-x-2 my-4">
          <div className="w-full h-[1px] bg-gray-600"></div>
          <p className="text-gray-400 font-medium">OR</p>
          <div className="w-full h-[1px] bg-gray-600"></div>
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="dark"
            size="large"
            width="380"
            text="signin_with"
            shape="rectangular"
          />
        </div>

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