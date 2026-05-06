function Dashboard() {
  return (
    <div className="min-h-screen bg-background text-transparent">
      <div className="relative mx-auto max-w-[1440px] min-h-[900px] px-6 py-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(155,92,255,0.32),transparent_45%)] opacity-80" />
          <div className="absolute left-1/2 top-1/4 h-[720px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(138,43,226,0.2),transparent_60%)] blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.02),transparent_25%)]" />
          <div className="absolute inset-x-0 bottom-12 h-20 bg-[radial-gradient(circle_at_bottom,_rgba(255,0,99,0.08),transparent_40%)]" />
        </div>

        <div className="relative grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <div className="glass-panel h-40" />
            <div className="glass-panel h-56" />
            <div className="glass-panel h-36" />
          </div>

          <div className="col-span-12 lg:col-span-6 flex justify-center items-center">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-[#9B5CFF]/20 bg-[#12031D]/70 shadow-[0_0_120px_rgba(155,92,255,0.35)] blur-2xl" />
              <div className="relative h-[460px] w-[460px] rounded-full border border-[#D8B3FF]/30 bg-gradient-to-br from-[#190020]/90 via-[#2B0D41]/80 to-[#130314]/80 shadow-[0_0_80px_rgba(155,92,255,0.25)]">
                <div className="absolute inset-10 rounded-full border border-[#B557FF]/50 bg-gradient-to-br from-[#3E0A66]/0 via-[#8D60FF]/10 to-transparent shadow-[0_0_100px_rgba(155,92,255,0.3)]" />
                <div className="absolute inset-[72px] rounded-full border border-[#E0BBFF]/30 bg-[#1E0A2F]/70 shadow-[0_0_60px_rgba(155,92,255,0.18)]" />
                <div className="absolute inset-[132px] rounded-full border border-[#F6E2FF]/10 bg-[#120319]/80" />
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-3 space-y-4">
            <div className="glass-panel h-28" />
            <div className="glass-panel h-24" />
            <div className="glass-panel h-20 border-accent/40" />
            <div className="glass-panel h-28" />
          </div>

          <div className="col-span-12 mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            <div className="card-surface h-40" />
            <div className="card-surface h-40" />
            <div className="card-surface h-40" />
            <div className="card-surface h-40" />
            <div className="card-surface h-40" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
