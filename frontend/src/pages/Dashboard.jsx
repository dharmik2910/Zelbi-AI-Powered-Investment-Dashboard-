import axios from 'axios';
import debounce from 'lodash/debounce';
import { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { FaArrowDown, FaArrowUp, FaChartLine, FaRegStar, FaRobot, FaSearch, FaStar } from 'react-icons/fa';
import { ImStatsBars } from 'react-icons/im';

const Dashboard = () => {

  const [stockData, setStockData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
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
    { label: "1hour", value: "1hour" },
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
}, [timeframe, selectedStock]);

  // Debounced search handler
  const debouncedSearch = debounce((value) => {
  setSearchQuery(value);
}, 300);

  const handleSearchInput = (e) => {
    const value = e.target.value;
    debouncedSearch(value);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchStockData(searchQuery.trim());
    }
  };

  const tradingViewOptions = {
    chart: {
      type: 'line',
      height: 600,
      background: '#0a0a0a',
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
    },
    title: {
      text: `${selectedStock} Stock Price`,
      align: 'left',
      style: {
        color: '#fff'
      }
    },
    xaxis: {
      type: 'datetime',
      labels: {
        style: {
          colors: '#fff'
        }
      }
    },
    yaxis: [
      {
        title: {
          text: "Price",
          style: {
            color: '#fff'
          }
        },
        labels: {
          style: {
            colors: '#fff'
          },
          formatter: (value) => `$${value.toFixed(2)}`
        }
      },
      {
        opposite: true,
        title: {
          text: "Volume",
          style: {
            color: '#fff'
          }
        },
        labels: {
          style: {
            colors: '#fff'
          },
          formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
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
  };

  const candlestickOptions = {
    chart: {
      type: 'candlestick',
      height: 350,
      background: '#0a0a0a',
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
        color: '#fff'
      }
    },
    xaxis: {
      type: 'datetime',
      labels: {
        style: {
          colors: '#fff'
        }
      }
    },
    yaxis: {
      tooltip: {
        enabled: true
      },
      labels: {
        style: {
          colors: '#fff'
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
  };

  const analyzeStock = async () => {
    try {
      setIsAnalyzing(true);
      const prompt = `Analyze the stock ${selectedStock} based on the following data:
        Current Price: $${stockData?.currentPrice?.toFixed(2)}
        24h Change: ${stockData?.priceChanges?.[stockData.priceChanges.length - 1]?.toFixed(2)}%
        Volume: ${(stockData?.currentVolume / 1000000).toFixed(1)}M
        High: $${stockData?.currentHigh?.toFixed(2)}
        Low: $${stockData?.currentLow?.toFixed(2)}
        
        Please provide a detailed analysis including:
        1. Current market position
        2. Technical indicators interpretation
        3. Risk assessment and future buying/selling
        4. Short-term outlook
        Keep the analysis concise but comprehensive.keep output data as small as possible`;

const response = await axios.post(
  `${process.env.REACT_APP_API_URL}/ai/analyze`,
  { prompt }
);

      if (response.data && response.data.result) {
        setAiAnalysis(response.data.result);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error analyzing stock:', error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setAiAnalysis(`Error: ${error.response.data.error || 'Server error occurred'}`);
      } else if (error.request) {
        // The request was made but no response was received
        setAiAnalysis('Error: No response received from server. Please check if the server is running.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setAiAnalysis(`Error: ${error.message}`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-full bg-black text-white p-8 mt-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 w-full md:w-auto">
            <div className="flex items-center space-x-4">
              <div className="bg-cyan-600 p-3 rounded-xl shadow-lg shadow-cyan-500/20">
                <FaChartLine className="text-2xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-cyan-400">
                  Stock Dashboard
                </h1>
                <p className="text-gray-400">Track your investments in real-time</p>
              </div>
            </div>
            
            <div className="w-full md:w-auto">
              <form onSubmit={handleSearch} className="flex items-center">
                <div className="relative flex-1">
                  <input
                    type="text"
                    //value={searchQuery}
                    onChange={handleSearchInput}
                    placeholder="Search stock symbol (e.g., AAPL, MSFT)"
                    className="w-full bg-black text-white pl-12 pr-4 py-3 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-white/20 placeholder-gray-400 caret-white"
                  />
                  <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <button
                  type="submit"
                  className="bg-black hover:bg-white hover:text-black px-6 py-3 rounded-r-xl hover:bg-cyan-700 transition-all duration-200 font-medium shadow-lg shadow-cyan-500/20"
                >
                  Search
                </button>
              </form>
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border border-gray-700 w-full md:w-auto">
            <h2 className="text-lg font-semibold mb-3 flex items-center">
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

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-6 border border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-cyan-400">{selectedStock}</h2>
              <button
                onClick={() => toggleFavorite(selectedStock)}
                className="text-2xl text-cyan-400 hover:text-cyan-300 transition-colors transform hover:scale-110"
              >
                {isFavorite(selectedStock) ? <FaStar /> : <FaRegStar />}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {timeframes.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => setTimeframe(tf.value)}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    timeframe === tf.value
                      ? 'bg-white text-black shadow-lg shadow-cyan-500/20'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#0a0a0a] rounded-2xl p-6 border border-[#1a1a1a]">
            <h3 className="text-gray-400 mb-2">Current Price</h3>
            <p className="text-2xl font-bold">${stockData?.currentPrice?.toFixed(2)}</p>
          </div>
          <div className="bg-[#0a0a0a] rounded-2xl p-6 border border-[#1a1a1a]">
            <h3 className="text-gray-400 mb-2">Price Change</h3>
            <p className={`text-2xl font-bold flex items-center ${
              stockData?.priceChanges?.[0] >= 0 ? "text-green-500" : "text-red-500"
            }`}>
              {stockData?.priceChanges?.[0] >= 0 ? <FaArrowUp className="mr-2" /> : <FaArrowDown className="mr-2" />}
              {Math.abs(stockData?.priceChanges?.[0]).toFixed(2)}%
            </p>
          </div>
          <div className="bg-[#0a0a0a] rounded-2xl p-6 border border-[#1a1a1a]">
            <h3 className="text-gray-400 mb-2">Volume</h3>
            <p className="text-2xl font-bold flex items-center">
              <ImStatsBars className="mr-2" />
              {(stockData?.currentVolume / 1000000).toFixed(2)}M
            </p>
          </div>
          <div className="bg-[#0a0a0a] rounded-2xl p-6 border border-[#1a1a1a]">
            <h3 className="text-gray-400 mb-2">High/Low</h3>
            <p className="text-2xl font-bold">
              ${stockData?.currentHigh?.toFixed(2)} / ${stockData?.currentLow?.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="bg-[#141414] rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <h2 className="text-2xl font-bold">{selectedStock}</h2>
              <button
                onClick={() => toggleFavorite(selectedStock)}
                className="text-yellow-500 hover:text-yellow-400"
              >
                {isFavorite(selectedStock) ? <FaStar /> : <FaRegStar />}
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  setShowAIModal(true);
                  analyzeStock();
                }}
                className="flex items-center px-4 py-2 bg-[#3affa3] text-black rounded-lg hover:bg-[#3affa3]/90 transition-colors duration-300"
              >
                <FaRobot className="mr-2" />
                ASK ZELBI AI
              </button>
              {timeframes.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => setTimeframe(tf.value)}
                  className={`px-4 py-2 rounded-lg ${
                    timeframe === tf.value ? 'bg-[#3affa3] text-black' : 'bg-gray-800 text-white'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
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
            <div className="space-y-8">
              <div className="bg-[#0a0a0a] rounded-2xl p-6 border border-[#1a1a1a]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Trading View</h3>
                  <div className="flex items-center space-x-4">
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
                <ReactApexChart
                  options={tradingViewOptions}
                  series={[
                    {
                      name: "Price",
                      type: 'line',
                      data: stockData.timestamps.map((timestamp, i) => ({
                        x: timestamp,
                        y: stockData.prices[i]
                      }))
                    },
                    ...(showMAs.ma50 ? [{
                      name: "50 MA",
                      type: 'line',
                      data: stockData.timestamps.map((timestamp, i) => ({
                        x: timestamp,
                        y: stockData.ma50[i]
                      }))
                    }] : []),
                    ...(showMAs.ma200 ? [{
                      name: "200 MA",
                      type: 'line',
                      data: stockData.timestamps.map((timestamp, i) => ({
                        x: timestamp,
                        y: stockData.ma200[i]
                      }))
                    }] : []),
                    {
                      name: "Volume",
                      type: 'bar',
                      data: stockData.timestamps.map((timestamp, i) => ({
                        x: timestamp,
                        y: stockData.volumes[i]
                      }))
                    }
                  ]}
                  height={600}
                />
              </div>

              <div className="bg-[#0a0a0a] rounded-2xl p-6 border border-[#1a1a1a]">
                <h3 className="text-xl font-semibold mb-4">Price Chart</h3>
                <ReactApexChart
                  options={candlestickOptions}
                  series={[{ data: stockData.candlestickData }]}
                  type="candlestick"
                  height={350}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* AI Analysis Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#141414] rounded-lg p-6 max-w-2xl w-full mx-4 relative">
            <button
              onClick={() => setShowAIModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>
            <div className="flex items-center mb-4">
              <FaRobot className="text-[#3affa3] text-2xl mr-2" />
              <h3 className="text-xl font-bold">ZELBI AI Analysis</h3>
            </div>
            {isAnalyzing ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#3affa3]"></div>
                <span className="ml-2">Analyzing {selectedStock}...</span>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{aiAnalysis}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;