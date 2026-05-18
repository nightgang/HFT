export const formatSignalConfidence = (confidence) => {
  if (confidence == null) return 'N/A';
  const value = confidence > 1 ? confidence : confidence * 100;
  return `${Math.round(value)}%`;
};

export const getSignalConfidenceClass = (confidence) => {
  const normalized = confidence == null ? 0 : (confidence > 1 ? confidence : confidence * 100);
  return normalized >= 90
    ? 'bg-emerald-500/20 text-emerald-300'
    : normalized >= 80
    ? 'bg-cyan-500/20 text-cyan-300'
    : 'bg-amber-500/20 text-amber-300';
};
