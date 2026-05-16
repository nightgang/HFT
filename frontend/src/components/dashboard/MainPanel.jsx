import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createChart } from "lightweight-charts";
import { RefreshCw } from "lucide-react";

const NEON = {
  green: "#00FF9D",
  red: "#FF3B3B",
  purple: "#8B5CF6",
  cyan: "#22D3EE",
  amber: "#FBBF24",
};

export default function MainPanel() {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const [chartData, setChartData] = useState([]);
  const [selectedPair, setSelectedPair] = useState("SOL/USDC");
  const [timeframe, setTimeframe] = useState("1m");

  useEffect(() => {
    if (chartContainerRef.current && !chartRef.current) {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { color: "#070a12" },
          textColor: "#d1d5db",
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
        },
        width: chartContainerRef.current.clientWidth,
        height: 400,
        timeScale: {
          timeVisible: true,
          secondsVisible: true,
        },
        grid: {
          horzLines: { color: "#1a1a2e" },
          vertLines: { color: "#1a1a2e" },
        },
      });

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: "#00FF9D",
        downColor: "#FF3B3B",
        borderUpColor: "#00FF9D",
        borderDownColor: "#FF3B3B",
        wickUpColor: "#00FF9D",
        wickDownColor: "#FF3B3B",
      });

      const generateCandles = () => {
        const data = [];
        let price = 140;
        const now = Math.floor(Date.now() / 1000);
        for (let i = 100; i >= 0; i--) {
          const change = (Math.random() - 0.5) * 2;
          price += change;
          data.push({
            time: now - i * 60,
            open: price,
            high: price + Math.random() * 1,
            low: price - Math.random() * 1,
            close: price + (Math.random() - 0.5) * 0.5,
          });
        }
        return data;
      };

      const initialData = generateCandles();
      candlestickSeries.setData(initialData);
      chart.timeScale().fitContent();
      chartRef.current = { chart, candlestickSeries };
      setChartData(initialData);

      const handleResize = () => {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      };
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
        chart.remove();
      };
    }
    return undefined;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setChartData((prev) => {
        if (!chartRef.current || !chartRef.current.candlestickSeries || prev.length === 0) {
          return prev;
        }
        const lastCandle = prev[prev.length - 1];
        const newPrice = lastCandle.close + (Math.random() - 0.5) * 0.5;
        const newCandle = {
          time: lastCandle.time + 60,
          open: lastCandle.close,
          high: newPrice + Math.random() * 0.5,
          low: newPrice - Math.random() * 0.5,
          close: newPrice,
        };
        chartRef.current.candlestickSeries.update(newCandle);
        return [...(prev || []).slice(1), newCandle];
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const timeframes = ["1m", "5m", "15m", "1h", "4h", "1d"];
  const tradingPairs = ["SOL/USDC", "BONK/USDC", "JTO/USDC", "ORCA/USDC"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col border-r border-cyan-500/10 bg-black/20 backdrop-blur-3xl rounded-3xl overflow-hidden shadow-[0_30px_90px_6px]"
    >
      <div className="border-b border-cyan-500/20 px-6 py-4 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 bg-black/40">
        <div className="flex flex-wrap gap-2">
          {tradingPairs.map((pair) => (
            <motion.button
              key={pair}
              onClick={() => setSelectedPair(pair)}
              className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                selectedPair === pair
                  ? "bg-cyan-500/30 text-cyan-300 border border-cyan-400"
                  : "bg-black/50 text-gray-400 border border-gray-700 hover:border-cyan-400"
              }`}
            >
              {pair}
            </motion.button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1 items-center">
          {timeframes.map((tf) => (
            <motion.button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-1 rounded text-xs font-mono transition-all ${
                timeframe === tf
                  ? "bg-purple-500/30 text-purple-300"
                  : "bg-black/50 text-gray-400 hover:text-purple-300"
              }`}
            >
              {tf}
            </motion.button>
          ))}
          <motion.button whileHover={{ rotate: 180 }} className="text-cyan-400 hover:text-cyan-300">
            <RefreshCw size={16} />
          </motion.button>
        </div>
      </div>

      <div className="flex-1 p-4 relative">
        <div className="grid grid-cols-2 gap-3 mb-4 text-[11px]">
          <div className="rounded-3xl border border-white/10 bg-black/30 p-3 text-gray-300 shadow-[0_18px_60px_8px]">
            <div className="text-[10px] uppercase tracking-[0.24em] text-gray-500 mb-2">Order Flow</div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-[#00FF9D]">BUY 68%</span>
              <span className="text-sm font-semibold text-[#FF3B3B]">SELL 32%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-[#00FF9D] via-[#22D3EE] to-[#FF3B3B]" style={{ width: "68%" }} />
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/30 p-3 text-gray-300 shadow-[0_18px_60px_8px]">
            <div className="text-[10px] uppercase tracking-[0.24em] text-gray-500 mb-2">Liquidity Zones</div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-cyan-300">High</span>
              <span className="text-sm text-gray-400">3 zones</span>
            </div>
            <div className="mt-3 space-y-2 text-[11px]">
              <div className="rounded-full bg-white/5 px-2 py-1">Bid wall at 0.0009</div>
              <div className="rounded-full bg-white/5 px-2 py-1">Ask wall at 0.0011</div>
            </div>
          </div>
        </div>
        <div
          ref={chartContainerRef}
          className="w-full h-full rounded-lg border bg-black/60 backdrop-blur-sm overflow-hidden relative"
          style={{ borderColor: "rgba(34,211,238,0.06)", boxShadow: `0 12px 40px 10px` }}
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 opacity-20" />
            <motion.div
              className="absolute left-1/2 top-10 w-96 h-48 rounded-lg mix-blend-overlay opacity-20"
              style={{ background: `radial-gradient(circle at 30% 30%, #00FF9D33, transparent 30%), linear-gradient(90deg, #FF3B3B12, #22D3EE12)` }}
              animate={{ x: [0, 8, -8, 0], opacity: [0.12, 0.24, 0.12] }}
              transition={{ duration: 6, repeat: Infinity }}
            />
            <div className="absolute right-8 bottom-16 text-xs text-[#00FF9D] font-bold animate-pulse">BUY</div>
            <div className="absolute left-8 bottom-24 text-xs text-[#FF3B3B] font-bold animate-pulse">SELL</div>
          </div>
        </div>
      </div>

      <div className="px-6 py-3 border-t border-cyan-500/20 bg-black/40 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-gray-400">24H HIGH</span>
          <div className="text-green-400 font-bold">$142.50</div>
        </div>
        <div>
          <span className="text-gray-400">24H LOW</span>
          <div className="text-red-400 font-bold">$138.20</div>
        </div>
        <div>
          <span className="text-gray-400">VOLUME</span>
          <div className="text-cyan-400 font-bold">$234.5M</div>
        </div>
        <div>
          <span className="text-gray-400">24H CHANGE</span>
          <div className="text-green-400 font-bold">+2.34%</div>
        </div>
      </div>
    </motion.div>
  );
}
