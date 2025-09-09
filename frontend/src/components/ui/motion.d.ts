// Type augmentation for Framer Motion to prevent conflicts with React types
import { HTMLMotionProps } from 'framer-motion'

declare module 'framer-motion' {
  interface HTMLMotionProps<T extends keyof HTMLElementTagNameMap> {
    onAnimationStart?: any
    onAnimationEnd?: any
    onAnimationIteration?: any
  }
}
