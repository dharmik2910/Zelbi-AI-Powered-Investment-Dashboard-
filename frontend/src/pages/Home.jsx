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

      {/* Mission Statement */}
      <div className='w-screen relative text-white h-full bg-black z-40'>
        <img src={img2} className='w-screen h-[500px] absolute brightness-90' alt="investment" />
        <div className='flex w-full justify-end pt-[200px] pr-[220px] bg-center bg-cover'>
          <div className='relative flex max-w-[700px] text-[24px] tracking-tighter'> 
            <div className='bg-[#3affa3] absolute w-[4px] left-[1px] h-6'></div>
            <span className='leading-none'>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;AT ZELBI, OUR MISSION IS TO MAKE THE COMPLEX WORLD OF BLOCKCHAIN SIMPLE AND INTUITIVE. CRYPTO EXCHANGE WITH AI-POWERED TRADING TOOLS TO HELP TRADERS MAKE THE BEST DATA-DRIVEN DECISIONS.
            </span>
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
      <div className="bg-white relative z-40 h-[900px] flex flex-col items-center pt-28">
        <div className="w-full px-20 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-black whitespace-nowrap ml-40">
            EVOLVE WITH US
          </h1>
          <p className="text-black text-right max-w-md font-medium border-t-4 border-green-400 leading-tight pl-5 mr-10">
            JOIN OUR COMMUNITY TO STAY UP TO DATE WITH THE LATEST NEWS AND ENJOY FREE EDUCATIONAL TRADING RESOURCES.
          </p>
        </div>

        <div className="flex gap-10 mt-32 relative z-50">
          <Card title="YOUTUBE" count="39K" Icon={FaXTwitter} />
          <Card title="TELEGRAM" count="102K" Icon={FaTelegram} />
          <Card title="DISCORD" count="32K" Icon={FaDiscord} />
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-black relative z-40 py-20">
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
      <Footer/>
    </div>
  );
};

export default Home;