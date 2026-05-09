import { useState, useEffect } from 'react';
import KatanaLayout from './components/KatanaLayout';

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
          <div className="text-gray-500 text-sm">Initializing trading engine...</div>
          <div className="w-48 h-1 bg-purple-500/20 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return <KatanaLayout />;
}

export default App;
