import React, { useState, useEffect, useMemo } from 'react';

const Star: React.FC<{style: React.CSSProperties}> = React.memo(({ style }) => <div style={style} />);

const Stars: React.FC<{count: number}> = ({count}) => {
    const stars = useMemo(() => {
        return Array.from({ length: count }).map((_, i) => {
            const size = Math.random() * 2 + 1;
            const duration = Math.random() * 3 + 4;
            const delay = Math.random() * 7;
            return {
                key: i,
                style: {
                    position: 'absolute' as const,
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: 'rgba(255, 255, 255, 0.5)',
                    borderRadius: '50%',
                    animation: `twinkle ${duration}s infinite ease-in-out ${delay}s`,
                }
            };
        });
    }, [count]);
    
    return <>{stars.map(star => <Star key={star.key} style={star.style} />)}</>;
}

const Background: React.FC = () => {
    const [mousePosition, setMousePosition] = useState({ x: -1000, y: -1000 });

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            setMousePosition({ x: event.clientX, y: event.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#0d0d0d]">
            {/* Scattered stars layer */}
            <div className="absolute inset-0">
                <Stars count={500} />
            </div>

            {/* Interactive spotlight layer */}
             <div 
                className="absolute inset-0 transition-all duration-300 ease-out"
                style={{
                    background: `radial-gradient(circle 250px at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 255, 255, 0.06), transparent 80%)`,
                }}
             />
        </div>
    );
};

export default Background;