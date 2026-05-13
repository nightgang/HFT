import { useState, useEffect, useRef } from "react";
import { createChart, ColorType } from "lightweight-charts";
import { TrendingUp, Settings, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

function KatanaChart() {
  const [timeframe, setTimeframe] = useState("1H");
  const [chartType, setChartType] = useState("candle");
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#94a3b8",
        fontSize: 12,
        fontFamily: "Inter, sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.1)" },
        horzLines: { color: "rgba(148, 163, 184, 0.1)" },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: "rgba(168, 85, 247, 0.5)", width: 1 },
        horzLine: { color: "rgba(168, 85, 247, 0.5)", width: 1 },
      },
      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.2)",
        textColor: "#94a3b8",
      },
      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.2)",
        textColor: "#94a3b8",
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
    });

    // Generate candlestick data
    const generateCandles = () => {
      const candles = [];
      let time = Date.now() / 1000 - 3600 * 24; // 24 hours ago
      let price = 150;

      for (let i = 0; i < 100; i++) {
        const open = price;
        const change = (Math.random() - 0.5) * 10;
        price += change;
        const high = Math.max(open, price) + Math.random() * 2;
        const low = Math.min(open, price) - Math.random() * 2;
        const close = price;

        candles.push({
          time: time,
          open: open,
          high: high,
          low: low,
          close: close,
        });

        time += 3600 / 4; // 15 minute intervals
      }

      return candles;
    };

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#10b981",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });

    candlestickSeries.setData(generateCandles());

    // Add volume series
    const volumeSeries = chart.addHistogramSeries({
      color: "rgba(168, 85, 247, 0.5)",
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "",
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    const volumeData = generateCandles().map((candle) => ({
      time: candle.time,
      value: Math.random() * 1000 + 500,
      color:
        candle.close > candle.open
          ? "rgba(16, 185, 129, 0.5)"
          : "rgba(239, 68, 68, 0.5)",
    }));

    volumeSeries.setData(volumeData);

    chartRef.current = chart;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-purple-950/40 to-black/60 border border-purple-500/30 rounded-xl overflow-hidden backdrop-blur-sm"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-purple-500/20 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <motion.h3
            className="font-bold text-white"
            animate={{ color: ["#ffffff", "#a855f7", "#ffffff"] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            SOL/USDC
          </motion.h3>
          <div className="text-2xl font-bold text-green-400">$168.35</div>
          <div className="text-sm text-green-400">+2.45%</div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          {["15M", "1H", "4H", "1D"].map((tf) => (
            <motion.button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded text-xs font-medium transition ${
                timeframe === tf
                  ? "bg-purple-500/40 border border-purple-400 text-purple-200 shadow-lg shadow-purple-500/20"
                  : "bg-purple-500/10 border border-purple-400/20 text-gray-400 hover:text-gray-200 hover:bg-purple-500/20"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tf}
            </motion.button>
          ))}
          <motion.button
            className="p-2 hover:bg-purple-500/20 rounded-lg text-purple-400 transition"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <Settings className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Chart */}
      <div className="px-4 py-4">
        <div ref={chartContainerRef} className="w-full h-80" />
      </div>
    </motion.div>
  );
}

export default KatanaChart;
