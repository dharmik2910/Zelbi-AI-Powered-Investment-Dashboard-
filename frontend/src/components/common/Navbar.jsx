import { useState } from "react";
import { HiMenu, HiX } from "react-icons/hi";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import logo from "../../assets/Zelbi.png";
import { logout } from "../../services/operations/authAPI";

const Navbar = () => {
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);

  return (
    // <nav className="fixed top-0 left-0 w-full h-16 bg-[#050505] text-white z-50 border-b border-gray-800">
    <nav className="fixed top-0 left-0 w-full h-16 bg-black text-white z-50 border-b border-white/10">
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
          <Link to="/project">AI</Link>
          <Link to="/blog">BLOGS</Link>

          {token ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/tax-calculator">Tax Calculator</Link>

              <button
                onClick={() => dispatch(logout())}
                className="
    rounded-sm
    bg-[#3affa3]
    text-black
    font-semibold
    px-4
    py-2
    hover:bg-[#2de88f]
    transition-all
    duration-300
  "
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>

              <Link to="/signup">
                <button className="bg-[#3affa3] text-black font-semibold px-4 py-2 rounded-sm tracking-tighter hover:bg-[#2de88f] transition-all duration-300">
                  TRADE NOW
                </button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-3xl"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <HiX /> : <HiMenu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="
md:hidden
text-[14px]
font-semibold
tracking-[0.08em]
uppercase
text-gray-200
hover:text-[#3affa3]
transition-colors
duration-300
bg-black
">
          <div className="flex flex-col p-4 gap-4">

            <Link to="/project" onClick={() => setIsOpen(false)}>
              AI
            </Link>

            <Link to="/blog" onClick={() => setIsOpen(false)}>
              BLOGS
            </Link>

            {token ? (
              <>
                <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                  Dashboard
                </Link>

                <Link to="/tax-calculator" onClick={() => setIsOpen(false)}>
                  Tax Calculator
                </Link>

                <button
                  onClick={() => {
                    dispatch(logout());
                    setIsOpen(false);
                  }}
                  className="
    w-full
    bg-[#3affa3]
    text-black
    font-semibold
    px-4
    py-2
    rounded-sm
    hover:bg-[#2de88f]
    transition-all
    duration-300
  "
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  Login
                </Link>

                <Link to="/signup" onClick={() => setIsOpen(false)}>
                  <button className="
    w-full
    bg-[#3affa3]
    text-black
    font-semibold
    px-4
    py-2
    rounded-lg
    hover:bg-[#2de88f]
    transition-all
    duration-300
  ">
                    TRADE NOW
                  </button>

                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;