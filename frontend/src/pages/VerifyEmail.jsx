import { useEffect, useState } from "react";
import OtpInput from "react-otp-input";
import { Link } from "react-router-dom";
import { BiArrowBack } from "react-icons/bi";
import { RxCountdownTimer } from "react-icons/rx";
import { useDispatch, useSelector } from "react-redux";
import { sendOtp, signUp } from "../services/operations/authAPI";
import { useNavigate } from "react-router-dom";

function VerifyEmail() {
  const [otp, setOtp] = useState("");
  const { signupData, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

useEffect(() => {
  if (!signupData) {
    navigate("/signup");
  }
}, [navigate, signupData]);
  const handleVerifyAndSignup = (e) => {
    e.preventDefault();
    const { email, password, confirmPassword } = signupData;
    dispatch(
      signUp(
        null,
        null,
        null,
        email,
        password,
        confirmPassword,
        otp,
        navigate
      )
    );
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] grid place-items-center bg-black">
      {loading ? (
        <div>
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="relative w-full max-w-md p-8 bg-gradient-to-br from-[#050505] to-[#111111] text-white">
          <h1 className="text-3xl font-bold text-cyan-400 text-center mb-6 text-shadow-[0_0_10px_#00ffff]">
            Verify Email
          </h1>
          <p className="text-sm text-gray-300 text-center mb-6">
            A verification code has been sent to you. Enter the code below
          </p>
          <form onSubmit={handleVerifyAndSignup} className="flex flex-col text-white gap-y-6">
            <OtpInput
              value={otp}
              onChange={setOtp}
              numInputs={6}
              renderInput={(props) => (
                <input
                  {...props}
                  placeholder="-"
                  style={{
                    boxShadow: "inset 0px -1px 0px rgba(0, 0, 0, 1)",
                  }}
                  className="w-[48px] lg:w-[60px] border-0 bg-black rounded-[0.5rem] text-richblack-5 aspect-square text-center focus:border-0 focus:outline-2 focus:outline-yellow-50"
                />
              )}
              containerStyle={{
                justifyContent: "space-between",
                gap: "0 6px",
              }}
            />
            <button
              type="submit"
              className="text-white mt-4 bg-[#212121] py-3 px-6 rounded-full bg-cyan-500 font-semibold active:scale-95 transition-all duration-300"
            >
              Verify Email
            </button>
          </form>
          <div className="mt-6 flex items-center justify-between">
            <Link to="/signup">
              <p className="text-white-400 flex items-center gap-x-2">
                <BiArrowBack /> Back To Signup
              </p>
            </Link>
            <button
              className="flex items-center text-white-400 gap-x-2"
              onClick={() => dispatch(sendOtp(signupData.email))}
            >
              <RxCountdownTimer />
              Resend it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VerifyEmail;
