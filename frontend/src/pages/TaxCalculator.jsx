import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaCalculator, FaExchangeAlt, FaClock, FaInfoCircle, FaChartLine, FaMoneyBillWave, FaPercentage } from "react-icons/fa";

const TaxRuleCard = ({ title, icon: Icon, children }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-[#101010] rounded-2xl p-6 border border-[#1a1a1a] hover:border-green-400/30 transition-all duration-300"
    >
      <div 
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-[#1a1a1a] p-3 rounded-xl group-hover:bg-white/5 transition-colors duration-300">
            <Icon className="text-2xl text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <motion.div
          initial={false}
          animate={{ height: isExpanded ? "auto" : "0" }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const calculateTax = (e) => {
    e.preventDefault();
    
    const purchase = parseFloat(formData.purchasePrice) || 0;
    const sale = parseFloat(formData.salePrice) || 0;
    const purchaseDate = new Date(formData.purchaseDate);
    const saleDate = new Date(formData.saleDate);
    
    // Calculate holding period in months
    const months = (saleDate.getFullYear() - purchaseDate.getFullYear()) * 12 +
      (saleDate.getMonth() - purchaseDate.getMonth());
    
    // Calculate capital gains
    const gains = sale - purchase;
    
    // Calculate STT (0.1% on sale value for listed securities)
    const stt = formData.assetType === "listed" ? sale * 0.001 : 0;
    
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
      gains,
      stt,
      tax,
      totalTax: tax + stt,
      taxType,
      effectiveRate: ((tax + stt) / gains) * 100 || 0
    });
  };

  useEffect(() => {
    document.title = "Zelbi | Tax Calculator";
    return () => {
      document.title = "Zelbi";
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-[#101010] p-4 rounded-2xl">
              <FaCalculator className="text-4xl text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2">Stock Market Tax Calculator</h1>
          <p className="text-gray-400">Calculate your capital gains tax and STT for stock market investments</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calculator Form */}
          <div className="bg-[#101010] rounded-2xl p-6 border border-[#1a1a1a]">
            <h2 className="text-2xl font-semibold mb-6">Transaction Details</h2>
            <form onSubmit={calculateTax} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Asset Type
                </label>
                <select
                  name="assetType"
                  value={formData.assetType}
                  onChange={handleChange}
                  className="w-full bg-[#1a1a1a] text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  <option value="listed">Listed Equity Shares</option>
                  <option value="unlisted">Unlisted Securities</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Purchase Price
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">₹</span>
                  <input
                    type="number"
                    name="purchasePrice"
                    value={formData.purchasePrice}
                    onChange={handleChange}
                    className="w-full bg-[#1a1a1a] text-white rounded-xl px-10 py-3 focus:outline-none focus:ring-2 focus:ring-white/20"
                    placeholder="Enter purchase price"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Sale Price
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">₹</span>
                  <input
                    type="number"
                    name="salePrice"
                    value={formData.salePrice}
                    onChange={handleChange}
                    className="w-full bg-[#1a1a1a] text-white rounded-xl px-10 py-3 focus:outline-none focus:ring-2 focus:ring-white/20"
                    placeholder="Enter sale price"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Purchase Date
                </label>
                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                  className="w-full bg-[#1a1a1a] text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Sale Date
                </label>
                <input
                  type="date"
                  name="saleDate"
                  value={formData.saleDate}
                  onChange={handleChange}
                  className="w-full bg-[#1a1a1a] text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors duration-300"
              >
                Calculate Tax
              </button>
            </form>
          </div>
          
          {/* Results */}
          {result && (
            <div className="space-y-6">
              {/* Holding Period Card */}
              <div className="bg-[#101010] rounded-2xl p-6 border border-[#1a1a1a]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-400">Holding Period</h3>
                  <FaClock className="text-2xl text-white" />
                </div>
                <p className="text-3xl font-bold">{result.holdingPeriod} months</p>
                <p className="text-sm text-gray-400 mt-2">
                  {result.holdingPeriod < (formData.assetType === "listed" ? 12 : 24) 
                    ? 'Short Term Capital Gains (STCG)' 
                    : 'Long Term Capital Gains (LTCG)'}
                </p>
              </div>

              {/* Capital Gains Card */}
              <div className="bg-[#101010] rounded-2xl p-6 border border-[#1a1a1a]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-400">Capital Gains</h3>
                  <FaExchangeAlt className="text-2xl text-white" />
                </div>
                <p className="text-3xl font-bold">₹{result.gains.toLocaleString('en-IN')}</p>
              </div>

              {/* STT Card */}
              <div className="bg-[#101010] rounded-2xl p-6 border border-[#1a1a1a]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-400">Securities Transaction Tax (STT)</h3>
                  <FaCalculator className="text-2xl text-white" />
                </div>
                <p className="text-3xl font-bold">₹{result.stt.toLocaleString('en-IN')}</p>
              </div>

              {/* Total Tax Card */}
              <div className="bg-[#101010] rounded-2xl p-6 border border-[#1a1a1a]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-400">Total Tax</h3>
                  <FaInfoCircle className="text-2xl text-white" />
                </div>
                <p className="text-3xl font-bold">₹{result.totalTax.toLocaleString('en-IN')}</p>
                <p className="text-sm text-gray-400 mt-2">
                  {result.taxType === 'STCG' 
                    ? formData.assetType === "listed" 
                      ? '20% STCG + STT' 
                      : 'As per tax slab + STT' 
                    : formData.assetType === "listed"
                      ? '12.5% LTCG (above ₹1.25L) + STT'
                      : '12.5% LTCG + STT'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tax Information */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-12"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">Tax Rules for Stock Market Investments</h2>
            <p className="text-gray-400">Understanding the tax implications of your investments</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* STCG Card */}
            <TaxRuleCard title="Short Term Capital Gains (STCG)" icon={FaChartLine}>
              <div className="space-y-4 text-gray-400">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 mt-2 rounded-full bg-green-400"></div>
                  <div>
                    <p className="font-medium text-white">Listed Equity</p>
                    <p>Less than 12 months holding period</p>
                    <p className="text-green-400">Tax rate: 20% on gains</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 mt-2 rounded-full bg-green-400"></div>
                  <div>
                    <p className="font-medium text-white">Unlisted Securities</p>
                    <p>Less than 24 months holding period</p>
                    <p className="text-green-400">Tax rate: As per individual's tax slab</p>
                  </div>
                </div>
              </div>
            </TaxRuleCard>

            {/* LTCG Card */}
            <TaxRuleCard title="Long Term Capital Gains (LTCG)" icon={FaMoneyBillWave}>
              <div className="space-y-4 text-gray-400">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 mt-2 rounded-full bg-green-400"></div>
                  <div>
                    <p className="font-medium text-white">Listed Equity</p>
                    <p>12 months or more holding period</p>
                    <p className="text-green-400">Exempt up to ₹1.25 lakh per year</p>
                    <p className="text-green-400">12.5% on gains above ₹1.25 lakh</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 mt-2 rounded-full bg-green-400"></div>
                  <div>
                    <p className="font-medium text-white">Unlisted Securities</p>
                    <p>24 months or more holding period</p>
                    <p className="text-green-400">Tax rate: 12.5% on gains</p>
                  </div>
                </div>
              </div>
            </TaxRuleCard>

            {/* STT Card */}
            <TaxRuleCard title="Securities Transaction Tax (STT)" icon={FaPercentage}>
              <div className="space-y-4 text-gray-400">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 mt-2 rounded-full bg-green-400"></div>
                  <div>
                    <p>0.1% on the sale value of equity shares</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 mt-2 rounded-full bg-green-400"></div>
                  <div>
                    <p>Applicable on both purchase and sale of listed securities</p>
                  </div>
                </div>
              </div>
            </TaxRuleCard>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-gray-400 italic">
              Note: This calculator provides an estimate. Please consult a tax professional for accurate calculations.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default TaxCalculator;