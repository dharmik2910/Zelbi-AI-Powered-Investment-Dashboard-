import { useState } from "react";
import {
  FaCalculator,
  FaChartLine,
  FaNewspaper,
  FaRobot,
  FaRocket,
  FaSignInAlt,
  FaSignOutAlt,
  FaTag,
} from "react-icons/fa";
import { HiMenu, HiX } from "react-icons/hi";
import { useSelector, useDispatch } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { logout } from "../../services/operations/authAPI";
import logo from "../../assets/Zelbi.png";

const Navbar = () => {
  const { token } = useSelector((state) => state.auth);
  const { user } = useSelector((state) => state.profile);
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isActive = (path) => location.pathname === path;

  const profileImage =
    user?.image ||
    `https://api.dicebear.com/5.x/initials/svg?seed=${user?.firstName || "User"} ${user?.lastName || ""}`;
  const isProfileActive = location.pathname === "/profile";

  return (
    // <nav className="fixed top-0 left-0 w-full h-16 bg-[#050505] text-white z-50 border-b border-gray-800">
    <nav className="fixed top-0 left-0 w-full h-16 bg-black text-white z-[100] border-b border-white/10">
      <div className="max-w-7xl mx-auto h-full px-4 md:px-8 flex items-center justify-between">

        {/* Logo */}
        <Link to="/">
          <img
            src={logo}
            alt="Zelbi"
            className="h-8 md:h-10 w-auto"
          />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/ai-assistant"
            className="relative group py-1"
          >
            AI Assistant
            <span
              className="
    absolute
    left-0
    bottom-0
    h-[2px]
    w-full
    bg-[#3affa3]
    origin-left
    scale-x-0
    transition-transform
    duration-300
    ease-out
    group-hover:scale-x-[1]
  "
            ></span>
          </Link>
          <Link to="/blog" className="relative group py-1">
            Blogs
            <span
              className="
    absolute
    left-0
    bottom-0
    h-[2px]
    w-full
    bg-[#3affa3]
    origin-left
    scale-x-0
    transition-transform
    duration-300
    ease-out
    group-hover:scale-x-[1]
  "
            ></span>          </Link>
          <Link to="/pricing" className="relative group py-1">
            Pricing
            <span
              className="
    absolute
    left-0
    bottom-0
    h-[2px]
    w-full
    bg-[#3affa3]
    origin-left
    scale-x-0
    transition-transform
    duration-300
    ease-out
    group-hover:scale-x-[1]
  "
            ></span>          </Link>

          {token ? (
            <>
              <Link to="/dashboard" className="relative group py-1">
                Dashboard
                <span
                  className="
    absolute
    left-0
    bottom-0
    h-[2px]
    w-full
    bg-[#3affa3]
    origin-left
    scale-x-0
    transition-transform
    duration-300
    ease-out
    group-hover:scale-x-[1]
  "
                ></span>              </Link>
              <Link to="/tax-calculator" className="relative group py-1">
                Tax Calculator
                <span
                  className="
    absolute
    left-0
    bottom-0
    h-[2px]
    w-full
    bg-[#3affa3]
    origin-left
    scale-x-0
    transition-transform
    duration-300
    ease-out
    group-hover:scale-x-[1]
  "
                ></span>              </Link>
              <Link
                to="/profile"
                title="Profile"
                className={`rounded-full border-2 transition-colors duration-300 ${
                  isProfileActive
                    ? "border-white"
                    : "border-white/10 hover:border-[#3affa3]"
                }`}
              >
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
                />
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="relative group py-1">
                Login
                <span
                  className="
    absolute
    left-0
    bottom-0
    h-[2px]
    w-full
    bg-[#3affa3]
    origin-left
    scale-x-0
    transition-transform
    duration-300
    ease-out
    group-hover:scale-x-[1]
  "
                ></span>              </Link>

              <Link to="/signup">
                <button className="bg-[#3affa3] text-black font-semibold px-4 py-2 rounded-sm tracking-tighter hover:bg-[#2de88f] transition-all duration-300">
                  Trade Now
                </button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        {/* <button
          className="md:hidden text-3xl"
          onClick={() => setIsOpen(!isOpen)}
        > */}
        <button
  className="md:hidden text-3xl text-white"
  onClick={() => setIsOpen(true)}
>
          {isOpen ? <HiX /> : <HiMenu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {/* {isOpen && (
<div
  className={`fixed top-0 right-0 h-screen w-72 bg-black z-[200] transform transition-transform duration-300 ${
    isOpen ? "translate-x-0" : "translate-x-full"
  }`}
>
          <div className="flex flex-col p-4 gap-4">

            <Link
              to="/ai-assistant"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3"
            >
              <FaRobot className="text-[#3affa3] text-lg shrink-0" />
              AI Assistant
            </Link>

            <Link
              to="/blog"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3"
            >
              <FaNewspaper className="text-[#3affa3] text-lg shrink-0" />
              BLOGS
            </Link>

            <Link
              to="/pricing"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 text-white"
            >
              <FaTag className="text-[#3affa3] text-lg shrink-0" />
              PRICING
            </Link>

            {token ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3"
                >
                  <FaChartLine className="text-[#3affa3] text-lg shrink-0" />
                  Dashboard
                </Link>

                <Link
                  to="/tax-calculator"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3"
                >
                  <FaCalculator className="text-[#3affa3] text-lg shrink-0" />
                  Tax Calculator
                </Link>

                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3"
                >
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover border-2 border-white/10 shrink-0"
                  />
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3"
                >
                  <FaSignInAlt className="text-[#3affa3] text-lg shrink-0" />
                  Login
                </Link>

                <Link to="/signup" onClick={() => setIsOpen(false)}>
                  <button className="
    w-full
    flex
    items-center
    justify-center
    gap-3
    bg-[#3affa3]
    text-black
    font-semibold
    px-4
    py-2
    rounded-sm
    hover:bg-[#2de88f]
    transition-all
    duration-300
  ">
                    <FaRocket className="text-lg shrink-0" />
                    Trade Now
                  </button>

                </Link>
              </>
            )}
          </div>
        </div>
      )} */}

      {/* Mobile Menu */}

<>
  {/* Overlay */}
  <div
    onClick={() => setIsOpen(false)}
    className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] transition-opacity duration-300 md:hidden ${
      isOpen ? "opacity-100 visible" : "opacity-0 invisible"
    }`}
  />

  {/* Drawer */}
  <div
    // className={`fixed top-0 right-0 h-screen w-72 bg-[#0B0B0B] border-l border-white/10 shadow-2xl z-[200] transform transition-transform duration-300 md:hidden flex flex-col ${
      className={`fixed inset-y-0 right-0 w-72 bg-[#0B0B0B] border-l border-white/10 shadow-2xl z-[200] transform transition-transform duration-300 md:hidden flex flex-col ${
      isOpen ? "translate-x-0" : "translate-x-full"
    }`}
  >
    {/* Header */}
    <div className="flex items-center justify-between p-5 border-b border-white/10">
      <img src={logo} alt="Zelbi" className="h-8" />

      <button
        onClick={() => setIsOpen(false)}
        className="text-3xl text-white hover:text-[#3affa3]"
      >
        <HiX />
      </button>
    </div>

    {/* Scrollable Menu */}
    {/* <div className="flex-1 overflow-y-auto p-4 space-y-2"> */}
    <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-24">
      <Link
        to="/ai-assistant"
        onClick={() => setIsOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all ${
          isActive("/ai-assistant")
            ? "bg-[#3affa3] text-black"
            : "text-white hover:bg-white/10"
        }`}
      >
        <FaRobot />
        AI Assistant
      </Link>

      <Link
        to="/blog"
        onClick={() => setIsOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all ${
          isActive("/blog")
            ? "bg-[#3affa3] text-black"
            : "text-white hover:bg-white/10"
        }`}
      >
        <FaNewspaper />
        Blogs
      </Link>

      <Link
        to="/pricing"
        onClick={() => setIsOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all ${
          isActive("/pricing")
            ? "bg-[#3affa3] text-black"
            : "text-white hover:bg-white/10"
        }`}
      >
        <FaTag />
        Pricing
      </Link>

      {token ? (
        <>
          <Link
            to="/dashboard"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all ${
              isActive("/dashboard")
                ? "bg-[#3affa3] text-black"
                : "text-white hover:bg-white/10"
            }`}
          >
            <FaChartLine />
            Dashboard
          </Link>

          <Link
            to="/tax-calculator"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all ${
              isActive("/tax-calculator")
                ? "bg-[#3affa3] text-black"
                : "text-white hover:bg-white/10"
            }`}
          >
            <FaCalculator />
            Tax Calculator
          </Link>

          <Link
            to="/profile"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all ${
              isActive("/profile")
                ? "bg-[#3affa3] text-black"
                : "text-white hover:bg-white/10"
            }`}
          >
            <img
              src={profileImage}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover"
            />
            Profile
          </Link>
        </>
      ) : (
        <>
          <Link
            to="/login"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all ${
              isActive("/login")
                ? "bg-[#3affa3] text-black"
                : "text-white hover:bg-white/10"
            }`}
          >
            <FaSignInAlt />
            Login
          </Link>

          <Link
            to="/signup"
            onClick={() => setIsOpen(false)}
            className="mt-4 block"
          >
            <button className="w-full bg-[#3affa3] text-black py-3 rounded-md font-semibold hover:bg-[#2de88f] transition">
              <div className="flex items-center justify-center gap-2">
                <FaRocket />
                Trade Now
              </div>
            </button>
          </Link>
        </>
      )}
    </div>

    {/* Fixed Bottom Sign Out */}
    {token && (
      <div className="sticky bottom-0 border-t border-white/10 bg-[#0B0B0B] p-4">
        <button
          onClick={() => {
            setIsOpen(false);
            dispatch(logout(navigate));
          }}
          className="flex items-center gap-3 px-4 py-3 rounded-md transition-all text-white hover:bg-white/10 w-full"
        >
          <FaSignOutAlt />
          Sign Out
        </button>
      </div>
    )}
  </div>
</>

    </nav>
  );
};

export default Navbar;