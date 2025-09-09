import type { ReactNode, HTMLAttributes } from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
  hover?: boolean
  animate?: boolean
  delay?: number
  cyber?: boolean
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
  cyber?: boolean
}

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode
  className?: string
  cyber?: boolean
}

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
  cyber?: boolean
}

export interface StatCardProps extends CardProps {
  title: string
  value: string | number
  subvalue?: string
  icon?: React.ComponentType<{ className?: string }>
  trend?: string
}

export declare const Card: React.FC<CardProps>
export declare const CardHeader: React.FC<CardHeaderProps>
export declare const CardTitle: React.FC<CardTitleProps>
export declare const CardContent: React.FC<CardContentProps>
export declare const CardFooter: React.FC<CardFooterProps>
export declare const StatCard: React.FC<StatCardProps>
