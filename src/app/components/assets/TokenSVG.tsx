import React from 'react';

const GoldCoinSVG = () => {
	return (
		<div className="flex items-center justify-center">
			<svg
				width="200"
				height="200"
				viewBox="0 0 400 400"
				xmlns="http://www.w3.org/2000/svg"
			>
				<defs>
					{/* Gold gradient for outer ring */}
					<linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
						<stop offset="0%" style={{ stopColor: '#F9E79F', stopOpacity: 1 }} />
						<stop offset="15%" style={{ stopColor: '#F4D03F', stopOpacity: 1 }} />
						<stop offset="30%" style={{ stopColor: '#D4AF37', stopOpacity: 1 }} />
						<stop offset="50%" style={{ stopColor: '#C5A028', stopOpacity: 1 }} />
						<stop offset="70%" style={{ stopColor: '#D4AF37', stopOpacity: 1 }} />
						<stop offset="85%" style={{ stopColor: '#F4D03F', stopOpacity: 1 }} />
						<stop offset="100%" style={{ stopColor: '#C5A028', stopOpacity: 1 }} />
					</linearGradient>

					{/* Inner gold gradient */}
					<linearGradient id="innerGoldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
						<stop offset="0%" style={{ stopColor: '#E8D5A0', stopOpacity: 1 }} />
						<stop offset="50%" style={{ stopColor: '#F9E79F', stopOpacity: 1 }} />
						<stop offset="100%" style={{ stopColor: '#D4AF37', stopOpacity: 1 }} />
					</linearGradient>

					{/* Radial gradient for depth */}
					<radialGradient id="radialGold" cx="50%" cy="40%" r="60%">
						<stop offset="0%" style={{ stopColor: '#FFF8DC', stopOpacity: 1 }} />
						<stop offset="40%" style={{ stopColor: '#F4D03F', stopOpacity: 1 }} />
						<stop offset="70%" style={{ stopColor: '#D4AF37', stopOpacity: 1 }} />
						<stop offset="100%" style={{ stopColor: '#B8941E', stopOpacity: 1 }} />
					</radialGradient>

					{/* Shadow */}
					<filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
						<feGaussianBlur in="SourceAlpha" stdDeviation="4" />
						<feOffset dx="2" dy="4" result="offsetblur" />
						<feComponentTransfer>
							<feFuncA type="linear" slope="0.3" />
						</feComponentTransfer>
						<feMerge>
							<feMergeNode />
							<feMergeNode in="SourceGraphic" />
						</feMerge>
					</filter>

					{/* Inner shadow */}
					<filter id="innerShadow">
						<feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
						<feOffset in="blur" dx="1" dy="2" result="offsetBlur" />
						<feFlood flood-color="#000000" flood-opacity="0.2" result="color" />
						<feComposite in="color" in2="offsetBlur" operator="in" result="shadow" />
						<feComposite in="shadow" in2="SourceAlpha" operator="in" result="innerShadow" />
						<feMerge>
							<feMergeNode in="SourceGraphic" />
							<feMergeNode in="innerShadow" />
						</feMerge>
					</filter>
				</defs>

				{/* Outer gold ring */}
				<circle
					cx="200"
					cy="200"
					r="190"
					fill="url(#radialGold)"
					filter="url(#shadow)"
				/>

				{/* Inner ring border - darker */}
				<circle
					cx="200"
					cy="200"
					r="165"
					fill="none"
					stroke="#B8941E"
					strokeWidth="3"
				/>

				{/* Inner white/light circle */}
				<circle
					cx="200"
					cy="200"
					r="160"
					fill="#FEFEFE"
				/>

				{/* Highlight on top edge */}
				<path
					d="M 50,120 A 180,180 0 0,1 350,120"
					fill="none"
					stroke="#FFF8DC"
					strokeWidth="4"
					opacity="0.6"
				/>

				{/* Bottom shadow on ring */}
				<path
					d="M 50,280 A 180,180 0 0,0 350,280"
					fill="none"
					stroke="#9D7E1E"
					strokeWidth="3"
					opacity="0.5"
				/>
			</svg>
		</div>
	);
};

export default GoldCoinSVG;