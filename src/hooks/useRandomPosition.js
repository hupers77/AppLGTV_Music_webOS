import {useEffect, useRef, useState} from 'react';

const intersects = (a, b, pad) => (
	a.left < b.right + pad &&
	a.right > b.left - pad &&
	a.top < b.bottom + pad &&
	a.bottom > b.top - pad
);

// 화면 안에서, 곡명/프로그레스 영역(avoidRect)과 겹치지 않고, 현재 위치(current)에서
// 가로 또는 세로로 minMove px 이상 떨어진 임의의 좌상단 좌표를 고른다.
//
// 480x270 iframe 은 화면 중앙의 곡명/프로그레스 영역 옆에는 들어가지 않으므로,
// 실제로 허용되는 위치는 그 영역의 위쪽 / 아래쪽 띠가 된다. 이동 거리(px)는 그 안에서 랜덤이다.
export const pickPosition = ({
	width, height, margin, avoidRect, avoidPadding, viewport, current, minMove = 0, random = Math.random
}) => {
	const maxX = Math.max(viewport.width - width - margin, margin);
	const maxY = Math.max(viewport.height - height - margin, margin);

	let best = {x: margin, y: margin};
	for (let i = 0; i < 100; i++) {
		const x = Math.round(margin + random() * (maxX - margin));
		const y = Math.round(margin + random() * (maxY - margin));
		best = {x, y};

		if (avoidRect && intersects({left: x, top: y, right: x + width, bottom: y + height}, avoidRect, avoidPadding)) {
			continue;
		}
		if (current && Math.max(Math.abs(x - current.x), Math.abs(y - current.y)) < minMove) {
			continue;
		}
		return best;
	}
	return best;
};

// intervalMs 마다 한 번, 랜덤한 위치로 옮긴다.
const useRandomPosition = ({width, height, intervalMs, minMove, margin, avoidPadding, avoidRef}) => {
	const [pos, setPos] = useState({x: margin, y: margin});
	const optionsRef = useRef({});
	optionsRef.current = {width, height, minMove, margin, avoidPadding, avoidRef};
	const posRef = useRef(pos);

	useEffect(() => {
		const move = (withCurrent) => {
			const o = optionsRef.current;
			const next = pickPosition({
				width: o.width,
				height: o.height,
				margin: o.margin,
				avoidPadding: o.avoidPadding,
				avoidRect: o.avoidRef && o.avoidRef.current ? o.avoidRef.current.getBoundingClientRect() : null,
				viewport: {width: window.innerWidth, height: window.innerHeight},
				current: withCurrent ? posRef.current : null,
				minMove: o.minMove
			});
			posRef.current = next;
			setPos(next);
		};

		move(false);
		const id = setInterval(() => move(true), intervalMs);
		return () => clearInterval(id);
	}, [intervalMs]);

	return pos;
};

export default useRandomPosition;
