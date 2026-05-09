import { Menu, LogOut, Zap, Wifi } from 'lucide-react';

function KatanaHeader({ onMenuClick, sidebarOpen, stats }) {
  return (
    <header className="bg-gradient-to-r from-black/60 via-purple-900/20 to-black/60 backdrop-blur-xl border-b border-purple-500/20 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-purple-500/20 rounded-lg transition text-purple-400"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
              HFT-MAIN ⚔️ KATANA MODE
            </h1>
            <p className="text-xs text-gray-500">Ultra Fast Solana Trading</p>
          </div>
        </div>

        {/* Center Section - Network Status */}
        <div className="hidden lg:flex items-center space-x-6 text-xs">
          <div className="flex items-center space-x-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400">Mainnet Connected</span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <Wifi className="w-3 h-3 text-blue-400" />
            <span className="text-blue-400">Helius RPC: Ready</span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-2 bg-pink-500/10 border border-pink-500/30 rounded-lg">
            <Zap className="w-3 h-3 text-pink-400" />
            <span className="text-pink-400">Jupiter: Connected</span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          <div className="text-right hidden md:block">
            <div className="text-xs text-gray-500">Latency</div>
            <div className="text-sm font-bold text-green-400">42ms</div>
          </div>
          <button className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/40 border border-purple-400/50 rounded-lg text-purple-300 text-sm font-medium transition">
            Katana Mode: ON
          </button>
          <button className="p-2 hover:bg-red-500/20 rounded-lg transition text-red-400">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default KatanaHeader;