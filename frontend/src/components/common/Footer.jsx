import { FaDiscord, FaGithub, FaTelegram, FaXTwitter } from "react-icons/fa6";
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
                <FaGithub size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/dashboard" onClick={() => window.scrollTo(0, 0)} className="text-gray-400 hover:text-cyan-400 transition-colors">Dashboard</Link></li>
              <li><Link to="/ai-assistant" className="text-gray-400 hover:text-cyan-400 transition-colors">AI Assistant</Link></li>
              <li><Link to="/blog" onClick={() => window.scrollTo(0, 0)} className="text-gray-400 hover:text-cyan-400 transition-colors">Blogs</Link></li>
              <li><Link to="/tax-calculator" onClick={() => window.scrollTo(0, 0)} className="text-gray-400 hover:text-cyan-400 transition-colors">Tax Calculator</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li className="text-gray-400 hover:text-cyan-400 transition-colors">Trading Guide</li>
                <li className="text-gray-400 hover:text-cyan-400 transition-colors">Market Analysis</li>
                <li className="text-gray-400 hover:text-cyan-400 transition-colors">API Documentation</li>
                <li className="text-gray-400 hover:text-cyan-400 transition-colors">FAQ</li>
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
              <div className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">Privacy Policy</div>
              <div className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">Terms of Service</div>
              <div className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">Cookie Policy</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;