export interface ProjectAnimatorProps {
    isHovered: boolean;
    color: string;
    /**
     * Pointer position within the card, for animators that need it in JS. The
     * built-in animator does not: the card writes `--pointer-x` / `--pointer-y`
     * custom properties that its gradients read directly, which keeps mouse
     * tracking off the render path.
     */
    mousePosition?: { x: number; y: number };
}

export type ProjectAnimator = React.ComponentType<ProjectAnimatorProps>;
