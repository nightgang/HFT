import { useState } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Settings } from 'lucide-react';

function KatanaChart() {
  const [timeframe, setTimeframe] = useState('1H');
  const [chartType, setChartType] = useState('candle');

  // Generate mock OHLC data
  const generateChartData = () => {
    let price = 150;
    const data = [];
    for (let i = 0; i < 50; i++) {
      const change = (Math.random() - 0.5) * 10;
      price += change;
      data.push({
        time: `${i}`,
        open: price - Math.random() * 5,
        high: price + Math.random() * 5,
        low: price - Math.random() * 5,
        close: price,
        volume: Math.random() * 1000,
        value: price + (Math.random() - 0.5) * 20,
      });
    }
    return data;
  };

  const data = generateChartData();

  return (
    <div className="bg-gradient-to-br from-purple-950/40 to-black/60 border border-purple-500/30 rounded-xl overflow-hidden h-96">
      {/* Header */}
      <div className="px-6 py-4 border-b border-purple-500/20 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="font-bold text-white">SOL/USDC</h3>
          <div className="text-2xl font-bold text-green-400">$168.35</div>
          <div className="text-sm text-green-400">+2.45%</div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          {['15M', '1H', '4H', '1D'].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded text-xs font-medium transition ${
                timeframe === tf
                  ? 'bg-purple-500/40 border border-purple-400 text-purple-200'
                  : 'bg-purple-500/10 border border-purple-400/20 text-gray-400 hover:text-gray-200'
              }`}
            >
              {tf}
            </button>
          ))}
          <button className="p-2 hover:bg-purple-500/20 rounded-lg text-purple-400 transition">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="px-4 py-4 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(168, 85, 247, 0.1)" />
            <XAxis dataKey="time" stroke="rgba(148, 163, 184, 0.5)" style={{ fontSize: '12px' }} />
            <YAxis stroke="rgba(148, 163, 184, 0.5)" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '8px',
              }}
              cursor={{ stroke: 'rgba(168, 85, 247, 0.5)' }}
              formatter={(value) => `$${value.toFixed(2)}`}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#a855f7"
              strokeWidth={2}
              fill="url(#colorGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default KatanaChart;