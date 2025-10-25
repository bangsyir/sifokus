export function formatTime(totalSeconds = 0) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.abs(totalSeconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
