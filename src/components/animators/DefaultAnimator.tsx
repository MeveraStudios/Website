import React from 'react';
import type { ProjectAnimatorProps } from './ProjectAnimator';

export const DefaultAnimator: React.FC<ProjectAnimatorProps> = ({ isHovered, color }) => {
    return (
        <div
            className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${isHovered ? 'opacity-100' : 'opacity-0'}`}
            style={{
                background: `radial-gradient(circle at center, ${color}20, transparent 70%)`,
            }}
        >
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    background: `radial-gradient(circle at center, ${color}, transparent 40%)`,
                    transform: 'translateZ(10px)'
                }}
            />
        </div>
    );
};
