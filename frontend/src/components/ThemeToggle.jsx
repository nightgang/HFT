function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      className="rounded-full border border-green-500/50 bg-black/40 px-4 py-2 text-sm text-green-300 transition hover:bg-green-500/10"
      onClick={onToggle}
      type="button"
    >
      Theme: {theme === 'dark' ? 'Dark' : 'Light'}
    </button>
  );
}

export default ThemeToggle;
