import {useEffect, useState} from 'react';

// 곡명/프로그레스 바 영역을 주기적으로 ±maxPx 범위에서 조금씩 옮긴다 (번인 방지).
const useDrift = ({maxPx, intervalMs}) => {
	const [offset, setOffset] = useState({x: 0, y: 0});

	useEffect(() => {
		const rand = () => Math.round((Math.random() * 2 - 1) * maxPx);
		const id = setInterval(() => setOffset({x: rand(), y: rand()}), intervalMs);
		return () => clearInterval(id);
	}, [maxPx, intervalMs]);

	return offset;
};

export default useDrift;
