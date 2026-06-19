import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaArrowRight, FaSearch } from "react-icons/fa";
import img1 from "../assets/second.jpeg";
import img2 from "../assets/third.jpeg";
import img3 from "../assets/fourth.jpeg";
import img4 from "../assets/top.jpeg";

const Blog = () => {
  const [expanded, setExpanded] = useState({
    article1: false,
    article2: false,
    article3: false,
  });

  const [searchQuery, setSearchQuery] = useState("");

  const toggleExpand = (article) => {
    setExpanded((prevState) => ({
      ...prevState,
      [article]: !prevState[article],
    }));
  };

  useEffect(() => {
    document.title = "Zelbi | Blog";
    return () => {
      document.title = "Zelbi";
    };
  }, []);
  const categories = [
    "Market Analysis",
    "AI Trading",
    "Cryptocurrency",
    "Stock Market",
    "Trading Tips",
  ];

  return (
    <div className="bg-black text-white min-h-screen pt-20">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative h-[500px] overflow-hidden"
      >
        <div className="absolute inset-0">
          <img 
            src={img4} 
            alt="Blog Hero" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
            AI Trading Insights
          </h1>
          <p className="text-2xl font-semibold font-edu-sa text-gray-300 max-w-2xl">
            Stay ahead of the market with our AI-powered analysis and expert trading insights
          </p>
        </div>
      </motion.section>

      {/* Search and Categories Section */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1a1a] text-white rounded-xl px-12 py-3 focus:outline-none focus:ring-2 focus:ring-green-400/50"
            />
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category, index) => (
              <motion.button
                key={category}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-[#1a1a1a] text-sm px-4 py-2 rounded-full hover:bg-[#3affa3] hover:text-black transition-colors duration-300"
              >
                {category}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Article */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="max-w-7xl mx-auto px-4 pb-12"
      >
        <div className="relative rounded-2xl overflow-hidden group cursor-pointer">
          <img 
            src={img4} 
            alt="Featured Article" 
            className="w-full h-[400px] object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent">
            <div className="absolute bottom-0 p-8">
              <div className="flex items-center gap-4 mb-4">
                <span className="bg-green-400 text-black text-sm px-3 py-1 rounded-full">Featured</span>
                <span className="text-gray-300">March 23, 2024</span>
              </div>
              <h2 className="text-3xl font-bold mb-4">Cross Margin Trading: A Game-Changer in Modern Trading</h2>
              <p className="text-gray-300 mb-6 max-w-2xl">
                Discover how cross margin trading is revolutionizing the way traders manage their positions and maximize their potential returns.
              </p>
              <button className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors duration-300">
                Read More <FaArrowRight />
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Latest Articles Grid */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8">Latest Articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              img: img1,
              category: "Market Trends",
              title: "AI Predicts Market Trends",
              description: "AI analysis shows market trends shifting towards bullish patterns. Our advanced algorithms analyze multiple data points to predict market movements with increasing accuracy.",
              expanded: expanded.article1,
              id: "article1"
            },
            {
              img: img2,
              category: "Stock Analysis",
              title: "Stock Volatility Analysis",
              description: "AI-driven risk models predict high volatility in the coming months. Understanding market volatility is crucial for making informed investment decisions.",
              expanded: expanded.article2,
              id: "article2"
            },
            {
              img: img3,
              category: "AI Trading",
              title: "AI & Algorithmic Trading",
              description: "Learn how AI is revolutionizing trading strategies with automation. Discover how machine learning algorithms are transforming the way we trade.",
              expanded: expanded.article3,
              id: "article3"
            }
          ].map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              className="bg-[#1a1a1a] rounded-xl overflow-hidden group cursor-pointer"
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={article.img} 
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-green-400 text-black text-sm px-3 py-1 rounded-full">
                    {article.category}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3 group-hover:text-green-400 transition-colors duration-300">
                  {article.title}
                </h3>
                <p className="text-gray-400 mb-4">
                  {article.expanded ? article.description : `${article.description.slice(0, 100)}...`}
                </p>
                <button
                  onClick={() => toggleExpand(article.id)}
                  className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors duration-300"
                >
                  {article.expanded ? "Show Less" : "Read More"} <FaArrowRight />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Newsletter Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="max-w-7xl mx-auto px-4 py-16"
      >
        <div className="bg-gradient-to-r from-green-400/10 to-blue-500/10 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Subscribe to our newsletter to receive the latest insights and analysis directly in your inbox
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full bg-[#1a1a1a] text-white rounded-xl px-6 py-3 focus:outline-none focus:ring-2 focus:ring-green-400/50"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto bg-green-400 text-white px-8 py-3 rounded-xl font-medium hover:bg-[#3affa3] hover:text-black transition-colors duration-300"
            >
              Subscribe
            </motion.button>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default Blog;