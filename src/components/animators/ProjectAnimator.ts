export interface ProjectAnimatorProps {
    isHovered: boolean;
    mousePosition: { x: number; y: number };
    color: string;
}

export type ProjectAnimator = React.ComponentType<ProjectAnimatorProps>;
