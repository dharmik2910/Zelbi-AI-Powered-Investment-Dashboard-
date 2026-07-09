import { FaDiscord, FaInstagram, FaTelegram, FaXTwitter } from "react-icons/fa6";
import { Link } from "react-router-dom";
import logo from "../../assets/Zelbi.png";

const Footer = () => {
  return (
    <footer className="bg-black text-white py-12 relative z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <img src={logo} alt="Zelbi Logo" className="h-8" />
            <p className="text-gray-400 text-sm">
              Empowering traders with AI-driven insights and advanced trading tools.
            </p>
            <div className="flex space-x-4">
              <a href="/" className="text-gray-400 hover:text-cyan-400 transition-colors">
                <FaXTwitter size={20} />
              </a>
              <a href="/" className="text-gray-400 hover:text-cyan-400 transition-colors">
                <FaTelegram size={20} />
              </a>
              <a href="/" className="text-gray-400 hover:text-cyan-400 transition-colors">
                <FaDiscord size={20} />
              </a>
              <a href="/" className="text-gray-400 hover:text-cyan-400 transition-colors">
                <FaInstagram size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
             <li><Link to="/dashboard" onClick={() => window.scrollTo(0, 0)} className="relative group inline-block text-gray-400 hover:text-white transition-colors">
                Dashboard
                <span className="absolute left-0 bottom-0 h-[2px] w-full bg-[#3affa3] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
              </Link></li>
              <li><Link to="/ai-assistant" className="relative group inline-block text-gray-400 hover:text-white transition-colors">
                AI Assistant
                <span className="absolute left-0 bottom-0 h-[2px] w-full bg-[#3affa3] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
              </Link></li>
              <li><Link to="/blog" onClick={() => window.scrollTo(0, 0)} className="relative group inline-block text-gray-400 hover:text-white transition-colors">
                Blogs
                <span className="absolute left-0 bottom-0 h-[2px] w-full bg-[#3affa3] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
              </Link></li>
              <li><Link to="/pricing" onClick={() => window.scrollTo(0, 0)} className="relative group inline-block text-gray-400 hover:text-white transition-colors">
                Pricing
                <span className="absolute left-0 bottom-0 h-[2px] w-full bg-[#3affa3] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
              </Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
              {/* <ul className="space-y-2">
                <li className="text-gray-400 hover:text-cyan-400 transition-colors">Trading Guide</li>
                <li className="text-gray-400 hover:text-cyan-400 transition-colors">Market Analysis</li>
                <li className="text-gray-400 hover:text-cyan-400 transition-colors">API Documentation</li>
                <li className="text-gray-400 hover:text-cyan-400 transition-colors">FAQ</li>
              </ul> */}
              <ul className="flex flex-col items-start space-y-2">
                <li className="relative group inline-block text-gray-400 hover:text-white transition-colors cursor-pointer">
                  Trading Guide
                  <span className="absolute left-0 bottom-0 h-[2px] w-full bg-[#3affa3] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
                </li>
                <li className="relative group inline-block text-gray-400 hover:text-white transition-colors cursor-pointer">
                  Market Analysis
                  <span className="absolute left-0 bottom-0 h-[2px] w-full bg-[#3affa3] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
                </li>
                <li className="relative group inline-block text-gray-400 hover:text-white transition-colors cursor-pointer">
                  API Documentation
                  <span className="absolute left-0 bottom-0 h-[2px] w-full bg-[#3affa3] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
                </li>
                <li className="relative group inline-block text-gray-400 hover:text-white transition-colors cursor-pointer">
                  FAQ
                  <span className="absolute left-0 bottom-0 h-[2px] w-full bg-[#3affa3] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
                </li>
              </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="text-gray-400">Email: support@zelbi.com</li>
              <li className="text-gray-400">Address: 123 Trading Street, NY</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2026 Zelbi. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
             <Link to="/privacy-policy" className="relative group inline-block text-gray-400 hover:text-white transition-colors text-sm">
                Privacy Policy
                <span className="absolute left-0 bottom-0 h-[2px] w-full bg-[#3affa3] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
              </Link>
              <Link to="/terms-and-conditions" className="relative group inline-block text-gray-400 hover:text-white transition-colors text-sm">
                Terms of Service
                <span className="absolute left-0 bottom-0 h-[2px] w-full bg-[#3affa3] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
              </Link>
              <Link to="/cookie-policy" className="relative group inline-block text-gray-400 hover:text-white transition-colors text-sm">
                Cookie Policy
                <span className="absolute left-0 bottom-0 h-[2px] w-full bg-[#3affa3] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;