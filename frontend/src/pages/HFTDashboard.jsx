import React, { useRef, useState, useMemo, useEffect } from 'react';
import { createChart } from 'lightweight-charts';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Wallet,
  Signal,
  TrendingUp,
  Clock8,
  Bell,
  Cpu,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Layers,
  Sun,
  Moon,
} from 'lucide-react';

const metricCards = [
  { label: 'Total PNL', value: '$18,742.60', change: '+7.8%', icon: TrendingUp, accent: 'text-emerald-400' },
  { label: 'Win Rate', value: '86.3%', change: '+4.2%', icon: Activity, accent: 'text-emerald-400' },
  { label: 'Active Trades', value: '14', change: 'Realtime', icon: Sparkles, accent: 'text-cyan-400' },
  { label: 'Balance', value: '$92,150.24', change: '+3.1%', icon: Wallet, accent: 'text-emerald-400' },
  { label: 'Priority Fee', value: 'LOW', change: 'Optimized', icon: ShieldCheck, accent: 'text-sky-400' },
];

const liveEvents = [
  { time: '09:52:04', event: 'BTC swap executed', status: 'success' },
  { time: '09:51:12', event: 'Limit order placed', status: 'info' },
  { time: '09:50:30', event: 'Slippage monitored', status: 'success' },
  { time: '09:49:58', event: 'Fee tier auto-adjusted', status: 'info' },
];

const walletRows = [
  { label: 'Spot Balance', value: '$48,720', icon: Wallet },
  { label: 'Margin Used', value: '$8,900', icon: Layers },
  { label: 'Available', value: '$22,300', icon: Signal },
  { label: 'PnL Today', value: '+$1,180', icon: TrendingUp },
];

const activeTrades = [
  { market: 'ETH/USDC', side: 'BUY', size: '5.2 ETH', entry: 2845, current: 2870, pnl: 3.2 },
  { market: 'SOL/USDC', side: 'SELL', size: '380 SOL', entry: 160, current: 155, pnl: -3.1 },
  { market: 'BTC/USDC', side: 'BUY', size: '0.18 BTC', entry: 71200, current: 72450, pnl: 1.7 },
];

const logEntries = [
  '09:52:48  ·  Signal engine updated parameters for BTC leg.',
  '09:52:20  ·  Order book depth monitor triggered safety throttle.',
  '09:51:40  ·  Wallet balance sync completed across 3 chains.',
  '09:50:58  ·  Adaptive fee model reduced gas by 18%.',
];

const candleData = [
  { time: '2026-05-05', open: 148.2, high: 153.4, low: 146.8, close: 151.6 },
  { time: '2026-05-06', open: 151.6, high: 156.1, low: 150.7, close: 154.8 },
  { time: '2026-05-07', open: 154.8, high: 158.2, low: 153.5, close: 155.7 },
  { time: '2026-05-08', open: 155.7, high: 160.4, low: 154.9, close: 159.0 },
  { time: '2026-05-09', open: 159.0, high: 162.9, low: 157.8, close: 160.4 },
  { time: '2026-05-10', open: 160.4, high: 164.2, low: 159.3, close: 163.1 },
  { time: '2026-05-11', open: 163.1, high: 166.0, low: 161.7, close: 165.8 },
  { time: '2026-05-12', open: 165.8, high: 169.5, low: 164.6, close: 168.2 },
  { time: '2026-05-13', open: 168.2, high: 170.1, low: 166.9, close: 169.7 },
];

const volumeData = [
  { time: '2026-05-05', value: 120000 },
  { time: '2026-05-06', value: 128000 },
  { time: '2026-05-07', value: 112000 },
  { time: '2026-05-08', value: 140000 },
  { time: '2026-05-09', value: 148000 },
  { time: '2026-05-10', value: 132000 },
  { time: '2026-05-11', value: 156000 },
  { time: '2026-05-12', value: 172000 },
  { time: '2026-05-13', value: 180000 },
];

const navItems = [
  { label: 'Dashboard', icon: Activity },
  { label: 'Markets', icon: BarChart3 },
  { label: 'Orders', icon: ArrowRight },
  { label: 'Wallets', icon: Wallet },
  { label: 'Settings', icon: Cpu },
];

