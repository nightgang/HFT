import { useState, useEffect } from "react";

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
            ⚔️ KATANA MODE
          </div>
          <div className="text-gray-500 text-sm">
            Initializing trading engine...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-4">HFT Trading System</h1>
      <p className="text-gray-300">Frontend is working! 🎉</p>
      <div className="mt-4 p-4 bg-slate-800 rounded">
        <p>Backend Status: Checking...</p>
      </div>
    </div>
  );
}

export default App;