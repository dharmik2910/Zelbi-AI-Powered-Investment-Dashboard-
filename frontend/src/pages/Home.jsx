import { FaChartLine, FaCreditCard, FaRobot, FaRocket, FaShieldAlt, FaUsers } from "react-icons/fa";
import { FaDiscord, FaTelegram, FaXTwitter } from "react-icons/fa6";
import { Link } from 'react-router-dom';
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import img from '../assets/Zelbi.png';
import img1 from '../assets/screen.png';
import img2 from '../assets/texture.png';
import Card from '../components/Card';
import Footer from '../components/common/Footer';
import '../styles/testimonials.css';

const Home = () => {
  return (
    <div className='scrollbar-hide'>
      {/* Hero Section */}
      <div className='flex flex-col w-full h-fit mt-[80px] bg-black'>
        <div className='fixed left-[183px] bg-cover bg-center z-0'>
          <img src={img} className='w-[1552px] h-[280px] mx-auto' alt="banner" />
          <div className='flex justify-between text-sm'>
            <div className='text-white mt-3 font-edu-sa tracking-tighter'>AI ENHANCED TRADING</div>
            <div className='text-white mt-3 font-edu-sa tracking-tighter'>PREDICT TOP COURSES</div>
          </div>
          <div className='flex justify-end'>
            <div className='text-[#3affa3] mt-3 text-sm font-extrabold tracking-tight'>$ 11 232 195 873</div>
          </div>
        </div>

        <div className='mt-[250px]'>
          <img src={img1} className='mx-auto relative w-[1030px] h-[700px] z-40' alt="feature" />
        </div>
        <Link className='flex justify-center mt-10 relative' to='/trade'>
          <button className='text-black bg-[#3affa3] rounded-md p-4 font-semibold py-2 relative z-40 text-[11px] hover:bg-[#2de88f] transition-colors duration-300'>TRADE NOW</button>
        </Link>
      </div>

      <div className="w-full relative text-white bg-black z-40">
        <img
          src={img2}
          className="w-full h-[500px] object-cover absolute brightness-90"
          alt="investment"
        />

        <div className="relative flex justify-center lg:justify-end pt-16 lg:pt-[200px] px-6 lg:pr-[220px]">
          <div className="relative max-w-[700px]">
            <div className="bg-[#3affa3] absolute left-0 top-1 w-[4px] h-full"></div>

            <p className="pl-6 sm:text-white text-base sm:text-lg lg:text-2xl leading-relaxed font-medium">
              AT ZELBI, OUR MISSION IS TO MAKE THE COMPLEX WORLD OF
              BLOCKCHAIN SIMPLE AND INTUITIVE. OUR AI-POWERED TRADING
              PLATFORM HELPS TRADERS MAKE SMARTER, DATA-DRIVEN DECISIONS.
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-black relative z-40 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-white mb-16">Why Choose Zelbi?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-[#141414] p-6 rounded-lg text-center">
              <FaChartLine className="text-4xl text-[#3affa3] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Advanced Analytics</h3>
              <p className="text-white">Real-time market data and advanced charting tools for informed trading decisions.</p>
            </div>
            <div className="bg-[#141414] p-6 rounded-lg text-center">
              <FaRobot className="text-4xl text-[#3affa3] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">AI-Powered Insights</h3>
              <p className="text-white">Machine learning algorithms analyze market trends and predict potential opportunities.</p>
            </div>
            <div className="bg-[#141414] p-6 rounded-lg text-center">
              <FaShieldAlt className="text-4xl text-[#3affa3] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Secure Trading</h3>
              <p className="text-white">State-of-the-art security measures to protect your assets and trading activities.</p>
            </div>
            <div className="bg-[#141414] p-6 rounded-lg text-center">
              <FaUsers className="text-4xl text-[#3affa3] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Community Driven</h3>
              <p className="text-white">Join a thriving community of traders and share insights with like-minded individuals.</p>
            </div>
          </div>
        </div>
      </div>



      {/* FAQ Section */}
      <div className="bg-black relative z-40 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-white mb-16">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#141414] p-8 rounded-xl transform hover:scale-105 transition-all duration-300 border border-[#3affa3]/10 hover:border-[#3affa3]/30">
              <div className="flex items-start space-x-4">
                <div className="bg-[#3affa3]/10 p-3 rounded-lg">
                  <FaRobot className="text-2xl text-[#3affa3]" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">How does the AI trading system work?</h3>
                  <p className="text-white leading-relaxed">Our AI system analyzes market data, historical trends, and various indicators to generate trading signals and predictions. It uses machine learning algorithms to continuously improve its accuracy.</p>
                </div>
              </div>
            </div>
            <div className="bg-[#141414] p-8 rounded-xl transform hover:scale-105 transition-all duration-300 border border-[#3affa3]/10 hover:border-[#3affa3]/30">
              <div className="flex items-start space-x-4">
                <div className="bg-[#3affa3]/10 p-3 rounded-lg">
                  <FaShieldAlt className="text-2xl text-[#3affa3]" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">Is my account secure?</h3>
                  <p className="text-white leading-relaxed">Yes, we implement industry-standard security measures including 2FA, encryption, and regular security audits to protect your account and assets.</p>
                </div>
              </div>
            </div>
            <div className="bg-[#141414] p-8 rounded-xl transform hover:scale-105 transition-all duration-300 border border-[#3affa3]/10 hover:border-[#3affa3]/30">
              <div className="flex items-start space-x-4">
                <div className="bg-[#3affa3]/10 p-3 rounded-lg">
                  <FaCreditCard className="text-2xl text-[#3affa3]" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">What payment methods do you accept?</h3>
                  <p className="text-white leading-relaxed">We accept major cryptocurrencies, bank transfers, and credit/debit cards. All transactions are processed securely and efficiently.</p>
                </div>
              </div>
            </div>
            <div className="bg-[#141414] p-8 rounded-xl transform hover:scale-105 transition-all duration-300 border border-[#3affa3]/10 hover:border-[#3affa3]/30">
              <div className="flex items-start space-x-4">
                <div className="bg-[#3affa3]/10 p-3 rounded-lg">
                  <FaRocket className="text-2xl text-[#3affa3]" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">How can I get started?</h3>
                  <p className="text-white leading-relaxed">Simply create an account, complete the verification process, and you can start trading immediately. We also provide educational resources for beginners.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div style={{ backgroundColor: "#000", position: "relative", zIndex: 40, padding: "80px 16px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          {/* Header */}
          <h2 className="text-4xl font-bold text-center text-white mb-4">Simple &amp; Affordable Pricing</h2>
          <p style={{ color: "#a1a1aa", textAlign: "center", marginBottom: 48, fontSize: 15 }}>
            Pick a plan that matches your workflow. Upgrade anytime as you grow.
          </p>

          {/* Cards */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 24, alignItems: "stretch" }}>
            {[
              {
                id: "free", name: "Free", price: "₹0", priceLabel: "/month",
                description: "Explore the core features and get a feel for the platform.",
                buttonText: "Get Started Free", buttonLink: "/signup",
                pro: false, popular: false,
                features: ["5 AI prompts per month", "Basic market insights", "Dashboard access", "Tax calculator"],
              },
              {
                id: "pro", name: "Pro", price: "₹499", priceLabel: "/month",
                description: "Everything you need to trade smarter and stay ahead of the market.",
                buttonText: "Upgrade to Pro", buttonLink: "/pricing",
                pro: true, popular: true,
                features: ["Everything in Free", "100 AI prompts / month", "Advanced market analysis", "Portfolio tracking", "Priority support"],
              },
              {
                id: "elite", name: "Elite", price: "₹999", priceLabel: "/month",
                description: "Unlimited AI power for serious traders with no prompt caps.",
                buttonText: "Get Elite Access", buttonLink: "/pricing",
                pro: false, popular: false,
                features: ["All Pro features", "Unlimited AI prompts", "Real-time AI insights", "Custom trading strategies", "Dedicated support"],
              },
            ].map((plan) => (
              <div
                key={plan.id}
                style={{
                  backgroundColor: plan.pro ? "#0a0a0a" : "#000",
                  border: "1px solid #27272a",
                  borderRadius: 12,
                  padding: 24,
                  flex: "1 1 240px",
                  maxWidth: 300,
                  display: "flex",
                  flexDirection: "column",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "#3affa3"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "#27272a"}
              >
                {/* Name + badge */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <span style={{ fontSize: 15, fontWeight: 500, color: "#fff" }}>{plan.name}</span>
                  {plan.popular && (
                    <span style={{ fontSize: 11, color: "#3affa3", border: "1px solid rgba(58,255,163,0.3)", padding: "3px 8px", borderRadius: 999 }}>
                      Popular
                    </span>
                  )}
                </div>

                {/* Price */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 12 }}>
                  <span style={{ fontSize: 32, fontWeight: 700, color: "#fff" }}>{plan.price}</span>
                  <span style={{ fontSize: 12, color: "#71717a" }}>{plan.priceLabel}</span>
                </div>

                {/* Description */}
                <p style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 20, lineHeight: 1.6 }}>{plan.description}</p>

                {/* Button */}
                <Link to={plan.buttonLink}>
                  <button
                    style={{
                      width: "100%", padding: "10px 0", borderRadius: 8,
                      fontSize: 13, fontWeight: 500, cursor: "pointer",
                      marginBottom: 24, transition: "opacity 0.2s",
                      ...(plan.pro
                        ? { backgroundColor: "#3affa3", color: "#000", border: "none" }
                        : { backgroundColor: "transparent", border: "1px solid #3f3f46", color: "#fff" }
                      ),
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                  >
                    {plan.buttonText}
                  </button>
                </Link>

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <div style={{ flex: 1, height: 1, backgroundColor: "#27272a" }} />
                  <span style={{ fontSize: 12, color: "#d4d4d8", fontWeight: 500 }}>Features</span>
                  <div style={{ flex: 1, height: 1, backgroundColor: "#27272a" }} />
                </div>

                {/* Features */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                  {plan.features.map((f, fi) => (
                    <div key={fi} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clipPath="url(#pc)">
                          <path d="M7 12.83A5.833 5.833 0 1 0 7 1.165a5.833 5.833 0 0 0 0 11.667" stroke="#3affa3" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="m5.25 7.003 1.167 1.166L8.75 5.836" stroke="#3affa3" strokeLinecap="round" strokeLinejoin="round"/>
                        </g>
                        <defs><clipPath id="pc"><path fill="#fff" d="M0 0h14v14H0z"/></clipPath></defs>
                      </svg>
                      <span style={{ fontSize: 13, color: "#d4d4d8" }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* View all plans CTA */}
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Link to="/pricing">
              <button
                style={{
                  backgroundColor: "transparent", border: "1px solid #3affa3",
                  color: "#3affa3", padding: "10px 32px", borderRadius: 999,
                  fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#3affa3"; e.currentTarget.style.color = "#000"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#3affa3"; }}
              >
                View all plans →
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* News Section */}
      <div className="bg-[#141414] relative z-40 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-white mb-16">Latest Updates</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-black p-8 rounded-xl transform hover:scale-105 transition-all duration-300 border border-[#3affa3]/10 hover:border-[#3affa3]/30 group">
              <div className="flex items-center mb-4">
                <div className="bg-[#3affa3]/10 p-2 rounded-lg mr-3">
                  <FaRobot className="text-xl text-[#3affa3]" />
                </div>
                <div className="text-[#3affa3] text-sm font-medium">March 22, 2024</div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-[#3affa3] transition-colors duration-300">New AI Trading Features Released</h3>
              <p className="text-white leading-relaxed">We've launched advanced AI trading features including predictive analytics and automated trading strategies.</p>
            </div>
            <div className="bg-black p-8 rounded-xl transform hover:scale-105 transition-all duration-300 border border-[#3affa3]/10 hover:border-[#3affa3]/30 group">
              <div className="flex items-center mb-4">
                <div className="bg-[#3affa3]/10 p-2 rounded-lg mr-3">
                  <FaShieldAlt className="text-xl text-[#3affa3]" />
                </div>
                <div className="text-[#3affa3] text-sm font-medium">March 20, 2024</div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-[#3affa3] transition-colors duration-300">Security Enhancement Update</h3>
              <p className="text-white leading-relaxed">Implemented additional security measures and improved account protection features.</p>
            </div>
            <div className="bg-black p-8 rounded-xl transform hover:scale-105 transition-all duration-300 border border-[#3affa3]/10 hover:border-[#3affa3]/30 group">
              <div className="flex items-center mb-4">
                <div className="bg-[#3affa3]/10 p-2 rounded-lg mr-3">
                  <FaChartLine className="text-xl text-[#3affa3]" />
                </div>
                <div className="text-[#3affa3] text-sm font-medium">March 18, 2024</div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-[#3affa3] transition-colors duration-300">New Trading Pairs Added</h3>
              <p className="text-white leading-relaxed">Added support for new cryptocurrency trading pairs and improved liquidity options.</p>
            </div>
          </div>
        </div>
      </div>


      {/* Community Section */}
<div className="bg-white relative z-40 h-auto lg:h-[900px] flex flex-col items-center py-12 lg:pt-28">
  <div className="w-full px-5 md:px-10 lg:px-20 flex flex-col lg:flex-row items-center justify-between gap-8">
    
    <h1 className="text-2xl md:text-3xl lg:text-3xl font-bold text-black text-center lg:text-left lg:ml-40">
      EVOLVE WITH US
    </h1>

    <p className="text-black text-center lg:text-right max-w-md font-medium border-t-4 border-green-400 pt-4 lg:pl-5 lg:mr-10">
      JOIN OUR COMMUNITY TO STAY UP TO DATE WITH THE LATEST NEWS AND ENJOY
      FREE EDUCATIONAL TRADING RESOURCES.
    </p>
  </div>

  <div className="flex flex-col md:flex-row flex-wrap justify-center gap-6 lg:gap-10 mt-12 lg:mt-32 relative z-50 px-4">
    <Card title="YOUTUBE" count="39K" Icon={FaXTwitter} />
    <Card title="TELEGRAM" count="102K" Icon={FaTelegram} />
    <Card title="DISCORD" count="32K" Icon={FaDiscord} />
  </div>
</div>

      {/* CTA Section */}
      <div className="bg-black relative z-40 py-20 min-h-[386px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-8">Ready to Start Trading?</h2>
          <p className="text-white mb-8 max-w-2xl mx-auto">
            Join thousands of successful traders who are already using Zelbi's AI-powered platform to make smarter trading decisions.
          </p>
          <Link to="/signup">
            <button className="bg-[#3affa3] text-black font-semibold px-8 py-3 rounded-full hover:bg-[#2de88f] transition-colors duration-300">
              Get Started Now
            </button>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Home;