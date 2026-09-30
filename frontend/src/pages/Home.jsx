import { FaCalculator, FaChartLine, FaCreditCard, FaRobot, FaRocket, FaShieldAlt, FaStar } from "react-icons/fa";
import { Link, useLocation } from 'react-router-dom';
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import img from '../assets/Zelbi.png';
import img1 from '../assets/screen.png';
import img2 from '../assets/texture.png';
import Footer from '../components/common/Footer';
import '../styles/testimonials.css';
import PricingCards from "../components/PricingCards";
import { useSelector } from "react-redux";
import { useEffect } from "react";


const HOW_IT_WORKS = [
  {
    icon: FaChartLine,
    step: "Step 1",
    title: "Search a stock",
    text: "Look up any listed company and explore its price history across timeframes from one minute to one day.",
  },
  {
    icon: FaRobot,
    step: "Step 2",
    title: "Get an AI analysis",
    text: "Generate a structured summary of the stock's market position, technical indicators, risks and short-term outlook.",
  },
  {
    icon: FaCalculator,
    step: "Step 3",
    title: "Plan your taxes",
    text: "Work out the capital gains tax on a trade before you sell, so there are no surprises at filing time.",
  },
];

const Home = () => {
  const { user } = useSelector((state) => state.profile);
  const { hash } = useLocation();

  useEffect(() => {
    document.title = "Zelbi | Home";
  }, []);

  // Scroll to a section when linked with a hash, e.g. /#faq from the footer
  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
    }
  }, [hash]);

  return (
    <div className='scrollbar-hide'>
      {/* Hero Section */}
      <div className='flex flex-col w-full h-fit mt-[80px] bg-black'>
        {/* On md+ the logo stays fixed while the screenshot scrolls over it */}
        <div className='relative md:fixed md:inset-x-0 z-0 w-full max-w-[1150px] mx-auto px-6'>
          <img src={img} className='w-full h-auto pt-6' alt="Zelbi" />
          <div className='flex justify-between gap-4 text-xs sm:text-sm'>
            <div className='text-white mt-3 font-edu-sa tracking-tighter'>AI ENHANCED TRADING</div>
            <div className='text-white mt-3 font-edu-sa tracking-tighter text-right'>SMARTER MARKET INSIGHTS</div>
          </div>
        </div>

        <div className='mt-8 md:mt-[250px] px-4'>
          <img
            src={img1}
            className='mx-auto relative w-full max-w-[1030px] h-auto z-40'
            alt="Zelbi dashboard showing a stock price chart and AI market analysis"
          />
        </div>
      </div>

      <div className="w-full relative text-white bg-black z-40">
        <img
          src={img2}
          className="w-full h-[500px] object-cover absolute brightness-90"
          alt=""
        />

        <div className="relative flex justify-center lg:justify-end pt-16 lg:pt-[200px] px-6 lg:pr-[220px]">
          <div className="relative max-w-[700px]">
            <div className="bg-[#3affa3] absolute left-0 top-1 w-[4px] h-full"></div>

            <p className="pl-6 sm:text-white text-base sm:text-lg lg:text-2xl leading-relaxed font-medium">
              AT ZELBI, OUR MISSION IS TO MAKE THE COMPLEX WORLD OF
              THE STOCK MARKET SIMPLE AND INTUITIVE. OUR AI-POWERED
              PLATFORM HELPS INVESTORS MAKE SMARTER, DATA-DRIVEN DECISIONS.
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-black relative z-40 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-white mb-16">Why Choose Zelbi?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-[#141414] p-6 rounded-lg text-center hover:scale-105 transition-all duration-300 border border-[#3affa3]/10 hover:border-[#3affa3]/30">
              <FaChartLine className="text-4xl text-[#3affa3] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Advanced Analytics</h3>
              <p className="text-white">Live market data, candlestick charts and moving averages for any listed stock.</p>
            </div>
            <div className="bg-[#141414] p-6 rounded-lg text-center hover:scale-105 transition-all duration-300 border border-[#3affa3]/10 hover:border-[#3affa3]/30">
              <FaRobot className="text-4xl text-[#3affa3] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">AI-Powered Insights</h3>
              <p className="text-white">Ask the Zelbi Assistant or run an AI analysis on any chart to get a clear summary of trends and risks.</p>
            </div>
            <div className="bg-[#141414] p-6 rounded-lg text-center hover:scale-105 transition-all duration-300 border border-[#3affa3]/10 hover:border-[#3affa3]/30">
              <FaStar className="text-4xl text-[#3affa3] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Personal Watchlist</h3>
              <p className="text-white">Save the stocks you follow and jump back to their charts in one click.</p>
            </div>
            <div className="bg-[#141414] p-6 rounded-lg text-center hover:scale-105 transition-all duration-300 border border-[#3affa3]/10 hover:border-[#3affa3]/30">
              <FaCalculator className="text-4xl text-[#3affa3] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Tax Calculator</h3>
              <p className="text-white">Estimate short and long term capital gains tax on your trades under current Indian rules.</p>
            </div>
          </div>
        </div>
      </div>



      {/* FAQ Section */}
      <div id="faq" className="bg-black relative z-40 py-20 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-white mb-16">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#141414] p-8 rounded-xl transform hover:scale-105 transition-all duration-300 border border-[#3affa3]/10 hover:border-[#3affa3]/30">
              <div className="flex items-start space-x-4">
                <div className="bg-[#3affa3]/10 p-3 rounded-lg">
                  <FaRobot className="text-2xl text-[#3affa3]" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">How does the AI analysis work?</h3>
                  <p className="text-white leading-relaxed">Zelbi sends recent price data and indicators such as moving averages to an AI model, which summarises the stock's position, risks and short-term outlook. It's a research aid, not financial advice.</p>
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
                  <p className="text-white leading-relaxed">Yes. Passwords are hashed, sessions use signed tokens, and payments are handled by Razorpay, so your card details never reach our servers.</p>
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
                  <p className="text-white leading-relaxed">Paid plans are billed in INR through Razorpay, which supports UPI, credit and debit cards, net banking and popular wallets.</p>
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
                  <p className="text-white leading-relaxed">Sign up with your email or Google account and verify your email. The dashboard, AI assistant and tax calculator are available straight away on the free plan.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <PricingCards
        currentPlan={user ? (user.subscriptionPlan || "free") : null}
        showHeading={true}
        showViewAllButton={true}
      />

      {/* How It Works Section */}
      <div className="bg-[#141414] relative z-40 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-white mb-16">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ icon: Icon, step, title, text }) => (
              <div key={title} className="bg-[#141414] p-8 rounded-xl transform hover:scale-105 transition-all duration-300 border border-[#3affa3]/10 hover:border-[#3affa3]/30">
                <div className="flex items-center mb-4">
                  <div className="bg-[#3affa3]/10 p-2 rounded-lg mr-3">
                    <Icon className="text-xl text-[#3affa3]" />
                  </div>
                  <div className="text-[#3affa3] text-sm font-medium">{step}</div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
                <p className="text-white leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-black relative z-40 py-20 min-h-[386px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-8">Ready to Invest Smarter?</h2>
          <p className="text-white mb-8 max-w-2xl mx-auto">
            Create a free account and start exploring live charts, AI analysis and tax estimates in minutes.
          </p>
          <Link to={user ? "/dashboard" : "/signup"}>
            <button className="bg-[#3affa3] text-black font-semibold px-8 py-3 rounded-full hover:bg-[#2de88f] transition-colors duration-300">
              {user ? "Go to Dashboard" : "Get Started Now"}
            </button>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Home;