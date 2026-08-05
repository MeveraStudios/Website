import React from 'react';
import type { ProjectAnimatorProps } from './ProjectAnimator';

/** Falls back to the card's centre until the pointer has moved over it. */
const POINTER = 'var(--pointer-x, 50%) var(--pointer-y, 50%)';

export const DefaultAnimator: React.FC<ProjectAnimatorProps> = ({ isHovered, color }) => {
    return (
        <div
            className={`absolute inset-0 transition-opacity duration-200 pointer-events-none ${isHovered ? 'opacity-100' : 'opacity-0'}`}
            style={{
                background: `radial-gradient(circle at ${POINTER}, ${color}20, transparent 70%)`,
            }}
        >
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    background: `radial-gradient(circle at ${POINTER}, ${color}, transparent 40%)`,
                    transform: 'translateZ(10px)'
                }}
            />
        </div>
    );
};
