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
              Empowering investors with AI-driven insights and market analysis tools.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
             <li><Link to="/dashboard" onClick={() => window.scrollTo(0, 0)} className="relative group inline-block text-gray-400 hover:text-white transition-colors">
                Dashboard
                <span className="absolute left-0 bottom-0 h-[2px] w-full bg-[#3affa3] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
              </Link></li>
              <li><Link to="/zelbi-assistant" className="relative group inline-block text-gray-400 hover:text-white transition-colors">
                Zelbi Assistant
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
            <ul className="space-y-2">
              <li><Link to="/tax-calculator" className="relative group inline-block text-gray-400 hover:text-white transition-colors">
                Tax Calculator
                <span className="absolute left-0 bottom-0 h-[2px] w-full bg-[#3affa3] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
              </Link></li>
              <li><Link to="/blog" className="relative group inline-block text-gray-400 hover:text-white transition-colors">
                Market Insights
                <span className="absolute left-0 bottom-0 h-[2px] w-full bg-[#3affa3] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
              </Link></li>
              <li><Link to="/#faq" className="relative group inline-block text-gray-400 hover:text-white transition-colors">
                FAQ
                <span className="absolute left-0 bottom-0 h-[2px] w-full bg-[#3affa3] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
              </Link></li>
              <li><Link to="/profile" className="relative group inline-block text-gray-400 hover:text-white transition-colors">
                Account Settings
                <span className="absolute left-0 bottom-0 h-[2px] w-full bg-[#3affa3] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
              </Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="text-gray-400">
                Email: <a href="mailto:support@zelbi.com" className="hover:text-white transition-colors">support@zelbi.com</a>
              </li>
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