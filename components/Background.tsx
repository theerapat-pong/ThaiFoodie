import React, { useMemo } from 'react';

const Star: React.FC<{style: React.CSSProperties}> = React.memo(({ style }) => <div style={style} />);

const Stars: React.FC<{count: number}> = ({count}) => {
    const stars = useMemo(() => {
        return Array.from({ length: count }).map((_, i) => {
            const size = Math.random() * 2.5 + 1;
            const duration = Math.random() * 1.5 + 1;
            const delay = Math.random() * 2.5;
            const hue = Math.random() * 360;
            const color = `hsla(${hue}, 100%, 80%, 0.9)`;
            const glowColor = `hsla(${hue}, 100%, 80%, 0.5)`;

            return {
                key: i,
                style: {
                    position: 'absolute' as const,
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: color,
                    borderRadius: '50%',
                    boxShadow: `0 0 ${size * 1.5}px ${glowColor}, 0 0 ${size * 3}px ${glowColor}`,
                    animation: `twinkle ${duration}s infinite ease-in-out ${delay}s`,
                }
            };
        });
    }, [count]);
    
    return <>{stars.map(star => <Star key={star.key} style={star.style} />)}</>;
}

const Background: React.FC = () => {
    // โค้ดที่ติดตามเมาส์ถูกลบออกไปแล้ว
    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#0d0d0d]">
            {/* เหลือแค่เลเยอร์ของดวงดาว */}
            <div className="absolute inset-0">
                <Stars count={500} />
            </div>
            {/* เลเยอร์แสงที่ตามเมาส์ถูกลบออกไปแล้ว */}
        </div>
    );
};

export default Background;