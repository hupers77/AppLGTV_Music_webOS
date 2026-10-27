const pad = (n) => String(n).padStart(2, '0');

// 초 -> "m:ss" 또는 "h:mm:ss"
export const formatTime = (seconds) => {
	const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
	const h = Math.floor(total / 3600);
	const m = Math.floor((total % 3600) / 60);
	const s = total % 60;
	return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
