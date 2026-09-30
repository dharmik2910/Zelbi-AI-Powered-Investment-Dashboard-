import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import TradeTaxSummary from "../components/TradeTaxSummary";
import { FaCalculator, FaExchangeAlt, FaClock, FaInfoCircle, FaChartLine, FaMoneyBillWave, FaPercentage, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

const TaxRuleCard = ({ title, icon: Icon, children }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className="bg-gradient-to-br from-[#101010] to-[#0a0a0a] rounded-2xl p-6 border border-[#1a1a1a] hover:border-green-400/40 transition-all duration-300 shadow-lg hover:shadow-green-400/10"
    >
      <div 
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-gradient-to-br from-green-400/20 to-green-400/5 p-3 rounded-xl border border-green-400/20">
            <Icon className="text-2xl text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <motion.div
          initial={false}
          animate={{ height: isExpanded ? "auto" : "0" }}
          className="overflow-hidden"
        >
          <div className="pt-4 border-t border-[#1a1a1a]">
            {children}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const ResultCard = ({ title, value, subtitle, icon: Icon, color = "white", delay = 0 }) => {
  const colorClasses = {
    white: "text-white",
    green: "text-green-400",
    red: "text-red-400",
    gray: "text-gray-400",
    blue: "text-blue-400"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-gradient-to-br from-[#101010] to-[#0a0a0a] rounded-2xl p-6 border border-[#1a1a1a] hover:border-white/10 transition-all duration-300 shadow-lg"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-400 mb-2">{title}</p>
          <p className={`text-3xl font-bold ${colorClasses[color]} mb-1`}>{value}</p>
          {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
        </div>
        <div className="bg-white/5 p-3 rounded-xl border border-white/10">
          <Icon className="text-2xl text-white" />
        </div>
      </div>
    </motion.div>
  );
};

const TaxCalculator = () => {
  const [formData, setFormData] = useState({
    purchasePrice: "",
    salePrice: "",
    purchaseDate: "",
    saleDate: "",
    assetType: "listed", // listed or unlisted
  });

  const [result, setResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const calculateTax = (e) => {
    e.preventDefault();
    setIsCalculating(true);
    
    // Simulate calculation delay for better UX
    setTimeout(() => {
      const purchase = parseFloat(formData.purchasePrice) || 0;
      const sale = parseFloat(formData.salePrice) || 0;
      const purchaseDate = new Date(formData.purchaseDate);
      const saleDate = new Date(formData.saleDate);
      
      // Validate dates
      if (saleDate <= purchaseDate) {
        alert("Sale date must be after purchase date");
        setIsCalculating(false);
        return;
      }
      
      // Calculate holding period accurately
      const diffTime = Math.abs(saleDate - purchaseDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const months = diffDays / 30; // Approximate months
      const years = diffDays / 365; // Approximate years
      
      // Calculate capital gains
      const gains = sale - purchase;
      
      // Handle losses - no tax on losses
      if (gains <= 0) {
        setResult({
          holdingPeriod: months,
          holdingPeriodYears: years,
          holdingPeriodDays: diffDays,
          gains,
          stt: 0,
          tax: 0,
          totalTax: 0,
          taxType: "Loss",
          effectiveRate: 0,
          isLoss: true
        });
        setIsCalculating(false);
        return;
      }
      
      // Calculate STT (0.1% on both purchase and sale value for listed securities)
      const stt = formData.assetType === "listed" ? (purchase + sale) * 0.001 : 0;
      
      let tax = 0;
      let taxType = "";
      
      if (formData.assetType === "listed") {
        if (months < 12) {
          // Short Term Capital Gains (STCG)
          taxType = "STCG";
          tax = gains * 0.20; // 20% for STCG on listed shares
        } else {
          // Long Term Capital Gains (LTCG)
          taxType = "LTCG";
          if (gains > 125000) {
            tax = (gains - 125000) * 0.125; // 12.5% for LTCG above 1.25L
          }
        }
      } else {
        if (months < 24) {
          // Short Term Capital Gains (STCG)
          taxType = "STCG";
          tax = gains * 0.30; // Assuming highest tax slab rate of 30%
        } else {
          // Long Term Capital Gains (LTCG)
          taxType = "LTCG";
          tax = gains * 0.125; // 12.5% for LTCG
        }
      }

      setResult({
        holdingPeriod: months,
        holdingPeriodYears: years,
        holdingPeriodDays: diffDays,
        gains,
        stt,
        tax,
        totalTax: tax + stt,
        taxType,
        effectiveRate: ((tax + stt) / gains) * 100 || 0,
        isLoss: false
      });
      setIsCalculating(false);
    }, 500);
  };

  useEffect(() => {
    document.title = "Zelbi | Tax Calculator";
  }, []);

  return (
<div className="min-h-screen bg-black text-white p-4 mt-14 md:p-6 lg:flex lg:items-center lg:justify-center">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:w-full">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 md:mb-12 text-center"
        >
          <motion.div 
            className="flex items-center justify-center mb-4 md:mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <div className="bg-gradient-to-br from-green-400/20 to-green-400/5 p-4 md:p-5 rounded-2xl border border-green-400/30 shadow-lg shadow-green-400/20">
              <FaCalculator className="text-4xl md:text-5xl text-green-400" />
            </div>
          </motion.div>
          <h1 className="text-3xl md:text-5xl font-bold mb-2 md:mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text">
            Stock Market Tax Calculator
          </h1>
          <p className="text-gray-400 text-sm md:text-lg px-4">Calculate your capital gains tax and STT for stock market investments</p>
        </motion.div>

        <TradeTaxSummary />

        <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Single trade calculator</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Calculator Form */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-[#101010] to-[#0a0a0a] rounded-2xl p-6 md:p-8 border border-[#1a1a1a] shadow-xl"
          >
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                <FaExchangeAlt className="text-xl text-white" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white">Transaction Details</h2>
            </div>
            
            <form onSubmit={calculateTax} className="space-y-4 md:space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 md:mb-3">
                  Asset Type
                </label>
                <select
                  name="assetType"
                  value={formData.assetType}
                  onChange={handleChange}
                  className="w-full bg-[#1a1a1a] text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400/50 border border-[#1a1a1a] hover:border-green-400/30 transition-all text-sm md:text-base"
                >
                  <option value="listed">Listed Equity Shares</option>
                  <option value="unlisted">Unlisted Securities</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 md:mb-3">
                  Purchase Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-green-400 font-semibold text-sm md:text-base">₹</span>
                  <input
                    type="number"
                    name="purchasePrice"
                    value={formData.purchasePrice}
                    onChange={handleChange}
                    className="w-full bg-[#1a1a1a] text-white rounded-xl pl-8 md:pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400/50 border border-[#1a1a1a] hover:border-green-400/30 transition-all text-sm md:text-base"
                    placeholder="Enter purchase price"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 md:mb-3">
                  Sale Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-green-400 font-semibold text-sm md:text-base">₹</span>
                  <input
                    type="number"
                    name="salePrice"
                    value={formData.salePrice}
                    onChange={handleChange}
                    className="w-full bg-[#1a1a1a] text-white rounded-xl pl-8 md:pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400/50 border border-[#1a1a1a] hover:border-green-400/30 transition-all text-sm md:text-base"
                    placeholder="Enter sale price"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2 md:mb-3">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    name="purchaseDate"
                    value={formData.purchaseDate}
                    onChange={handleChange}
                    className="w-full bg-[#1a1a1a] text-white rounded-xl px-3 md:px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400/50 border border-[#1a1a1a] hover:border-green-400/30 transition-all text-xs md:text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2 md:mb-3">
                    Sale Date
                  </label>
                  <input
                    type="date"
                    name="saleDate"
                    value={formData.saleDate}
                    onChange={handleChange}
                    className="w-full bg-[#1a1a1a] text-white rounded-xl px-3 md:px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400/50 border border-[#1a1a1a] hover:border-green-400/30 transition-all text-xs md:text-base"
                    required
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={isCalculating}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-green-400 to-green-500 text-black font-bold py-3 md:py-4 rounded-xl hover:from-green-500 hover:to-green-400 transition-all duration-300 shadow-lg shadow-green-400/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
              >
                {isCalculating ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    Calculating...
                  </span>
                ) : (
                  "Calculate Tax"
                )}
              </motion.button>
            </form>
          </motion.div>
          
          {/* Results */}
          {result && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-3 md:space-y-4"
            >
              {/* Status Badge */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full border text-xs md:text-sm ${
                  result.isLoss 
                    ? 'bg-red-400/10 border-red-400/30 text-red-400' 
                    : 'bg-green-400/10 border-green-400/30 text-green-400'
                }`}
              >
                {result.isLoss ? (
                  <FaExclamationTriangle className="text-xs md:text-sm" />
                ) : (
                  <FaCheckCircle className="text-xs md:text-sm" />
                )}
                <span className="font-semibold">
                  {result.isLoss ? 'Capital Loss' : result.taxType}
                </span>
              </motion.div>

              {/* Holding Period Card */}
              <ResultCard
                title="Holding Period"
                value={
                  result.isLoss ? `${result.holdingPeriodDays} days` : 
                  result.holdingPeriodYears >= 1 ? `${result.holdingPeriodYears.toFixed(1)} years` :
                  `${result.holdingPeriod.toFixed(1)} months`
                }
                subtitle={result.isLoss ? 'Loss - No Tax Applicable' : 
                  result.holdingPeriod < (formData.assetType === "listed" ? 12 : 24) 
                    ? 'Short Term Capital Gains' 
                    : 'Long Term Capital Gains'}
                icon={FaClock}
                color={result.isLoss ? "gray" : "blue"}
                delay={0.1}
              />

              {/* Capital Gains Card */}
              <ResultCard
                title="Capital Gains"
                value={`${result.isLoss ? '-' : '+'}₹${Math.abs(result.gains).toLocaleString('en-IN')}`}
                subtitle={result.isLoss ? 'Capital Loss' : 'Net Profit'}
                icon={FaExchangeAlt}
                color={result.isLoss ? "red" : "green"}
                delay={0.2}
              />

              {/* STT Card */}
              {!result.isLoss && (
                <ResultCard
                  title="Securities Transaction Tax (STT)"
                  value={`₹${result.stt.toLocaleString('en-IN')}`}
                  subtitle={formData.assetType === "listed" ? "0.1% on purchase + sale value" : "Not applicable"}
                  icon={FaPercentage}
                  color="gray"
                  delay={0.3}
                />
              )}

              {/* Tax Breakdown */}
              {!result.isLoss && (
                <ResultCard
                  title="Tax on Gains"
                  value={`₹${result.tax.toLocaleString('en-IN')}`}
                  subtitle={
                    result.taxType === 'STCG' 
                      ? formData.assetType === "listed" 
                        ? '20% STCG rate' 
                        : 'As per tax slab' 
                      : formData.assetType === "listed"
                        ? '12.5% LTCG (above ₹1.25L)'
                        : '12.5% LTCG'
                  }
                  icon={FaMoneyBillWave}
                  color="white"
                  delay={0.4}
                />
              )}

              {/* Total Tax Card */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-gradient-to-br from-green-400/10 to-green-400/5 rounded-2xl p-4 md:p-6 border-2 border-green-400/30 shadow-xl shadow-green-400/20"
              >
                <div className="flex items-start justify-between mb-2 md:mb-3">
                  <div className="flex-1">
                    <p className="text-xs md:text-sm font-semibold text-gray-300 mb-1 md:mb-2">Total Tax Payable</p>
                    <p className={`text-2xl md:text-4xl font-bold ${result.isLoss ? 'text-gray-500' : 'text-green-400'}`}>
                      {result.isLoss ? '₹0' : `₹${result.totalTax.toLocaleString('en-IN')}`}
                    </p>
                    {!result.isLoss && (
                      <p className="text-xs md:text-sm text-gray-400 mt-1 md:mt-2">
                        Effective rate: {result.effectiveRate.toFixed(2)}%
                      </p>
                    )}
                  </div>
                  <div className="bg-green-400/20 p-2 md:p-3 rounded-xl border border-green-400/30">
                    <FaInfoCircle className="text-xl md:text-2xl text-green-400" />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* Tax Information */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 md:mt-16"
        >
          <div className="text-center mb-6 md:mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 md:mb-3 text-white">Tax Rules for Stock Market Investments</h2>
            <p className="text-gray-400 text-sm md:text-base px-4">Understanding the tax implications of your investments</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* STCG Card */}
            <TaxRuleCard title="Short Term Capital Gains (STCG)" icon={FaChartLine}>
              <div className="space-y-3 md:space-y-4 text-gray-400">
                <div className="flex items-start gap-2 md:gap-3">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 mt-1 md:mt-1.5 rounded-full bg-green-400 flex-shrink-0"></div>
                  <div>
                    <p className="font-semibold text-white mb-1 text-sm md:text-base">Listed Equity</p>
                    <p className="text-xs md:text-sm">Holding period: Less than 12 months</p>
                    <p className="text-green-400 font-semibold mt-1 text-xs md:text-sm">Tax rate: 20% on gains</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 md:gap-3">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 mt-1 md:mt-1.5 rounded-full bg-green-400 flex-shrink-0"></div>
                  <div>
                    <p className="font-semibold text-white mb-1 text-sm md:text-base">Unlisted Securities</p>
                    <p className="text-xs md:text-sm">Holding period: Less than 24 months</p>
                    <p className="text-green-400 font-semibold mt-1 text-xs md:text-sm">Tax rate: As per individual's tax slab</p>
                  </div>
                </div>
              </div>
            </TaxRuleCard>

            {/* LTCG Card */}
            <TaxRuleCard title="Long Term Capital Gains (LTCG)" icon={FaMoneyBillWave}>
              <div className="space-y-3 md:space-y-4 text-gray-400">
                <div className="flex items-start gap-2 md:gap-3">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 mt-1 md:mt-1.5 rounded-full bg-green-400 flex-shrink-0"></div>
                  <div>
                    <p className="font-semibold text-white mb-1 text-sm md:text-base">Listed Equity</p>
                    <p className="text-xs md:text-sm">Holding period: 12 months or more</p>
                    <p className="text-green-400 font-semibold mt-1 text-xs md:text-sm">Exempt up to ₹1.25 lakh/year</p>
                    <p className="text-green-400 font-semibold text-xs md:text-sm">12.5% on gains above ₹1.25 lakh</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 md:gap-3">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 mt-1 md:mt-1.5 rounded-full bg-green-400 flex-shrink-0"></div>
                  <div>
                    <p className="font-semibold text-white mb-1 text-sm md:text-base">Unlisted Securities</p>
                    <p className="text-xs md:text-sm">Holding period: 24 months or more</p>
                    <p className="text-green-400 font-semibold mt-1 text-xs md:text-sm">Tax rate: 12.5% on gains</p>
                  </div>
                </div>
              </div>
            </TaxRuleCard>

            {/* STT Card */}
            <TaxRuleCard title="Securities Transaction Tax (STT)" icon={FaPercentage}>
              <div className="space-y-3 md:space-y-4 text-gray-400">
                <div className="flex items-start gap-2 md:gap-3">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 mt-1 md:mt-1.5 rounded-full bg-green-400 flex-shrink-0"></div>
                  <div>
                    <p className="font-semibold text-white mb-1 text-sm md:text-base">Listed Securities</p>
                    <p className="text-xs md:text-sm">0.1% on purchase value</p>
                    <p className="text-xs md:text-sm">0.1% on sale value</p>
                    <p className="text-green-400 font-semibold mt-1 text-xs md:text-sm">Total: 0.2% of transaction</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 md:gap-3">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 mt-1 md:mt-1.5 rounded-full bg-green-400 flex-shrink-0"></div>
                  <div>
                    <p className="font-semibold text-white mb-1 text-sm md:text-base">Unlisted Securities</p>
                    <p className="text-xs md:text-sm">STT not applicable</p>
                  </div>
                </div>
              </div>
            </TaxRuleCard>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 md:mt-10 text-center"
          >
            <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-xl px-4 md:px-6 py-2 md:py-3">
              <FaExclamationTriangle className="text-yellow-400 text-xs md:text-sm" />
              <p className="text-xs md:text-sm text-gray-300">
                <span className="font-semibold">Note:</span> This calculator provides an estimate. Please consult a tax professional for accurate calculations.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default TaxCalculator;