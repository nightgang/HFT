function TradeConfirmation({ trade, onConfirm, onCancel }) {
  return (
    <div className="rounded-3xl border border-green-500/20 bg-black/40 p-5 shadow-glowSoft">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-semibold text-green-300">Trade Confirmation</div>
          <div className="text-xs text-slate-400">Approve or decline routed execution</div>
        </div>
        <div className="text-xs text-slate-500">Realtime</div>
      </div>
      <div className="space-y-3 text-sm text-slate-200">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-slate-900/80 p-3">Pair: <span className="font-semibold text-white">{trade.pair}</span></div>
          <div className="rounded-2xl bg-slate-900/80 p-3">Type: <span className="font-semibold text-white">{trade.type}</span></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl bg-slate-900/80 p-3">Size: <span className="font-semibold text-white">{trade.size}</span></div>
          <div className="rounded-2xl bg-slate-900/80 p-3">Price: <span className="font-semibold text-white">{trade.price}</span></div>
          <div className="rounded-2xl bg-slate-900/80 p-3">Slippage: <span className="font-semibold text-white">{trade.slippage}</span></div>
        </div>
        <div className="rounded-2xl bg-slate-900/80 p-4 text-xs text-slate-400">{trade.description}</div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-full bg-green-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-green-400"
        >
          Confirm
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default TradeConfirmation;