const HFTDashboard = ({ darkMode, onToggleDarkMode }) => {
  const chartContainerRef = useRef(null);
  const [sorting, setSorting] = useState([]);
  const columnHelper = createColumnHelper();

  const columns = useMemo(
    () => [
      columnHelper.accessor('market', {
        header: 'Market',
        cell: info => <span className="font-semibold">{info.getValue()}</span>,
      }),
      columnHelper.accessor('side', {
        header: 'Side',
        cell: info => {
          const side = info.getValue();
          return (
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                side === 'BUY'
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
              }`}
            >
              {side}
            </span>
          );
        },
      }),
      columnHelper.accessor('size', {
        header: 'Size',
        cell: info => info.getValue(),
      }),
      columnHelper.accessor('entry', {
        header: 'Entry',
        cell: info => `$${info.getValue().toLocaleString()}`,
      }),
      columnHelper.accessor('current', {
        header: 'Current',
        cell: info => `$${info.getValue().toLocaleString()}`,
      }),
      columnHelper.accessor('pnl', {
        header: 'PNL',
        cell: info => {
          const value = info.getValue();
          return (
            <span className={`font-semibold ${value >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
              {value >= 0 ? '+' : ''}{value.toFixed(1)}%
            </span>
          );
        },
      }),
    ],
    [columnHelper]
  );

  const table = useReactTable({
    data: activeTrades,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 360,
      layout: {
        background: { color: darkMode ? '#06080f' : '#f8fafc' },
        textColor: darkMode ? '#e2e8f0' : '#0f172a',
      },
      grid: {
        vertLines: { color: 'rgba(148, 163, 184, 0.08)' },
        horzLines: { color: 'rgba(148, 163, 184, 0.08)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(148, 163, 184, 0.18)',
      },
      timeScale: {
        borderColor: 'rgba(148, 163, 184, 0.18)',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      borderVisible: false,
      wickWidth: 2,
    });

    candleSeries.setData(candleData);

    const histogramSeries = chart.addHistogramSeries({
      color: '#22c55e',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    histogramSeries.setData(volumeData);

    const resizeObserver = new ResizeObserver(() => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [darkMode]);

  const theme = {
    root: darkMode ? 'min-h-screen bg-[#0a0a0c] text-slate-100' : 'min-h-screen bg-slate-100 text-slate-950',
    page: darkMode ? 'bg-slate-900/80 border border-slate-800 text-slate-100 shadow-[0_0_60px_rgba(16,185,129,0.08)]' : 'bg-white/95 border border-slate-200 text-slate-950 shadow-[0_0_40px_rgba(16,185,129,0.08)]',
    panel: darkMode ? 'bg-slate-900/80 border border-slate-800 text-slate-100' : 'bg-white/95 border border-slate-200 text-slate-950',
    card: darkMode ? 'bg-slate-950/80 border border-slate-800 text-slate-100' : 'bg-slate-50 border border-slate-200 text-slate-950',
    chartSurface: darkMode ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900' : 'bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100',
    sidebar: darkMode ? 'hidden lg:flex flex-col w-20 bg-slate-950 border-r border-slate-800 p-4 gap-4' : 'hidden lg:flex flex-col w-20 bg-slate-50 border-r border-slate-200 p-4 gap-4',
    sidebarButton: darkMode ? 'group flex h-12 w-full items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:border-emerald-400/40 hover:text-emerald-300' : 'group flex h-12 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-400/40 hover:text-emerald-700',
    badge: darkMode ? 'rounded-full bg-emerald-500/10 px-3 py-2 text-xs uppercase tracking-[0.25em] text-emerald-300 border border-emerald-500/20' : 'rounded-full bg-emerald-500/10 px-3 py-2 text-xs uppercase tracking-[0.25em] text-emerald-700 border border-emerald-200',
  };

  return (
    <div className={theme.root}>
      <div className="flex min-h-screen">
        <aside className={theme.sidebar}>
          <div className={darkMode ? 'h-12 w-full flex items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 text-sm font-semibold tracking-widest' : 'h-12 w-full flex items-center justify-center rounded-2xl bg-slate-200 border border-slate-200 text-slate-950 text-sm font-semibold tracking-widest'}>
            HFT
          </div>
          <nav className="flex flex-col gap-3 mt-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  className={theme.sidebarButton}
                >
                  <Icon className="w-5 h-5" />
                </button>
              );
            })}
          </nav>
          <div className="mt-auto text-center text-[10px] uppercase tracking-[0.35em] text-slate-500">neon terminal</div>
        </aside>

        <main className="flex-1 p-6 lg:p-8">
          <div className="flex flex-col gap-6">
            <header className={`rounded-3xl p-5 ${theme.page}`}>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className={darkMode ? 'text-sm uppercase tracking-[0.3em] text-slate-500' : 'text-sm uppercase tracking-[0.3em] text-slate-500'}>High-Frequency Trading</p>
                  <h1 className={darkMode ? 'mt-2 text-3xl font-semibold text-white' : 'mt-2 text-3xl font-semibold text-slate-950'}>Terminal Dashboard</h1>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={darkMode ? 'inline-flex items-center gap-2 rounded-full border border-slate-800 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300' : 'inline-flex items-center gap-2 rounded-full border border-slate-200 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700'}>Live mode</span>
                  <span className={darkMode ? 'inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300' : 'inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700'}>UTC 14:52</span>
                  <button
                    onClick={onToggleDarkMode}
                    className={darkMode ? 'inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900 transition' : 'inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition'}
                  >
                    {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    {darkMode ? 'Dark Mode' : 'Light Mode'}
                  </button>
                </div>
              </div>
            </header>

            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
              {metricCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article
                    key={card.label}
                    className={`rounded-3xl p-5 ${theme.panel} shadow-[0_0_30px_rgba(16,185,129,0.08)]`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{card.label}</p>
                        <p className="mt-3 text-2xl font-semibold text-white">{card.value}</p>
                      </div>
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-slate-200 ${card.accent}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <p className={`mt-4 text-sm font-medium ${card.accent}`}>{card.change}</p>
                  </article>
                );
              })}
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-[1.8fr_0.95fr_0.95fr] gap-6">
              <article className={`order-2 xl:order-1 rounded-[32px] p-5 ${theme.page}`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Token Price Chart</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">SOL / USDC</h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-slate-950 px-3 py-2 text-sm text-slate-300 border border-slate-800">24h +4.2%</span>
                    <span className="rounded-full bg-slate-950 px-3 py-2 text-sm text-slate-300 border border-slate-800">Vol 12.4M</span>
                  </div>
                </div>

                <div className="mt-6 h-[360px] rounded-[32px] border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 p-6 shadow-inner shadow-slate-950/50">
                  <div ref={chartContainerRef} className="h-full w-full rounded-[28px] bg-slate-900/70" />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-400">
                  <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Current</p>
                    <p className="mt-2 text-lg font-semibold text-white">$160.42</p>
                  </div>
                  <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Market Depth</p>
                    <p className="mt-2 text-lg font-semibold text-white">Stable</p>
                  </div>
                </div>
              </article>

              <article className={`order-1 xl:order-2 rounded-[32px] p-5 ${theme.page}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Trade Panel</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Market Execution</h2>
                  </div>
                  <div className="rounded-2xl bg-emerald-500/10 px-3 py-2 text-xs uppercase tracking-[0.25em] text-emerald-300 border border-emerald-500/20">
                    Fast Lane
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.25em] text-slate-500">Token Pair</label>
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4 text-sm text-white">SOL / USDC</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.25em] text-slate-500">Order Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="rounded-full border border-slate-800 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">Market</button>
                      <button className="rounded-full border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-300">Limit</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.25em] text-slate-500">Amount</label>
                    <input type="text" placeholder="5.2" className="w-full rounded-3xl border border-slate-800 bg-slate-950/90 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.25em] text-slate-500">Price</label>
                    <input type="text" placeholder="$160.42" className="w-full rounded-3xl border border-slate-800 bg-slate-950/90 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.25em] text-slate-500">Leverage</label>
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-white">3.5x</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button className="inline-flex items-center justify-center gap-2 rounded-3xl bg-emerald-500 px-4 py-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400">
                      <ArrowUpRight className="w-4 h-4" /> Buy
                    </button>
                    <button className="inline-flex items-center justify-center gap-2 rounded-3xl bg-slate-800 border border-slate-700 px-4 py-4 text-sm font-semibold text-slate-100 transition hover:bg-slate-700">
                      <ArrowDownRight className="w-4 h-4" /> Sell
                    </button>
                  </div>
                </div>
              </article>

              <aside className={`order-3 rounded-[32px] p-5 ${theme.page}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Live Feed</p>
                    <h2 className="mt-1 text-xl font-semibold text-white">Market Events</h2>
                  </div>
                  <Bell className="w-5 h-5 text-emerald-400" />
                </div>

                <div className="mt-5 space-y-3">
                  {liveEvents.map((item) => (
                    <div key={item.time} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                      <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.3em] text-slate-500">
                        <span>{item.time}</span>
                        <span className={item.status === 'success' ? 'text-emerald-300' : 'text-sky-300'}>{item.status}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-100">{item.event}</p>
                    </div>
                  ))}
                </div>

                <div className={`mt-8 rounded-3xl p-4 ${theme.card}`}>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Wallet Tracker</p>
                  <div className="mt-4 space-y-3">
                    {walletRows.map((row) => {
                      const Icon = row.icon;
                      return (
                        <div key={row.label} className="flex items-center justify-between gap-3 rounded-3xl border border-slate-800 bg-slate-900/80 p-3">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-slate-200">
                              <Icon className="w-4 h-4" />
                            </span>
                            <div>
                              <p className="text-sm text-slate-400">{row.label}</p>
                              <p className="text-sm font-semibold text-white">{row.value}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </aside>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <article className={`rounded-[32px] p-5 ${theme.page}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className={darkMode ? 'text-sm uppercase tracking-[0.25em] text-slate-500' : 'text-sm uppercase tracking-[0.25em] text-slate-600'}>Active Trades</p>
                    <h2 className={darkMode ? 'mt-1 text-xl font-semibold text-white' : 'mt-1 text-xl font-semibold text-slate-950'}>Positions</h2>
                  </div>
                  <div className={darkMode ? 'rounded-full bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-emerald-300 border border-emerald-500/20' : 'rounded-full bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-emerald-700 border border-emerald-200'}>Live</div>
                </div>

                <div className={`mt-5 overflow-hidden rounded-3xl ${darkMode ? 'border border-slate-800 bg-slate-950/90' : 'border border-slate-200 bg-slate-50'}`}>
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className={darkMode ? 'bg-slate-900/90 text-slate-400 uppercase tracking-[0.2em] text-xs' : 'bg-slate-100 text-slate-600 uppercase tracking-[0.2em] text-xs'}>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <th key={header.id} className="px-4 py-4">
                              {header.isPlaceholder ? null : (
                                <div
                                  className="flex items-center justify-between gap-2 cursor-pointer select-none"
                                  onClick={header.column.getToggleSortingHandler()}
                                >
                                  <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                                  <span className="text-xs text-slate-400">
                                    {header.column.getIsSorted() === 'asc' ? '▲' : header.column.getIsSorted() === 'desc' ? '▼' : ''}
                                  </span>
                                </div>
                              )}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {table.getRowModel().rows.map((row) => (
                        <tr
                          key={row.id}
                          className={darkMode ? 'border-t border-slate-800 hover:bg-slate-900/80' : 'border-t border-slate-200 hover:bg-slate-100'}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className={darkMode ? 'px-4 py-4 text-slate-100' : 'px-4 py-4 text-slate-950'}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>

              <article className={`rounded-[32px] p-5 ${theme.page}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className={darkMode ? 'text-sm uppercase tracking-[0.25em] text-slate-500' : 'text-sm uppercase tracking-[0.25em] text-slate-600'}>System Logs</p>
                    <h2 className={darkMode ? 'mt-1 text-xl font-semibold text-white' : 'mt-1 text-xl font-semibold text-slate-950'}>Audit Trail</h2>
                  </div>
                  <div className={darkMode ? 'rounded-full bg-slate-950 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-300 border border-slate-800' : 'rounded-full bg-slate-50 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-700 border border-slate-200'}>Realtime</div>
                </div>

                <div className="mt-5 space-y-3 text-sm text-slate-300">
                  {logEntries.map((entry, index) => (
                    <div key={index} className={`rounded-3xl px-4 py-4 ${theme.card}`}>
                      <p>{entry}</p>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default HFTDashboard;
