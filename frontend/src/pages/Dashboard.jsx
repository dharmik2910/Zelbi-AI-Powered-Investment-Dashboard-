import axios from 'axios';
import debounce from 'lodash/debounce';
import { useEffect, useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import ReactMarkdown from 'react-markdown';
import { FaArrowDown, FaArrowUp, FaChartLine, FaRegStar, FaRobot, FaSearch, FaStar } from 'react-icons/fa';
import { ImStatsBars } from 'react-icons/im';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '../slices/profileSlice';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.profile);
  const { token } = useSelector((state) => state.auth);
  const promptCount = user?.aiPromptCount || 0;
  const currentPlan = user?.subscriptionPlan || "free";
  const planLimits = { free: 5, pro: 100, elite: Infinity };
  const promptLimit = planLimits[currentPlan] || 5;

  const [stockData, setStockData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState("1day");
  const [selectedStock, setSelectedStock] = useState("AAPL");

  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favoriteStocks');
    return saved ? JSON.parse(saved) : [];
  });
  const [showMAs, setShowMAs] = useState({
    ma50: true,
    ma200: false
  });
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const handleChange = (event) => setIsMobile(event.matches);
    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const chartHeight = isMobile ? 320 : 600;
  const candlestickHeight = isMobile ? 260 : 350;

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('favoriteStocks', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (symbol) => {
    setFavorites(prev => {
      if (prev.includes(symbol)) {
        return prev.filter(s => s !== symbol);
      } else {
        return [...prev, symbol];
      }
    });
  };

  const isFavorite = (symbol) => favorites.includes(symbol);
  const timeframes = [
    { label: "1min", value: "1min" },
    { label: "5min", value: "5min" },
    { label: "15min", value: "15min" },
    { label: "1h", value: "1h" },
    { label: "1day", value: "1day" },
  ];

  const calculateMA = (data, period) => {
    const mas = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        mas.push(null);
        continue;
      }

      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j];
      }
      mas.push(sum / period);
    }
    return mas;
  };

  const fetchStockData = async (symbol) => {
    try {
      setLoading(true);
      setError(null);
      setStockData(null);

      const API_KEY = "73b158b9a1f149acb0aeb5c6ce64df55";
      const response = await axios.get(
        `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${timeframe}&outputsize=500&apikey=${API_KEY}`
      );

      if (response.data.status !== "ok") {
        throw new Error("Failed to fetch stock data");
      }

      const values = response.data.values.reverse(); // Reverse to get chronological order
      const meta = response.data.meta;

      // Transform data for charts
      const timestamps = values.map(item => new Date(item.datetime).getTime());
      const prices = values.map(item => parseFloat(item.close));
      const volumes = values.map(item => parseFloat(item.volume));

      // Calculate moving averages
      const ma50 = calculateMA(prices, 50);
      const ma200 = calculateMA(prices, 200);

      const candlestickData = values.map(item => ({
        x: new Date(item.datetime).getTime(),
        y: [
          parseFloat(item.open),
          parseFloat(item.high),
          parseFloat(item.low),
          parseFloat(item.close)
        ]
      }));

      const priceChanges = values.map((item, index) => {
        if (index === 0) return 0;
        return ((parseFloat(item.close) - parseFloat(values[index - 1].close)) / parseFloat(values[index - 1].close)) * 100;
      });

      setStockData({
        timestamps,
        prices,
        volumes,
        ma50,
        ma200,
        candlestickData,
        priceChanges,
        meta,
        currentPrice: parseFloat(values[values.length - 1].close),
        currentVolume: parseFloat(values[values.length - 1].volume),
        currentHigh: parseFloat(values[values.length - 1].high),
        currentLow: parseFloat(values[values.length - 1].low)
      });
      setSelectedStock(symbol);
    } catch (err) {
      setError("Failed to fetch stock data. Please try a valid stock symbol (e.g., AAPL, MSFT)");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData(selectedStock);
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStock, timeframe]);

  useEffect(() => {
    document.title = "Zelbi | Dashboard";
    return () => {
      document.title = "Zelbi";
    };
  }, []);

  const fetchSearchResults = async (query) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await axios.get(`https://api.twelvedata.com/symbol_search?symbol=${query}`);
      if (response.data && response.data.data) {
        setSearchResults(response.data.data.slice(0, 6));
        setShowDropdown(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Debounced search handler
  const debouncedFetchResults = useMemo(
    () => debounce((value) => fetchSearchResults(value), 400),
    []
  );

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim().length > 0) {
      debouncedFetchResults(value.trim());
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  const handleSelectStock = (symbol) => {
    setSearchQuery("");
    setShowDropdown(false);
    fetchStockData(symbol);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchStockData(searchQuery.trim());
    }
  };

  const tradingViewOptions = useMemo(() => ({
    chart: {
      type: 'line',
      height: chartHeight,
      width: '100%',
      background: '#0a0a0a',
      zoom: {
        enabled: !isMobile,
        allowMouseWheelZoom: false,
      },
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          pan: true,
        },
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    stroke: {
      curve: 'smooth',
      width: [2, 1, 1]
    },
    grid: {
      borderColor: '#1a1a1a',
      strokeDashArray: 4,
      padding: {
        right: 30,
      },
    },
    title: {
      text: `${selectedStock} Stock Price`,
      align: 'left',
      style: {
        color: '#fff',
        fontSize: isMobile ? '14px' : '16px',
      }
    },
    legend: {
      show: true,
      position: 'bottom',
      horizontalAlign: 'center',
      fontSize: isMobile ? '10px' : '12px',
      itemMargin: {
        horizontal: 16,
        vertical: 4,
      },
    },
    xaxis: {
      type: 'datetime',
      tickAmount: isMobile ? 8 : 12,
      labels: {
        show: true,
        hideOverlappingLabels: false,
        rotate: isMobile ? -45 : 0,
        style: {
          colors: '#fff',
          fontSize: isMobile ? '10px' : '12px',
        }
      }
    },
    yaxis: [
      {
        title: {
          text: isMobile ? '' : 'Price',
          style: {
            color: '#fff'
          }
        },
        labels: {
          style: {
            colors: '#fff',
            fontSize: isMobile ? '10px' : '12px',
          },
          formatter: (value) => `$${value.toFixed(isMobile ? 0 : 2)}`
        }
      },
      {
        opposite: true,
        show: true,
        title: {
          text: isMobile ? '' : 'Volume',
          style: {
            color: '#fff'
          }
        },
        labels: {
          style: {
            colors: '#fff',
            fontSize: isMobile ? '8px' : '12px',
          },
          formatter: (value) => `${(value / 1000000).toFixed(0)}M`
        }
      }
    ],
    tooltip: {
      theme: 'dark',
      shared: true,
      intersect: false,
      y: [{
        formatter: function (y) {
          if (typeof y !== "undefined") {
            return `$${y.toFixed(2)}`;
          }
        }
      }]
    }
  }), [selectedStock, isMobile, chartHeight]);

  const candlestickOptions = useMemo(() => ({
    chart: {
      type: 'candlestick',
      height: candlestickHeight,
      width: '100%',
      background: '#0a0a0a',
      zoom: {
        enabled: !isMobile,
        allowMouseWheelZoom: false,
      },
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
        },
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    title: {
      text: 'Price Chart',
      style: {
        color: '#fff',
        fontSize: isMobile ? '14px' : '16px',
      }
    },
    xaxis: {
      type: 'datetime',
      tickAmount: isMobile ? 8 : 12,
      labels: {
        show: true,
        hideOverlappingLabels: false,
        rotate: isMobile ? -45 : 0,
        style: {
          colors: '#fff',
          fontSize: isMobile ? '10px' : '12px',
        }
      }
    },
    yaxis: {
      tooltip: {
        enabled: true
      },
      labels: {
        style: {
          colors: '#fff',
          fontSize: isMobile ? '10px' : '12px',
        }
      }
    },
    theme: {
      mode: 'dark'
    },
    grid: {
      borderColor: '#1a1a1a',
      strokeDashArray: 4,
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: '#00ff00',
          downward: '#ff0000',
          wick: {
            useFillColor: true
          }
        }
      }
    }
  }), [isMobile, candlestickHeight]);

  const tradingSeries = useMemo(() => {
    if (!stockData) return [];
    return [
      {
        name: "Price",
        type: "line",
        data: stockData.timestamps.map((timestamp, i) => ({
          x: timestamp,
          y: stockData.prices[i]
        }))
      },
      ...(showMAs.ma50
        ? [{
          name: "50 MA",
          type: "line",
          data: stockData.timestamps.map((timestamp, i) => ({
            x: timestamp,
            y: stockData.ma50[i]
          }))
        }]
        : []),
      ...(showMAs.ma200
        ? [{
          name: "200 MA",
          type: "line",
          data: stockData.timestamps.map((timestamp, i) => ({
            x: timestamp,
            y: stockData.ma200[i]
          }))
        }]
        : []),
      {
        name: "Volume",
        type: "bar",
        data: stockData.timestamps.map((timestamp, i) => ({
          x: timestamp,
          y: stockData.volumes[i]
        }))
      }
    ];
  }, [stockData, showMAs]);

  const candlestickSeries = useMemo(() => {
    if (!stockData) return [];
    return [{ data: stockData.candlestickData }];
  }, [stockData]);

  const analyzeStock = async () => {
    if (promptCount >= promptLimit) {
      setAiAnalysis(`You have reached your limit of ${promptLimit} AI prompts for the ${currentPlan} plan. Please upgrade your plan to continue using ZELBI AI-Assistant.`);
      return;
    }
    try {
      setIsAnalyzing(true);
      const prompt = `Analyze the stock ${selectedStock} based on the following data:
        Current Price: $${stockData?.currentPrice?.toFixed(2)}
        24h Change: ${stockData?.priceChanges?.[stockData.priceChanges.length - 1]?.toFixed(2)}%
        Volume: ${(stockData?.currentVolume / 1000000).toFixed(1)}M
        High: $${stockData?.currentHigh?.toFixed(2)}
        Low: $${stockData?.currentLow?.toFixed(2)}
        
        Please provide a structured analysis formatted nicely in Markdown. Use headings (###) for the following sections and bullet points for the key takeaways:
        ### Current Market Position
        ### Technical Indicators
        ### Risk Assessment & Action
        ### Short-Term Outlook
        Keep the analysis concise, insightful, and easy to read.`;

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/ai/analyze`,
        { prompt },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data && response.data.result) {
        setAiAnalysis(response.data.result);
        
        const newCount = response.data.aiPromptCount;
        if (typeof newCount === "number" && user) {
          const updatedUser = { ...user, aiPromptCount: newCount };
          dispatch(setUser(updatedUser));
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error analyzing stock:', error);
      if (error.response) {
        setAiAnalysis(`Error: ${error.response.data.error || 'Server error occurred'}`);
      } else if (error.request) {
        setAiAnalysis('Error: No response received from server. Please check if the server is running.');
      } else {
        setAiAnalysis(`Error: ${error.message}`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-full bg-black text-white px-3 py-4 sm:px-6 sm:py-6 md:p-8 mt-16 md:mt-10 overflow-x-hidden">
      <style>{`
        .apexcharts-legend {
          display: flex !important;
          flex-direction: row !important;
          flex-wrap: wrap !important;
          justify-content: center !important;
          align-items: center !important;
          gap: 16px !important;
          padding-top: 20px !important;
        }
        .apexcharts-legend > div {
          display: flex !important;
          flex-direction: row !important;
          gap: 16px !important;
          margin: 0 !important;
        }
        .apexcharts-legend-series {
          display: inline-flex !important;
          align-items: center !important;
          margin: 0 !important;
        }
      `}</style>
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4 md:gap-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 w-full md:w-auto">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="bg-cyan-600 p-2 sm:p-3 rounded-xl shadow-lg shadow-cyan-500/20 shrink-0">
                <FaChartLine className="text-xl sm:text-2xl" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-cyan-400">
                  Stock Dashboard
                </h1>
                <p className="text-gray-400 text-sm sm:text-base">Track your investments in real-time</p>
              </div>
            </div>

            <div className="w-full md:w-auto">
              <form onSubmit={handleSearch} className="flex items-stretch w-full">
                <div className="relative flex-1 min-w-0">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchInput}
                    onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    placeholder={isMobile ? 'Search symbol' : 'Search stock symbol (e.g., AAPL, MSFT)'}
                    className="w-full bg-black text-white pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-white/20 placeholder-gray-400 caret-white text-sm sm:text-base"
                  />
                  <FaSearch className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  
                  {showDropdown && searchResults.length > 0 && (
                    <ul className="absolute z-50 w-full mt-1 bg-[#141414] border border-[#333] rounded-xl shadow-lg max-h-60 overflow-y-auto custom-scrollbar">
                      {searchResults.map((result, idx) => (
                        <li 
                          key={idx}
                          className="px-4 py-2 hover:bg-gray-800 cursor-pointer text-sm border-b border-[#222] last:border-b-0 flex justify-between items-center"
                          onClick={() => handleSelectStock(result.symbol)}
                        >
                          <span className="font-bold text-cyan-400">{result.symbol}</span>
                          <span className="text-gray-400 text-xs truncate ml-2 text-right">{result.instrument_name} ({result.exchange})</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  type="submit"
                  className="bg-black hover:bg-white hover:text-black px-4 sm:px-6 py-2.5 sm:py-3 rounded-r-xl hover:bg-cyan-700 transition-all duration-200 font-medium shadow-lg shadow-cyan-500/20 text-sm sm:text-base shrink-0"
                >
                  Search
                </button>
              </form>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm p-3 sm:p-4 rounded-xl border border-gray-700 w-full md:w-auto">
            <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 flex items-center">
              <FaStar className="text-cyan-400 mr-2" />
              Favorites
            </h2>
            <div className="flex flex-wrap gap-2">
              {favorites.map(symbol => (
                <div
                  key={symbol}
                  className="flex items-center space-x-2 bg-gray-700/50 backdrop-blur-sm px-4 py-2 rounded-full hover:bg-gray-600 transition-all duration-200 cursor-pointer border border-gray-600"
                  onClick={() => fetchStockData(symbol)}
                >
                  <span className="font-medium">{symbol}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(symbol);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <FaStar />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6 md:mb-8">
          <div className="bg-[#0a0a0a] rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-[#1a1a1a]">
            <h3 className="text-gray-400 mb-1 sm:mb-2 text-xs sm:text-sm">Current Price</h3>
            <p className="text-lg sm:text-2xl font-bold">{stockData ? `$${stockData.currentPrice?.toFixed(2)}` : '--'}</p>
          </div>
          <div className="bg-[#0a0a0a] rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-[#1a1a1a]">
            <h3 className="text-gray-400 mb-1 sm:mb-2 text-xs sm:text-sm">Price Change</h3>
            <p className={`text-lg sm:text-2xl font-bold flex items-center ${!stockData ? "text-gray-500" : stockData.priceChanges?.[stockData.priceChanges.length - 1] >= 0 ? "text-green-500" : "text-red-500"}`}>
              {stockData ? (
                <>
                  {stockData.priceChanges?.[stockData.priceChanges.length - 1] >= 0 ? <FaArrowUp className="mr-1 sm:mr-2 text-sm sm:text-base" /> : <FaArrowDown className="mr-1 sm:mr-2 text-sm sm:text-base" />}
                  {Math.abs(stockData.priceChanges?.[stockData.priceChanges.length - 1]).toFixed(2)}%
                </>
              ) : '--'}
            </p>
          </div>
          <div className="bg-[#0a0a0a] rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-[#1a1a1a]">
            <h3 className="text-gray-400 mb-1 sm:mb-2 text-xs sm:text-sm">Volume</h3>
            <p className="text-lg sm:text-2xl font-bold flex items-center">
              {stockData ? (
                <>
                  <ImStatsBars className="mr-1 sm:mr-2 text-sm sm:text-base" />
                  {(stockData.currentVolume / 1000000).toFixed(2)}M
                </>
              ) : '--'}
            </p>
          </div>
          <div className="bg-[#0a0a0a] rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-[#1a1a1a]">
            <h3 className="text-gray-400 mb-1 sm:mb-2 text-xs sm:text-sm">High/Low</h3>
            <p className="text-base sm:text-2xl font-bold">
              {stockData ? `$${stockData.currentHigh?.toFixed(2)} / $${stockData.currentLow?.toFixed(2)}` : '--'}
            </p>
          </div>
        </div>

        {/* <div className="bg-[#141414] rounded-lg p-3 sm:p-6 mb-6 md:mb-8 overflow-hidden"> */}
        <div className="bg-[#141414] rounded-lg p-3 sm:p-6 mb-6 md:mb-8">
          <div className="flex flex-col gap-4 mb-4 sm:mb-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl sm:text-2xl font-bold">{selectedStock}</h2>
              <button
                onClick={() => toggleFavorite(selectedStock)}
                className="text-yellow-500 hover:text-yellow-400"
              >
                {isFavorite(selectedStock) ? <FaStar /> : <FaRegStar />}
              </button>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3 md:shrink-0">
              <button
                onClick={() => {
                  setShowAIModal(true);
                  analyzeStock();
                }}
                className="flex items-center justify-center w-full md:w-auto px-4 py-2.5 bg-[#3affa3] text-black rounded-lg hover:bg-[#3affa3]/90 transition-colors duration-300 text-sm md:text-base font-medium whitespace-nowrap"
              >
                <FaRobot className="mr-2" />
                ASK ZELBI AI
              </button>
              <div className="flex flex-wrap gap-2 md:flex-nowrap">
                {timeframes.map((tf) => (
                  <button
                    key={tf.value}
                    onClick={() => setTimeframe(tf.value)}
                    className={`flex-1 min-w-[calc(33%-0.5rem)] md:flex-none md:min-w-0 px-3 md:px-4 py-2 rounded-lg text-sm md:text-base whitespace-nowrap ${timeframe === tf.value ? 'bg-[#3affa3] text-black' : 'bg-gray-800 text-white'
                      }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            </div>
          ) : error ? (
            <div className="bg-red-900/20 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
              {error}
            </div>
          ) : stockData ? (
            <div className="space-y-4 sm:space-y-8">
              {/* <div className="bg-[#0a0a0a] rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-[#1a1a1a] overflow-hidden"> */}
              <div className="bg-[#0a0a0a] rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-[#1a1a1a]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
                  <h3 className="text-lg sm:text-xl font-semibold">Trading View</h3>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={showMAs.ma50}
                        onChange={(e) => setShowMAs(prev => ({ ...prev, ma50: e.target.checked }))}
                        className="form-checkbox text-blue-500 bg-[#1a1a1a] border-gray-600 rounded"
                      />
                      <span>50 MA</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={showMAs.ma200}
                        onChange={(e) => setShowMAs(prev => ({ ...prev, ma200: e.target.checked }))}
                        className="form-checkbox text-blue-500 bg-[#1a1a1a] border-gray-600 rounded"
                      />
                      <span>200 MA</span>
                    </label>
                  </div>
                </div>


                {/* <div style={{ minWidth: isMobile ? '800px' : '100%' }}> */}
                <div className={isMobile ? "overflow-x-auto" : ""}>
                  <div
                    style={{
                      width: isMobile ? "1200px" : "100%",
                    }}
                  >
                    <ReactApexChart
                      options={tradingViewOptions}
                      series={tradingSeries}
                      width={isMobile ? 1200 : "100%"}
                      height={chartHeight}
                    />
                  </div>
                </div>
              </div>

              {/* <div className="bg-[#0a0a0a] rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-[#1a1a1a] overflow-hidden"> */}
              <div className="bg-[#0a0a0a] rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-[#1a1a1a]">
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Price Chart</h3>
                <div className="overflow-x-auto">
                  <div style={{ minWidth: isMobile ? '800px' : '100%' }}>
                    <ReactApexChart
                      options={candlestickOptions}
                      series={candlestickSeries}
                      type="candlestick"
                      height={candlestickHeight}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* AI Analysis Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] rounded-lg p-6 max-w-2xl w-full relative flex flex-col max-h-[90vh]">
            <button
              onClick={() => setShowAIModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 bg-[#141414] rounded-full p-1"
            >
              ✕
            </button>
            <div className="flex items-center mb-4 shrink-0">
              <FaRobot className="text-[#3affa3] text-2xl mr-2" />
              <h3 className="text-xl font-bold">ZELBI AI Analysis</h3>
            </div>
            {isAnalyzing ? (
              <div className="flex items-center justify-center py-8 shrink-0">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#3affa3]"></div>
                <span className="ml-2">Analyzing {selectedStock}...</span>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none overflow-y-auto pr-2 custom-scrollbar text-sm sm:text-base leading-relaxed">
                <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;